import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import { application, config } from './helpers.mjs';

function createTestSession(state, agencyId, role) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const userId = `user-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 4)}`;
  const membershipId = `mem-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 4)}`;
  const sessionId = `sess-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 6)}`;
  const password = 'mock-password-hash';
  const passwordHash = createHash('sha256').update(password).digest('hex');

  const user = {
    id: userId,
    email: `${role.toLowerCase()}-${userId}@${agencyId}.test`,
    password,
    isActive: true,
    lockedUntil: null,
    tokenVersion: 1,
  };
  state.users.push(user);

  const membership = {
    id: membershipId,
    userId,
    agencyId,
    role,
    isActive: true,
  };
  state.memberships.push(membership);

  const session = {
    id: sessionId,
    membershipId,
    tokenHash,
    tokenVersion: 1,
    passwordHash,
    expiresAt: new Date(Date.now() + 3600_000),
    revokedAt: null,
  };
  state.apiSessions.push(session);

  return token;
}

test('Agency Self-Service Settings (Part A)', async (t) => {
  const now = new Date('2026-09-28T12:00:00.000Z');
  const agencyA = {
    id: 'agency-a-id',
    name: 'Agencia A Tours',
    slug: 'agency-a',
    subdomain: 'agency-a',
    customDomain: null,
    phone: '+51 987 111 222',
    email: 'contacto@agency-a.test',
    address: 'Av. Sol 100, Cusco',
    logoUrl: 'https://r2.test/agencies/agency-a-id/agency_logo/logo.webp',
    iconUrl: 'https://r2.test/agencies/agency-a-id/agency_icon/icon.webp',
    isActive: true,
    updatedAt: now,
  };

  const agencyB = {
    id: 'agency-b-id',
    name: 'Agencia B Travel',
    slug: 'agency-b',
    subdomain: 'agency-b',
    customDomain: null,
    phone: '+51 987 333 444',
    email: 'contacto@agency-b.test',
    address: 'Av. Larco 200, Lima',
    logoUrl: null,
    iconUrl: null,
    isActive: true,
    updatedAt: now,
  };

  const legalA = {
    agencyId: 'agency-a-id',
    data: {
      ruc: '20123456789',
      legalName: 'AGENCIA A SAC',
      tradeName: 'Agencia A Tours',
      fiscalAddress: 'Av. Sol 100, Cusco',
      legalRepresentative: 'Juan Pérez',
      contactEmail: 'legal@agency-a.test',
      contactPhone: '+51 987 111 222',
    },
    updatedAt: now,
  };

  const state = {
    agencies: [agencyA, agencyB],
    legalProfiles: [legalA],
    users: [],
    memberships: [],
    apiSessions: [],
    mediaAssets: [],
    configurationAudits: [],
  };

  const mockPrisma = {
    agency: {
      findUnique: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      findFirst: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      update: async ({ where, data }) => {
        const agency = state.agencies.find((a) => a.id === where.id);
        if (!agency) throw new Error('Agency not found');
        const newUpdatedAt = new Date();
        Object.assign(agency, data, { updatedAt: newUpdatedAt });
        return { ...agency };
      },
    },
    legalProfile: {
      findUnique: async ({ where }) => state.legalProfiles.find((l) => l.agencyId === where.agencyId) ?? null,
      upsert: async ({ where, create, update }) => {
        let profile = state.legalProfiles.find((l) => l.agencyId === where.agencyId);
        if (!profile) {
          profile = {
            agencyId: where.agencyId,
            data: create.data,
            updatedAt: new Date(),
          };
          state.legalProfiles.push(profile);
        } else {
          profile.data = update.data;
          profile.updatedAt = new Date();
        }
        return profile;
      },
    },
    mediaAsset: {
      findFirst: async ({ where }) => {
        return state.mediaAssets.find((m) => {
          if (where.OR) {
            return where.OR.some((cond) => (cond.publicUrl && m.publicUrl === cond.publicUrl) || (cond.objectKey && m.objectKey === cond.objectKey));
          }
          return false;
        }) ?? null;
      },
    },
    configurationAudit: {
      create: async ({ data }) => {
        const row = { id: `audit-${randomUUID().slice(0, 8)}`, createdAt: new Date(), ...data };
        state.configurationAudits.push(row);
        return row;
      },
    },
    user: {
      findUnique: async ({ where }) => state.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
    },
    agencyMembership: {
      findFirst: async ({ where }) => state.memberships.find((m) => m.userId === where.userId && m.agencyId === where.agencyId) ?? null,
    },
    apiSession: {
      findUnique: async ({ where }) => {
        const session = state.apiSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!session) return null;
        const membership = state.memberships.find((m) => m.id === session.membershipId);
        if (!membership) return null;
        const user = state.users.find((u) => u.id === membership.userId);
        const agency = state.agencies.find((a) => a.id === membership.agencyId);
        return {
          ...session,
          membership: { ...membership, user, agency },
        };
      },
    },
    $queryRaw: async (queryParts, ...params) => {
      const fullQuery = Array.isArray(queryParts) ? queryParts.join(' ') : String(queryParts);
      if (fullQuery.includes('Agency') && fullQuery.includes('FOR UPDATE')) {
        const agencyId = params[0];
        const agency = state.agencies.find((a) => a.id === agencyId);
        return agency ? [{ id: agency.id, updatedAt: agency.updatedAt }] : [];
      }
      return [];
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  const app = await application(
    config({ API_AUTH_ENABLED: 'true', API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b' }),
    mockPrisma
  );

  const ownerAToken = createTestSession(state, 'agency-a-id', 'OWNER');
  const adminAToken = createTestSession(state, 'agency-a-id', 'ADMIN');
  const editorAToken = createTestSession(state, 'agency-a-id', 'EDITOR');
  const operatorAToken = createTestSession(state, 'agency-a-id', 'OPERATOR');
  const viewerAToken = createTestSession(state, 'agency-a-id', 'VIEWER');
  const ownerBToken = createTestSession(state, 'agency-b-id', 'OWNER');

  // 1. READ AGENCY PROFILE
  await t.test('1. Any member of Agency A (OWNER, ADMIN, EDITOR, OPERATOR, VIEWER) can read Agency A profile', async () => {
    for (const [role, token] of [
      ['OWNER', ownerAToken],
      ['ADMIN', adminAToken],
      ['EDITOR', editorAToken],
      ['OPERATOR', operatorAToken],
      ['VIEWER', viewerAToken],
    ]) {
      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/settings/profile')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200, `Expected 200 for ${role}`);
      assert.equal(res.body.name, 'Agencia A Tours');
      assert.equal(res.body.slug, 'agency-a');
    }
  });

  // 2. WRITE AGENCY PROFILE: OWNER & ADMIN can write; EDITOR, OPERATOR, VIEWER rejected with 403
  await t.test('2. Role matrix for updating agency profile', async () => {
    // Missing expectedUpdatedAt is rejected with 400
    const missingVer = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Without expectedUpdatedAt' });
    assert.equal(missingVer.status, 400);

    // EDITOR cannot update
    const editorRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${editorAToken}`)
      .send({ name: 'Hacked Name', expectedUpdatedAt: agencyA.updatedAt.toISOString() });
    assert.equal(editorRes.status, 403);

    // OPERATOR cannot update
    const opRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${operatorAToken}`)
      .send({ name: 'Hacked Name', expectedUpdatedAt: agencyA.updatedAt.toISOString() });
    assert.equal(opRes.status, 403);

    // VIEWER cannot update
    const viewRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${viewerAToken}`)
      .send({ name: 'Hacked Name', expectedUpdatedAt: agencyA.updatedAt.toISOString() });
    assert.equal(viewRes.status, 403);

    // ADMIN can update
    const adminRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Agencia A Renombrada por Admin',
        phone: '+51 999 888 777',
        expectedUpdatedAt: agencyA.updatedAt.toISOString(),
      });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.body.name, 'Agencia A Renombrada por Admin');
    assert.equal(adminRes.body.phone, '+51 999 888 777');

    // OWNER can update
    const ownerRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Agencia A Oficial',
        expectedUpdatedAt: agencyA.updatedAt.toISOString(),
      });
    assert.equal(ownerRes.status, 200);
    assert.equal(ownerRes.body.name, 'Agencia A Oficial');
  });

  // 3. CROSS-TENANT ISOLATION: Agency B cannot read or write Agency A profile
  await t.test('3. Cross-tenant isolation on Agency profile', async () => {
    const readRes = await request(app.getHttpServer())
      .get('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${ownerBToken}`);
    assert.equal(readRes.status, 403);

    const writeRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({ name: 'Cross-tenant Overwrite', expectedUpdatedAt: agencyA.updatedAt.toISOString() });
    assert.equal(writeRes.status, 403);
  });

  // 4. CROSS-TENANT MEDIA PROTECTION
  await t.test('4. Cross-tenant media protection: rejects foreign media URLs', async () => {
    const foreignRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Agencia A',
        logoUrl: 'https://r2.test/agencies/agency-b-id/agency_logo/stolen.webp',
        expectedUpdatedAt: agencyA.updatedAt.toISOString(),
      });
    assert.equal(foreignRes.status, 403);
  });

  // 5. OPTIMISTIC CONCURRENCY CHECK
  await t.test('5. Optimistic concurrency check on profile update', async () => {
    const staleIso = new Date('2020-01-01T00:00:00.000Z').toISOString();
    const staleRes = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/profile')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Agencia A Concurrente',
        expectedUpdatedAt: staleIso,
      });
    assert.equal(staleRes.status, 409);
  });

  // 6. LEGAL PROFILE READ & WRITE
  await t.test('6. Legal profile READ, WRITE and Peruvian 11-digit RUC validation', async () => {
    // Read legal profile
    const readLegal = await request(app.getHttpServer())
      .get('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${viewerAToken}`);
    assert.equal(readLegal.status, 200);
    assert.equal(readLegal.body.ruc, '20123456789');
    assert.equal(readLegal.body.legalName, 'AGENCIA A SAC');

    // Invalid RUC: 10 digits
    const inv10 = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '2012345678', // 10 digits
        legalName: 'TEST SAC',
        fiscalAddress: 'Fiscal 123',
        expectedUpdatedAt: legalA.updatedAt.toISOString(),
      });
    assert.equal(inv10.status, 400);

    // Invalid RUC: 12 digits
    const inv12 = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '201234567890', // 12 digits
        legalName: 'TEST SAC',
        fiscalAddress: 'Fiscal 123',
        expectedUpdatedAt: legalA.updatedAt.toISOString(),
      });
    assert.equal(inv12.status, 400);

    // Invalid RUC: non-digits
    const invAlpha = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '2012345678A',
        legalName: 'TEST SAC',
        fiscalAddress: 'Fiscal 123',
        expectedUpdatedAt: legalA.updatedAt.toISOString(),
      });
    assert.equal(invAlpha.status, 400);

    // Valid update
    const validUpdate = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '20987654321',
        legalName: 'AGENCIA A ACTUALIZADA SAC',
        fiscalAddress: 'Av. Sol 500, Cusco',
        tradeName: 'A Tours',
        expectedUpdatedAt: legalA.updatedAt.toISOString(),
      });
    assert.equal(validUpdate.status, 200);
    assert.equal(validUpdate.body.ruc, '20987654321');
    assert.equal(validUpdate.body.legalName, 'AGENCIA A ACTUALIZADA SAC');

    // Stale legal profile update
    const staleLegal = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '20987654321',
        legalName: 'AGENCIA A STALE SAC',
        fiscalAddress: 'Av. Sol 500, Cusco',
        expectedUpdatedAt: new Date('2021-01-01').toISOString(),
      });
    assert.equal(staleLegal.status, 409);

    // Initial creation race: if client expects null but profile exists -> 409
    const expectNullRace = await request(app.getHttpServer())
      .put('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        ruc: '20987654321',
        legalName: 'AGENCIA A NEW SAC',
        fiscalAddress: 'Av. Sol 500, Cusco',
        expectedUpdatedAt: null,
      });
    assert.equal(expectNullRace.status, 409);

    // Cross-tenant legal check
    const crossLegal = await request(app.getHttpServer())
      .get('/v1/agencies/agency-a-id/settings/legal')
      .set('Authorization', `Bearer ${ownerBToken}`);
    assert.equal(crossLegal.status, 403);
  });

  // 7. AUDIT VERIFICATION
  await t.test('7. ConfigurationAudit is written on profile and legal mutations', async () => {
    assert.ok(state.configurationAudits.length >= 2, 'Expected configuration audits to be recorded');
    const profileAudit = state.configurationAudits.find((a) => a.target === 'AGENCY_PROFILE');
    assert.ok(profileAudit);
    assert.equal(profileAudit.agencyId, 'agency-a-id');

    const legalAudit = state.configurationAudits.find((a) => a.target === 'LEGAL_PROFILE');
    assert.ok(legalAudit);
    assert.equal(legalAudit.agencyId, 'agency-a-id');
  });

  await app.close();
});
