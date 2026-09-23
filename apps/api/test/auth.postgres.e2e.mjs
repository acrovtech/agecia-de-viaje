import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { config, application } from './helpers.mjs';

test('persistent authentication and membership authorization', async (t) => {
  const databaseUrl = process.env.API_TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'Se requiere una BD de prueba local con las migraciones aplicadas.');
  const url = new URL(databaseUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.match(url.pathname, /^\/api_test_[a-z0-9_]+$/);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID();
  const password = `Test-${suffix}`;
  const email = `${suffix}@example.test`;
  const agencyIds = [];
  const tourIds = [];
  const transferIds = [];
  let user;
  let app;
  try {
    const a = await prisma.agency.create({ data: { name: 'A', slug: `a-${suffix}`, subdomain: `a-${suffix}` } });
    agencyIds.push(a.id);
    const b = await prisma.agency.create({ data: { name: 'B', slug: `b-${suffix}`, subdomain: `b-${suffix}` } });
    agencyIds.push(b.id);
    user = await prisma.user.create({ data: { email, password: await hash(password, 10), role: 'SUPERADMIN' } });
    const membership = await prisma.agencyMembership.create({ data: { agencyId: a.id, userId: user.id, role: 'ADMIN' } });
    const settings = config({ DATABASE_URL: databaseUrl, API_AUTH_ENABLED: 'true' });
    const resetApp = async () => {
      await app?.close();
      app = await application(settings);
      return app.getHttpServer();
    };
    const login = async (server, overrides = {}) => request(server).post('/v1/auth/login').send({ email, password, agencySlug: a.slug, ...overrides });

    await t.test('private catalog is scoped, paginated and independent of public publication', async () => {
      const server = await resetApp();
      for (let i = 0; i < 53; i++) {
        const id = randomUUID();
        const agencyId = i < 51 ? a.id : i === 51 ? b.id : null;
        const slug = `test-${i}-${suffix}`;
        await prisma.tour.create({ data: { id, agencyId, slug, title: `Tour ${i}`, description: 'Fixture', duration: '1 day', bannerImage: '/x', cardImage: '/x' } });
        tourIds.push(id);
        if (i >= 50) {
          await prisma.transfer.create({ data: { id, agencyId, slug, title: `Transfer ${i}`, origin: 'A', destination: 'B', duration: '1h', isActive: false } });
          transferIds.push(id);
        }
      }
      const response = await login(server);
      const token = response.body.accessToken;
      const route = `/v1/agencies/${a.id}/catalog`;
      const first = await request(server).get(`${route}/tours`).auth(token, { type: 'bearer' }).expect(200);
      assert.equal(first.body.data.length, 50);
      assert.ok(first.body.nextCursor);
      const second = await request(server).get(`${route}/tours?after=${first.body.nextCursor}`).auth(token, { type: 'bearer' }).expect(200);
      assert.equal(second.body.data.length, 1);
      assert.equal(second.body.nextCursor, null);
      const visibleIds = [...first.body.data, ...second.body.data].map((row) => row.id);
      assert.equal(new Set(visibleIds).size, 51);
      assert.ok(visibleIds.every((id) => tourIds.slice(0, 51).includes(id)));
      const transfers = await request(server).get(`${route}/transfers`).auth(token, { type: 'bearer' }).expect(200);
      assert.equal(transfers.body.data.length, 1);
      assert.equal(transfers.body.data[0].isActive, false);
      for (const resource of ['tours', 'transfers']) {
        await request(server).get(`/v1/agencies/${b.id}/catalog/${resource}`).auth(token, { type: 'bearer' }).expect(403);
        await request(server).get(`${route}/${resource}?agencyId=${b.id}`).auth(token, { type: 'bearer' }).expect(400);
        await request(server).get(`${route}/${resource}`).expect(401);
      }
    });

    await t.test('login stores only a token digest; logout survives application restart', async () => {
      let server = await resetApp();
      const response = await login(server);
      assert.equal(response.status, 200);
      const token = response.body.accessToken;
      assert.match(token, /^[A-Za-z0-9_-]{43}$/);
      const stored = await prisma.apiSession.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') } });
      assert.ok(stored);
      assert.notEqual(stored.tokenHash, token);
      const me = await request(server).get('/v1/auth/me').auth(token, { type: 'bearer' }).expect(200);
      assert.equal(me.body.agencyId, a.id);
      assert.equal(me.body.role, 'ADMIN');
      assert.equal(me.body.password, undefined);
      await request(server).post('/v1/auth/logout').auth(token, { type: 'bearer' }).expect(204);
      server = await resetApp();
      await request(server).get('/v1/auth/me').auth(token, { type: 'bearer' }).expect(401);
    });

    await t.test('global legacy role does not grant another agency or elevate local role', async () => {
      const server = await resetApp();
      assert.equal((await login(server, { agencySlug: b.slug })).status, 401);
      const response = await login(server);
      const token = response.body.accessToken;
      const members = await request(server).get(`/v1/agencies/${a.id}/memberships`).auth(token, { type: 'bearer' }).expect(200);
      assert.equal(members.body.data.length, 1);
      assert.equal(JSON.stringify(members.body).includes('password'), false);
      await request(server).get(`/v1/agencies/${a.id}/memberships?agencyId=${b.id}`).auth(token, { type: 'bearer' }).expect(400);
      await request(server).get(`/v1/agencies/${b.id}/memberships`).auth(token, { type: 'bearer' }).expect(403);
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role: 'VIEWER' } });
      await request(server).get(`/v1/agencies/${a.id}/memberships`).auth(token, { type: 'bearer' }).expect(403);
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role: 'ADMIN' } });
    });

    await t.test('one user can hold independent memberships with different roles', async () => {
      const server = await resetApp();
      const second = await prisma.agencyMembership.create({ data: { agencyId: b.id, userId: user.id, role: 'VIEWER' } });
      const response = await login(server, { agencySlug: b.slug });
      assert.equal(response.status, 200);
      const me = await request(server).get('/v1/auth/me').auth(response.body.accessToken, { type: 'bearer' }).expect(200);
      assert.equal(me.body.agencyId, b.id);
      assert.equal(me.body.role, 'VIEWER');
      await prisma.agencyMembership.delete({ where: { id: second.id } });
      await request(server).get('/v1/auth/me').auth(response.body.accessToken, { type: 'bearer' }).expect(401);
    });

    await t.test('operator provisioning changes only the requested membership and revokes old sessions', async () => {
      const server = await resetApp();
      const response = await login(server);
      const script = fileURLToPath(new URL('../../../packages/db/grant-membership.mjs', import.meta.url));
      const result = JSON.parse(execFileSync(process.execPath, [script, '--email', email, '--agency', a.slug, '--role', 'VIEWER'], {
        env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8',
      }));
      assert.equal(result.id, membership.id);
      assert.equal(result.role, 'VIEWER');
      await request(server).get('/v1/auth/me').auth(response.body.accessToken, { type: 'bearer' }).expect(401);
      await prisma.agencyMembership.update({ where: { id: membership.id }, data: { role: 'ADMIN' } });
    });

    await t.test('disabling membership, user or agency invalidates current sessions', async () => {
      const server = await resetApp();
      const response = await login(server);
      const token = response.body.accessToken;
      for (const [model, id] of [[prisma.agencyMembership, membership.id], [prisma.user, user.id], [prisma.agency, a.id]]) {
        await model.update({ where: { id }, data: { isActive: false } });
        await request(server).get('/v1/auth/me').auth(token, { type: 'bearer' }).expect(401);
        assert.equal((await login(server)).status, 401);
        await model.update({ where: { id }, data: { isActive: true } });
      }
    });

    await t.test('expiration, password replacement and tokenVersion revoke access', async () => {
      const server = await resetApp();
      for (const mutation of ['expiry', 'version', 'password']) {
        const response = await login(server);
        assert.equal(response.status, 200);
        const token = response.body.accessToken;
        if (mutation === 'expiry') await prisma.apiSession.updateMany({ where: { membershipId: membership.id }, data: { expiresAt: new Date(0) } });
        if (mutation === 'version') await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
        if (mutation === 'password') await prisma.user.update({ where: { id: user.id }, data: { password: await hash(password, 10) } });
        await request(server).get('/v1/auth/me').auth(token, { type: 'bearer' }).expect(401);
      }
    });

    await t.test('strict body validation and forged credentials fail closed', async () => {
      const server = await resetApp();
      for (const overrides of [{ role: 'OWNER' }, { agencyId: b.id }, { password: 'x'.repeat(73) }, { email: [] }]) {
        assert.equal((await login(server, overrides)).status, 400);
      }
      await request(server).get('/v1/auth/me').set('Authorization', 'Bearer forged.jwt.token').expect(401);
      await request(server).get('/v1/auth/me').set('Cookie', 'admin_session=forged').expect(401);
      assert.equal((await login(server, { email: `unknown-${email}` })).status, 401);
    });

    await t.test('five failed passwords lock account and invalidate existing session', async () => {
      const server = await resetApp();
      const session = await login(server);
      for (let i = 0; i < 5; i++) assert.equal((await login(server, { password: 'wrong' })).status, 401);
      const locked = await prisma.user.findUnique({ where: { id: user.id } });
      assert.ok(locked.lockedUntil > new Date());
      assert.equal((await login(server)).status, 401);
      await request(server).get('/v1/auth/me').auth(session.body.accessToken, { type: 'bearer' }).expect(401);
      await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: null, failedLoginAttempts: 0 } });
    });

    await t.test('expired account lock starts a fresh failed-attempt window', async () => {
      const server = await resetApp();
      await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(0), failedLoginAttempts: 5 } });
      assert.equal((await login(server, { password: 'wrong' })).status, 401);
      const account = await prisma.user.findUnique({ where: { id: user.id } });
      assert.equal(account.failedLoginAttempts, 1);
      assert.equal(account.lockedUntil, null);
      assert.equal((await login(server)).status, 200);
    });

    await t.test('login has its own request rate limit', async () => {
      const server = await resetApp();
      for (let i = 0; i < 10; i++) await request(server).post('/v1/auth/login').send({}).expect(400);
      await request(server).post('/v1/auth/login').send({}).expect(429);
    });

    await t.test('auth endpoints are not registered unless enabled', async () => {
      await app.close();
      app = await application(config({ DATABASE_URL: databaseUrl }));
      await request(app.getHttpServer()).post('/v1/auth/login').send({}).expect(404);
      await request(app.getHttpServer()).get('/v1/auth/me').expect(404);
    });
  } finally {
    await app?.close();
    await prisma.tour.deleteMany({ where: { id: { in: tourIds } } });
    await prisma.transfer.deleteMany({ where: { id: { in: transferIds } } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.agency.deleteMany({ where: { id: { in: agencyIds } } });
    await prisma.$disconnect();
  }
});
