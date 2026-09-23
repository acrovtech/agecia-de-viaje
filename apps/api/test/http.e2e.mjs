import crypto from 'node:crypto';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Controller, Get } from '@nestjs/common';
import { config, application } from './helpers.mjs';

class PrivateController { index() { return { secret: true }; } }
Controller('private')(PrivateController);
Get()(PrivateController.prototype, 'index', Object.getOwnPropertyDescriptor(PrivateController.prototype, 'index'));

const agencies = [
  { id: 'a', slug: 'agency-a', isActive: true },
  { id: 'b', slug: 'agency-b', isActive: true },
  { id: 'c', slug: 'inactive', isActive: false },
];
const tours = [
  { agencyId: 'a', slug: 'tour-a', title: 'Tour A', id: 't-a' },
  { agencyId: 'a', slug: 'tour-a-two', title: 'Tour A 2', id: 't-a2' },
  { agencyId: 'b', slug: 'tour-b', title: 'Tour B', id: 't-b' },
  { agencyId: null, slug: 'orphan', title: 'Orphan', id: 't-orph' },
].map((tour) => ({
  ...tour, description: 'Public description', duration: '1 day', cardImage: '/tour.webp',
  bannerImage: '/banner.webp', altitude: '3400', transport: 'Bus', groupSize: '15',
  difficulty: 'Easy', mapImage: null, metaTitle: 'Tour Meta', metaDescription: 'Tour Meta Desc',
  region: 'Cusco', isPublished: true, hasSharedService: true, hasPrivateService: true, sharedPrice: 20,
  categories: [{ id: 'cat-1', name: 'Aventura', slug: 'aventura' }],
  images: [{ id: 'img-1', url: '/img1.webp', alt: 'Img 1', order: 0 }],
  itineraries: [{ id: 'it-1', title: 'Day 1', content: 'Explore', order: 0 }],
  inclusions: [{ id: 'inc-1', content: 'Transporte', order: 0 }],
  exclusions: [{ id: 'exc-1', content: 'Propinas', order: 0 }],
  recommendations: [{ id: 'rec-1', content: 'Bloqueador', order: 0 }],
  faqs: [{ id: 'faq-1', question: 'Q1', answer: 'A1', order: 0 }],
  privatePricing: [{ id: 'pp-1', pax: 2, price: 50 }],
  // Even an overly broad adapter must not leak these fields through the DTO.
  internalSecret: 'DO_NOT_EXPOSE', reservations: [{ customerEmail: 'private@example.test' }],
}));

const transfers = [
  {
    id: 'tr-a',
    agencyId: 'a', slug: 'transfer-a', title: 'Transfer A', origin: 'Aeropuerto',
    destination: 'Hotel', duration: '30 min', tripType: 'Solo ida', description: 'Ruta A',
    bannerImage: '/banner-a.webp', hasSharedService: true, sharedPrice: 15, hasPrivateService: true,
    isActive: true, order: 1,
    vehiclePrices: [{ price: 45, vehicle: { id: 'v-sedan', code: 'sedan', name: 'Sedan', maxPax: 3, maxLuggage: 3 } }],
  },
  {
    id: 'tr-b',
    agencyId: 'b', slug: 'transfer-b', title: 'Transfer B', origin: 'Estacion',
    destination: 'Hotel', duration: '20 min', tripType: 'Solo ida', description: 'Ruta B',
    bannerImage: '/banner-b.webp', hasSharedService: false, sharedPrice: null, hasPrivateService: true,
    isActive: true, order: 1,
    vehiclePrices: [{ price: 60, vehicle: { id: 'v-van', code: 'van', name: 'Van', maxPax: 6, maxLuggage: 6 } }],
  },
];

const coupons = [
  { id: 'c1', agencyId: 'a', code: 'PROMO10', isActive: true, discountType: 'PERCENTAGE', discountValue: 10, timesUsed: 0, usageLimit: 100, minSpend: 10 },
  { id: 'c2', agencyId: 'a', code: 'EXPIRED', isActive: true, expiresAt: new Date('2020-01-01'), discountType: 'FIXED', discountValue: 5, timesUsed: 0 },
];
const reservations = [];
const notifications = [];

