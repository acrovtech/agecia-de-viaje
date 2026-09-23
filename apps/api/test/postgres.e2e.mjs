import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { config, application } from './helpers.mjs';

test('PostgreSQL real: two agencies, orphan records and disabled agency remain isolated', async () => {
  const databaseUrl = process.env.API_TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'API_TEST_DATABASE_URL debe apuntar a PostgreSQL desechable con el schema aplicado.');
  const url = new URL(databaseUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Solo se permite una BD de prueba local.');
  assert.match(url.pathname, /^\/api_test_[a-z0-9_]+$/, 'El nombre de BD debe comenzar por api_test_.');
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID();
  const a = `a-${suffix}`;
  const b = `b-${suffix}`;
  const tourIds = [];
  const transferIds = [];
  const agencyIds = [];
  let app;
  try {
    const agencyA = await prisma.agency.create({ data: { slug: a, subdomain: a, name: 'Agency A' } });
    agencyIds.push(agencyA.id);
    const agencyB = await prisma.agency.create({ data: { slug: b, subdomain: b, name: 'Agency B' } });
    agencyIds.push(agencyB.id);
    for (const [agencyId, title, slug] of [[agencyA.id, 'Tour A', a], [agencyB.id, 'Tour B', b], [null, 'Orphan', `orphan-${suffix}`]]) {
      const tour = await prisma.tour.create({ data: { isPublished: true, agencyId, title, slug, description: 'Test', duration: '1 day', bannerImage: '/test.webp', cardImage: '/test.webp' } });
      tourIds.push(tour.id);
      const transfer = await prisma.transfer.create({ data: {
        isPublished: true, agencyId, title, slug, origin: 'Airport', destination: 'Hotel', duration: '30 min',
      } });
      transferIds.push(transfer.id);
    }
    app = await application(config({ DATABASE_URL: databaseUrl, API_PUBLIC_AGENCY_SLUGS: `${a},${b}` }));
    const resultA = await request(app.getHttpServer()).get(`/v1/storefronts/${a}/tours`).expect(200);
    assert.deepEqual(resultA.body.data.map((tour) => tour.slug), [a]);
    const resultB = await request(app.getHttpServer()).get(`/v1/storefronts/${b}/tours`).expect(200);
    assert.deepEqual(resultB.body.data.map((tour) => tour.slug), [b]);
    await request(app.getHttpServer()).get(`/v1/storefronts/${a}/tours/${b}`).expect(404);
    await request(app.getHttpServer()).get(`/v1/storefronts/${b}/tours/${a}`).expect(404);
    await request(app.getHttpServer()).get(`/v1/storefronts/${a}/tours/orphan-${suffix}`).expect(404);
    const ownDetail = await request(app.getHttpServer()).get(`/v1/storefronts/${a}/tours/${a}`).expect(200);
    assert.equal(ownDetail.body.id, tourIds[0]);
    const ownTransfers = await request(app.getHttpServer()).get(`/v1/storefronts/${a}/transfers`).expect(200);
    assert.deepEqual(ownTransfers.body.data.map((transfer) => transfer.slug), [a]);
    await request(app.getHttpServer()).get(`/v1/storefronts/${a}/transfers/${b}`).expect(404);
    await request(app.getHttpServer()).get(`/v1/storefronts/${a}/transfers/orphan-${suffix}`).expect(404);
    await prisma.transfer.update({ where: { id: transferIds[0] }, data: { isActive: false } });
    await request(app.getHttpServer()).get(`/v1/storefronts/${a}/transfers/${a}`).expect(404);
    await prisma.agency.update({ where: { id: agencyB.id }, data: { isActive: false } });
    await request(app.getHttpServer()).get(`/v1/storefronts/${b}/tours`).expect(404);
    await request(app.getHttpServer()).get(`/v1/storefronts/${b}/transfers`).expect(404);
    await request(app.getHttpServer()).get('/health/ready').expect(200);
  } finally {
    await app?.close();
    // Delete only records created by this test, never truncate a database.
    await prisma.tour.deleteMany({ where: { id: { in: tourIds } } });
    await prisma.transfer.deleteMany({ where: { id: { in: transferIds } } });
    await prisma.agency.deleteMany({ where: { id: { in: agencyIds } } });
    await prisma.$disconnect();
  }
});
