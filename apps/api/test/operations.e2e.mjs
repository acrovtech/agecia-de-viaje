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
        if (!item) return null;
        const vt = state.vehicleTypes.find((t) => t.id === item.vehicleTypeId) ?? vehicleTypeA;
        return { ...item, vehicleType: vt };
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
      findFirst: async ({ where }) => {
        const r = state.reservations.find((res) => res.id === where.id && (!where.agencyId || res.agencyId === where.agencyId));
        if (!r) return null;
        const assigns = state.resourceAssignments
          .filter((a) => a.reservationId === r.id)
          .map((a) => {
            const sr = state.serviceResources.find((s) => s.id === a.serviceResourceId);
            const fv = state.fleetVehicles.find((f) => f.id === a.fleetVehicleId);
            const vt = fv ? (state.vehicleTypes.find((t) => t.id === fv.vehicleTypeId) ?? vehicleTypeA) : null;
            return {
              ...a,
              serviceResource: sr ? { id: sr.id, displayName: sr.displayName, phone: sr.phone, type: sr.type } : null,
              fleetVehicle: fv ? { ...fv, vehicleType: vt } : null,
            };
          });
        return { ...r, resourceAssignments: assigns };
      },
      findMany: async ({ where }) => {
        return state.reservations
          .filter((r) => {
            if (where.agencyId && r.agencyId !== where.agencyId) return false;
            return true;
          })
          .map((r) => {
            const assigns = state.resourceAssignments
              .filter((a) => a.reservationId === r.id)
              .map((a) => {
                const sr = state.serviceResources.find((s) => s.id === a.serviceResourceId);
                const fv = state.fleetVehicles.find((f) => f.id === a.fleetVehicleId);
                const vt = fv ? (state.vehicleTypes.find((t) => t.id === fv.vehicleTypeId) ?? vehicleTypeA) : null;
                return {
                  ...a,
                  serviceResource: sr ? { id: sr.id, displayName: sr.displayName, phone: sr.phone, type: sr.type } : null,
                  fleetVehicle: fv ? { ...fv, vehicleType: vt } : null,
                };
              });
            return { ...r, resourceAssignments: assigns };
          });
      },
      update: async ({ where, data }) => {
        const item = state.reservations.find((r) => r.id === where.id);
        if (!item) throw new Error('Not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    },
    reservationResourceAssignment: {
      findMany: async () => state.resourceAssignments,
      findFirst: async ({ where }) => {
        return state.resourceAssignments.find((a) => {
          if (where.serviceResourceId && a.serviceResourceId !== where.serviceResourceId) return false;
          if (where.fleetVehicleId && a.fleetVehicleId !== where.fleetVehicleId) return false;
          if (where.serviceDate && a.serviceDate?.toISOString?.() !== where.serviceDate?.toISOString?.()) return false;
          if (where.reservationId?.not && a.reservationId === where.reservationId.not) return false;
          return true;
        }) ?? null;
      },
      deleteMany: async ({ where }) => {
        const initial = state.resourceAssignments.length;
        state.resourceAssignments = state.resourceAssignments.filter((a) => {
          if (where.reservationId && a.reservationId === where.reservationId && where.resourceType && a.resourceType === where.resourceType) return false;
          return true;
        });
        return { count: initial - state.resourceAssignments.length };
      },
      upsert: async ({ where, create, update }) => {
        const idx = state.resourceAssignments.findIndex((a) => a.reservationId === where.reservationId_resourceType.reservationId && a.resourceType === where.reservationId_resourceType.resourceType);
        if (idx >= 0) {
          Object.assign(state.resourceAssignments[idx], update);
          return state.resourceAssignments[idx];
        } else {
          const item = { id: `assign-${randomUUID().slice(0, 6)}`, ...create };
          state.resourceAssignments.push(item);
          return item;
        }
      },
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

    await t.test('7. Dispatch: Private TOUR without assignments has all missing flags = false', async () => {
      const tourRes = {
        id: 'res-tour-private-1',
        agencyId: agencyA.id,
        code: 'RES-TP-1',
        serviceTitle: 'Tour Machu Picchu Privado',
        serviceType: 'private',
        tourId: 'tour-123',
        transferId: null,
        vehicleTypeId: null,
        pax: 2,
        operationStatus: 'CONFIRMED',
        pickupHotel: 'Hotel Central',
        pickupTime: '06:00',
        date: new Date('2026-10-16T00:00:00.000Z'),
        updatedAt: new Date(),
      };
      state.reservations.push(tourRes);

      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/dispatch?date=2026-10-16')
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      const item = res.body.data.find((d) => d.reservationId === tourRes.id);
      assert.ok(item, 'Tour reservation must appear in dispatch');
      assert.equal(item.missing.guide, false);
      assert.equal(item.missing.driver, false);
      assert.equal(item.missing.vehicle, false);
      assert.equal(item.missing.any, false);
    });

    await t.test('8. Dispatch: Private TRANSFER without assignments requires driver and vehicle', async () => {
      const transferRes = {
        id: 'res-transfer-private-1',
        agencyId: agencyA.id,
        code: 'RES-TR-1',
        serviceTitle: 'Traslado Aeropuerto Privado',
        serviceType: 'private',
        tourId: null,
        transferId: 'tr-123',
        vehicleTypeId: 'vt-a-1',
        pax: 3,
        operationStatus: 'CONFIRMED',
        pickupHotel: 'Aeropuerto Cusco',
        pickupTime: '10:00',
        date: new Date('2026-10-16T00:00:00.000Z'),
        updatedAt: new Date(),
      };
      state.reservations.push(transferRes);

      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/dispatch?date=2026-10-16')
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      const item = res.body.data.find((d) => d.reservationId === transferRes.id);
      assert.ok(item, 'Transfer reservation must appear in dispatch');
      assert.equal(item.missing.guide, false);
      assert.equal(item.missing.driver, true);
      assert.equal(item.missing.vehicle, true);
      assert.equal(item.missing.any, true);
    });

    await t.test('9. Dispatch: Private TRANSFER with driver + vehicle has missing flags = false', async () => {
      const driver = {
        id: 'driver-dispatch-1',
        agencyId: agencyA.id,
        type: 'DRIVER',
        displayName: 'Pedro Conductor',
        phone: '984000111',
        isActive: true,
      };
      state.serviceResources.push(driver);

      const vehicle = {
        id: 'veh-dispatch-1',
        agencyId: agencyA.id,
        vehicleTypeId: 'vt-a-1',
        internalLabel: 'Van 01',
        plate: 'ABC-123',
        capacity: 10,
        isActive: true,
      };
      state.fleetVehicles.push(vehicle);

      state.resourceAssignments.push(
        {
          reservationId: 'res-transfer-private-1',
          resourceType: 'DRIVER',
          serviceResourceId: driver.id,
          fleetVehicleId: null,
          serviceDate: new Date('2026-10-16T00:00:00.000Z'),
        },
        {
          reservationId: 'res-transfer-private-1',
          resourceType: 'VEHICLE',
          serviceResourceId: null,
          fleetVehicleId: vehicle.id,
          serviceDate: new Date('2026-10-16T00:00:00.000Z'),
        }
      );

      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/dispatch?date=2026-10-16')
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      const item = res.body.data.find((d) => d.reservationId === 'res-transfer-private-1');
      assert.ok(item);
      assert.equal(item.missing.driver, false);
      assert.equal(item.missing.vehicle, false);
      assert.equal(item.missing.any, false);
      assert.equal(item.driver?.displayName, 'Pedro Conductor');
      assert.equal(item.vehicle?.plate, 'ABC-123');
    });

    await t.test('10. Dispatch: TOUR with optional assigned guide displays guide without marking as required-policy', async () => {
      const guide = {
        id: 'guide-dispatch-1',
        agencyId: agencyA.id,
        type: 'GUIDE',
        displayName: 'Elena Guía Oficial',
        phone: '984222333',
        isActive: true,
      };
      state.serviceResources.push(guide);

      state.resourceAssignments.push({
        reservationId: 'res-tour-private-1',
        resourceType: 'GUIDE',
        serviceResourceId: guide.id,
        fleetVehicleId: null,
        serviceDate: new Date('2026-10-16T00:00:00.000Z'),
      });

      const res = await request(app.getHttpServer())
        .get('/v1/agencies/agency-a-id/operations/dispatch?date=2026-10-16')
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      const item = res.body.data.find((d) => d.reservationId === 'res-tour-private-1');
      assert.ok(item);
      assert.equal(item.guide?.displayName, 'Elena Guía Oficial');
      assert.equal(item.missing.guide, false);
      assert.equal(item.missing.any, false);
    });

    await t.test('11. Vehicle capacity hardening: physical capacity cannot expand commercial VehicleType.maxPax', async () => {
      const commercialTier = {
        id: 'vt-sedan-3',
        agencyId: agencyA.id,
        name: 'Sedan Ejecutivo 3 Pax',
        code: 'sedan-3',
        maxPax: 3,
        isActive: true,
      };
      state.vehicleTypes.push(commercialTier);

      // Physical vehicle has physical seating capacity 10, but belongs to commercial tier maxPax = 3
      const physicalUnit = {
        id: 'veh-hiace-expanded',
        agencyId: agencyA.id,
        vehicleTypeId: commercialTier.id,
        internalLabel: 'Hiace 10 Pax en Tarifa Sedan',
        plate: 'EXP-100',
        capacity: 10,
        isActive: true,
      };
      state.fleetVehicles.push(physicalUnit);

      // Reservation 1: booked with commercial tier vt-sedan-3 and pax = 4
      const resPax4 = {
        id: 'res-capacity-pax4',
        agencyId: agencyA.id,
        vehicleTypeId: commercialTier.id,
        pax: 4,
        operationStatus: 'CONFIRMED',
        date: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-01T12:00:00.000Z'),
      };
      state.reservations.push(resPax4);

      // Must be rejected because effective capacity is min(10, 3) = 3 < 4
      const rejectRes = await request(app.getHttpServer())
        .put(`/v1/agencies/agency-a-id/reservations/${resPax4.id}/assignments`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          expectedUpdatedAt: resPax4.updatedAt.toISOString(),
          vehicleId: physicalUnit.id,
        });
      assert.equal(rejectRes.status, 400);
      assert.equal(rejectRes.body.error?.code, 'INVALID_REQUEST');

      // Reservation 2: booked with commercial tier vt-sedan-3 and pax = 3
      const resPax3 = {
        id: 'res-capacity-pax3',
        agencyId: agencyA.id,
        vehicleTypeId: commercialTier.id,
        pax: 3,
        operationStatus: 'CONFIRMED',
        date: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-01T12:00:00.000Z'),
      };
      state.reservations.push(resPax3);

      // Succeeds because effective capacity min(10, 3) = 3 >= 3
      const acceptRes = await request(app.getHttpServer())
        .put(`/v1/agencies/agency-a-id/reservations/${resPax3.id}/assignments`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          expectedUpdatedAt: resPax3.updatedAt.toISOString(),
          vehicleId: physicalUnit.id,
        });
      assert.equal(acceptRes.status, 200);
      assert.equal(acceptRes.body.vehicle?.id, physicalUnit.id);

      // Reservation 3: without authoritative vehicleTypeId (e.g. general tour) with pax = 5
      const resNoVt = {
        id: 'res-capacity-novt-pax5',
        agencyId: agencyA.id,
        vehicleTypeId: null,
        pax: 5,
        operationStatus: 'CONFIRMED',
        date: new Date('2026-10-21T00:00:00.000Z'),
        updatedAt: new Date('2026-10-01T12:00:00.000Z'),
      };
      state.reservations.push(resNoVt);

      // Uses physical capacity (10) normally, so 10 >= 5 succeeds
      const acceptNoVtRes = await request(app.getHttpServer())
        .put(`/v1/agencies/agency-a-id/reservations/${resNoVt.id}/assignments`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          expectedUpdatedAt: resNoVt.updatedAt.toISOString(),
          vehicleId: physicalUnit.id,
        });
      assert.equal(acceptNoVtRes.status, 200);
      assert.equal(acceptNoVtRes.body.vehicle?.id, physicalUnit.id);
    });
  } finally {
    await app.close();
  }
});
