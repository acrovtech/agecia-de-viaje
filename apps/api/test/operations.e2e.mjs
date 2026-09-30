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

test('Operations & Service Resource Assignment (P2.6) - Controller & Role Suite', async (t) => {
  const agencyA = {
    id: 'agency-a-id',
    name: 'Agencia A Tours',
    slug: 'agency-a',
    isActive: true,
  };

  const agencyB = {
    id: 'agency-b-id',
    name: 'Agencia B Tours',
    slug: 'agency-b',
    isActive: true,
  };

  const vehicleTypeA = {
    id: 'vt-a-1',
    agencyId: 'agency-a-id',
    name: 'Van 10 Pax',
    code: 'van-10',
    maxPax: 10,
    isActive: true,
  };

  const state = {
    agencies: [agencyA, agencyB],
    vehicleTypes: [vehicleTypeA],
    serviceResources: [],
    fleetVehicles: [],
    reservations: [],
    resourceAssignments: [],
    users: [],
    memberships: [],
    apiSessions: [],
    adminAuditLogs: [],
    reservationEvents: [],
  };

  const mockPrisma = {
    agency: {
      findUnique: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      findFirst: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
    },
    vehicleType: {
      findFirst: async ({ where }) => state.vehicleTypes.find((v) => v.id === where.id && (!where.agencyId || v.agencyId === where.agencyId)) ?? null,
    },
    serviceResource: {
      findMany: async ({ where }) => {
        return state.serviceResources.filter((r) => {
          if (where.agencyId && r.agencyId !== where.agencyId) return false;
          if (where.type && r.type !== where.type) return false;
          if (where.isActive !== undefined && r.isActive !== where.isActive) return false;
          return true;
        });
      },
      findFirst: async ({ where }) => {
        return state.serviceResources.find((r) => {
          if (where.id && r.id !== where.id) return false;
          if (where.agencyId && r.agencyId !== where.agencyId) return false;
          if (where.type && r.type !== where.type) return false;
          return true;
        }) ?? null;
      },
      create: async ({ data }) => {
        const item = { id: `res-${randomUUID().slice(0, 6)}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        state.serviceResources.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        const item = state.serviceResources.find((r) => r.id === where.id);
        if (!item) throw new Error('Not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    },
    fleetVehicle: {
      findMany: async ({ where }) => {
        return state.fleetVehicles
          .filter((v) => {
            if (where.agencyId && v.agencyId !== where.agencyId) return false;
            if (where.isActive !== undefined && v.isActive !== where.isActive) return false;
            return true;
          })
          .map((v) => ({ ...v, vehicleType: vehicleTypeA }));
      },
      findFirst: async ({ where }) => {
        const item = state.fleetVehicles.find((v) => {
          if (where.id && v.id !== where.id) return false;
          if (where.agencyId && v.agencyId !== where.agencyId) return false;
          return true;
        });
        return item ? { ...item, vehicleType: vehicleTypeA } : null;
      },
      create: async ({ data }) => {
        const item = { id: `veh-${randomUUID().slice(0, 6)}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        state.fleetVehicles.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        const item = state.fleetVehicles.find((v) => v.id === where.id);
        if (!item) throw new Error('Not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    },
    reservation: {
      findFirst: async ({ where }) => state.reservations.find((r) => r.id === where.id && (!where.agencyId || r.agencyId === where.agencyId)) ?? null,
      findMany: async ({ where }) => {
        return state.reservations
          .filter((r) => {
            if (where.agencyId && r.agencyId !== where.agencyId) return false;
            return true;
          })
          .map((r) => ({ ...r, resourceAssignments: [] }));
      },
      update: async ({ where, data }) => {
        const item = state.reservations.find((r) => r.id === where.id);
        if (!item) throw new Error('Not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    },
    reservationResourceAssignment: {
      findMany: async () => [],
      findFirst: async () => null,
      deleteMany: async () => ({ count: 0 }),
      upsert: async () => ({ id: 'mock-assign' }),
    },
    reservationEvent: {
      create: async ({ data }) => {
        state.reservationEvents.push(data);
        return { id: `evt-${randomUUID()}`, ...data };
      },
    },
    adminAuditLog: {
      create: async ({ data }) => {
        state.adminAuditLogs.push(data);
        return { id: `aud-${randomUUID()}`, ...data };
      },
    },
    user: {
      findFirst: async ({ where }) => state.users.find((u) => u.id === where.id && (!where.agencyId || u.agencyId === where.agencyId)) ?? null,
    },
    apiSession: {
      findUnique: async ({ where }) => {
        const s = state.apiSessions.find((sess) => sess.tokenHash === where.tokenHash);
        if (!s) return null;
        const m = state.memberships.find((mem) => mem.id === s.membershipId);
        const u = state.users.find((usr) => usr.id === m?.userId);
        const a = state.agencies.find((ag) => ag.id === m?.agencyId);
        return { ...s, membership: { ...m, user: u, agency: a } };
      },
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  const app = await application(
    config({ API_AUTH_ENABLED: 'true', API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b' }),
    mockPrisma
  );

  const ownerToken = createTestSession(state, agencyA.id, 'OWNER');
  const adminToken = createTestSession(state, agencyA.id, 'ADMIN');
  const operatorToken = createTestSession(state, agencyA.id, 'OPERATOR');
  const viewerToken = createTestSession(state, agencyA.id, 'VIEWER');
  const agencyBAdminToken = createTestSession(state, agencyB.id, 'ADMIN');

  try {
    await t.test('1. OWNER and ADMIN can create service resource', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/agencies/agency-a-id/operations/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'GUIDE',
          displayName: 'Juan Perez Guia',
          phone: '+51 984 555 111',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.displayName, 'Juan Perez Guia');
      assert.equal(res.body.type, 'GUIDE');
      assert.equal(res.body.isActive, true);
    });

    await t.test('2. OPERATOR can list resources but cannot create them (returns 403)', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/resources')
        .set('Authorization', `Bearer ${operatorToken}`);
      assert.equal(listRes.status, 200);

      const createRes = await request(app.getHttpServer())
        .post('/v1/agencies/agency-a-id/operations/resources')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          type: 'DRIVER',
          displayName: 'Carlos Conductor',
        });
      assert.equal(createRes.status, 403);
    });

    await t.test('3. VIEWER cannot access operations mutations (returns 403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/agencies/agency-a-id/operations/resources')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          type: 'DRIVER',
          displayName: 'Test',
        });
      assert.equal(res.status, 403);
    });

    await t.test('4. OWNER and ADMIN can create fleet vehicle', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/agencies/agency-a-id/operations/vehicles')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          vehicleTypeId: 'vt-a-1',
          internalLabel: 'Sprinter 01',
          plate: 'X1A-999',
          capacity: 10,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.internalLabel, 'Sprinter 01');
      assert.equal(res.body.plate, 'X1A-999');
    });

    await t.test('5. Cross-tenant path access denied (Agency B user cannot access Agency A operations path)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/resources')
        .set('Authorization', `Bearer ${agencyBAdminToken}`);

      assert.equal(res.status, 403);
    });

    await t.test('6. Dispatch endpoint returns 200 with date and items', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/dispatch?date=2026-10-15')
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.date, '2026-10-15');
      assert.ok(Array.isArray(res.body.data));
    });
  } finally {
    await app.close();
  }
});
