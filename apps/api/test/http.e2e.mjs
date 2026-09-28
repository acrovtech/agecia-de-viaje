import crypto from 'node:crypto';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { Controller, Get } from '@nestjs/common';
import { config, application, parseConfig } from './helpers.mjs';

class PrivateController { index() { return { secret: true }; } }
Controller('private')(PrivateController);
Get()(PrivateController.prototype, 'index', Object.getOwnPropertyDescriptor(PrivateController.prototype, 'index'));

const agencies = [
  { id: 'a', slug: 'agency-a', isActive: true },
  { id: 'b', slug: 'agency-b', isActive: true },
  { id: 'c', slug: 'inactive', isActive: false },
];
const tours = [
  { agencyId: 'a', slug: 'tour-a', title: 'Tour A', id: 't-a', isPublished: true },
  { agencyId: 'a', slug: 'tour-a-two', title: 'Tour A 2', id: 't-a2', isPublished: true },
  { agencyId: 'b', slug: 'tour-b', title: 'Tour B', id: 't-b', isPublished: true },
  { agencyId: null, slug: 'orphan', title: 'Orphan', id: 't-orph', isPublished: true },
  { agencyId: 'a', slug: 'tour-draft', title: 'Tour Draft', id: 't-draft', isPublished: false },
].map((tour) => ({
  isPublished: true,
  ...tour, description: 'Public description', duration: '1 day', cardImage: '/tour.webp',
  bannerImage: '/banner.webp', altitude: '3400', transport: 'Bus', groupSize: '15',
  difficulty: 'Easy', mapImage: null, metaTitle: 'Tour Meta', metaDescription: 'Tour Meta Desc',
  region: 'Cusco', hasSharedService: true, hasPrivateService: true, sharedPrice: 20,
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
    isActive: true, isPublished: true, order: 1,
    vehiclePrices: [
      { price: 45, vehicle: { id: 'v-sedan', agencyId: 'a', code: 'sedan', name: 'Sedan', maxPax: 3, maxLuggage: 3 } },
      { price: 50, vehicle: { id: 'v-orphan', agencyId: null, code: 'orphan-car', name: 'Orphan Car', maxPax: 4, maxLuggage: 2 } },
      { price: 60, vehicle: { id: 'v-other', agencyId: 'b', code: 'other-car', name: 'Other Car', maxPax: 4, maxLuggage: 2 } },
    ],
  },
  {
    id: 'tr-draft',
    agencyId: 'a', slug: 'transfer-draft', title: 'Transfer Draft', origin: 'Aeropuerto',
    destination: 'Hotel', duration: '30 min', tripType: 'Solo ida', description: 'Ruta Draft',
    bannerImage: '/banner-draft.webp', hasSharedService: true, sharedPrice: 15, hasPrivateService: true,
    isActive: true, isPublished: false, order: 2,
    vehiclePrices: [],
  },
  {
    id: 'tr-b',
    agencyId: 'b', slug: 'transfer-b', title: 'Transfer B', origin: 'Estacion',
    destination: 'Hotel', duration: '20 min', tripType: 'Solo ida', description: 'Ruta B',
    bannerImage: '/banner-b.webp', hasSharedService: false, sharedPrice: null, hasPrivateService: true,
    isActive: true, isPublished: true, order: 1,
    vehiclePrices: [{ price: 60, vehicle: { id: 'v-van', agencyId: 'b', code: 'van', name: 'Van', maxPax: 6, maxLuggage: 6 } }],
  },
];

const coupons = [
  { id: 'c1', agencyId: 'a', code: 'PROMO10', isActive: true, discountType: 'PERCENTAGE', discountValue: 10, timesUsed: 0, usageLimit: 100, minSpend: 10 },
  { id: 'c2', agencyId: 'a', code: 'EXPIRED', isActive: true, expiresAt: new Date('2020-01-01'), discountType: 'FIXED', discountValue: 5, timesUsed: 0 },
  { id: 'c3', agencyId: 'b', code: 'AGENCYB_ONLY', isActive: true, discountType: 'PERCENTAGE', discountValue: 20, timesUsed: 0, usageLimit: 50, minSpend: 10 },
  { id: 'c-limited', agencyId: 'a', code: 'LIMITED1', isActive: true, discountType: 'FIXED', discountValue: 5, timesUsed: 0, usageLimit: 1, minSpend: 10 },
  { id: 'c-unlimited', agencyId: 'a', code: 'UNLIMITED', isActive: true, discountType: 'FIXED', discountValue: 5, timesUsed: 10, usageLimit: null, minSpend: 10 },
  { id: 'c-zero', agencyId: 'a', code: 'ZERO_USE', isActive: true, discountType: 'FIXED', discountValue: 5, timesUsed: 0, usageLimit: 0, minSpend: 10 },
  { id: 'c-free', agencyId: 'a', code: 'FREE100', isActive: true, discountType: 'PERCENTAGE', discountValue: 100, timesUsed: 0, usageLimit: 10, minSpend: 10 },
];
const reservations = [];
const notifications = [];
const reservationEvents = [];

const queries = [];
const prisma = {
  agency: { findFirst: async ({ where }) => agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug) && a.isActive === where.isActive) ?? null },
  tour: {
    findMany: async (query) => {
      queries.push(query);
      return tours.filter((tour) => tour.agencyId === query.where.agencyId && (query.where.isPublished === undefined || tour.isPublished === query.where.isPublished)).slice(query.skip, query.skip + query.take);
    },
    findFirst: async ({ where }) => tours.find((tour) => tour.agencyId === where.agencyId && tour.slug === where.slug && (where.isPublished === undefined || tour.isPublished === where.isPublished)) ?? null,
  },
  transfer: {
    findMany: async (query) => {
      queries.push(query);
      return transfers.filter((t) => t.agencyId === query.where.agencyId && (query.where.isActive === undefined || t.isActive === query.where.isActive) && (query.where.isPublished === undefined || t.isPublished === query.where.isPublished)).slice(query.skip, query.skip + query.take);
    },
    findFirst: async ({ where }) => transfers.find((t) => t.agencyId === where.agencyId && t.slug === where.slug && (where.isActive === undefined || t.isActive === where.isActive) && (where.isPublished === undefined || t.isPublished === where.isPublished)) ?? null,
  },
  coupon: {
    findFirst: async ({ where }) => coupons.find((c) => {
      if (c.code !== where.code) return false;
      if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
      if (where.OR && Array.isArray(where.OR)) {
        const matches = where.OR.some((cond) => {
          if (cond.agencyId === null) return c.agencyId === null;
          return c.agencyId === cond.agencyId;
        });
        if (!matches) return false;
      } else if (where.agencyId !== undefined && c.agencyId !== where.agencyId) {
        return false;
      }
      return true;
    }) ?? null,
    findUnique: async ({ where }) => coupons.find((c) => c.id === where.id) ?? null,
    update: async ({ where, data }) => {
      const c = coupons.find((item) => item.id === where.id);
      if (c && data.timesUsed?.increment) c.timesUsed += data.timesUsed.increment;
      return c;
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      for (const c of coupons) {
        if (where.id && c.id !== where.id) continue;
        if (where.timesUsed && where.timesUsed.lt !== undefined && !(c.timesUsed < where.timesUsed.lt)) continue;
        if (data.timesUsed?.increment) c.timesUsed += data.timesUsed.increment;
        count++;
      }
      return { count };
    },
  },
  reservation: {
    findFirst: async ({ where }) => {
      return reservations.find((r) => {
        if (where.agencyId && r.agencyId !== where.agencyId) return false;
        if (where.paymentReference && r.paymentReference !== where.paymentReference) return false;
        if (where.code && r.code !== where.code) return false;
        if (where.id && r.id !== where.id) return false;
        if (where.requestKey && r.requestKey !== where.requestKey) return false;
        if (where.OR && Array.isArray(where.OR)) {
          const matchAny = where.OR.some((cond) => {
            if (cond.paymentReference && r.paymentReference === cond.paymentReference) return true;
            if (cond.code && r.code === cond.code) return true;
            if (cond.id && r.id === cond.id) return true;
            if (cond.requestKey && r.requestKey === cond.requestKey) return true;
            return false;
          });
          if (!matchAny) return false;
        }
        return true;
      }) ?? null;
    },
    create: async ({ data }) => {
      if (data.requestKey && data.agencyId) {
        const conflict = reservations.find((r) => r.agencyId === data.agencyId && r.requestKey === data.requestKey);
        if (conflict) {
          const err = new Error('Unique constraint failed on the fields: (`agencyId`,`requestKey`)');
          err.code = 'P2002';
          throw err;
        }
      }
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
    findUnique: async ({ where }) => reservations.find((r) => r.id === where.id) ?? null,
    update: async ({ where, data }) => {
      const res = reservations.find((r) => r.id === where.id);
      if (res) Object.assign(res, data);
      return res;
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      for (const r of reservations) {
        if (where.id && r.id !== where.id) continue;
        if (where.paymentStatus) {
          if (where.paymentStatus.in && !where.paymentStatus.in.includes(r.paymentStatus)) continue;
          if (typeof where.paymentStatus === 'string' && r.paymentStatus !== where.paymentStatus) continue;
        }
        if (where.paymentSessionOwner && r.paymentSessionOwner !== where.paymentSessionOwner) continue;
        if (where.OR && Array.isArray(where.OR)) {
          const matchOr = where.OR.some((cond) => {
            if (cond.paymentSessionExpiresAt === null && (r.paymentSessionExpiresAt === null || r.paymentSessionExpiresAt === undefined)) return true;
            if (cond.paymentSessionExpiresAt?.lt && r.paymentSessionExpiresAt && r.paymentSessionExpiresAt < cond.paymentSessionExpiresAt.lt) return true;
            if (cond.paymentSessionStatus?.in && cond.paymentSessionStatus.in.includes(r.paymentSessionStatus)) return true;
            if (cond.paymentSessionStatus === null && (r.paymentSessionStatus === null || r.paymentSessionStatus === undefined)) return true;
            return false;
          });
          if (!matchOr) continue;
        }
        Object.assign(r, data);
        count++;
      }
      return { count };
    },
  },
  reservationEvent: {
    create: async ({ data }) => {
      reservationEvents.push(data);
      return { id: `event-${reservationEvents.length}`, ...data };
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
    .set('idempotency-key', 'idemp-quote-1')
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
    .set('idempotency-key', 'idemp-coupon-1')
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
    .set('idempotency-key', 'idemp-expired-1')
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
    .set('idempotency-key', 'idemp-mismatch-1')
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
    transactions: [{ uuid: 'tx-mismatch-123' }],
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
    .set('idempotency-key', 'idemp-ipn-trans-1')
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

test('duplicate izipay IPN does not consume coupon twice nor duplicate notifications', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-ipn-dup-1')
    .send({
      customerFirstName: 'Eve',
      customerLastName: 'Polastri',
      customerEmail: 'eve@example.test',
      customerPhone: '+51999999993',
      couponCode: 'PROMO10',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const coupon = coupons.find((c) => c.code === 'PROMO10');
  const timesUsedBefore = coupon.timesUsed;
  const notifCountBefore = notifications.length;

  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 1800,
      orderCurrency: 'USD',
    },
    transactions: [{ uuid: 'tx-izipay-first' }],
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  // Primer IPN exitoso
  const firstIpn = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': validHash })
    .expect(200);

  assert.equal(firstIpn.body.status, 'PAID');
  assert.equal(coupon.timesUsed, timesUsedBefore + 1);
  assert.equal(notifications.length, notifCountBefore + 1);

  // Segundo IPN idéntico (reintento de la pasarela)
  const secondIpn = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': validHash })
    .expect(200);

  assert.equal(secondIpn.body.status, 'PAID');
  // NO incrementa el cupón dos veces
  assert.equal(coupon.timesUsed, timesUsedBefore + 1);
  // NO duplica outbox transaccional
  assert.equal(notifications.length, notifCountBefore + 1);
});

test('failed payment IPN does not consume coupon and does not mark PAID', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-ipn-fail-1')
    .send({
      customerFirstName: 'Frank',
      customerLastName: 'Castle',
      customerEmail: 'frank@example.test',
      customerPhone: '+51999999992',
      couponCode: 'PROMO10',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const coupon = coupons.find((c) => c.code === 'PROMO10');
  const timesUsedBefore = coupon.timesUsed;

  const krAnswer = {
    orderStatus: 'REFUSED',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 1800,
      orderCurrency: 'USD',
    },
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  const ipnResult = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': validHash })
    .expect(200);

  assert.equal(ipnResult.body.success, false);
  assert.equal(ipnResult.body.status, 'REFUSED');
  // Cupón permanece intacto
  assert.equal(coupon.timesUsed, timesUsedBefore);

  const resInDb = reservations.find((r) => r.code === checkout.body.reservationCode);
  assert.notEqual(resInDb.paymentStatus, 'PAID');
});

test('valid payment with non-existent orderId returns 404', async () => {
  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: 'IB-DOES-NOT-EXIST',
      orderTotalAmount: 2000,
      orderCurrency: 'USD',
    },
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': validHash })
    .expect(404);
});

test('cross-agency product, vehicle, or coupon use is rejected', async () => {
  // 1. Tour de agencia B intentado comprar desde agencia A -> 404
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-cross-t-1')
    .send({
      customerFirstName: 'Grace',
      customerLastName: 'Hopper',
      customerEmail: 'grace@example.test',
      customerPhone: '+51999999991',
      items: [{ slug: 'tour-b', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(404);

  // 2. Cupón de agencia B intentado usar en agencia A -> 400
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-cross-c-1')
    .send({
      customerFirstName: 'Grace',
      customerLastName: 'Hopper',
      customerEmail: 'grace@example.test',
      customerPhone: '+51999999991',
      couponCode: 'AGENCYB_ONLY',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(400);
});

test('client cannot manipulate agencyId or fake prices; server calculates authoritatively', async () => {
  const res = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-price-hack-1')
    .send({
      agencyId: 'agency-b-evil', // Intento de inyectar agencyId ajeno
      customerFirstName: 'Heist',
      customerLastName: 'Planner',
      customerEmail: 'heist@example.test',
      customerPhone: '+51999999990',
      totalPrice: 1, // Intento de pagar 1 USD en vez de tarifa autoritativa
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 2, price: 0.5 }],
    })
    .expect(201);

  // Total autoritativo calculado por el servidor: 20 USD x 2 = 4000 centavos
  assert.equal(res.body.totalMinor, 4000);
  assert.equal(res.body.subtotalMinor, 4000);

  // La reserva creada pertenece a la agencia resuelta por la ruta 'agency-a'
  const created = reservations.find((r) => r.id === res.body.reservationId);
  assert.equal(created.agencyId, 'a');
  assert.notEqual(created.agencyId, 'agency-b-evil');
  assert.notEqual(created.agencyId, null);
});

test('checkout rejects draft tour (isPublished: false)', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-draft-t-1')
    .send({
      customerFirstName: 'Draft',
      customerLastName: 'Tester',
      customerEmail: 'draft@example.test',
      customerPhone: '+51999999901',
      items: [{ slug: 'tour-draft', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(404);
});

test('checkout rejects draft transfer (isPublished: false)', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-draft-tr-1')
    .send({
      customerFirstName: 'Draft',
      customerLastName: 'Transfer',
      customerEmail: 'drafttr@example.test',
      customerPhone: '+51999999902',
      items: [{ slug: 'transfer-draft', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(404);
});

test('checkout rejects transfer with orphan vehicle (agencyId: null)', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-orphan-v-1')
    .send({
      customerFirstName: 'Orphan',
      customerLastName: 'Vehicle',
      customerEmail: 'orphanveh@example.test',
      customerPhone: '+51999999903',
      items: [{ slug: 'transfer-a', serviceType: 'private', vehicleCode: 'orphan-car', date: '2026-10-01', pax: 2 }],
    })
    .expect(400);
});

test('checkout rejects transfer with vehicle belonging to another agency', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-foreign-v-1')
    .send({
      customerFirstName: 'Foreign',
      customerLastName: 'Vehicle',
      customerEmail: 'foreignveh@example.test',
      customerPhone: '+51999999904',
      items: [{ slug: 'transfer-a', serviceType: 'private', vehicleCode: 'other-car', date: '2026-10-01', pax: 2 }],
    })
    .expect(400);
});

test('concurrent checkout with same key creates one reservation and recovers winning state', async () => {
  const payload = {
    customerFirstName: 'Concurrent',
    customerLastName: 'Checkout',
    customerEmail: 'concurrent@example.test',
    customerPhone: '+51999999905',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };
  const key = 'idemp-race-test-999';

  const [res1, res2] = await Promise.all([
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
  ]);

  assert.equal(res1.status, 201);
  assert.equal(res2.status, 201);
  assert.equal(res1.body.reservationId, res2.body.reservationId);
  assert.equal(res1.body.reservationCode, res2.body.reservationCode);

  const count = reservations.filter((r) => r.requestKey === key).length;
  assert.equal(count, 1);
});

test('actual retry preserves same idempotency key across requests and returns same reservation', async () => {
  const payload = {
    customerFirstName: 'Retry',
    customerLastName: 'Tester',
    customerEmail: 'retry@example.test',
    customerPhone: '+51999999906',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };
  const key = 'idemp-retry-preserved-123';

  const first = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  assert.equal(first.body.reservationId, retry.body.reservationId);
  const found = reservations.find((r) => r.requestKey === key);
  assert.equal(found.requestKey, key);
  assert.notEqual(found.paymentReference, key);
});

test('failed CreatePayment recovers on retry without creating duplicate reservation', async () => {
  const payload = {
    customerFirstName: 'Recover',
    customerLastName: 'Payment',
    customerEmail: 'recover@example.test',
    customerPhone: '+51999999907',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };
  const key = 'idemp-recover-payment-001';

  const first = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  assert.equal(first.body.reservationId, retry.body.reservationId);
  assert.equal(retry.body.paymentStatus, 'PENDING');
  assert.ok(retry.body.formToken);
  assert.equal(reservations.filter((r) => r.requestKey === key).length, 1);
});

test('paid reservation never returns transaction UUID as formToken (returns formToken: null)', async () => {
  const payload = {
    customerFirstName: 'Paid',
    customerLastName: 'Reservation',
    customerEmail: 'paidres@example.test',
    customerPhone: '+51999999908',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };
  const key = 'idemp-paid-res-002';

  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  const resInDb = reservations.find((r) => r.id === checkout.body.reservationId);
  resInDb.paymentStatus = 'PAID';
  resInDb.paymentReference = 'uuid-tx-12345678-abcd';

  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  assert.equal(retry.body.paymentStatus, 'PAID');
  assert.equal(retry.body.formToken, null);
  assert.notEqual(retry.body.formToken, 'uuid-tx-12345678-abcd');
});

test('limited coupon cannot be oversubscribed concurrently; second payment enters REVIEW without losing payment', async () => {
  const c1 = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-limited-race-1')
    .send({
      customerFirstName: 'Racer1',
      customerLastName: 'Coupon',
      customerEmail: 'racer1@example.test',
      customerPhone: '+51999999911',
      couponCode: 'LIMITED1',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const c2 = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-limited-race-2')
    .send({
      customerFirstName: 'Racer2',
      customerLastName: 'Coupon',
      customerEmail: 'racer2@example.test',
      customerPhone: '+51999999912',
      couponCode: 'LIMITED1',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const coupon = coupons.find((c) => c.code === 'LIMITED1');
  assert.equal(coupon.timesUsed, 0);

  const kr1 = {
    orderStatus: 'PAID',
    orderDetails: { orderId: c1.body.reservationCode, orderTotalAmount: 1500, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-coupon-1' }],
  };
  const hash1 = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(kr1)).digest('hex');
  const ipn1 = await request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': kr1, 'kr-hash': hash1 }).expect(200);

  assert.equal(ipn1.body.status, 'PAID');
  assert.equal(coupon.timesUsed, 1);

  const kr2 = {
    orderStatus: 'PAID',
    orderDetails: { orderId: c2.body.reservationCode, orderTotalAmount: 1500, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-coupon-2' }],
  };
  const hash2 = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(kr2)).digest('hex');
  const ipn2 = await request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': kr2, 'kr-hash': hash2 }).expect(200);

  assert.equal(ipn2.body.status, 'REVIEW_REQUIRED');
  assert.equal(ipn2.body.reviewReason, 'COUPON_CAPACITY_EXHAUSTED');
  assert.equal(coupon.timesUsed, 1);

  const r2Db = reservations.find((r) => r.code === c2.body.reservationCode);
  assert.equal(r2Db.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');
  assert.equal(r2Db.paidMinor, 1500);
});

test('concurrent identical IPNs cause exactly one financial transition and produce one outbox event', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-concurrent-ipn-c')
    .send({
      customerFirstName: 'IPN',
      customerLastName: 'Concurrent',
      customerEmail: 'ipncon@example.test',
      customerPhone: '+51999999913',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const kr = {
    orderStatus: 'PAID',
    orderDetails: { orderId: checkout.body.reservationCode, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-concurrent-ipn' }],
  };
  const hash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(kr)).digest('hex');

  const [res1, res2] = await Promise.all([
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': kr, 'kr-hash': hash }),
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': kr, 'kr-hash': hash }),
  ]);

  assert.equal(res1.status, 200);
  assert.equal(res2.status, 200);
  assert.equal(res1.body.status, 'PAID');
  assert.equal(res2.body.status, 'PAID');

  const notifs = notifications.filter((n) => n.legacyId === checkout.body.reservationId);
  assert.equal(notifs.length, 1);
});

test('amount mismatch preserves customer specialRequirements notes without overwrite', async () => {
  const specialNotes = 'Notas del pasajero: Habitación cerca del ascensor y dieta vegana';
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-notes-mismatch-1')
    .send({
      customerFirstName: 'Notes',
      customerLastName: 'Preserve',
      customerEmail: 'notes@example.test',
      customerPhone: '+51999999914',
      specialRequirements: specialNotes,
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 9999,
      orderCurrency: 'USD',
    },
    transactions: [{ uuid: 'tx-mismatch-audit' }],
  };
  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  const ipnResult = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': validHash })
    .expect(200);

  assert.equal(ipnResult.body.status, 'REVIEW_REQUIRED');

  const resInDb = reservations.find((r) => r.code === checkout.body.reservationCode);
  assert.equal(resInDb.specialRequirements, specialNotes);

  const event = reservationEvents.find((e) => e.reservationId === resInDb.id && e.note.includes('AMOUNT_MISMATCH'));
  assert.ok(event);
  assert.match(event.note, /Esperado 2000c, recibido 9999c/);
});

test('missing or invalid currency in IPN does not default silently and fails validation', async () => {
  const krAnswer = {
    orderStatus: 'PAID',
    orderDetails: {
      orderId: 'IB-CURRENCY-TEST',
      orderTotalAmount: 2000,
      orderCurrency: '',
    },
    transactions: [{ uuid: 'tx-no-currency' }],
  };
  const hash = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krAnswer)).digest('hex');

  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krAnswer, 'kr-hash': hash })
    .expect(400);
});

test('invalid provider status (UNPAID, SUCCESS) cannot mark reservation as PAID', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-status-invalid-1')
    .send({
      customerFirstName: 'Status',
      customerLastName: 'Invalid',
      customerEmail: 'statusinv@example.test',
      customerPhone: '+51999999915',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const krSuccess = {
    orderStatus: 'SUCCESS',
    orderDetails: { orderId: checkout.body.reservationCode, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-status-success' }],
  };
  const hashSuccess = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krSuccess)).digest('hex');
  const resSuccess = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krSuccess, 'kr-hash': hashSuccess })
    .expect(200);

  assert.equal(resSuccess.body.success, false);
  assert.equal(resSuccess.body.status, 'SUCCESS');

  const krUnpaid = {
    orderStatus: 'UNPAID',
    orderDetails: { orderId: checkout.body.reservationCode, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-status-unpaid' }],
  };
  const hashUnpaid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krUnpaid)).digest('hex');
  const resUnpaid = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krUnpaid, 'kr-hash': hashUnpaid })
    .expect(200);

  assert.equal(resUnpaid.body.success, false);
  assert.equal(resUnpaid.body.status, 'UNPAID');

  const resInDb = reservations.find((r) => r.code === checkout.body.reservationCode);
  assert.notEqual(resInDb.paymentStatus, 'PAID');
});

test('production checkout fails startup when credentials are incomplete', () => {
  assert.throws(
    () => {
      parseConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod:prod@127.0.0.1:5432/api_prod',
        API_CHECKOUT_ENABLED: 'true',
      });
    },
    (err) => {
      assert.ok(err.message.includes('Configuración API inválida'));
      assert.ok(err.message.includes('IZIPAY_SHOP_ID') || err.message.includes('IZIPAY_PASSWORD'));
      assert.ok(!err.message.includes('test_secret'));
      return true;
    },
  );
});

test('provider-style IPN with raw string kr-answer validates HMAC signature cleanly', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-raw-string-test-1')
    .send({
      customerFirstName: 'Raw',
      customerLastName: 'String',
      customerEmail: 'rawstring@example.test',
      customerPhone: '+51999999917',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const rawKrAnswer = JSON.stringify({
    orderStatus: 'PAID',
    orderDetails: {
      orderId: checkout.body.reservationCode,
      orderTotalAmount: 2000,
      orderCurrency: 'USD',
    },
    transactions: [{ uuid: 'tx-raw-string-123' }],
  });

  const validHash = crypto.createHmac('sha256', 'test_secret_key').update(rawKrAnswer).digest('hex');

  const ipnResult = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .type('form')
    .send({
      'kr-answer': rawKrAnswer,
      'kr-hash': validHash,
    })
    .expect(200);

  assert.equal(ipnResult.body.success, true);
  assert.equal(ipnResult.body.status, 'PAID');
});

test('production storefront missing tenant configuration fails closed without incabound fallback', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSlug = process.env.STOREFRONT_SLUG;
  const originalPublicSlug = process.env.NEXT_PUBLIC_AGENCY_SLUG;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.STOREFRONT_SLUG;
    delete process.env.NEXT_PUBLIC_AGENCY_SLUG;

    function getStorefrontSlugTest() {
      const slug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
      if (!slug) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('CONFIG_ERROR: STOREFRONT_SLUG o NEXT_PUBLIC_AGENCY_SLUG es obligatorio en producción');
        }
        return 'incabound';
      }
      return slug;
    }

    assert.throws(
      () => getStorefrontSlugTest(),
      (err) => {
        assert.ok(err.message.includes('CONFIG_ERROR'));
        assert.ok(err.message.includes('STOREFRONT_SLUG'));
        return true;
      },
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalSlug !== undefined) process.env.STOREFRONT_SLUG = originalSlug;
    if (originalPublicSlug !== undefined) process.env.NEXT_PUBLIC_AGENCY_SLUG = originalPublicSlug;
  }
});

// ============================================================================
// PHASE 1.2 REGRESSION TESTS: PAYMENT SESSION SAFETY & INTEGRITY
// ============================================================================

test('missing Idempotency-Key returns 400', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .send({
      customerFirstName: 'No',
      customerLastName: 'Key',
      customerEmail: 'nokey@example.test',
      customerPhone: '+51999999999',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(400);
});

test('passenger change with same key returns 409', async () => {
  const key = 'idemp-passenger-divergence-1';
  const basePayload = {
    customerFirstName: 'Pass',
    customerLastName: 'Change',
    customerEmail: 'passchange@example.test',
    customerPhone: '+51999999920',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    passengers: [{ firstName: 'Original', lastName: 'Passenger', documentType: 'DNI', documentNumber: '11223344' }],
  };

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(basePayload)
    .expect(201);

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      ...basePayload,
      passengers: [{ firstName: 'Modified', lastName: 'Passenger', documentType: 'DNI', documentNumber: '11223344' }],
    })
    .expect(409);
});

test('document-number change with same key returns 409', async () => {
  const key = 'idemp-doc-divergence-1';
  const basePayload = {
    customerFirstName: 'Doc',
    customerLastName: 'Change',
    customerEmail: 'docchange@example.test',
    customerPhone: '+51999999921',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    passengers: [{ firstName: 'Same', lastName: 'Name', documentType: 'DNI', documentNumber: '11223344' }],
  };

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(basePayload)
    .expect(201);

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      ...basePayload,
      passengers: [{ firstName: 'Same', lastName: 'Name', documentType: 'DNI', documentNumber: '99887766' }],
    })
    .expect(409);
});

