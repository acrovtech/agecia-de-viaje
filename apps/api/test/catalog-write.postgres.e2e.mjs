import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { application, config } from './helpers.mjs';
import { CatalogWriteService } from '../dist/catalog/catalog-write.service.js';

test('catalog writes: ownership, roles, concurrency and atomic audit', async (t) => {
  const databaseUrl = process.env.API_TEST_DATABASE_URL;
  assert.ok(databaseUrl);
  const url = new URL(databaseUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.match(url.pathname, /^\/api_test_[a-z0-9_]+$/);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID();
  const agencyIds = [];
  let app, user, orphan;
  try {
    const a = await prisma.agency.create({ data: { name: 'A', slug: `a-${suffix}`, subdomain: `a-${suffix}` } });
    agencyIds.push(a.id);
    const b = await prisma.agency.create({ data: { name: 'B', slug: `b-${suffix}`, subdomain: `b-${suffix}` } });
    agencyIds.push(b.id);
    const password = randomUUID();
    user = await prisma.user.create({ data: { email: `${suffix}@example.test`, password: await hash(password, 10) } });
    const membership = await prisma.agencyMembership.create({ data: { userId: user.id, agencyId: a.id, role: 'ADMIN' } });
    app = await application(config({ DATABASE_URL: databaseUrl, API_AUTH_ENABLED: 'true' }));
    const server = app.getHttpServer();
    const login = await request(server).post('/v1/auth/login').send({ email: user.email, password, agencySlug: a.slug }).expect(200);
    const token = login.body.accessToken;
    const route = `/v1/agencies/${a.id}/catalog`;
    const tourBody = { title: 'New tour', slug: `tour-${suffix}`, description: 'Description', duration: '1 day', bannerImage: '/image.webp', cardImage: '/card.webp', region: 'Cusco', hasSharedService: true, sharedPrice: 25.50 };
    const transferBody = { title: 'New transfer', slug: `transfer-${suffix}`, description: null, duration: '1 hour', bannerImage: null, origin: 'Airport', destination: 'Hotel', tripType: 'Solo ida', isActive: false, hasSharedService: true, sharedPrice: 15 };
    let tour, transfer;
    const write = (method, path, data) => request(server)[method](path).auth(token, { type: 'bearer' }).send(data);

    await t.test('creates both resources in the authenticated agency and audits each commit', async () => {
      tour = (await write('post', `${route}/tours`, tourBody).expect(201)).body;
      transfer = (await write('post', `${route}/transfers`, transferBody).expect(201)).body;
      assert.equal((await prisma.tour.findUnique({ where: { id: tour.id } })).agencyId, a.id);
      assert.equal((await prisma.transfer.findUnique({ where: { id: transfer.id } })).agencyId, a.id);
      assert.equal(tour.hasPrivateService, false);
      const logs = await prisma.adminAuditLog.findMany({ where: { userId: user.id } });
      assert.equal(logs.length, 2);
      assert.ok(logs.every((log) => log.details.agencyId === a.id && log.action === 'SAAS_CATALOG_CREATE'));
    });

    await t.test('strict payload rejects tenant injection, nested relations and invalid money', async () => {
      for (const extra of [{ agencyId: b.id }, { categories: { connect: [{ id: 'other' }] } }, { sharedPrice: -1 }, { sharedPrice: 1.001 }, { sharedPrice: null }, { bannerImage: 'javascript:alert(1)' }]) {
        await write('post', `${route}/tours`, { ...tourBody, ...extra }).expect(400);
      }
      await write('post', `${route}/transfers`, { ...transferBody, vehiclePrices: [] }).expect(400);
      await write('post', `/v1/agencies/${b.id}/catalog/tours`, tourBody).expect(403);
      await request(server).post(`${route}/tours`).send(tourBody).expect(401);
    });

    await t.test('duplicate slug rolls back cleanly without an extra audit event', async () => {
      const before = await prisma.adminAuditLog.count({ where: { userId: user.id } });
      const duplicate = await write('post', `${route}/tours`, tourBody).expect(409);
      assert.equal(duplicate.body.error.code, 'CONFLICT');
      assert.equal(await prisma.adminAuditLog.count({ where: { userId: user.id } }), before);
    });

    await t.test('audit storage failure rolls back the resource creation', async () => {
      const failAudit = new CatalogWriteService({
        $transaction: (callback) => prisma.$transaction((tx) => callback(new Proxy(tx, {
          get(target, key) {
            if (key === 'adminAuditLog') return { create: async () => { throw new Error('audit unavailable'); } };
            return Reflect.get(target, key);
          },
        }))),
      });
      const slug = `rollback-${suffix}`;
      await assert.rejects(() => failAudit.createTour({ agencyId: a.id, userId: user.id, membershipId: membership.id, role: 'ADMIN' }, { ...tourBody, slug }), /audit unavailable/);
      assert.equal(await prisma.tour.count({ where: { slug } }), 0);
    });

    await t.test('foreign and unassigned records cannot be read or updated by ID', async () => {
      const foreign = await prisma.tour.create({ data: { ...tourBody, slug: `foreign-${suffix}`, agencyId: b.id } });
      const foreignTransfer = await prisma.transfer.create({ data: { ...transferBody, slug: `foreign-transfer-${suffix}`, agencyId: b.id } });
      orphan = await prisma.tour.create({ data: { ...tourBody, slug: `orphan-${suffix}` } });
      for (const resource of [foreign, orphan]) {
        await request(server).get(`${route}/tours/${resource.id}`).auth(token, { type: 'bearer' }).expect(404);
        await write('put', `${route}/tours/${resource.id}`, { ...tourBody, expectedUpdatedAt: resource.updatedAt.toISOString() }).expect(404);
      }
      await write('put', `${route}/transfers/${foreignTransfer.id}`, { ...transferBody, expectedUpdatedAt: foreignTransfer.updatedAt.toISOString() }).expect(404);
      assert.equal((await prisma.tour.findUnique({ where: { id: foreign.id } })).title, tourBody.title);
    });

    await t.test('role policy is authoritative for each resource', async () => {
      for (const [role, toursAllowed, transfersAllowed] of [['VIEWER', false, false], ['OPERATOR', false, true], ['EDITOR', true, false]]) {
        await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role } });
        const tResult = await write('post', `${route}/tours`, { ...tourBody, slug: `${role.toLowerCase()}-tour-${suffix}` });
        const trResult = await write('post', `${route}/transfers`, { ...transferBody, slug: `${role.toLowerCase()}-transfer-${suffix}` });
        assert.equal(tResult.status, toursAllowed ? 201 : 403);
        assert.equal(trResult.status, transfersAllowed ? 201 : 403);
        if (!toursAllowed) await write('put', `${route}/tours/${tour.id}`, { ...tourBody, expectedUpdatedAt: tour.updatedAt }).expect(403);
        if (!transfersAllowed) await write('put', `${route}/transfers/${transfer.id}`, { ...transferBody, expectedUpdatedAt: transfer.updatedAt }).expect(403);
      }
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role: 'ADMIN' } });
    });

    await t.test('concurrent edits accept exactly one writer and preserve nested tour content', async () => {
      await prisma.tourItineraryDay.create({ data: { tourId: tour.id, title: 'Preserve itinerary', content: 'Original', order: 0 } });
      const before = await prisma.adminAuditLog.count({ where: { entityId: tour.id } });
      const results = await Promise.all(['First', 'Second'].map((title) => write('put', `${route}/tours/${tour.id}`, { ...tourBody, title, expectedUpdatedAt: tour.updatedAt })));
      assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
      tour = results.find((result) => result.status === 200).body;
      assert.equal(await prisma.tourItineraryDay.count({ where: { tourId: tour.id } }), 1);
      assert.equal(await prisma.adminAuditLog.count({ where: { entityId: tour.id } }), before + 1);
    });

    await t.test('transfer edit persists active state and rejects stale versions', async () => {
      const saved = await write('put', `${route}/transfers/${transfer.id}`, { ...transferBody, isActive: true, title: 'Updated transfer', expectedUpdatedAt: transfer.updatedAt }).expect(200);
      assert.equal(saved.body.isActive, true);
      assert.notEqual(saved.body.updatedAt, transfer.updatedAt);
      await write('put', `${route}/transfers/${transfer.id}`, { ...transferBody, expectedUpdatedAt: transfer.updatedAt }).expect(409);
      assert.equal((await prisma.transfer.findUnique({ where: { id: transfer.id } })).title, 'Updated transfer');
    });
  } finally {
    await app?.close();
    if (orphan) await prisma.tour.delete({ where: { id: orphan.id } });
    if (user) {
      await prisma.adminAuditLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.agency.deleteMany({ where: { id: { in: agencyIds } } });
    await prisma.$disconnect();
  }
});
