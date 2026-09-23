import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { application, config } from './helpers.mjs';

test('compiled Next admin talks to Nest with scoped sessions and denies legacy surfaces', async () => {
  const databaseUrl = process.env.API_TEST_DATABASE_URL;
  const adminUrl = process.env.ADMIN_TEST_URL;
  assert.ok(databaseUrl && adminUrl, 'Definir API_TEST_DATABASE_URL y ADMIN_TEST_URL locales.');
  const db = new URL(databaseUrl);
  const admin = new URL(adminUrl);
  assert.ok(['localhost', '127.0.0.1'].includes(db.hostname));
  assert.match(db.pathname, /^\/api_test_[a-z0-9_]+$/);
  assert.equal(admin.origin, adminUrl);
  assert.equal(admin.protocol, 'http:');
  assert.ok(['localhost', '127.0.0.1'].includes(admin.hostname));
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID();
  const ids = [];
  let user;
  let app;
  try {
    app = await application(config({ NODE_ENV: 'production', DATABASE_URL: databaseUrl, API_AUTH_ENABLED: 'true' }));
    await app.listen(3002, '127.0.0.1');
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try { ready = (await fetch(`${adminUrl}/login`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* startup */ }
      if (ready) break;
      await setTimeout(1000);
    }
    assert.ok(ready, 'Admin compilado no está disponible.');
    const a = await prisma.agency.create({ data: { name: `Agency A ${suffix}`, slug: `a-${suffix}`, subdomain: `a-${suffix}` } });
    ids.push(a.id);
    const b = await prisma.agency.create({ data: { name: `Agency B ${suffix}`, slug: `b-${suffix}`, subdomain: `b-${suffix}` } });
    ids.push(b.id);
    const password = randomUUID();
    user = await prisma.user.create({ data: { email: `${suffix}@example.test`, password: await hash(password, 10) } });
    const member = await prisma.agencyMembership.create({ data: { userId: user.id, agencyId: a.id, role: 'ADMIN' } });
    for (const agency of [a, b]) await prisma.tour.create({ data: {
      agencyId: agency.id, slug: agency.slug, title: `ONLY-${agency.slug}`, description: 'Fixture', duration: '1 day', bannerImage: '/x', cardImage: '/x',
    } });
    const login = await request(app.getHttpServer()).post('/v1/auth/login').send({ email: user.email, password, agencySlug: a.slug }).expect(200);
    const token = login.body.accessToken;
    const headers = { Cookie: `admin_api_session=${token}` };
    const get = (path, options = {}) => fetch(`${adminUrl}${path}`, { headers, redirect: 'manual', ...options });
    const loginHtml = await (await get('/login')).text();
    assert.ok(loginHtml.includes('name="agencySlug"'));
    const anonymous = await get('/workspace', { headers: {} });
    assert.equal(anonymous.status, 307);
    assert.ok(anonymous.headers.get('location').endsWith('/login'));
    const page = await get('/workspace');
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes(a.name));
    assert.ok(html.includes(`ONLY-${a.slug}`));
    assert.equal(html.includes(`ONLY-${b.slug}`), false);
    assert.equal(html.includes(token), false, 'Token must not be serialized into HTML or RSC.');
    const team = await (await get('/workspace?view=members')).text();
    assert.ok(team.includes(user.email));
    for (const path of ['/reservas', '/usuarios', '/tours/other.png']) {
      const blocked = await get(path);
      assert.equal(blocked.status, 307);
      assert.ok(blocked.headers.get('location').endsWith('/workspace'));
    }
    assert.equal((await get('/api/seed')).status, 403);
    assert.equal((await get('/api/upload', { method: 'POST' })).status, 403);
    await prisma.agencyMembership.update({ where: { id: member.id }, data: { role: 'VIEWER' } });
    const restricted = await (await get('/workspace?view=members')).text();
    assert.ok(restricted.includes('Tu rol no permite consultar el equipo.'));
    await request(app.getHttpServer()).post('/v1/auth/logout').auth(token, { type: 'bearer' }).expect(204);
    const revoked = await get('/workspace');
    const revokedHtml = await revoked.text();
    // Next may stream its redirect; either representation must exclude protected data.
    assert.ok(revoked.headers.get('location')?.includes('/login') || revokedHtml.includes('/login?expired=1'));
    assert.equal(revokedHtml.includes(`ONLY-${a.slug}`), false);
  } finally {
    await app?.close();
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.agency.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