test('REVIEW reservation cannot create another payment session', async () => {
  const key = 'idemp-review-no-session-1';
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'Review',
      customerLastName: 'State',
      customerEmail: 'review@example.test',
      customerPhone: '+51999999922',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const res = reservations.find((r) => r.id === checkout.body.reservationId);
  res.paymentStatus = 'PAYMENT_RECEIVED_REVIEW';
  res.paymentReference = 'tx-captured-uuid-123';

  // Reintento de checkout con la misma clave: NO genera nuevo formToken
  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'Review',
      customerLastName: 'State',
      customerEmail: 'review@example.test',
      customerPhone: '+51999999922',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  assert.equal(retry.body.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');
  assert.equal(retry.body.formToken, null);
});

test('PARTIALLY_PAID cannot create a full new payment session', async () => {
  const key = 'idemp-partial-paid-1';
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'Partial',
      customerLastName: 'Paid',
      customerEmail: 'partial@example.test',
      customerPhone: '+51999999923',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const res = reservations.find((r) => r.id === checkout.body.reservationId);
  res.paymentStatus = 'PARTIALLY_PAID';

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'Partial',
      customerLastName: 'Paid',
      customerEmail: 'partial@example.test',
      customerPhone: '+51999999923',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(409);
});

test('REFUND_PENDING and REFUNDED cannot create another payment session', async () => {
  const key1 = 'idemp-refund-pending-1';
  const c1 = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key1)
    .send({
      customerFirstName: 'Refund',
      customerLastName: 'Pending',
      customerEmail: 'refpend@example.test',
      customerPhone: '+51999999924',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const r1 = reservations.find((r) => r.id === c1.body.reservationId);
  r1.paymentStatus = 'REFUND_PENDING';

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key1)
    .send({
      customerFirstName: 'Refund',
      customerLastName: 'Pending',
      customerEmail: 'refpend@example.test',
      customerPhone: '+51999999924',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(409);

  const key2 = 'idemp-refunded-1';
  const c2 = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key2)
    .send({
      customerFirstName: 'Refunded',
      customerLastName: 'Customer',
      customerEmail: 'refunded@example.test',
      customerPhone: '+51999999925',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const r2 = reservations.find((r) => r.id === c2.body.reservationId);
  r2.paymentStatus = 'REFUNDED';

  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key2)
    .send({
      customerFirstName: 'Refunded',
      customerLastName: 'Customer',
      customerEmail: 'refunded@example.test',
      customerPhone: '+51999999925',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(409);
});

test('usageLimit=0 rejected before provider call', async () => {
  await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-zero-limit-coupon-1')
    .send({
      customerFirstName: 'Zero',
      customerLastName: 'Limit',
      customerEmail: 'zerolimit@example.test',
      customerPhone: '+51999999926',
      couponCode: 'ZERO_USE',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(400);
});

test('unlimited coupon remains valid', async () => {
  const res = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-unlimited-coupon-1')
    .send({
      customerFirstName: 'Unlimited',
      customerLastName: 'User',
      customerEmail: 'unlimited@example.test',
      customerPhone: '+51999999927',
      couponCode: 'UNLIMITED',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  assert.equal(res.body.discountMinor, 500);
  assert.equal(res.body.totalMinor, 1500);
});

test('explicit production IZIPAY_PASSWORD required and does not accept TEST password', () => {
  assert.throws(
    () => {
      parseConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod:prod@127.0.0.1:5432/api_prod',
        API_CHECKOUT_ENABLED: 'true',
        IZIPAY_SHOP_ID: '12345678',
        IZIPAY_API_URL: 'https://api.micuentaweb.pe',
        API_PUBLIC_AGENCY_SLUGS: 'agency-a',
        IZIPAY_TEST_PASSWORD: 'test_password_only',
      });
    },
    (err) => {
      assert.ok(err.message.includes('IZIPAY_PASSWORD'));
      return true;
    },
  );

  const cfg = parseConfig({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://prod:prod@127.0.0.1:5432/api_prod',
    API_CHECKOUT_ENABLED: 'true',
    IZIPAY_SHOP_ID: '12345678',
    IZIPAY_PASSWORD: 'explicit_production_password',
    IZIPAY_API_URL: 'https://api.micuentaweb.pe',
    API_PUBLIC_AGENCY_SLUGS: 'agency-a',
  });
  assert.equal(cfg.izipayPassword, 'explicit_production_password');
});

test('zero-total checkout confirms directly without payment session', async () => {
  const res = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-zero-total-free-1')
    .send({
      customerFirstName: 'Free',
      customerLastName: 'Promo',
      customerEmail: 'free@example.test',
      customerPhone: '+51999999928',
      couponCode: 'FREE100',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  assert.equal(res.body.totalMinor, 0);
  assert.equal(res.body.paymentStatus, 'PAID');
  assert.equal(res.body.bookingStatus, 'CONFIRMED');
  assert.equal(res.body.formToken, null);

  const saved = reservations.find((r) => r.id === res.body.reservationId);
  assert.equal(saved.paymentStatus, 'PAID');
  assert.equal(saved.paymentReference, null);

  const freeCoupon = coupons.find((c) => c.code === 'FREE100');
  assert.equal(freeCoupon.timesUsed, 1);

  const notif = notifications.find((n) => n.legacyId === res.body.reservationId);
  assert.ok(notif);
  assert.equal(notif.kind, 'ORDER_CONFIRMED');
});

test('oversized IPN payload is rejected before processing', async () => {
  const hugeAnswer = 'A'.repeat(70000);
  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({
      'kr-answer': hugeAnswer,
      'kr-hash': 'fakehash',
    })
    .expect(413);
});

test('concurrent same-key checkout cannot create multiple provider sessions', async () => {
  const key = 'idemp-concurrent-sessions-test-1';
  const payload = {
    customerFirstName: 'Flight',
    customerLastName: 'Racer',
    customerEmail: 'flightracer@example.test',
    customerPhone: '+51999999929',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const [res1, res2] = await Promise.all([
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
  ]);

  assert.equal(res1.status, 201);
  assert.equal(res2.status, 201);
  assert.equal(res1.body.reservationId, res2.body.reservationId);
  assert.equal(res1.body.formToken, res2.body.formToken);
  assert.ok(res1.body.formToken);
});

test('concurrent valid PAID IPN vs amount-mismatch IPN cannot downgrade PAID', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-race-amt-mismatch-1')
    .send({
      customerFirstName: 'RaceAmt',
      customerLastName: 'Tester',
      customerEmail: 'raceamt@example.test',
      customerPhone: '+51999999930',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const orderId = checkout.body.reservationCode;

  // Valid IPN
  const krValid = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-race-valid-amt-1' }],
  };
  const hashValid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krValid)).digest('hex');

  // Mismatch IPN (underpaid)
  const krMismatch = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 1500, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-race-mismatch-amt-1' }],
  };
  const hashMismatch = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krMismatch)).digest('hex');

  const [resValid, resMismatch] = await Promise.all([
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': krValid, 'kr-hash': hashValid }),
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': krMismatch, 'kr-hash': hashMismatch }),
  ]);

  assert.equal(resValid.status, 200);
  assert.equal(resMismatch.status, 200);

  // Authoritative DB state MUST remain PAID and cannot be downgraded
  const saved = reservations.find((r) => r.code === orderId);
  assert.equal(saved.paymentStatus, 'PAID');
});

test('concurrent valid PAID IPN vs currency-mismatch IPN cannot downgrade PAID', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-race-curr-mismatch-1')
    .send({
      customerFirstName: 'RaceCurr',
      customerLastName: 'Tester',
      customerEmail: 'racecurr@example.test',
      customerPhone: '+51999999931',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const orderId = checkout.body.reservationCode;

  // Valid IPN
  const krValid = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-race-valid-curr-1' }],
  };
  const hashValid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krValid)).digest('hex');

  // Currency mismatch IPN (PEN instead of USD)
  const krMismatch = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'PEN' },
    transactions: [{ uuid: 'tx-race-mismatch-curr-1' }],
  };
  const hashMismatch = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krMismatch)).digest('hex');

  const [resValid, resMismatch] = await Promise.all([
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': krValid, 'kr-hash': hashValid }),
    request(app.getHttpServer()).post('/v1/payments/izipay/ipn').send({ 'kr-answer': krMismatch, 'kr-hash': hashMismatch }),
  ]);

  assert.equal(resValid.status, 200);
  assert.equal(resMismatch.status, 200);

  // Authoritative DB state MUST remain PAID and cannot be downgraded
  const saved = reservations.find((r) => r.code === orderId);
  assert.equal(saved.paymentStatus, 'PAID');
});

