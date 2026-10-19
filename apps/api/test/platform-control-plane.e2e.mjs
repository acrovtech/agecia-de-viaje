import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { application, config } from './helpers.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');

test('Platform Control Plane & Auth Boundary Suite', async (t) => {
  const superAdminPassword = 'SuperAdminPassword2026!';
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10);

  const state = {
    platformAdmins: [
      {
        id: 'p-admin-1',
        email: 'superadmin@platform.test',
        password: superAdminPasswordHash,
        displayName: 'Platform Superadmin',
        role: 'SUPERADMIN',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        tokenVersion: 1,
        lastLoginAt: null,
      },
      {
        id: 'p-admin-inactive',
        email: 'inactive@platform.test',
        password: superAdminPasswordHash,
        displayName: 'Inactive Admin',
        role: 'SUPERADMIN',
        isActive: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        tokenVersion: 1,
        lastLoginAt: null,
      },
    ],
    platformSessions: [],
    platformAuditLogs: [],
    users: [
      {
        id: 'user-tenant-1',
        email: 'superadmin@platform.test', // Same email in tenant User
        password: superAdminPasswordHash,
        isActive: true,
        lockedUntil: null,
        tokenVersion: 1,
      },
    ],
    agencyMemberships: [
      {
        id: 'mem-tenant-1',
        userId: 'user-tenant-1',
        agencyId: 'agency-a-id',
        role: 'OWNER',
        isActive: true,
        agency: { id: 'agency-a-id', slug: 'agency-a', name: 'Agency A', isActive: true },
        user: { id: 'user-tenant-1', email: 'superadmin@platform.test', password: superAdminPasswordHash, isActive: true, lockedUntil: null, tokenVersion: 1 },
      },
    ],
    apiSessions: [],
    agencies: [
      { id: 'agency-a-id', slug: 'agency-a', name: 'Agency A', logoUrl: 'https://r2.test/agency-a.webp', iconUrl: null, isActive: true },
      { id: 'agency-inactive-id', slug: 'inactive-agency', name: 'Inactive Agency', logoUrl: null, iconUrl: null, isActive: false },
    ],
    brandingPreferences: [
      { agencyId: 'agency-a-id', platformBrandingEnabled: true },
    ],
    platformSettings: {
      id: 'global',
      productName: 'Acrov SaaS',
      logoUrl: 'https://r2.test/platform-logo.webp',
      iconUrl: null,
      brandingRewardEnabled: true,
      brandingRewardCredits: 10,
    },
  };

  const mockPrisma = {
    platformAdmin: {
      findUnique: async ({ where }) => {
        if (where.email) {
          return state.platformAdmins.find((a) => a.email.toLowerCase() === where.email.toLowerCase()) || null;
        }
        if (where.id) {
          return state.platformAdmins.find((a) => a.id === where.id) || null;
        }
        return null;
      },
      update: async ({ where, data }) => {
        const admin = state.platformAdmins.find((a) => a.id === where.id);
        if (!admin) throw new Error('Not found');
        if (data.failedLoginAttempts !== undefined) {
          if (typeof data.failedLoginAttempts === 'object' && data.failedLoginAttempts.increment) {
            admin.failedLoginAttempts += data.failedLoginAttempts.increment;
          } else {
            admin.failedLoginAttempts = data.failedLoginAttempts;
          }
        }
        if (data.lockedUntil !== undefined) admin.lockedUntil = data.lockedUntil;
        if (data.lastLoginAt !== undefined) admin.lastLoginAt = data.lastLoginAt;
        return admin;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const admin of state.platformAdmins) {
          let match = true;
          if (where.id && admin.id !== where.id) match = false;
          if (where.failedLoginAttempts?.gte && admin.failedLoginAttempts < where.failedLoginAttempts.gte) match = false;
          if (where.lockedUntil?.lte && (!admin.lockedUntil || admin.lockedUntil > where.lockedUntil.lte)) match = false;
          if (match) {
            if (data.failedLoginAttempts !== undefined) admin.failedLoginAttempts = data.failedLoginAttempts;
            if (data.lockedUntil !== undefined) admin.lockedUntil = data.lockedUntil;
            count++;
          }
        }
        return { count };
      },
    },
    platformSession: {
      create: async ({ data }) => {
        const row = { id: `psess-${state.platformSessions.length + 1}`, revokedAt: null, ...data };
        state.platformSessions.push(row);
        return row;
      },
      findUnique: async ({ where }) => {
        const sess = state.platformSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!sess) return null;
        const platformAdmin = state.platformAdmins.find((a) => a.id === sess.platformAdminId);
        return { ...sess, platformAdmin };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const sess of state.platformSessions) {
          let match = true;
          if (where.id && sess.id !== where.id) match = false;
          if (where.revokedAt === null && sess.revokedAt !== null) match = false;
          if (match) {
            if (data.revokedAt !== undefined) sess.revokedAt = data.revokedAt;
            count++;
          }
        }
        return { count };
      },
    },
    platformAuditLog: {
      create: async ({ data }) => {
        const row = { id: `paudit-${state.platformAuditLogs.length + 1}`, createdAt: new Date(), ...data };
        state.platformAuditLogs.push(row);
        return row;
      },
    },
    user: {
      findUnique: async ({ where }) => state.users.find((u) => u.email === where.email) || null,
      update: async () => {},
      updateMany: async () => ({ count: 0 }),
    },
    agencyMembership: {
      findFirst: async ({ where }) => {
        return state.agencyMemberships.find((m) => m.userId === where.userId && m.isActive) || null;
      },
    },
    apiSession: {
      create: async ({ data }) => {
        const row = { id: `apisess-${state.apiSessions.length + 1}`, revokedAt: null, ...data };
        state.apiSessions.push(row);
        return row;
      },
      findUnique: async ({ where }) => {
        const sess = state.apiSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!sess) return null;
        const membership = state.agencyMemberships.find((m) => m.id === sess.membershipId);
        return { ...sess, membership };
      },
      updateMany: async () => ({ count: 0 }),
    },
    agency: {
      findUnique: async ({ where }) => {
        if (where.slug) return state.agencies.find((a) => a.slug === where.slug) || null;
        if (where.id) return state.agencies.find((a) => a.id === where.id) || null;
        return null;
      },
    },
    agencyBrandingPreference: {
      findUnique: async ({ where }) => {
        return state.brandingPreferences.find((b) => b.agencyId === where.agencyId) || null;
      },
    },
    platformSettings: {
      findUnique: async () => state.platformSettings,
    },
    $transaction: async (tasks) => {
      if (Array.isArray(tasks)) {
        return Promise.all(tasks);
      }
      return tasks(mockPrisma);
    },
  };

  const app = await application(config({ API_AUTH_ENABLED: 'true' }), mockPrisma);
  const server = app.getHttpServer();

  await t.test('1. PlatformAdmin can log in with valid credentials, getting 43-char token and audit log', async () => {
    const res = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    assert.equal(res.body.tokenType, 'Bearer');
    assert.match(res.body.accessToken, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(res.body.admin.role, 'SUPERADMIN');
    assert.equal(res.body.admin.email, 'superadmin@platform.test');

    const audit = state.platformAuditLogs.find((l) => l.action === 'PLATFORM_LOGIN_SUCCESS');
    assert.ok(audit, 'PlatformAuditLog must be recorded');
  });

  await t.test('2. Inactive PlatformAdmin is rejected with 401', async () => {
    await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'inactive@platform.test', password: superAdminPassword })
      .expect(401);
  });

  await t.test('3. Nonexistent user returns 401 without creating session', async () => {
    await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'unknown@platform.test', password: 'SomePassword123!' })
      .expect(401);
  });

  await t.test('4. Password > 72 bytes is rejected with 400', async () => {
    await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: 'a'.repeat(73) })
      .expect(400);
  });

  let platformToken;
  await t.test('5. PlatformAdmin can access /v1/platform/auth/me with valid platform token', async () => {
    const login = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    platformToken = login.body.accessToken;

    const me = await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    assert.equal(me.body.email, 'superadmin@platform.test');
    assert.equal(me.body.role, 'SUPERADMIN');
  });

  // Create a tenant token for comparison
  const tenantRawToken = randomBytes(32).toString('base64url');
  state.apiSessions.push({
    id: 'apisess-1',
    membershipId: 'mem-tenant-1',
    tokenHash: digest(tenantRawToken),
    tokenVersion: 1,
    passwordHash: digest(superAdminPasswordHash),
    expiresAt: new Date(Date.now() + 3600_000),
    revokedAt: null,
  });

  await t.test('6. STRICT BOUNDARY: Tenant ApiSession token is rejected on /v1/platform/auth/me (returns 401)', async () => {
    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(401);
  });

  await t.test('7. STRICT BOUNDARY: Platform token is rejected on tenant /v1/auth/me (returns 401)', async () => {
    await request(server)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(401);
  });

  await t.test('8. Platform logout revokes session, subsequent /me returns 401', async () => {
    await request(server)
      .post('/v1/platform/auth/logout')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(204);

    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(401);
  });

  await t.test('9. Public admin login context returns safe branding and NEVER exposes agencyId or secrets', async () => {
    const res = await request(server)
      .get('/v1/public/admin-login-context/agency-a')
      .expect(200);

    assert.equal(res.body.agency.slug, 'agency-a');
    assert.equal(res.body.agency.name, 'Agency A');
    assert.equal(res.body.agency.logoUrl, 'https://r2.test/agency-a.webp');
    assert.equal(res.body.platformBranding.enabled, true);
    assert.equal(res.body.platformBranding.productName, 'Acrov SaaS');

    // Security assertions
    assert.equal(res.body.agency.id, undefined);
    assert.equal(res.body.agencyId, undefined);
    assert.equal(res.body.entitlements, undefined);
    assert.equal(res.body.credits, undefined);
    assert.equal(res.body.balance, undefined);
  });

  await t.test('10. Inactive agency returns 404 on public login context', async () => {
    await request(server)
      .get('/v1/public/admin-login-context/inactive-agency')
      .expect(404);
  });

  await t.test('11. Nonexistent agency returns 404 on public login context', async () => {
    await request(server)
      .get('/v1/public/admin-login-context/nonexistent-agency')
      .expect(404);
  });

  await app.close();
});
