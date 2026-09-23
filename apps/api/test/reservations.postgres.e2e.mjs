import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { ReservationsService } from '../dist/reservations/reservations.service.js';
import { application, config } from './helpers.mjs';

test('manual reservations: tenant isolation, authoritative quotes and durable operation', async (t) => {
  const url = new URL(process.env.API_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.match(url.pathname, /^\/api_test_[a-z0-9_]+$/);
  const prisma = new PrismaClient({ datasources: { db: { url: url.href } } });
  const suffix = randomUUID(), agencies = [], orphans = [];
  let app, user;
  try {
    const a = await prisma.agency.create({ data: { name: 'Reservations A', slug: `res-a-${suffix}`, subdomain: `res-a-${suffix}` } }); agencies.push(a.id);
    const b = await prisma.agency.create({ data: { name: 'Reservations B', slug: `res-b-${suffix}`, subdomain: `res-b-${suffix}` } }); agencies.push(b.id);
    const password = randomUUID();
    user = await prisma.user.create({ data: { email: `${suffix}@example.test`, password: await hash(password, 10) } });
    const membership = await prisma.agencyMembership.create({ data: { agencyId: a.id, userId: user.id, role: 'OPERATOR' } });
    const tourData = { title: 'Original title', slug: `res-tour-${suffix}`, description: 'Tour', duration: '1 day', bannerImage: '/a.webp', cardImage: '/b.webp', isPublished: true, hasSharedService: true, sharedPrice: 10.15, hasPrivateService: true };
    const tour = await prisma.tour.create({ data: { ...tourData, agencyId: a.id, privatePricing: { create: { pax: 2, price: 17.25 } } } });
    const foreign = await prisma.tour.create({ data: { ...tourData, agencyId: b.id, slug: `foreign-${suffix}` } });
    const orphan = await prisma.tour.create({ data: { ...tourData, slug: `orphan-${suffix}` } }); orphans.push(orphan.id);
    const vehicleData = { code: `v-${suffix}`, name: 'Car original', maxPax: 3, maxLuggage: 2, image: '/car.webp', features: [], isActive: true };
    const vehicle = await prisma.vehicleType.create({ data: { ...vehicleData, agencyId: a.id } });
    const otherVehicle = await prisma.vehicleType.create({ data: { ...vehicleData, code: `vb-${suffix}`, agencyId: b.id } });
    const transfer = await prisma.transfer.create({ data: { title: 'Transfer', slug: `transfer-${suffix}`, duration: '1h', origin: 'Airport', destination: 'City', tripType: 'Solo ida', isActive: true, isPublished: true, hasSharedService: true, sharedPrice: 8.5, hasPrivateService: true, agencyId: a.id, vehiclePrices: { create: [{ vehicleId: vehicle.id, price: 50.25 }, { vehicleId: otherVehicle.id, price: 1 }] } } });
    app = await application(config({ DATABASE_URL: url.href, API_AUTH_ENABLED: 'true' }));
    const server = app.getHttpServer();
    const token = (await request(server).post('/v1/auth/login').send({ email: user.email, password, agencySlug: a.slug }).expect(200)).body.accessToken;
    const base = `/v1/agencies/${a.id}/reservations`;
    const send = (method, path = '', body) => request(server)[method](base + path).auth(token, { type: 'bearer' }).send(body);
    const today = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
    const selection = { kind: 'TOUR', serviceId: tour.id, modality: 'shared', date: today, pax: 2, vehicleId: null };
    const make = (quote) => ({ selection: Object.fromEntries(Object.keys(selection).map((k) => [k, quote[k]])), quoteHash: quote.quoteHash, requestKey: randomUUID(), customerFirstName: 'Ana', customerLastName: 'Pérez', customerEmail: 'ana@example.test', customerPhone: '+51999999999', pickupHotel: '', pickupTime: '', specialRequirements: '', passengers: Array.from({ length: quote.pax }, (_, i) => ({ firstName: `Guest ${i}`, lastName: 'Test', docType: 'DNI', docNumber: '' })) });
    let quote, reservation, payload;

    await t.test('quote computes shared and exact private tiers in minor units', async () => {
      quote = (await send('post', '/quote', selection).expect(201)).body;
      assert.equal(quote.unitPriceMinor, 1015); assert.equal(quote.totalMinor, 2030);
      const privateQuote = (await send('post', '/quote', { ...selection, modality: 'private' }).expect(201)).body;
      assert.equal(privateQuote.totalMinor, 3450); assert.equal(privateQuote.pricingUnit, 'PER_TRAVELER');
      await send('post', '/quote', { ...selection, modality: 'private', pax: 3 }).expect(400);
    });
    await t.test('strict input rejects price injection, impossible dates and foreign services', async () => {
      for (const patch of [{ totalMinor: 1 }, { agencyId: b.id }, { date: '2026-02-30' }, { date: '2000-01-01' }, { pax: 0 }, { pax: 101 }, { vehicleId: vehicle.id }]) await send('post', '/quote', { ...selection, ...patch }).expect(400);
      for (const serviceId of [foreign.id, orphan.id, 'missing']) await send('post', '/quote', { ...selection, serviceId }).expect(404);
      await request(server).get(`/v1/agencies/${b.id}/reservations`).auth(token, { type: 'bearer' }).expect(403);
      await request(server).get(base).expect(401);
      await send('get', '?agencyId=' + b.id).expect(400);
    });
    await t.test('transfer price is per vehicle and enforces own active capacity', async () => {
      const input = { ...selection, kind: 'TRANSFER', serviceId: transfer.id, modality: 'private', vehicleId: vehicle.id, pax: 3 };
      const q = (await send('post', '/quote', input).expect(201)).body;
      assert.equal(q.totalMinor, 5025); assert.equal(q.pricingUnit, 'GROUP');
      await send('post', '/quote', { ...input, pax: 4 }).expect(400);
      await send('post', '/quote', { ...input, vehicleId: otherVehicle.id }).expect(400);
      await prisma.vehicleType.update({ where: { id: vehicle.id }, data: { isActive: false } });
      await send('post', '/quote', input).expect(400);
      await prisma.vehicleType.update({ where: { id: vehicle.id }, data: { isActive: true } });
      const created = (await send('post', '', make(q)).expect(201)).body;
      assert.equal(created.totalMinor, 5025); assert.equal(created.vehicleName, 'Car original');
      await prisma.vehicleType.update({ where: { id: vehicle.id }, data: { name: 'Renamed' } });
      assert.equal((await send('get', `/${created.id}`).expect(200)).body.vehicleName, 'Car original');
      await prisma.transfer.update({ where: { id: transfer.id }, data: { isActive: false } });
      await send('post', '/quote', input).expect(404);
    });
    await t.test('passenger count, duplicate documents and forged create fields are rejected', async () => {
      const input = make(quote);
      for (const patch of [{ totalMinor: 1 }, { status: 'PAID' }, { agencyId: b.id }, { passengers: [] }, { passengers: [input.passengers[0]] }, { passengers: input.passengers.map((p) => ({ ...p, docNumber: 'same' })) }]) await send('post', '', { ...input, ...patch }).expect(400);
    });
    await t.test('concurrent identical requests persist one reservation and one event', async () => {
      payload = make(quote);
      const results = await Promise.all([send('post', '', payload), send('post', '', payload)]);
      assert.deepEqual(results.map((r) => r.status), [201, 201]);
      assert.equal(results[0].body.id, results[1].body.id); reservation = results[0].body;
      assert.equal(reservation.operationStatus, 'PENDING'); assert.equal(reservation.paymentStatus, 'PENDING');
      assert.equal(reservation.totalMinor, 2030); assert.equal(reservation.passengers.length, 2);
      assert.equal(reservation.events.length, 1);
      assert.equal(await prisma.reservation.count({ where: { agencyId: a.id, requestKey: payload.requestKey } }), 1);
      assert.equal(await prisma.adminAuditLog.count({ where: { entityId: reservation.id, action: 'SAAS_RESERVATION_CREATE' } }), 1);
      await send('post', '', { ...payload, customerFirstName: 'Other' }).expect(409);
      assert.ok(!JSON.stringify(reservation).includes('requestHash')); assert.ok(!JSON.stringify(reservation).includes(payload.requestKey));
    });
    await t.test('catalog changes invalidate quotes but retain saved prices and idempotent replays', async () => {
      await prisma.tour.update({ where: { id: tour.id }, data: { sharedPrice: 100, title: 'Updated title' } });
      await send('post', '', { ...payload, requestKey: randomUUID() }).expect(409);
      const replay = (await send('post', '', payload).expect(201)).body;
      assert.equal(replay.id, reservation.id); assert.equal(replay.totalMinor, 2030); assert.equal(replay.serviceTitle, 'Original title');
      await prisma.tour.update({ where: { id: tour.id }, data: { isPublished: false } });
      await send('post', '/quote', selection).expect(404);
      await send('post', '', payload).expect(201);
      await prisma.tour.update({ where: { id: tour.id }, data: { isPublished: true } });
    });
    await t.test('own legacy reservations are read-only and foreign/orphan IDs stay hidden', async () => {
      const data = { customerFirstName: 'Legacy', customerLastName: 'Client', customerEmail: 'legacy@example.test', customerPhone: '12345', date: new Date(), pax: 1, totalPrice: 7 };
      const own = await prisma.reservation.create({ data: { ...data, agencyId: a.id } });
      const foreignBooking = await prisma.reservation.create({ data: { ...data, agencyId: b.id } });
      const noAgency = await prisma.reservation.create({ data });
      try {
        assert.equal((await send('get', `/${own.id}`).expect(200)).body.operationStatus, null);
        await send('put', `/${own.id}/status`, { expectedUpdatedAt: own.updatedAt.toISOString(), status: 'CONFIRMED', note: 'No migration' }).expect(400);
        for (const id of [foreignBooking.id, noAgency.id]) {
          await send('get', `/${id}`).expect(404);
          await send('put', `/${id}/status`, { expectedUpdatedAt: own.updatedAt.toISOString(), status: 'CONFIRMED', note: 'Hijack' }).expect(404);
        }
        const ids = (await send('get').expect(200)).body.data.map((r) => r.id);
        assert.ok(ids.includes(own.id)); assert.ok(!ids.includes(foreignBooking.id)); assert.ok(!ids.includes(noAgency.id));
      } finally { await prisma.reservation.delete({ where: { id: noAgency.id } }); }
    });
    await t.test('concurrent transitions accept only one writer and never change payment', async () => {
      const body = { expectedUpdatedAt: reservation.updatedAt, status: 'CONFIRMED', note: 'Disponibilidad coordinada' };
      const results = await Promise.all([send('put', `/${reservation.id}/status`, body), send('put', `/${reservation.id}/status`, body)]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      reservation = results.find((r) => r.status === 200).body;
      assert.equal(reservation.paymentStatus, 'PENDING'); assert.equal(reservation.events.length, 2);
      await send('put', `/${reservation.id}/status`, { expectedUpdatedAt: reservation.updatedAt, status: 'PENDING', note: 'Reopen' }).expect(400);
      reservation = (await send('put', `/${reservation.id}/status`, { expectedUpdatedAt: reservation.updatedAt, status: 'COMPLETED', note: 'Servicio realizado' }).expect(200)).body;
      assert.equal(reservation.paymentStatus, 'PENDING'); assert.equal(reservation.events.length, 3);
      await send('put', `/${reservation.id}/status`, { expectedUpdatedAt: reservation.updatedAt, status: 'CANCELLED', note: 'Forbidden' }).expect(400);
    });
    await t.test('future bookings cannot be completed and cancellation is terminal', async () => {
      const q = (await send('post', '/quote', { ...selection, date: '2099-01-01' }).expect(201)).body;
      let row = (await send('post', '', make(q)).expect(201)).body;
      row = (await send('put', `/${row.id}/status`, { expectedUpdatedAt: row.updatedAt, status: 'CONFIRMED', note: 'Coordinado' }).expect(200)).body;
      await send('put', `/${row.id}/status`, { expectedUpdatedAt: row.updatedAt, status: 'COMPLETED', note: 'Too soon' }).expect(400);
      row = (await send('put', `/${row.id}/status`, { expectedUpdatedAt: row.updatedAt, status: 'CANCELLED', note: 'Solicitado por cliente' }).expect(200)).body;
      assert.equal(row.paymentStatus, 'PENDING');
      await send('put', `/${row.id}/status`, { expectedUpdatedAt: row.updatedAt, status: 'CONFIRMED', note: 'Reopen' }).expect(400);
    });
    await t.test('audit failure rolls back booking and passenger records', async () => {
      const q = (await send('post', '/quote', selection).expect(201)).body;
      const body = make(q);
      await assert.rejects(app.get(ReservationsService).create({ agencyId: a.id, userId: 'nonexistent-actor', membershipId: membership.id, email: user.email, role: 'OPERATOR' }, body));
      assert.equal(await prisma.reservation.count({ where: { agencyId: a.id, requestKey: body.requestKey } }), 0);
    });
    await t.test('pagination and status filtering remain tenant scoped', async () => {
      await prisma.reservation.createMany({ data: Array.from({ length: 33 }, (_, i) => ({ id: `${suffix}-${String(i).padStart(3, '0')}`, agencyId: a.id, customerFirstName: 'Page', customerLastName: 'Test', customerEmail: 'page@example.test', customerPhone: '12345', date: new Date(), pax: 1, totalPrice: 1 })) });
      const first = (await send('get').expect(200)).body;
      assert.equal(first.data.length, 30); assert.ok(first.nextCursor);
      const second = (await send('get', '?after=' + first.nextCursor).expect(200)).body;
      assert.equal(new Set([...first.data, ...second.data].map((r) => r.id)).size, first.data.length + second.data.length);
      const done = (await send('get', '?status=COMPLETED').expect(200)).body;
      assert.deepEqual(done.data.map((r) => r.id), [reservation.id]);
    });
    await t.test('editor/viewer cannot access contact data or write and revoked membership fails closed', async () => {
      for (const role of ['EDITOR', 'VIEWER']) {
        await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role } });
        await send('get').expect(403); await send('get', `/${reservation.id}`).expect(403);
        await send('post', '/quote', selection).expect(403); await send('post', '', payload).expect(403);
        await send('put', `/${reservation.id}/status`, {}).expect(403);
      }
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { isActive: false } });
      await send('get').expect(401);
    });
  } finally {
    await app?.close();
    await prisma.reservation.deleteMany({ where: { agencyId: { in: agencies } } });
    if (user) { await prisma.adminAuditLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    await prisma.tour.deleteMany({ where: { id: { in: orphans } } });
    await prisma.agency.deleteMany({ where: { id: { in: agencies } } });
    await prisma.$disconnect();
  }
});