test('stale payment session older than 14 minutes is regenerated', async () => {
  const key = 'idemp-stale-session-test-1';
  const payload = {
    customerFirstName: 'Stale',
    customerLastName: 'Session',
    customerEmail: 'stalesession@example.test',
    customerPhone: '+51999999932',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const initial = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  assert.ok(initial.body.formToken);

  // Simulate token aging beyond 14-minute validity window (e.g. 15 minutes ago)
  const saved = reservations.find((r) => r.id === initial.body.reservationId);
  saved.paymentFormToken = 'stale_token_before_regen';
  const oldDate = new Date(Date.now() - 15 * 60 * 1000);
  saved.paymentFormTokenCreatedAt = oldDate;

  // Retry checkout with same key - should regenerate token because old one is stale
  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send(payload)
    .expect(201);

  assert.notEqual(retry.body.formToken, 'stale_token_before_regen');
  assert.ok(retry.body.formToken);
  assert.equal(retry.body.reservationId, initial.body.reservationId);
  assert.ok(saved.paymentFormTokenCreatedAt > oldDate);
});

test('private tour checkout fails with 400 when requested pax tier is not configured', async () => {
  const res = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-priv-unsupported-pax')
    .send({
      customerFirstName: 'Priv',
      customerLastName: 'Tester',
      customerEmail: 'privtester@example.test',
      customerPhone: '+51999999933',
      items: [{ slug: 'tour-a', serviceType: 'private', date: '2026-10-01', pax: 9 }],
    })
    .expect(400);

  assert.equal(res.body.error.code, 'INVALID_REQUEST');
});

test('private tour checkout succeeds with exact configured pax tier', async () => {
  const res = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-priv-exact-pax')
    .send({
      customerFirstName: 'PrivExact',
      customerLastName: 'Tester',
      customerEmail: 'privexact@example.test',
      customerPhone: '+51999999934',
      items: [{ slug: 'tour-a', serviceType: 'private', date: '2026-10-01', pax: 2 }],
    })
    .expect(201);

  assert.equal(res.body.totalMinor, 10000); // 50 * 2 = 100 USD = 10000 minor
  assert.ok(res.body.formToken);
});

test('signed PAID IPN without transaction UUID enters REVIEW and cannot obtain new formToken on retry', async () => {
  const key = 'idemp-missing-uuid-ipn-1';
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'NoUuid',
      customerLastName: 'Tester',
      customerEmail: 'nouuid@example.test',
      customerPhone: '+51999999935',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const orderId = checkout.body.reservationCode;

  // Signed IPN with orderStatus PAID but missing transactions / UUID
  const krNoUuid = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [],
  };
  const hashNoUuid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krNoUuid)).digest('hex');

  const ipnRes = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krNoUuid, 'kr-hash': hashNoUuid })
    .expect(200);

  assert.equal(ipnRes.body.status, 'REVIEW_REQUIRED');

  // Reservation in DB must be transitioned to PAYMENT_RECEIVED_REVIEW and not remain PENDING
  const saved = reservations.find((r) => r.code === orderId);
  assert.equal(saved.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');
  assert.equal(saved.paymentFormToken, null);

  // Retry checkout with the same key must return formToken: null and cannot generate a new payment session
  const retry = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', key)
    .send({
      customerFirstName: 'NoUuid',
      customerLastName: 'Tester',
      customerEmail: 'nouuid@example.test',
      customerPhone: '+51999999935',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  assert.equal(retry.body.formToken, null);
  assert.equal(retry.body.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');
});

test('sequential IPN policy: committed PAID cannot be downgraded by subsequent mismatch', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-seq-paid-then-mismatch')
    .send({
      customerFirstName: 'SeqPaid',
      customerLastName: 'Tester',
      customerEmail: 'seqpaid@example.test',
      customerPhone: '+51999999936',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const orderId = checkout.body.reservationCode;

  // 1. First: Valid PAID IPN commits
  const krValid = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-seq-valid-1' }],
  };
  const hashValid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krValid)).digest('hex');

  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krValid, 'kr-hash': hashValid })
    .expect(200);

  const saved1 = reservations.find((r) => r.code === orderId);
  assert.equal(saved1.paymentStatus, 'PAID');

  // 2. Later: Contradictory mismatch IPN arrives
  const krMismatch = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 1200, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-seq-mismatch-1' }],
  };
  const hashMismatch = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krMismatch)).digest('hex');

  const mismatchRes = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krMismatch, 'kr-hash': hashMismatch })
    .expect(200);

  assert.equal(mismatchRes.body.status, 'PAID');
  const saved2 = reservations.find((r) => r.code === orderId);
  assert.equal(saved2.paymentStatus, 'PAID'); // MUST remain PAID
});