const queries = [];
const prisma = {
  agency: { findFirst: async ({ where }) => agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug) && a.isActive === where.isActive) ?? null },
  tour: {
    findMany: async (query) => {
      queries.push(query);
      return tours.filter((tour) => tour.agencyId === query.where.agencyId).slice(query.skip, query.skip + query.take);
    },
    findFirst: async ({ where }) => tours.find((tour) => tour.agencyId === where.agencyId && tour.slug === where.slug) ?? null,
  },
  transfer: {
    findMany: async (query) => {
      queries.push(query);
      return transfers.filter((t) => t.agencyId === query.where.agencyId && t.isActive === query.where.isActive).slice(query.skip, query.skip + query.take);
    },
    findFirst: async ({ where }) => transfers.find((t) => t.agencyId === where.agencyId && t.slug === where.slug && t.isActive === where.isActive) ?? null,
  },
  coupon: {
    findFirst: async ({ where }) => coupons.find((c) => c.code === where.code && c.isActive === where.isActive) ?? null,
    update: async ({ where, data }) => {
      const c = coupons.find((item) => item.id === where.id);
      if (c && data.timesUsed?.increment) c.timesUsed += data.timesUsed.increment;
      return c;
    },
  },
  reservation: {
    findFirst: async ({ where }) => {
      if (where.paymentReference) {
        return reservations.find((r) => r.paymentReference === where.paymentReference) ?? null;
      }
      if (where.code) {
        return reservations.find((r) => r.code === where.code) ?? null;
      }
      return null;
    },
    create: async ({ data }) => {
      const res = {
        id: `res-${reservations.length + 1}`,
        ...data,
        items: (data.items?.create || []).map((it) => {
          const tour = tours.find((t) => t.id === it.tourId);
          const transfer = transfers.find((t) => t.id === it.transferId);
          return { ...it, tour, transfer };
        }),
      };
      reservations.push(res);
      return res;
    },
    update: async ({ where, data }) => {
      const res = reservations.find((r) => r.id === where.id);
      if (res) Object.assign(res, data);
      return res;
    },
  },
  paymentNotification: {
    create: async ({ data }) => {
      notifications.push(data);
      return { id: `notif-${notifications.length}`, ...data };
    },
  },
  $transaction: async (cb) => cb(prisma),
  $queryRaw: async () => [{ '?column?': 1 }],
};
let app;
before(async () => { app = await application(config({ API_DOCS_ENABLED: 'true' }), prisma, [PrivateController]); });
after(async () => { await app?.close(); });

