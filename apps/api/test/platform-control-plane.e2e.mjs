import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { application, config } from './helpers.mjs';
import { getCurrentRewardPeriodAndBoundary } from '../dist/settings/settings.service.js';

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
      {
        id: 'p-admin-support',
        email: 'support@platform.test',
        password: superAdminPasswordHash,
        displayName: 'Platform Support',
        role: 'SUPPORT',
        isActive: true,
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
      { id: 'pref-1', agencyId: 'agency-a-id', platformBrandingEnabled: true, rewardLockedUntil: null, lastRewardPeriod: null },
    ],
    brandingRewardClaims: [],
    aiCreditAccounts: [],
    aiCreditLedgers: [],
    adminAuditLogs: [],
    platformSettings: {
      id: 'global',
      productName: 'Acrov SaaS',
      logoUrl: 'https://r2.test/platform-logo.webp',
      iconUrl: null,
      coBrandingEnabled: true,
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
        let agency = null;
        if (where.slug) agency = state.agencies.find((a) => a.slug === where.slug) || null;
        if (where.id) agency = state.agencies.find((a) => a.id === where.id) || null;
        if (!agency) return null;
        return {
          ...agency,
          _count: { memberships: 1, tours: 2, locales: 1 },
          locales: [{ id: 'loc-1', locale: 'es', isDefault: true, enabled: true }],
          entitlements: { maxCatalogLocales: 5, aiEnabled: true, aiMonthlyCredits: 10 },
          brandingPreference: state.brandingPreferences.find((b) => b.agencyId === agency.id) || null,
        };
      },
      findMany: async () => {
        return state.agencies.map((agency) => ({
          ...agency,
          _count: { memberships: 1, tours: 2, locales: 1 },
        }));
      },
    },
    agencyBrandingPreference: {
      findUnique: async ({ where }) => {
        return state.brandingPreferences.find((b) => b.agencyId === where.agencyId) || null;
      },
      upsert: async ({ where, create, update }) => {
        let pref = state.brandingPreferences.find((b) => b.agencyId === where.agencyId);
        if (!pref) {
          pref = { id: `pref-${state.brandingPreferences.length + 1}`, ...create };
          state.brandingPreferences.push(pref);
        } else {
          Object.assign(pref, update);
        }
        return pref;
      },
      update: async ({ where, data }) => {
        const pref = state.brandingPreferences.find((b) => b.agencyId === where.agencyId);
        if (!pref) throw new Error('Preference not found');
        Object.assign(pref, data);
        return pref;
      },
    },
    brandingRewardClaim: {
      findUnique: async ({ where }) => {
        if (where.agencyId_period) {
          return state.brandingRewardClaims.find(
            (c) => c.agencyId === where.agencyId_period.agencyId && c.period === where.agencyId_period.period
          ) || null;
        }
        return null;
      },
      create: async ({ data }) => {
        const existing = state.brandingRewardClaims.find(
          (c) => c.agencyId === data.agencyId && c.period === data.period
        );
        if (existing) {
          const err = new Error('Unique constraint failed on the fields: (`agencyId`,`period`)');
          err.code = 'P2002';
          throw err;
        }
        const row = { id: `brc-${state.brandingRewardClaims.length + 1}`, createdAt: new Date(), ...data };
        state.brandingRewardClaims.push(row);
        return row;
      },
    },
    aiCreditAccount: {
      findUnique: async ({ where }) => {
        return state.aiCreditAccounts.find((a) => a.agencyId === where.agencyId) || null;
      },
      findMany: async () => {
        return state.aiCreditAccounts;
      },
      create: async ({ data }) => {
        const row = { id: `aca-${state.aiCreditAccounts.length + 1}`, ...data };
        state.aiCreditAccounts.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        const account = state.aiCreditAccounts.find((a) => a.id === where.id);
        if (!account) throw new Error('Account not found');
        if (data.balance?.increment !== undefined) {
          account.balance += data.balance.increment;
        } else if (typeof data.balance === 'number') {
          account.balance = data.balance;
        }
        return account;
      },
    },
    aiCreditLedger: {
      create: async ({ data }) => {
        const row = { id: `acl-${state.aiCreditLedgers.length + 1}`, createdAt: new Date(), ...data };
        state.aiCreditLedgers.push(row);
        return row;
      },
    },
    adminAuditLog: {
      create: async ({ data }) => {
        const row = { id: `aaudit-${state.adminAuditLogs.length + 1}`, createdAt: new Date(), ...data };
        state.adminAuditLogs.push(row);
        return row;
      },
    },
    platformSettings: {
      findUnique: async () => state.platformSettings,
      upsert: async ({ create, update }) => {
        state.platformSettings = { ...state.platformSettings, ...update };
        return state.platformSettings;
      },
    },
    $queryRaw: async () => [{ id: 'agency-a-id' }],
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

  await t.test('12. GET /v1/agencies/:agencyId/settings/branding returns current preference and reward availability', async () => {
    const res = await request(server)
      .get('/v1/agencies/agency-a-id/settings/branding')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(200);

    assert.equal(res.body.platformBrandingEnabled, true);
    assert.equal(res.body.isLocked, false);
    assert.equal(res.body.isCurrentPeriodClaimed, false);
    assert.equal(res.body.rewardCredits, 10);
    assert.equal(res.body.productName, 'Acrov SaaS');
  });

  await t.test('13. POST /v1/agencies/:agencyId/settings/branding/reward claims reward, increments credits, creates ledger and locks', async () => {
    const res = await request(server)
      .post('/v1/agencies/agency-a-id/settings/branding/reward')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.claimed, true);
    assert.equal(res.body.creditsAwarded, 10);
    assert.equal(res.body.balance, 10);
    assert.ok(res.body.lockedUntil);
    assert.ok(res.body.period);

    // Verify DB state
    const account = state.aiCreditAccounts.find((a) => a.agencyId === 'agency-a-id');
    assert.equal(account.balance, 10);

    const ledger = state.aiCreditLedgers.find((l) => l.agencyId === 'agency-a-id');
    assert.ok(ledger);
    assert.equal(ledger.delta, 10);
    assert.equal(ledger.reason, 'BRANDING_REWARD');
    assert.equal(ledger.referenceType, 'BRANDING_PERIOD');
    assert.equal(ledger.referenceId, res.body.period);

    const claim = state.brandingRewardClaims.find((c) => c.agencyId === 'agency-a-id');
    assert.ok(claim);
    assert.equal(claim.period, res.body.period);
    assert.equal(claim.credits, 10);
  });

  await t.test('14. Disabling co-branding while locked returns 409 Conflict', async () => {
    const res = await request(server)
      .put('/v1/agencies/agency-a-id/settings/branding')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .send({ platformBrandingEnabled: false })
      .expect(409);

    const errorMsg = res.body.error?.message || res.body.message || '';
    assert.match(errorMsg, /bloqueado hasta el próximo ciclo/i);

    // Verify preference is still enabled
    const pref = state.brandingPreferences.find((p) => p.agencyId === 'agency-a-id');
    assert.equal(pref.platformBrandingEnabled, true);
  });

  await t.test('15. Second claim in same period is rejected with 409 and does not mint duplicate credits', async () => {
    await request(server)
      .post('/v1/agencies/agency-a-id/settings/branding/reward')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(409);

    // Balance remains 10 (not 20)
    const account = state.aiCreditAccounts.find((a) => a.agencyId === 'agency-a-id');
    assert.equal(account.balance, 10);

    // Ledger has exactly 1 entry
    const ledgers = state.aiCreditLedgers.filter((l) => l.agencyId === 'agency-a-id');
    assert.equal(ledgers.length, 1);
  });

  await t.test('16. CONTROL PLANE: GET /v1/platform/agencies requires PlatformSession (tenant token returns 401)', async () => {
    await request(server)
      .get('/v1/platform/agencies')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(401);
  });

  await t.test('17. CONTROL PLANE: GET /v1/platform/agencies returns real tenant data and authoritative AI credit balance', async () => {
    // Log back in to get a fresh platform token
    const login = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    const activePlatformToken = login.body.accessToken;

    const res = await request(server)
      .get('/v1/platform/agencies')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    const agencyA = res.body.find((a) => a.id === 'agency-a-id');
    assert.ok(agencyA);
    assert.equal(agencyA.name, 'Agency A');
    assert.equal(agencyA.slug, 'agency-a');
    assert.equal(agencyA.isActive, true);
    assert.equal(agencyA.aiCreditBalance, 10);
    assert.equal(agencyA.membershipCount, 1);
    assert.equal(agencyA.tourCount, 2);
  });

  await t.test('18. CONTROL PLANE: GET /v1/platform/agencies/:agencyId returns tenant detail with lock and reward state', async () => {
    const login = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    const activePlatformToken = login.body.accessToken;

    const res = await request(server)
      .get('/v1/platform/agencies/agency-a-id')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .expect(200);

    assert.equal(res.body.agency.name, 'Agency A');
    assert.equal(res.body.aiCredits.balance, 10);
    assert.equal(res.body.coBranding.platformBrandingEnabled, true);
    assert.equal(res.body.coBranding.isLocked, true);
    assert.equal(res.body.coBranding.currentPeriodReward, 'CLAIMED');
  });

  await t.test('19. CONTROL PLANE: GET /v1/platform/agencies/:agencyId returns 404 for nonexistent agency', async () => {
    const login = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    const activePlatformToken = login.body.accessToken;

    await request(server)
      .get('/v1/platform/agencies/nonexistent-id')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .expect(404);
  });

  let activePlatformToken;
  await t.test('20. CONTROL PLANE: PUT /v1/platform/settings modifies global settings and writes PlatformAuditLog', async () => {
    const login = await request(server)
      .post('/v1/platform/auth/login')
      .send({ email: 'superadmin@platform.test', password: superAdminPassword })
      .expect(200);

    activePlatformToken = login.body.accessToken;

    const updateRes = await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .send({
        productName: 'Acrov Platform 2.8',
        logoUrl: 'https://r2.test/updated-logo.webp',
        iconUrl: null,
        brandingRewardEnabled: true,
        brandingRewardCredits: 15,
      })
      .expect(200);

    assert.equal(updateRes.body.productName, 'Acrov Platform 2.8');
    assert.equal(updateRes.body.brandingRewardCredits, 15);

    const audit = state.platformAuditLogs.find((l) => l.action === 'PLATFORM_SETTINGS_UPDATE');
    assert.ok(audit, 'PlatformAuditLog must be recorded for settings update');
    assert.equal(audit.entity, 'PlatformSettings');
  });

  await t.test('21. PLATFORM RBAC: Non-SUPERADMIN (SUPPORT) role receives 403 Forbidden on PUT /v1/platform/settings', async () => {
    const supportToken = randomBytes(32).toString('base64url');
    state.platformSessions.push({
      id: 'psess-support',
      platformAdminId: 'p-admin-support',
      tokenHash: digest(supportToken),
      tokenVersion: 1,
      passwordHash: digest(superAdminPasswordHash),
      expiresAt: new Date(Date.now() + 3600_000),
      revokedAt: null,
    });

    await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${supportToken}`)
      .send({
        productName: 'Hacked SaaS Name',
        coBrandingEnabled: false,
        brandingRewardEnabled: false,
        brandingRewardCredits: 0,
      })
      .expect(403);
  });

  await t.test('22. URL SECURITY: Unsafe protocols (javascript:, file:) on logoUrl or iconUrl are rejected with 400', async () => {
    // javascript: URL
    await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .send({
        productName: 'Acrov SaaS',
        logoUrl: 'javascript:alert(1)',
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      })
      .expect(400);

    // file: URL
    await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .send({
        productName: 'Acrov SaaS',
        iconUrl: 'file:///etc/passwd',
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      })
      .expect(400);
  });

  await t.test('23. GLOBAL KILL SWITCH: Disabling coBrandingEnabled causes public login context to return enabled = false without altering tenant preference', async () => {
    // 1. Disable globally
    await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .send({
        productName: 'Acrov SaaS',
        coBrandingEnabled: false,
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      })
      .expect(200);

    // 2. Verify public login context returns platformBranding.enabled = false
    const publicCtx = await request(server)
      .get('/v1/public/admin-login-context/agency-a')
      .expect(200);

    assert.equal(publicCtx.body.platformBranding.enabled, false);

    // 3. Verify tenant preference was NOT rewritten
    const tenantPref = state.brandingPreferences.find((p) => p.agencyId === 'agency-a-id');
    assert.equal(tenantPref.platformBrandingEnabled, true);
  });

  await t.test('24. GLOBAL KILL SWITCH: Claiming branding reward while coBrandingEnabled is false returns 409 Conflict', async () => {
    // Attempt claim for an agency while global coBrandingEnabled is false
    // First reset claims to ensure clean period
    state.brandingRewardClaims = [];

    const res = await request(server)
      .post('/v1/agencies/agency-a-id/settings/branding/reward')
      .set('Authorization', `Bearer ${tenantRawToken}`)
      .expect(409);

    const errorMsg = res.body?.error?.message || res.body?.message || '';
    assert.match(errorMsg, /desactivado globalmente/i);
    assert.equal(state.brandingRewardClaims.length, 0);
  });

  await t.test('25. GLOBAL KILL SWITCH: Re-enabling coBrandingEnabled restores platform branding visibility', async () => {
    // Re-enable globally
    await request(server)
      .put('/v1/platform/settings')
      .set('Authorization', `Bearer ${activePlatformToken}`)
      .send({
        productName: 'Acrov SaaS',
        coBrandingEnabled: true,
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      })
      .expect(200);

    const publicCtx = await request(server)
      .get('/v1/public/admin-login-context/agency-a')
      .expect(200);

    assert.equal(publicCtx.body.platformBranding.enabled, true);
  });

  await t.test('26. SESSION SECURITY: Session fails closed on admin deactivation, tokenVersion increment, or password change', async () => {
    // 1. Create a platform session token for p-admin-1
    const sessionToken = randomBytes(32).toString('base64url');
    state.platformSessions.push({
      id: 'psess-test26',
      platformAdminId: 'p-admin-1',
      tokenHash: digest(sessionToken),
      tokenVersion: 1,
      passwordHash: digest(superAdminPasswordHash),
      expiresAt: new Date(Date.now() + 3600_000),
      revokedAt: null,
    });

    // 2. Verified active
    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(200);

    // 3. Admin deactivated
    const admin = state.platformAdmins.find((a) => a.id === 'p-admin-1');
    admin.isActive = false;

    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(401);

    // Restore active
    admin.isActive = true;
    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(200);

    // 4. tokenVersion increment
    admin.tokenVersion = 2;
    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(401);

    // Restore tokenVersion
    admin.tokenVersion = 1;

    // 5. Password changed
    admin.password = await bcrypt.hash('BrandNewPassword2026!', 10);
    await request(server)
      .get('/v1/platform/auth/me')
      .set('Authorization', `Bearer ${sessionToken}`)
      .expect(401);

    // Restore original password
    admin.password = superAdminPasswordHash;
  });

  await t.test('27. CONCURRENCY: Simultaneous concurrent reward claims serialize idempotently (exactly 1 succeeds, balance increments once)', async () => {
    // Reset claims and account for agency-a-id
    state.brandingRewardClaims = [];
    let acc = state.aiCreditAccounts.find((a) => a.agencyId === 'agency-a-id');
    if (!acc) {
      acc = { id: 'aca-agency-a', agencyId: 'agency-a-id', balance: 0 };
      state.aiCreditAccounts.push(acc);
    } else {
      acc.balance = 0;
    }
    state.aiCreditLedgers = [];

    // Ensure preference is not locked
    const pref = state.brandingPreferences.find((p) => p.agencyId === 'agency-a-id');
    if (pref) pref.rewardLockedUntil = null;

    // Launch 10 simultaneous claims
    const promises = Array.from({ length: 10 }, () =>
      request(server)
        .post('/v1/agencies/agency-a-id/settings/branding/reward')
        .set('Authorization', `Bearer ${tenantRawToken}`)
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    assert.equal(successes.length, 1, 'Exactly one claim must succeed');
    assert.equal(conflicts.length, 9, 'All other concurrent claims must return 409 Conflict');
    assert.equal(state.brandingRewardClaims.length, 1, 'Exactly 1 claim record in DB');
    assert.equal(state.aiCreditLedgers.length, 1, 'Exactly 1 ledger entry');
    assert.equal(acc.balance, 10, 'Balance must increment exactly once by 10 credits');
  });

  await t.test('28. UTC BOUNDARIES: Reward period and lock expiration use canonical UTC calendar boundaries', async () => {
    // 1. Month-end: 2026-10-31T23:59:59.999Z -> period '2026-10', lockedUntil '2026-11-01T00:00:00.000Z'
    const octEnd = new Date('2026-10-31T23:59:59.999Z');
    const r1 = getCurrentRewardPeriodAndBoundary(octEnd);
    assert.equal(r1.period, '2026-10');
    assert.equal(r1.lockedUntil.toISOString(), '2026-11-01T00:00:00.000Z');

    // 2. Month-start: 2026-11-01T00:00:00.000Z -> period '2026-11', lockedUntil '2026-12-01T00:00:00.000Z'
    const novStart = new Date('2026-11-01T00:00:00.000Z');
    const r2 = getCurrentRewardPeriodAndBoundary(novStart);
    assert.equal(r2.period, '2026-11');
    assert.equal(r2.lockedUntil.toISOString(), '2026-12-01T00:00:00.000Z');

    // 3. Year rollover: 2026-12-31T23:59:59.999Z -> period '2026-12', lockedUntil '2027-01-01T00:00:00.000Z'
    const decEnd = new Date('2026-12-31T23:59:59.999Z');
    const r3 = getCurrentRewardPeriodAndBoundary(decEnd);
    assert.equal(r3.period, '2026-12');
    assert.equal(r3.lockedUntil.toISOString(), '2027-01-01T00:00:00.000Z');

    // 4. Leap year February final instant: 2024-02-29T23:59:59.999Z -> period '2024-02', lockedUntil '2024-03-01T00:00:00.000Z'
    const leapFebFinal = new Date('2024-02-29T23:59:59.999Z');
    const r4 = getCurrentRewardPeriodAndBoundary(leapFebFinal);
    assert.equal(r4.period, '2024-02');
    assert.equal(r4.lockedUntil.toISOString(), '2024-03-01T00:00:00.000Z');

    // 5. Leap year February start of leap day: 2024-02-29T00:00:00.000Z -> period '2024-02', lockedUntil '2024-03-01T00:00:00.000Z'
    const leapFebStart = new Date('2024-02-29T00:00:00.000Z');
    const r5 = getCurrentRewardPeriodAndBoundary(leapFebStart);
    assert.equal(r5.period, '2024-02');
    assert.equal(r5.lockedUntil.toISOString(), '2024-03-01T00:00:00.000Z');

    // 6. Non-leap year February final instant: 2026-02-28T23:59:59.999Z -> period '2026-02', lockedUntil '2026-03-01T00:00:00.000Z'
    const nonLeapFebFinal = new Date('2026-02-28T23:59:59.999Z');
    const r6 = getCurrentRewardPeriodAndBoundary(nonLeapFebFinal);
    assert.equal(r6.period, '2026-02');
    assert.equal(r6.lockedUntil.toISOString(), '2026-03-01T00:00:00.000Z');

    // 7. Non-leap year March first instant: 2026-03-01T00:00:00.000Z -> period '2026-03', lockedUntil '2026-04-01T00:00:00.000Z'
    const nonLeapMarchStart = new Date('2026-03-01T00:00:00.000Z');
    const r7 = getCurrentRewardPeriodAndBoundary(nonLeapMarchStart);
    assert.equal(r7.period, '2026-03');
    assert.equal(r7.lockedUntil.toISOString(), '2026-04-01T00:00:00.000Z');
  });

  await t.test('29. CSRF & BEARER BOUNDARY: Cookie-only requests or cross-origin requests without Bearer token are rejected with 401', async () => {
    // 1. Cross-origin request with only platform cookie (no Authorization header)
    await request(server)
      .put('/v1/platform/settings')
      .set('Origin', 'https://evil.example')
      .set('Cookie', `platform_admin_session=${activePlatformToken}`)
      .send({ productName: 'CSRF Attack', coBrandingEnabled: false, brandingRewardEnabled: false, brandingRewardCredits: 0 })
      .expect(401);

    // 2. Cross-origin request with only tenant cookie on tenant branding mutation
    await request(server)
      .put('/v1/agencies/agency-a-id/settings/branding')
      .set('Origin', 'https://evil.example')
      .set('Cookie', `admin_api_session=${tenantRawToken}`)
      .send({ platformBrandingEnabled: false })
      .expect(401);

    // 3. Cross-origin request with only tenant cookie on reward claim
    await request(server)
      .post('/v1/agencies/agency-a-id/settings/branding/reward')
      .set('Origin', 'https://evil.example')
      .set('Cookie', `admin_api_session=${tenantRawToken}`)
      .expect(401);
  });

  await t.test('30. CONCURRENCY: Global coBranding disable vs Tenant claim reward race resolves into valid serializable outcome', async () => {
    // Setup clean agency state
    state.brandingRewardClaims = [];
    let acc = state.aiCreditAccounts.find((a) => a.agencyId === 'agency-a-id');
    if (!acc) {
      acc = { id: 'aca-agency-a', agencyId: 'agency-a-id', balance: 0 };
      state.aiCreditAccounts.push(acc);
    } else {
      acc.balance = 0;
    }
    state.aiCreditLedgers = [];
    const pref = state.brandingPreferences.find((p) => p.agencyId === 'agency-a-id');
    if (pref) pref.rewardLockedUntil = null;

    // Reset platform coBranding to true initially
    state.platformSettings.coBrandingEnabled = true;

    // Concurrently launch SUPERADMIN disable and Tenant reward claim
    const [disableRes, claimRes] = await Promise.all([
      request(server)
        .put('/v1/platform/settings')
        .set('Authorization', `Bearer ${activePlatformToken}`)
        .send({
          productName: 'Acrov SaaS',
          coBrandingEnabled: false,
          brandingRewardEnabled: true,
          brandingRewardCredits: 10,
        }),
      request(server)
        .post('/v1/agencies/agency-a-id/settings/branding/reward')
        .set('Authorization', `Bearer ${tenantRawToken}`),
    ]);

    assert.equal(disableRes.status, 200, 'SUPERADMIN disable must succeed');
    assert.ok(
      claimRes.status === 201 || claimRes.status === 409,
      `Claim must either succeed (201) if ordered before disable or fail with conflict (409) if ordered after disable. Received: ${claimRes.status}`
    );

    if (claimRes.status === 201) {
      // Claim won the race: reward was minted before disable completed
      assert.equal(state.brandingRewardClaims.length, 1);
      assert.equal(acc.balance, 10);
    } else {
      // Disable won the race: reward was rejected
      assert.equal(state.brandingRewardClaims.length, 0);
      assert.equal(acc.balance, 0);
    }

    // Restore platform settings to true for subsequent tests
    state.platformSettings.coBrandingEnabled = true;
  });

  await app.close();
});