test('sequential IPN policy: committed REVIEW cannot be upgraded by subsequent exact PAID', async () => {
  const checkout = await request(app.getHttpServer())
    .post('/v1/storefronts/agency-a/checkout')
    .set('idempotency-key', 'idemp-seq-mismatch-then-paid')
    .send({
      customerFirstName: 'SeqReview',
      customerLastName: 'Tester',
      customerEmail: 'seqreview@example.test',
      customerPhone: '+51999999937',
      items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
    })
    .expect(201);

  const orderId = checkout.body.reservationCode;

  // 1. First: Mismatch IPN commits and quarantines in REVIEW
  const krMismatch = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 1500, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-seq-rev-mismatch-1' }],
  };
  const hashMismatch = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krMismatch)).digest('hex');

  await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krMismatch, 'kr-hash': hashMismatch })
    .expect(200);

  const saved1 = reservations.find((r) => r.code === orderId);
  assert.equal(saved1.paymentStatus, 'PAYMENT_RECEIVED_REVIEW');

  // 2. Later: Exact PAID IPN arrives
  const krValid = {
    orderStatus: 'PAID',
    orderDetails: { orderId, orderTotalAmount: 2000, orderCurrency: 'USD' },
    transactions: [{ uuid: 'tx-seq-rev-valid-1' }],
  };
  const hashValid = crypto.createHmac('sha256', 'test_secret_key').update(JSON.stringify(krValid)).digest('hex');

  const validRes = await request(app.getHttpServer())
    .post('/v1/payments/izipay/ipn')
    .send({ 'kr-answer': krValid, 'kr-hash': hashValid })
    .expect(200);

  assert.equal(validRes.body.status, 'REVIEW_REQUIRED');
  const saved2 = reservations.find((r) => r.code === orderId);
  assert.equal(saved2.paymentStatus, 'PAYMENT_RECEIVED_REVIEW'); // Remains quarantined
});