test('liveness/readiness respond with request IDs and security headers', async () => {
  const live = await request(app.getHttpServer()).get('/health/live').expect(200);
  assert.deepEqual(live.body, { status: 'ok' });
  assert.match(live.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  assert.equal(live.headers['x-powered-by'], undefined);
  assert.equal(live.headers['x-content-type-options'], 'nosniff');
  await request(app.getHttpServer()).get('/health/ready').expect(200);
});

test('catalog scopes queries to resolved agency and paginates without leaking models', async () => {
  const first = await request(app.getHttpServer()).get('/v1/storefronts/agency-a/tours?limit=1').expect(200);
  assert.deepEqual(first.body.pagination, { page: 1, limit: 1, hasMore: true });
  assert.equal(first.body.data[0].slug, 'tour-a');
  assert.equal(first.body.data[0].agencyId, undefined);
  assert.equal(first.body.data[0].reservations, undefined);
  assert.equal(first.body.data[0].internalSecret, undefined);
  assert.deepEqual(queries.at(-1).where, { agencyId: 'a', isPublished: true, agency: { isActive: true } });
  const second = await request(app.getHttpServer()).get('/v1/storefronts/agency-a/tours?page=2&limit=1').expect(200);
  assert.equal(second.body.data[0].slug, 'tour-a-two');
  assert.equal(second.body.pagination.hasMore, false);
});

test('another agency slug and orphan record cannot be read through agency A', async () => {
  await request(app.getHttpServer()).get('/v1/storefronts/agency-a/tours/tour-b').expect(404);
  await request(app.getHttpServer()).get('/v1/storefronts/agency-a/tours/orphan').expect(404);
  const own = await request(app.getHttpServer()).get('/v1/storefronts/agency-b/tours/tour-b').expect(200);
  assert.equal(own.body.title, 'Tour B');
  assert.equal(own.body.itineraries.length, 1);
  assert.equal(own.body.itineraries[0].title, 'Day 1');
  assert.equal(own.body.inclusions.length, 1);
  assert.equal(own.body.privatePricing[0].pax, 2);
  assert.equal(own.body.privatePricing[0].price, 50);
  assert.equal(own.body.internalSecret, undefined);
  assert.equal(own.body.reservations, undefined);
});

test('unknown and inactive agencies fail closed', async () => {
  await request(app.getHttpServer()).get('/v1/storefronts/missing/tours').expect(404);
  await request(app.getHttpServer()).get('/v1/storefronts/inactive/tours').expect(404);
});

test('invalid/extra parameters cannot override agency or expand limits', async () => {
  for (const query of ['limit=101', 'limit=-1', 'page=0', 'page=abc', 'page=10001', 'agencyId=b', 'limit=1&limit=2']) {
    const result = await request(app.getHttpServer()).get(`/v1/storefronts/agency-a/tours?${query}`).expect(400);
    assert.equal(result.body.error.code, 'INVALID_REQUEST');
  }
});

test('new private routes deny access even with arbitrary legacy credentials', async () => {
  await request(app.getHttpServer()).get('/private').set('Authorization', 'Bearer forged').expect(401);
});

test('CORS allows configured browser origins only, without credential sharing', async () => {
  const allowed = await request(app.getHttpServer()).get('/health/live').set('Origin', 'https://agency-a.example').expect(200);
  assert.equal(allowed.headers['access-control-allow-origin'], 'https://agency-a.example');
  assert.equal(allowed.headers['access-control-allow-credentials'], undefined);
  const denied = await request(app.getHttpServer()).get('/health/live').set('Origin', 'https://evil.example').expect(200);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('transfers catalog scopes queries to resolved agency and returns vehicle options', async () => {
  const result = await request(app.getHttpServer()).get('/v1/storefronts/agency-a/transfers').expect(200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].slug, 'transfer-a');
  assert.equal(result.body.data[0].vehicleOptions[0].vehicleCode, 'sedan');
  assert.equal(result.body.data[0].vehicleOptions[0].price, 45);

  const detail = await request(app.getHttpServer()).get('/v1/storefronts/agency-a/transfers/transfer-a').expect(200);
  assert.equal(detail.body.title, 'Transfer A');
});

test('another agency transfer slug cannot be read through agency A', async () => {
  await request(app.getHttpServer()).get('/v1/storefronts/agency-a/transfers/transfer-b').expect(404);
  const own = await request(app.getHttpServer()).get('/v1/storefronts/agency-b/transfers/transfer-b').expect(200);
  assert.equal(own.body.title, 'Transfer B');
});

test('OpenAPI includes versioned routes and concrete public response schemas', async () => {
  const result = await request(app.getHttpServer()).get('/openapi.json').expect(200);
  assert.ok(result.body.paths['/v1/storefronts/{storefront}/tours']);
  assert.ok(result.body.paths['/v1/storefronts/{storefront}/transfers']);
  assert.ok(result.body.components.schemas.TourListDto);
  assert.ok(result.body.components.schemas.TourSummaryDto);
  assert.ok(result.body.components.schemas.TransferListDto);
  assert.ok(result.body.components.schemas.TransferSummaryDto);
  assert.equal(JSON.stringify(result.body).includes('DATABASE_URL'), false);
});

test('catalog and documentation are closed by default', async () => {
  const closed = await application(config({ API_PUBLIC_AGENCY_SLUGS: '' }), prisma);
  try {
    await request(closed.getHttpServer()).get('/v1/storefronts/agency-a/tours').expect(404);
    await request(closed.getHttpServer()).get('/openapi.json').expect(404);
    await request(closed.getHttpServer()).get('/docs').expect(404);
  } finally { await closed.close(); }
});

test('database failures return sanitized errors and liveness remains available', async () => {
  const failure = async () => { throw new Error('postgresql://SECRET:PASSWORD@private.internal/db'); };
  const failed = await application(config(), { ...prisma, agency: { findFirst: failure }, $queryRaw: failure });
  try {
    const result = await request(failed.getHttpServer()).get('/v1/storefronts/agency-a/tours').expect(500);
    assert.equal(result.body.error.code, 'INTERNAL_ERROR');
    assert.equal(JSON.stringify(result.body).includes('SECRET'), false);
    const ready = await request(failed.getHttpServer()).get('/health/ready').expect(503);
    assert.equal(ready.body.error.code, 'UNAVAILABLE');
    await request(failed.getHttpServer()).get('/health/live').expect(200);
  } finally { await failed.close(); }
});

test('catalog has a bounded request rate', async () => {
  const limited = await application(config({ API_RATE_LIMIT: '1' }), prisma);
  try {
    await request(limited.getHttpServer()).get('/v1/storefronts/agency-a/tours').expect(200);
    const blocked = await request(limited.getHttpServer()).get('/v1/storefronts/agency-a/tours').expect(429);
    assert.equal(blocked.body.error.code, 'RATE_LIMITED');
  } finally { await limited.close(); }
});

test('invalid configuration fails without including secret values', () => {
  for (const overrides of [
    { DATABASE_URL: 'SECRET_NOT_A_URL' }, { API_PORT: '70000' }, { API_DOCS_ENABLED: 'yes' },
    { API_CORS_ORIGINS: '*' }, { API_CORS_ORIGINS: 'https://example.test/path' },
    { API_PUBLIC_AGENCY_SLUGS: 'agency-a,*' },
  ]) {
    assert.throws(() => config(overrides), (error) => error.message.startsWith('Configuración API inválida:') && !error.message.includes('SECRET_NOT_A_URL'));
  }
});

test('financial prototypes are unavailable outside the test environment', async () => {
  for (const environment of ['development', 'production']) {
    const closed = await application(config({ NODE_ENV: environment, API_DOCS_ENABLED: 'true' }), prisma);
    try {
      await request(closed.getHttpServer()).post('/v1/storefronts/agency-a/checkout').send({}).expect(404);
      await request(closed.getHttpServer()).post('/v1/payments/izipay/ipn').send({}).expect(404);
      const spec = await request(closed.getHttpServer()).get('/openapi.json').expect(200);
      assert.equal(Object.keys(spec.body.paths).some((path) => /checkout|izipay/.test(path)), false);
    } finally { await closed.close(); }
  }
});

test('checkout creates reservation with minor units and quotes authoritatively', async () => {
  const result = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerEmail: 'john@example.test',
      customerPhone: '+51999999999',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 2 }],
      passengers: [{ firstName: 'John', lastName: 'Doe', documentType: 'DNI', documentNumber: '12345678' }],
    })
    .expect(201);

  assert.equal(result.body.totalMinor, 4000);
  assert.equal(result.body.subtotalMinor, 4000);
  assert.equal(result.body.discountMinor, 0);
  assert.equal(result.body.currency, 'USD');
  assert.equal(result.body.bookingStatus, 'PENDING');
  assert.equal(result.body.paymentStatus, 'PENDING');
  assert.ok(result.body.reservationId);
  assert.ok(result.body.reservationCode);
});

