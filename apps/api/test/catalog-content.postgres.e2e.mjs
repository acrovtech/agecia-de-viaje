import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { application, config } from './helpers.mjs';

test('complete catalog: content, owned resources and publication', async (t) => {
  const url = new URL(process.env.API_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.match(url.pathname, /^\/api_test_[a-z0-9_]+$/);
  const prisma = new PrismaClient({ datasources: { db: { url: url.href } } });
  const suffix = randomUUID();
  const agencies = [], vehicles = [];
  let user, app;
  try {
    const a = await prisma.agency.create({ data: { name: 'A', slug: `a-${suffix}`, subdomain: `a-${suffix}` } }); agencies.push(a.id);
    const b = await prisma.agency.create({ data: { name: 'B', slug: `b-${suffix}`, subdomain: `b-${suffix}` } }); agencies.push(b.id);
    const password = randomUUID();
    user = await prisma.user.create({ data: { email: `${suffix}@example.test`, password: await hash(password, 10) } });
    const membership = await prisma.agencyMembership.create({ data: { agencyId: a.id, userId: user.id, role: 'ADMIN' } });
    app = await application(config({ DATABASE_URL: url.href, API_AUTH_ENABLED: 'true', API_PUBLIC_AGENCY_SLUGS: `${a.slug},${b.slug}` }));
    const server = app.getHttpServer();
    const token = (await request(server).post('/v1/auth/login').send({ email: user.email, password, agencySlug: a.slug }).expect(200)).body.accessToken;
    const base = `/v1/agencies/${a.id}/catalog`;
    const write = (method, path, body) => request(server)[method](`${base}/${path}`).auth(token, { type: 'bearer' }).send(body);
    const read = (path) => request(server).get(`${base}/${path}`).auth(token, { type: 'bearer' });
    const publicTour = (slug) => request(server).get(`/v1/storefronts/${a.slug}/tours/${slug}`);
    const publicTransfer = (slug) => request(server).get(`/v1/storefronts/${a.slug}/transfers/${slug}`);
    const tourBody = { title: 'Tour', slug: `tour-${suffix}`, description: 'Description', duration: '1 day', bannerImage: '/banner.webp', cardImage: '/card.webp', region: null, hasSharedService: false, sharedPrice: null };
    const transferBody = { title: 'Transfer', slug: `transfer-${suffix}`, description: null, duration: '1h', bannerImage: null, origin: 'A', destination: 'B', tripType: 'Solo ida', isActive: true, hasSharedService: false, sharedPrice: null };
    const vehicleBody = { code: `sedan-${suffix}`, name: 'Sedan', subtitle: null, maxPax: 3, maxLuggage: 3, image: '/sedan.webp', features: ['Aire acondicionado'], isActive: true };
    let tour, transfer, category, vehicle;
    const otherCategory = await prisma.category.create({ data: { name: 'Foreign', slug: `foreign-${suffix}`, agencyId: b.id } });
    const foreignVehicle = await prisma.vehicleType.create({ data: { ...vehicleBody, code: `foreign-${suffix}`, agencyId: b.id } }); vehicles.push(foreignVehicle.id);
    const orphanVehicle = await prisma.vehicleType.create({ data: { ...vehicleBody, code: `orphan-${suffix}` } }); vehicles.push(orphanVehicle.id);
    const content = {
      hasPrivateService: true, categoryIds: [],
      images: [{ url: '/first.webp', alt: 'Primera' }, { url: '/second.webp', alt: null }],
      itineraries: [{ title: 'Día 1', content: 'Salida' }, { title: 'Día 2', content: 'Regreso' }],
      inclusions: [{ content: 'Guía' }], exclusions: [{ content: 'Propinas' }], recommendations: [{ content: 'Agua' }],
      faqs: [{ question: '¿Hay guía?', answer: 'Sí' }], privatePricing: [{ pax: 2, price: 25.5 }, { pax: 4, price: 20 }],
    };

    await t.test('new resources are owned and new services default to hidden drafts', async () => {
      category = (await write('post', 'categories', { name: 'Aventura', slug: `adventure-${suffix}` }).expect(201)).body;
      vehicle = (await write('post', 'vehicles', vehicleBody).expect(201)).body; vehicles.push(vehicle.id);
      tour = (await write('post', 'tours', tourBody).expect(201)).body;
      transfer = (await write('post', 'transfers', transferBody).expect(201)).body;
      assert.equal(tour.isPublished, false); assert.equal(transfer.isPublished, false);
      await publicTour(tour.slug).expect(404); await publicTransfer(transfer.slug).expect(404);
      assert.deepEqual((await read('vehicles').expect(200)).body.data.map((row) => row.id), [vehicle.id]);
      assert.deepEqual((await read('categories').expect(200)).body.data.map((row) => row.id), [category.id]);
      await write('post', 'vehicles', { ...vehicleBody, agencyId: b.id }).expect(400);
    });

    await t.test('publication rejects missing private/shared tariffs', async () => {
      for (const [kind, row] of [['tours', tour], ['transfers', transfer]]) await write('put', `${kind}/${row.id}/publication`, { expectedUpdatedAt: row.updatedAt, isPublished: true }).expect(400);
    });

    await t.test('foreign categories, forged child IDs and duplicate private tiers are rejected', async () => {
      for (const patch of [{ categoryIds: [otherCategory.id] }, { images: [{ id: 'foreign-child', url: '/x', alt: null }] }, { images: [{ url: 'javascript:alert(1)', alt: null }] }, { privatePricing: [{ pax: 2, price: 10 }, { pax: 2, price: 12 }] }]) {
        await write('put', `tours/${tour.id}/content`, { ...content, ...patch, expectedUpdatedAt: tour.updatedAt }).expect(400);
      }
      assert.equal(await prisma.tourImage.count({ where: { tourId: tour.id } }), 0);
      await write('put', `categories/${otherCategory.id}`, { name: 'Hijack', slug: otherCategory.slug, expectedUpdatedAt: otherCategory.updatedAt.toISOString() }).expect(404);
    });

    await t.test('ordered content and prices round-trip, publish explicitly, then return to draft on editing', async () => {
      tour = (await write('put', `tours/${tour.id}/content`, { ...content, categoryIds: [category.id], expectedUpdatedAt: tour.updatedAt }).expect(200)).body;
      assert.deepEqual(tour.images.map((row) => row.order), [0, 1]);
      assert.equal(tour.itineraries[1].title, 'Día 2');
      assert.equal(tour.categories[0].id, category.id);
      const stale = tour.updatedAt;
      tour = (await write('put', `tours/${tour.id}/publication`, { expectedUpdatedAt: tour.updatedAt, isPublished: true }).expect(200)).body;
      const live = (await publicTour(tour.slug).expect(200)).body;
      assert.equal(live.privatePricing[0].price, 25.5); assert.equal(live.images.length, 2);
      await write('put', `tours/${tour.id}/content`, { ...content, expectedUpdatedAt: stale }).expect(409);
      tour = (await write('put', `tours/${tour.id}/content`, { ...content, categoryIds: [category.id], images: [...content.images].reverse(), expectedUpdatedAt: tour.updatedAt }).expect(200)).body;
      assert.equal(tour.images[0].url, '/second.webp'); assert.equal(tour.isPublished, false);
      await publicTour(tour.slug).expect(404);
    });

    await t.test('only active vehicles owned by the agency may receive transfer prices', async () => {
      for (const vehicleId of [foreignVehicle.id, orphanVehicle.id]) {
        await write('put', `transfers/${transfer.id}/content`, { hasPrivateService: true, vehiclePrices: [{ vehicleId, price: 50 }], expectedUpdatedAt: transfer.updatedAt }).expect(400);
      }
      transfer = (await write('put', `transfers/${transfer.id}/content`, { hasPrivateService: true, vehiclePrices: [{ vehicleId: vehicle.id, price: 50 }], expectedUpdatedAt: transfer.updatedAt }).expect(200)).body;
      transfer = (await write('put', `transfers/${transfer.id}/publication`, { expectedUpdatedAt: transfer.updatedAt, isPublished: true }).expect(200)).body;
      const live = (await publicTransfer(transfer.slug).expect(200)).body;
      assert.equal(live.vehicleOptions.length, 1); assert.equal(live.vehicleOptions[0].price, 50);
    });

    await t.test('editing a category or vehicle withdraws dependent listings and invalidates old versions', async () => {
      tour = (await write('put', `tours/${tour.id}/publication`, { expectedUpdatedAt: tour.updatedAt, isPublished: true }).expect(200)).body;
      category = (await write('put', `categories/${category.id}`, { name: 'Nueva categoría', slug: category.slug, expectedUpdatedAt: category.updatedAt }).expect(200)).body;
      await publicTour(tour.slug).expect(404);
      await write('put', `tours/${tour.id}/publication`, { expectedUpdatedAt: tour.updatedAt, isPublished: true }).expect(409);
      vehicle = (await write('put', `vehicles/${vehicle.id}`, { ...vehicleBody, isActive: false, expectedUpdatedAt: vehicle.updatedAt }).expect(200)).body;
      await publicTransfer(transfer.slug).expect(404);
      transfer = (await read(`transfers/${transfer.id}/content`).expect(200)).body;
      await write('put', `transfers/${transfer.id}/publication`, { expectedUpdatedAt: transfer.updatedAt, isPublished: true }).expect(400);
    });

    await t.test('role revocation prevents content changes and publication', async () => {
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role: 'VIEWER' } });
      await write('put', `tours/${tour.id}/content`, { ...content, expectedUpdatedAt: tour.updatedAt }).expect(403);
      await write('put', `tours/${tour.id}/publication`, { expectedUpdatedAt: tour.updatedAt, isPublished: true }).expect(403);
      await write('post', 'categories', { name: 'Forbidden', slug: `denied-${suffix}` }).expect(403);
      await write('post', 'vehicles', vehicleBody).expect(403);
      const audit = await prisma.adminAuditLog.findMany({ where: { userId: user.id } });
      assert.ok(audit.some((row) => row.action === 'SAAS_PUBLISH'));
      assert.ok(audit.every((row) => row.details.agencyId === a.id));
    });
  } finally {
    await app?.close();
    if (user) { await prisma.adminAuditLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    await prisma.agency.deleteMany({ where: { id: { in: agencies } } });
    await prisma.vehicleType.deleteMany({ where: { id: { in: vehicles } } });
    await prisma.$disconnect();
  }
});