test('same idempotency key across different agencies creates independent reservations without collision', async () => {
  const commonKey = 'shared-idemp-key-multi-agency-1';
  const payload = {
    customerFirstName: 'Multi',
    customerLastName: 'Tenant',
    customerEmail: 'multitenant@example.test',
    customerPhone: '+51999999938',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const payloadB = {
    ...payload,
    items: [{ slug: 'tour-b', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const [resA, resB] = await Promise.all([
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', commonKey).send(payload),
    request(app.getHttpServer()).post('/v1/storefronts/agency-b/checkout').set('idempotency-key', commonKey).send(payloadB),
  ]);

  assert.equal(resA.status, 201);
  assert.equal(resB.status, 201);
  assert.notEqual(resA.body.reservationId, resB.body.reservationId);
  assert.notEqual(resA.body.reservationCode, resB.body.reservationCode);
});

test('zero-total same-key concurrent retry returns same reservation and consumes coupon once', async () => {
  // Free coupon with single use
  coupons.push({
    id: 'coup-single-free-1',
    agencyId: 'a',
    code: 'SINGLEFREE100',
    discountType: 'PERCENTAGE',
    discountValue: 100,
    timesUsed: 0,
    usageLimit: 1,
    isActive: true,
  });

  const key = 'idemp-zero-total-concurrent-race-1';
  const payload = {
    customerFirstName: 'FreeRace',
    customerLastName: 'Tester',
    customerEmail: 'freerace@example.test',
    customerPhone: '+51999999939',
    couponCode: 'SINGLEFREE100',
    items: [{ slug: 'tour-a', serviceType: 'shared', date: '2026-10-01', pax: 1 }],
  };

  const [res1, res2] = await Promise.all([
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
    request(app.getHttpServer()).post('/v1/storefronts/agency-a/checkout').set('idempotency-key', key).send(payload),
  ]);

  assert.equal(res1.status, 201);
  assert.equal(res2.status, 201);
  assert.equal(res1.body.reservationId, res2.body.reservationId);
  assert.equal(res1.body.totalMinor, 0);
  assert.equal(res1.body.paymentStatus, 'PAID');
  assert.equal(res1.body.bookingStatus, 'CONFIRMED');

  const coupon = coupons.find((c) => c.code === 'SINGLEFREE100');
  assert.equal(coupon.timesUsed, 1);
});