test('checkout applies coupon discount without burning usage prematurely', async () => {
  const initialCoupon = coupons.find((c) => c.code === 'PROMO10');
  assert.equal(initialCoupon.timesUsed, 0);

  const result = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'Jane',
      customerLastName: 'Doe',
      customerEmail: 'jane@example.test',
      customerPhone: '+51999999998',
      couponCode: 'PROMO10',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 2 }],
    })
    .expect(201);

  assert.equal(result.body.subtotalMinor, 4000);
  assert.equal(result.body.discountMinor, 400); // 10% de 4000
  assert.equal(result.body.totalMinor, 3600);
  // El cupón no se quema en el checkout
  assert.equal(initialCoupon.timesUsed, 0);
});

test('checkout is idempotent with Idempotency-Key header', async () => {
  const payload = {
    customerFirstName: 'Alice',
    customerLastName: 'Smith',
    customerEmail: 'alice@example.test',
    customerPhone: '+51999999997',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const first = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-test-100')
    .send(payload)
    .expect(201);

  const second = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-test-100')
    .send(payload)
    .expect(201);

  assert.equal(first.body.reservationId, second.body.reservationId);
  assert.equal(first.body.reservationCode, second.body.reservationCode);

  // Conflicto si los datos divergen
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-test-100')
    .send({ ...payload, customerEmail: 'divergent@example.test' })
    .expect(409);
});

test('checkout rejects invalid or expired coupon', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'Bob',
      customerLastName: 'Builder',
      customerEmail: 'bob@example.test',
      customerPhone: '+51999999996',
      couponCode: 'EXPIRED',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(400);
});

