import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient, ReservationPaymentStatus } from '@repo/db/prisma';
import { parseConfig } from '../dist/config.js';
import { CheckoutService } from '../dist/checkout/checkout.service.js';
import { PaymentsService } from '../dist/payments/payments.service.js';

const testDbUrl = process.env.API_TEST_DATABASE_URL;

if (!testDbUrl) {
  test('PostgreSQL concurrency integration test suite (SKIPPED: API_TEST_DATABASE_URL not configured)', { skip: true }, () => {
    // Explicitly skipped when disposable test database is not provided.
    // NEVER run concurrency tests against production DATABASE_URL.
  });
} else {
  const prisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
  });

  const secretKey = 'test_secret_key';
  const testConfig = parseConfig({
    NODE_ENV: 'test',
    DATABASE_URL: testDbUrl,
    IZIPAY_SECRET_KEY: secretKey,
    API_CHECKOUT_ENABLED: 'true',
  });

  const paymentsService = new PaymentsService(prisma, testConfig);
  const checkoutService = new CheckoutService(prisma, testConfig, paymentsService);

  test.before(async () => {
    if (!testDbUrl.includes('test')) {
      throw new Error('API_TEST_DATABASE_URL must be a disposable test database containing "test" in its connection string.');
    }
    await prisma.$connect();
  });

  test.after(async () => {
    await prisma.$disconnect();
  });

  // A. Same-key concurrent checkout through real CheckoutService/API -> one Reservation
  test('PostgreSQL A: Same-key concurrent checkout through real CheckoutService produces exactly one reservation', async () => {
    const slug = `pg-race-chk-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'PG Race Agency', slug, isActive: true },
    });

    const tour = await prisma.tour.create({
      data: {
        agencyId: agency.id,
        title: 'PG Concurrent Tour',
        slug: `pg-tour-${Date.now()}`,
        price: 25,
        duration: '1 day',
        destination: 'Cusco',
        isPublished: true,
      },
    });

    const idempotencyKey = `pg-idemp-race-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const checkoutDto = {
      customerFirstName: 'PgRace',
      customerLastName: 'Tester',
      customerEmail: 'pgrace@example.test',
      customerPhone: '+51999999801',
      items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
    };

    // Dos llamadas concurrentes a través del CheckoutService real
    const [res1, res2] = await Promise.all([
      checkoutService.createCheckout(agency.slug, checkoutDto, idempotencyKey),
      checkoutService.createCheckout(agency.slug, checkoutDto, idempotencyKey),
    ]);

    assert.equal(res1.reservationId, res2.reservationId, 'Both concurrent calls must return the same reservation ID');
    assert.ok(res1.formToken, 'Must generate a payment session token');
    assert.equal(res1.formToken, res2.formToken, 'Both concurrent calls must return the same formToken');

    const totalReservations = await prisma.reservation.count({
      where: { agencyId: agency.id, requestKey: idempotencyKey },
    });
    assert.equal(totalReservations, 1, 'Exactly one reservation record must exist in PostgreSQL');

    // Cleanup
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // B. Concurrent identical IPN through real PaymentsService/API -> one transition, one coupon increment, one outbox
  test('PostgreSQL B: Concurrent identical IPN through real PaymentsService causes exactly one transition, one coupon increment, one outbox', async () => {
    const slug = `pg-ipn-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'PG IPN Agency', slug, isActive: true },
    });

    const coupon = await prisma.coupon.create({
      data: {
        agencyId: agency.id,
        code: `PGCOUP-${Date.now().toString(36).toUpperCase()}`,
        discountType: 'FIXED',
        discountValue: 10,
        timesUsed: 0,
        usageLimit: 5,
        isActive: true,
      },
    });

    const tour = await prisma.tour.create({
      data: {
        agencyId: agency.id,
        title: 'PG IPN Tour',
        slug: `pg-ipn-tour-${Date.now()}`,
        price: 30,
        duration: '1 day',
        destination: 'Cusco',
        isPublished: true,
      },
    });

    const checkout = await checkoutService.createCheckout(
      agency.slug,
      {
        customerFirstName: 'Ipn',
        customerLastName: 'Racer',
        customerEmail: 'ipnracer@example.test',
        customerPhone: '+51999999802',
        couponCode: coupon.code,
        items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
      },
      `pg-ipn-chk-${Date.now()}`,
    );

    const orderId = checkout.reservationCode;
    const krAnswer = {
      orderStatus: 'PAID',
      orderDetails: {
        orderId,
        orderTotalAmount: checkout.totalMinor,
        orderCurrency: 'USD',
      },
      transactions: [{ uuid: `tx-pg-identical-${Date.now()}` }],
    };
    const krHash = crypto.createHmac('sha256', secretKey).update(JSON.stringify(krAnswer)).digest('hex');
    const ipnPayload = { 'kr-answer': krAnswer, 'kr-hash': krHash };

    // Dos llamadas concurrentes al PaymentsService real con el mismo IPN
    const [ipn1, ipn2] = await Promise.all([
      paymentsService.processIzipayIpn(ipnPayload),
      paymentsService.processIzipayIpn(ipnPayload),
    ]);

    assert.equal(ipn1.status, 'PAID');
    assert.equal(ipn2.status, 'PAID');

    // Comprobar estado financiero en la base de datos PostgreSQL
    const saved = await prisma.reservation.findUnique({ where: { id: checkout.reservationId } });
    assert.equal(saved.paymentStatus, ReservationPaymentStatus.PAID);

    // Cupón incrementado exactamente una vez
    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    assert.equal(updatedCoupon.timesUsed, 1, 'Coupon timesUsed must be incremented exactly once');

    // Mensaje de outbox creado exactamente una vez
    const outboxRecords = await prisma.paymentNotification.findMany({
      where: { legacyId: checkout.reservationId },
    });
    assert.equal(outboxRecords.length, 1, 'Exactly one outbox notification must be created');

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: checkout.reservationId } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // C. Valid IPN vs mismatch IPN concurrently -> no PAID downgrade
  test('PostgreSQL C: Valid IPN vs mismatch IPN concurrently cannot downgrade PAID', async () => {
    const slug = `pg-race-downgrade-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'PG Downgrade Agency', slug, isActive: true },
    });

    const tour = await prisma.tour.create({
      data: {
        agencyId: agency.id,
        title: 'PG Downgrade Tour',
        slug: `pg-dg-tour-${Date.now()}`,
        price: 20,
        duration: '1 day',
        destination: 'Lima',
        isPublished: true,
      },
    });

    const checkout = await checkoutService.createCheckout(
      agency.slug,
      {
        customerFirstName: 'No',
        customerLastName: 'Downgrade',
        customerEmail: 'nodowngrade@example.test',
        customerPhone: '+51999999803',
        items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
      },
      `pg-dg-chk-${Date.now()}`,
    );

    const orderId = checkout.reservationCode;

    // Payload válido (total exacto 2000 minor)
    const validKr = {
      orderStatus: 'PAID',
      orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pg-valid-${Date.now()}` }],
    };
    const validHash = crypto.createHmac('sha256', secretKey).update(JSON.stringify(validKr)).digest('hex');

    // Payload con monto no coincidente (1500 minor)
    const mismatchKr = {
      orderStatus: 'PAID',
      orderDetails: { orderId, orderTotalAmount: 1500, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pg-mismatch-${Date.now()}` }],
    };
    const mismatchHash = crypto.createHmac('sha256', secretKey).update(JSON.stringify(mismatchKr)).digest('hex');

    // Ejecución concurrente
    const [resValid, resMismatch] = await Promise.all([
      paymentsService.processIzipayIpn({ 'kr-answer': validKr, 'kr-hash': validHash }),
      paymentsService.processIzipayIpn({ 'kr-answer': mismatchKr, 'kr-hash': mismatchHash }),
    ]);

    assert.ok(resValid.success);
    assert.ok(resMismatch.success);

    // Estado final en PostgreSQL DEBE ser PAID sin degradación
    const finalReservation = await prisma.reservation.findUnique({ where: { id: checkout.reservationId } });
    assert.equal(finalReservation.paymentStatus, ReservationPaymentStatus.PAID, 'Payment status must remain PAID');

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: checkout.reservationId } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // D. Coupon last-use race through real PaymentsService -> exactly one claim, loser enters REVIEW
  test('PostgreSQL D: Coupon last-use race through real PaymentsService allows exactly one claim; loser enters REVIEW', async () => {
    const slug = `pg-lastuse-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'PG LastUse Agency', slug, isActive: true },
    });

    const coupon = await prisma.coupon.create({
      data: {
        agencyId: agency.id,
        code: `PGLAST-${Date.now().toString(36).toUpperCase()}`,
        discountType: 'FIXED',
        discountValue: 5,
        timesUsed: 0,
        usageLimit: 1, // Sólo 1 uso total
        isActive: true,
      },
    });

    const tour = await prisma.tour.create({
      data: {
        agencyId: agency.id,
        title: 'PG LastUse Tour',
        slug: `pg-lu-tour-${Date.now()}`,
        price: 25,
        duration: '1 day',
        destination: 'Ica',
        isPublished: true,
      },
    });

    // Dos reservas separadas que aplicaron el mismo cupón con 1 solo uso
    const [chk1, chk2] = await Promise.all([
      checkoutService.createCheckout(
        agency.slug,
        {
          customerFirstName: 'Competitor',
          customerLastName: 'One',
          customerEmail: 'comp1@example.test',
          customerPhone: '+51999999804',
          couponCode: coupon.code,
          items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
        },
        `pg-lu-chk1-${Date.now()}`,
      ),
      checkoutService.createCheckout(
        agency.slug,
        {
          customerFirstName: 'Competitor',
          customerLastName: 'Two',
          customerEmail: 'comp2@example.test',
          customerPhone: '+51999999805',
          couponCode: coupon.code,
          items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
        },
        `pg-lu-chk2-${Date.now()}`,
      ),
    ]);

    const kr1 = {
      orderStatus: 'PAID',
      orderDetails: { orderId: chk1.reservationCode, orderTotalAmount: chk1.totalMinor, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pg-lu-1-${Date.now()}` }],
    };
    const hash1 = crypto.createHmac('sha256', secretKey).update(JSON.stringify(kr1)).digest('hex');

    const kr2 = {
      orderStatus: 'PAID',
      orderDetails: { orderId: chk2.reservationCode, orderTotalAmount: chk2.totalMinor, orderCurrency: 'USD' },
      transactions: [{ uuid: `tx-pg-lu-2-${Date.now()}` }],
    };
    const hash2 = crypto.createHmac('sha256', secretKey).update(JSON.stringify(kr2)).digest('hex');

    // Disparar ambos IPNs concurrentemente
    const [ipnRes1, ipnRes2] = await Promise.all([
      paymentsService.processIzipayIpn({ 'kr-answer': kr1, 'kr-hash': hash1 }),
      paymentsService.processIzipayIpn({ 'kr-answer': kr2, 'kr-hash': hash2 }),
    ]);

    const statuses = [ipnRes1.status, ipnRes2.status];
    assert.ok(statuses.includes('PAID'), 'One reservation must be confirmed PAID');
    assert.ok(statuses.includes('REVIEW_REQUIRED'), 'Losing reservation must require REVIEW due to oversubscribed coupon');

    // Verificar en base de datos PostgreSQL
    const finalCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    assert.equal(finalCoupon.timesUsed, 1, 'Coupon timesUsed must not exceed usageLimit (1)');

    const dbRes1 = await prisma.reservation.findUnique({ where: { id: chk1.reservationId } });
    const dbRes2 = await prisma.reservation.findUnique({ where: { id: chk2.reservationId } });
    const dbStatuses = [dbRes1.paymentStatus, dbRes2.paymentStatus];

    assert.ok(dbStatuses.includes(ReservationPaymentStatus.PAID));
    assert.ok(dbStatuses.includes(ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW));

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: { in: [chk1.reservationId, chk2.reservationId] } } });
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  // E. Distributed payment-session claim logic -> two simulated service instances cannot both own session generation
  test('PostgreSQL E: Two simulated CheckoutService instances cannot both own session generation lease', async () => {
    const slug = `pg-lease-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'PG Lease Agency', slug, isActive: true },
    });

    const tour = await prisma.tour.create({
      data: {
        agencyId: agency.id,
        title: 'PG Lease Tour',
        slug: `pg-lease-tour-${Date.now()}`,
        price: 45,
        duration: '1 day',
        destination: 'Arequipa',
        isPublished: true,
      },
    });

    // Dos instancias simuladas de CheckoutService conectadas a la misma PostgreSQL
    const instanceA = new CheckoutService(prisma, testConfig, paymentsService);
    const instanceB = new CheckoutService(prisma, testConfig, paymentsService);

    const idempotencyKey = `pg-lease-chk-${Date.now()}`;
    const checkoutDto = {
      customerFirstName: 'Instance',
      customerLastName: 'Racer',
      customerEmail: 'instancerace@example.test',
      customerPhone: '+51999999806',
      items: [{ slug: tour.slug, serviceType: 'shared', date: '2026-10-15', pax: 1 }],
    };

    // Ambas instancias intentan simultáneamente procesar el checkout para la misma clave
    const [resA, resB] = await Promise.all([
      instanceA.createCheckout(agency.slug, checkoutDto, idempotencyKey),
      instanceB.createCheckout(agency.slug, checkoutDto, idempotencyKey),
    ]);

    assert.equal(resA.reservationId, resB.reservationId, 'Both instances must resolve the same reservation');
    assert.ok(resA.formToken, 'Instance A must have valid formToken');
    assert.ok(resB.formToken, 'Instance B must have valid formToken');
    assert.equal(resA.formToken, resB.formToken, 'Both instances must share the same formToken');

    // Verificar en PostgreSQL que el estado del lease se completó limpiamente (READY) y no quedó colgado en CREATING
    const saved = await prisma.reservation.findUnique({ where: { id: resA.reservationId } });
    assert.equal(saved.paymentSessionStatus, 'READY');
    assert.equal(saved.paymentSessionOwner, null, 'Lease owner must be released after completion');

    // Cleanup
    await prisma.reservationItem.deleteMany({ where: { tourId: tour.id } });
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.tour.delete({ where: { id: tour.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });
}
