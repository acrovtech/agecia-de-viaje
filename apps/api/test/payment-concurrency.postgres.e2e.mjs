import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient, ReservationPaymentStatus } from '@repo/db/prisma';
import { parseConfig } from '../dist/config.js';
import { CheckoutService } from '../dist/checkout/checkout.service.js';
import { PaymentsService } from '../dist/payments/payments.service.js';

const testDbUrl = process.env.API_TEST_DATABASE_URL;

// Validación estricta de seguridad de la base de datos de pruebas (Ticket P1.4)
function isSafeTestDatabaseUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    // Debe contener 'test' en la ruta de la base de datos
    if (!pathname.includes('test')) return false;
    // Rechazar explícitamente dominios productivos conocidos
    if (hostname.includes('supabase.co') || hostname.includes('rds.amazonaws.com') || hostname.includes('prod')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

if (!testDbUrl || !isSafeTestDatabaseUrl(testDbUrl)) {
  test('PostgreSQL concurrency integration test suite (SKIPPED: API_TEST_DATABASE_URL not configured with a valid disposable test database)', { skip: true }, () => {
    // Explicitly skipped when disposable test database is not provided.
    // NEVER run concurrency tests against production DATABASE_URL.
  });
} else {
  const prisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
  });

  const secretKey = 'test_secret_key';

  // Fábrica de configuración de prueba que autoriza explícitamente los slugs dinámicos generados
  function createTestConfig(agencySlugs = [], extraConfig = {}) {
    const slugs = ['incabound', ...agencySlugs];
    return parseConfig({
      NODE_ENV: 'test',
      DATABASE_URL: testDbUrl,
      IZIPAY_SECRET_KEY: secretKey,
      API_CHECKOUT_ENABLED: 'true',
      API_PUBLIC_AGENCY_SLUGS: slugs.join(','),
      ...extraConfig,
    });
  }

  test.before(async () => {
    await prisma.$connect();
  });

  test.after(async () => {
    await prisma.$disconnect();
  });

  // Helper para crear un Tour válido según el esquema actual de Prisma
  async function createValidTour(agencyId, slugSuffix, overrides = {}) {
    return prisma.tour.create({
      data: {
        agencyId,
        title: `PG Test Tour ${slugSuffix}`,
        slug: `pg-tour-${slugSuffix}`,
        description: 'Descripción completa del tour para pruebas de integración',
        duration: '1 day',
        bannerImage: 'https://example.test/banner.webp',
        cardImage: 'https://example.test/card.webp',
        hasSharedService: true,
        sharedPrice: 25.0,
        hasPrivateService: false,
        isPublished: true,
        region: 'Cusco',
        ...overrides,
      },
    });
  }

  // 1 & 2. Probar que dos instancias concurrentes ejecutan EXACTAMENTE UNA llamada al proveedor
  test('PostgreSQL: Two independent CheckoutService instances execute exactly ONE provider session call under race', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const agencySlug = `pg-race-calls-${slugSuffix}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'PG Calls Agency',
        slug: agencySlug,
        subdomain: agencySlug, // Campo obligatorio del esquema actual
        isActive: true,
      },
    });

    const tour = await createValidTour(agency.id, slugSuffix);
    const testConfig = createTestConfig([agencySlug]);

    let providerCreatePaymentCalls = 0;
    const basePayments = new PaymentsService(prisma, testConfig);

    // Doble de prueba controlado que instrumenta la llamada a la pasarela con contador compartido y latencia
    const instrumentedPaymentsService = {
      ...basePayments,
      createPaymentSession: async (params) => {
        providerCreatePaymentCalls++;
        // Latencia artificial para forzar contienda concurrente en PostgreSQL
        await new Promise((r) => setTimeout(r, 600));
        return { formToken: `instrumented_token_${slugSuffix}` };
      },
      verifySignature: basePayments.verifySignature.bind(basePayments),
      processIzipayIpn: basePayments.processIzipayIpn.bind(basePayments),
    };

    // Dos instancias de servicio independientes conectadas a la misma PostgreSQL
    const instanceA = new CheckoutService(prisma, testConfig, instrumentedPaymentsService);
    const instanceB = new CheckoutService(prisma, testConfig, instrumentedPaymentsService);

    const idempotencyKey = `pg-idemp-one-call-${slugSuffix}`;
    const checkoutDto = {
      customerFirstName: 'OneCall',
      customerLastName: 'Racer',
      customerEmail: 'onecall@example.test',
      customerPhone: '+51999999810',
      items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
    };

    const [resA, resB] = await Promise.all([
      instanceA.createCheckout(agency.slug, checkoutDto, idempotencyKey),
      instanceB.createCheckout(agency.slug, checkoutDto, idempotencyKey),
    ]);

    // Probar que el proveedor fue invocado EXACTAMENTE UNA VEZ
    assert.equal(providerCreatePaymentCalls, 1, 'Provider createPaymentSession must be called exactly once across instances');
    assert.equal(resA.reservationId, resB.reservationId, 'Both instances must return the same reservation ID');
    assert.equal(resA.formToken, resB.formToken, 'Both instances must receive the exact same formToken');
    assert.equal(resA.formToken, `instrumented_token_${slugSuffix}`);

    // Verificar estado en PostgreSQL
    const saved = await prisma.reservation.findUnique({ where: { id: resA.reservationId } });
    assert.equal(saved.paymentSessionStatus, 'READY');
    assert.equal(saved.paymentSessionOwner, null, 'Lease owner must be released');

    // Cleanup
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // 4. Slow provider response (latencia artificial prolongada) still resolves both distributed callers safely
  test('PostgreSQL: Slow provider response still resolves both distributed callers safely without secondary call', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const agencySlug = `pg-slow-prov-${slugSuffix}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'PG Slow Prov Agency',
        slug: agencySlug,
        subdomain: agencySlug,
        isActive: true,
      },
    });

    const tour = await createValidTour(agency.id, slugSuffix);
    const testConfig = createTestConfig([agencySlug]);

    let providerCalls = 0;
    const basePayments = new PaymentsService(prisma, testConfig);

    const slowPaymentsService = {
      ...basePayments,
      createPaymentSession: async (params) => {
        providerCalls++;
        // Latencia de 1200ms para probar el ciclo de espera informado por el lease
        await new Promise((r) => setTimeout(r, 1200));
        return { formToken: `slow_token_${slugSuffix}` };
      },
      verifySignature: basePayments.verifySignature.bind(basePayments),
      processIzipayIpn: basePayments.processIzipayIpn.bind(basePayments),
    };

    const instanceA = new CheckoutService(prisma, testConfig, slowPaymentsService);
    const instanceB = new CheckoutService(prisma, testConfig, slowPaymentsService);

    const idempotencyKey = `pg-idemp-slow-${slugSuffix}`;
    const checkoutDto = {
      customerFirstName: 'Slow',
      customerLastName: 'Racer',
      customerEmail: 'slowracer@example.test',
      customerPhone: '+51999999811',
      items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
    };

    const [resA, resB] = await Promise.all([
      instanceA.createCheckout(agency.slug, checkoutDto, idempotencyKey),
      instanceB.createCheckout(agency.slug, checkoutDto, idempotencyKey),
    ]);

    assert.equal(providerCalls, 1, 'Provider must only be invoked once despite slow response');
    assert.equal(resA.formToken, resB.formToken);
    assert.equal(resA.formToken, `slow_token_${slugSuffix}`);

    // Cleanup
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // 5 & 6. Signed PAID without transaction UUID enters REVIEW and cannot obtain new formToken on retry
  test('PostgreSQL: Signed PAID without transaction UUID transitions to REVIEW and blocks session on retry', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const agencySlug = `pg-nouuid-${slugSuffix}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'PG NoUuid Agency',
        slug: agencySlug,
        subdomain: agencySlug,
        isActive: true,
      },
    });

    const tour = await createValidTour(agency.id, slugSuffix);
    const testConfig = createTestConfig([agencySlug]);
    const paymentsService = new PaymentsService(prisma, testConfig);
    const checkoutService = new CheckoutService(prisma, testConfig, paymentsService);

    const idempotencyKey = `pg-idemp-nouuid-${slugSuffix}`;
    const checkout = await checkoutService.createCheckout(
      agency.slug,
      {
        customerFirstName: 'NoUuid',
        customerLastName: 'Tester',
        customerEmail: 'nouuid@example.test',
        customerPhone: '+51999999812',
        items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
      },
      idempotencyKey,
    );

    const orderId = checkout.reservationCode;

    // IPN firmado sin UUID de transacción
    const krNoUuid = {
      orderStatus: 'PAID',
      orderDetails: { orderId, orderTotalAmount: checkout.totalMinor, orderCurrency: 'USD' },
      transactions: [],
    };
    const hashNoUuid = crypto.createHmac('sha256', secretKey).update(JSON.stringify(krNoUuid)).digest('hex');

    const ipnResult = await paymentsService.processIzipayIpn({ 'kr-answer': krNoUuid, 'kr-hash': hashNoUuid });
    assert.equal(ipnResult.status, 'REVIEW_REQUIRED');

    // Verificar en la base de datos real
    const dbRes = await prisma.reservation.findUnique({ where: { id: checkout.reservationId } });
    assert.equal(dbRes.paymentStatus, ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW);
    assert.equal(dbRes.paymentFormToken, null);

    // Evento de auditoría debe existir
    const events = await prisma.reservationEvent.findMany({ where: { reservationId: checkout.reservationId } });
    const auditFound = events.some((e) => e.note.includes('MISSING_TRANSACTION_UUID'));
    assert.ok(auditFound, 'Audit event for missing transaction UUID must be persisted');

    // Reintento con la misma clave de idempotencia
    const retry = await checkoutService.createCheckout(
      agency.slug,
      {
        customerFirstName: 'NoUuid',
        customerLastName: 'Tester',
        customerEmail: 'nouuid@example.test',
        customerPhone: '+51999999812',
        items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
      },
      idempotencyKey,
    );

    assert.equal(retry.formToken, null, 'Must return formToken: null for reservation in REVIEW');
    assert.equal(retry.paymentStatus, ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW);

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: checkout.reservationId } });
    await prisma.reservationEvent.deleteMany({ where: { reservationId: checkout.reservationId } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // 7 & 8. Conflicting signed IPN policy (First-Authoritative-Transition Semantics)
  test('PostgreSQL: Committed PAID cannot be downgraded by subsequent mismatch IPN', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const agencySlug = `pg-policy-paid-${slugSuffix}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'PG Policy Paid Agency',
        slug: agencySlug,
        subdomain: agencySlug,
        isActive: true,
      },
    });

    const tour = await createValidTour(agency.id, slugSuffix);
    const testConfig = createTestConfig([agencySlug]);
    const paymentsService = new PaymentsService(prisma, testConfig);
    const checkoutService = new CheckoutService(prisma, testConfig, paymentsService);

    const checkout = await checkoutService.createCheckout(
      agency.slug,
      {
        customerFirstName: 'Policy',
        customerLastName: 'Paid',
        customerEmail: 'policypaid@example.test',
        customerPhone: '+51999999813',
        items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
      },
      `pg-idemp-polpaid-${slugSuffix}`,
    );

    const orderId = checkout.reservationCode;

    // 1. IPN válido exacto confirma PAID
    const krValid = {
      orderStatus: 'PAID',
      orderDetails: { orderId, orderTotalAmount: checkout.totalMinor, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pol-valid-${slugSuffix}` }],
    };
    const hashValid = crypto.createHmac('sha256', secretKey).update(JSON.stringify(krValid)).digest('hex');

    const resValid = await paymentsService.processIzipayIpn({ 'kr-answer': krValid, 'kr-hash': hashValid });
    assert.equal(resValid.status, 'PAID');

    // 2. IPN tardío con discrepancia de monto
    const krMismatch = {
      orderStatus: 'PAID',
      orderDetails: { orderId, orderTotalAmount: 1000, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pol-mismatch-${slugSuffix}` }],
    };
    const hashMismatch = crypto.createHmac('sha256', secretKey).update(JSON.stringify(krMismatch)).digest('hex');

    const resMismatch = await paymentsService.processIzipayIpn({ 'kr-answer': krMismatch, 'kr-hash': hashMismatch });
    assert.equal(resMismatch.status, 'PAID'); // Responde con el estado autoritativo final

    // DB debe permanecer en PAID
    const finalRes = await prisma.reservation.findUnique({ where: { id: checkout.reservationId } });
    assert.equal(finalRes.paymentStatus, ReservationPaymentStatus.PAID);

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: checkout.reservationId } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // 9 & 10. Zero-total same-key concurrency: coupon consumed once and identical retry returns same reservation
  test('PostgreSQL: Zero-total same-key concurrent checkout consumes coupon once and returns same confirmed reservation', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const agencySlug = `pg-zero-race-${slugSuffix}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'PG Zero Race Agency',
        slug: agencySlug,
        subdomain: agencySlug,
        isActive: true,
      },
    });

    const coupon = await prisma.coupon.create({
      data: {
        agencyId: agency.id,
        code: `PG100-${Date.now().toString(36).toUpperCase()}`,
        discountType: 'PERCENTAGE',
        discountValue: 100,
        timesUsed: 0,
        usageLimit: 1, // Sólo 1 uso permitido
        isActive: true,
      },
    });

    const tour = await createValidTour(agency.id, slugSuffix);
    const testConfig = createTestConfig([agencySlug]);
    const paymentsService = new PaymentsService(prisma, testConfig);
    const checkoutService = new CheckoutService(prisma, testConfig, paymentsService);

    const idempotencyKey = `pg-zero-race-key-${slugSuffix}`;
    const checkoutDto = {
      customerFirstName: 'Zero',
      customerLastName: 'Racer',
      customerEmail: 'zeroracer@example.test',
      customerPhone: '+51999999814',
      couponCode: coupon.code,
      items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
    };

    // Dos llamadas simultáneas con la misma clave de idempotencia
    const [res1, res2] = await Promise.all([
      checkoutService.createCheckout(agency.slug, checkoutDto, idempotencyKey),
      checkoutService.createCheckout(agency.slug, checkoutDto, idempotencyKey),
    ]);

    assert.equal(res1.reservationId, res2.reservationId, 'Both concurrent zero-total callers must resolve the same reservation');
    assert.equal(res1.totalMinor, 0);
    assert.equal(res2.totalMinor, 0);
    assert.equal(res1.paymentStatus, 'PAID');
    assert.equal(res2.paymentStatus, 'PAID');

    // Cupón consumido exactamente una vez
    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    assert.equal(updatedCoupon.timesUsed, 1, 'Coupon timesUsed must not exceed usageLimit (1)');

    // Exactamente 1 registro en la base de datos
    const totalReservations = await prisma.reservation.count({
      where: { agencyId: agency.id, requestKey: idempotencyKey },
    });
    assert.equal(totalReservations, 1);

    // Exactamente 1 notificación de outbox y 1 evento de auditoría
    const notifs = await prisma.paymentNotification.findMany({ where: { legacyId: res1.reservationId } });
    assert.equal(notifs.length, 1);

    const events = await prisma.reservationEvent.findMany({ where: { reservationId: res1.reservationId } });
    assert.equal(events.length, 1);

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: res1.reservationId } });
    await prisma.reservationEvent.deleteMany({ where: { reservationId: res1.reservationId } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // 11 & 12. Same idempotency key across different agencies creates independent reservations without collision
  test('PostgreSQL: Same idempotency key can exist independently in two agencies without code collision', async () => {
    const slugSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const slugA = `pg-tenant-a-${slugSuffix}`;
    const slugB = `pg-tenant-b-${slugSuffix}`;

    const [agencyA, agencyB] = await Promise.all([
      prisma.agency.create({
        data: { name: 'Agency A', slug: slugA, subdomain: slugA, isActive: true },
      }),
      prisma.agency.create({
        data: { name: 'Agency B', slug: slugB, subdomain: slugB, isActive: true },
      }),
    ]);

    const [tourA, tourB] = await Promise.all([
      createValidTour(agencyA.id, `a-${slugSuffix}`),
      createValidTour(agencyB.id, `b-${slugSuffix}`),
    ]);

    const testConfig = createTestConfig([slugA, slugB]);
    const paymentsService = new PaymentsService(prisma, testConfig);
    const checkoutService = new CheckoutService(prisma, testConfig, paymentsService);

    const sharedKey = `shared-multi-tenant-idemp-${slugSuffix}`;

    const [resA, resB] = await Promise.all([
      checkoutService.createCheckout(
        agencyA.slug,
        {
          customerFirstName: 'TenantA',
          customerLastName: 'Client',
          customerEmail: 'client@example.test',
          customerPhone: '+51999999815',
          items: [{ slug: tourA.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
        },
        sharedKey,
      ),
      checkoutService.createCheckout(
        agencyB.slug,
        {
          customerFirstName: 'TenantB',
          customerLastName: 'Client',
          customerEmail: 'client@example.test',
          customerPhone: '+51999999815',
          items: [{ slug: tourB.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
        },
        sharedKey,
      ),
    ]);

    assert.notEqual(resA.reservationId, resB.reservationId, 'Reservations must be separate across agencies');
    assert.notEqual(resA.reservationCode, resB.reservationCode, 'Reservation codes must not collide across agencies');

    // Cleanup
    await prisma.reservationItem.deleteMany({ where: { tourId: { in: [tourA.id, tourB.id] } } });
    await prisma.reservation.deleteMany({ where: { agencyId: { in: [agencyA.id, agencyB.id] } } });
    await prisma.tour.deleteMany({ where: { id: { in: [tourA.id, tourB.id] } } });
    await prisma.agency.deleteMany({ where: { id: { in: [agencyA.id, agencyB.id] } } });
  });
}