test('izipay IPN fails with invalid HMAC signature', async () => {
  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({
      'kr-answer': { orderDetails: { orderId: 'IB-UNKNOWN', orderTotalAmount: 1000 } },
      'kr-hash': 'forged_hash_invalid',
    })
    .expect(400);
});

test('izipay IPN handles amount mismatch safely without marking PAID', async () => {
  // Crear reserva previa de 20 USD = 2000 centavos
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'Charlie',
      customerLastName: 'Brown',
      customerEmail: 'charlie@example.test',
      customerPhone: '+51999999995',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 9999, // Mismatch intencional
      orderCurrency: 'USD',
    },
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  const ipnResult = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({
      'kr-answer': krAnswer,
      'kr-hash': validHash,
    })
    .expect(200);

  assert.equal(ipnResult.body.success, false);
  assert.equal(ipnResult.body.status, 'REVIEW_REQUIRED');
  assert.equal(ipnResult.body.reviewReason, 'AMOUNT_MISMATCH');

  const reservationInDb = reservations.find((r) => r.code === checkout.body.reservationCode);
  assert.equal(reservationInDb.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');
});

test('izipay IPN transitions reservation to PAID and records transactional outbox', async () => {
  // Crear reserva con cupón PROMO10: total 3600 centavos
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'Diana',
      customerLastName: 'Prince',
      customerEmail: 'diana@example.test',
      customerPhone: '+51999999994',
      couponCode: 'PROMO10',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 2 }],
    })
    .expect(201);

  const couponBefore = coupons.find((c) => c.code === 'PROMO10');
  const timesUsedBefore = couponBefore.timesUsed;

  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 3600, // Coincide exactamente
      orderCurrency: 'USD',
    },
    transactions: [{ uuid: 'tx-izipay-12345' }],
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  const ipnResult = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({
      'kr-answer': krAnswer,
      'kr-hash': validHash,
    })
    .expect(200);

  assert.equal(ipnResult.body.success, true);
  assert.equal(ipnResult.body.status, 'PAID');
  assert.equal(ipnResult.body.paidMinor, 3600);

  // Cupón confirmado atómicamente tras pago exitoso
  assert.equal(couponBefore.timesUsed, timesUsedBefore + 1);

  // Outbox transaccional creado para entrega durable
  const notif = notifications.find((n) => n.legacyId === checkout.body.reservationId);
  assert.ok(notif);
  assert.equal(notif.state, 'PENDING');
  assert.equal(notif.kind, 'ORDER_CONFIRMED');
  assert.equal(notif.snapshot.paidMinor, 3600);
});
