import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';
import { OperationsService } from '../dist/operations/operations.service.js';

test('Operations & Service Resource Assignment Real PostgreSQL Gate (P2.6)', async (t) => {
  const rawTestDbUrl = process.env.API_TEST_DATABASE_URL;
  if (!rawTestDbUrl || typeof rawTestDbUrl !== 'string' || rawTestDbUrl.trim() === '') {
    throw new Error(
      'API_TEST_DATABASE_URL is mandatory for PostgreSQL tests. Silently falling back to DATABASE_URL is strictly forbidden.'
    );
  }

  const safety = validatePostgresTestTarget(
    rawTestDbUrl.trim(),
    process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  );
  if (!safety.ok) {
    throw new Error(`[SAFETY VIOLATION] Target rejected: ${safety.reason}`);
  }

  const databaseUrl = rawTestDbUrl.trim();
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();

  const operations = new OperationsService(prisma);

  const suffix = randomUUID().slice(0, 8);
  let agencyA, agencyB;
  let userA, userB;
  let vehicleTypeSedanA, vehicleTypeVanA, vehicleTypeSedanB;
  let guideA, driverA, vehicleA;
  let guideB, driverB, vehicleB;
  let resA1, resA2, resTransferA;

  const testDate = new Date('2026-10-15T00:00:00.000Z');
  const differentDate = new Date('2026-10-16T00:00:00.000Z');

  try {
    // -------------------------------------------------------------------------
    // Setup: Seed Agencies, Users, VehicleTypes, Resources, and Reservations
    // -------------------------------------------------------------------------
    agencyA = await prisma.agency.create({
      data: {
        name: `Ops Agency A ${suffix}`,
        slug: `ops-a-${suffix}`,
        subdomain: `ops-a-${suffix}`,
        isActive: true,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: `Ops Agency B ${suffix}`,
        slug: `ops-b-${suffix}`,
        subdomain: `ops-b-${suffix}`,
        isActive: true,
      },
    });

    userA = await prisma.user.create({
      data: {
        email: `admin-a-${suffix}@ops.test`,
        password: 'hashed-password-test',
        agencyId: agencyA.id,
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `admin-b-${suffix}@ops.test`,
        password: 'hashed-password-test',
        agencyId: agencyB.id,
      },
    });

    const identityA = {
      userId: userA.id,
      agencyId: agencyA.id,
      role: 'ADMIN',
      membershipId: `mem-a-${suffix}`,
      email: userA.email,
    };

    const identityB = {
      userId: userB.id,
      agencyId: agencyB.id,
      role: 'ADMIN',
      membershipId: `mem-b-${suffix}`,
      email: userB.email,
    };

    // Commercial VehicleTypes
    vehicleTypeSedanA = await prisma.vehicleType.create({
      data: {
        agencyId: agencyA.id,
        code: `sedan-${suffix}`,
        name: 'Sedan Ejecutivo',
        maxPax: 3,
        maxLuggage: 2,
        image: 'https://example.com/sedan.jpg',
        features: ['A/C'],
      },
    });

    vehicleTypeVanA = await prisma.vehicleType.create({
      data: {
        agencyId: agencyA.id,
        code: `van-${suffix}`,
        name: 'Minivan Ejecutiva',
        maxPax: 7,
        maxLuggage: 6,
        image: 'https://example.com/van.jpg',
        features: ['A/C', 'WiFi'],
      },
    });

    vehicleTypeSedanB = await prisma.vehicleType.create({
      data: {
        agencyId: agencyB.id,
        code: `sedan-b-${suffix}`,
        name: 'Sedan B',
        maxPax: 3,
        maxLuggage: 2,
        image: 'https://example.com/sedan-b.jpg',
        features: ['A/C'],
      },
    });

    // Service Resources for Agency A
    guideA = await prisma.serviceResource.create({
      data: {
        agencyId: agencyA.id,
        type: 'GUIDE',
        displayName: `Guía A ${suffix}`,
        phone: '+51 984 111 111',
        isActive: true,
      },
    });

    driverA = await prisma.serviceResource.create({
      data: {
        agencyId: agencyA.id,
        type: 'DRIVER',
        displayName: `Conductor A ${suffix}`,
        phone: '+51 984 222 222',
        isActive: true,
      },
    });

    vehicleA = await prisma.fleetVehicle.create({
      data: {
        agencyId: agencyA.id,
        vehicleTypeId: vehicleTypeVanA.id,
        internalLabel: `Van 01 ${suffix}`,
        plate: `X1A-${suffix.slice(0, 3).toUpperCase()}`,
        capacity: 6,
        isActive: true,
      },
    });

    // Service Resources for Agency B (Foreign Tenant)
    guideB = await prisma.serviceResource.create({
      data: {
        agencyId: agencyB.id,
        type: 'GUIDE',
        displayName: `Guía B ${suffix}`,
        phone: '+51 984 333 333',
        isActive: true,
      },
    });

    driverB = await prisma.serviceResource.create({
      data: {
        agencyId: agencyB.id,
        type: 'DRIVER',
        displayName: `Conductor B ${suffix}`,
        phone: '+51 984 444 444',
        isActive: true,
      },
    });

    vehicleB = await prisma.fleetVehicle.create({
      data: {
        agencyId: agencyB.id,
        vehicleTypeId: vehicleTypeSedanB.id,
        internalLabel: `Sedan B 01 ${suffix}`,
        plate: `X2B-${suffix.slice(0, 3).toUpperCase()}`,
        capacity: 3,
        isActive: true,
      },
    });

    // Reservations for Agency A
    resA1 = await prisma.reservation.create({
      data: {
        agencyId: agencyA.id,
        code: `RES-A1-${suffix}`,
        source: 'MANUAL_SAAS',
        operationStatus: 'CONFIRMED',
        serviceTitle: 'Tour Valle Sagrado VIP',
        serviceType: 'shared',
        date: testDate,
        pax: 4,
        totalPrice: 200,
        currency: 'USD',
        customerFirstName: 'Juan',
        customerLastName: 'Perez',
        customerEmail: 'juan@test.com',
        customerPhone: '984000111',
      },
    });

    resA2 = await prisma.reservation.create({
      data: {
        agencyId: agencyA.id,
        code: `RES-A2-${suffix}`,
        source: 'MANUAL_SAAS',
        operationStatus: 'CONFIRMED',
        serviceTitle: 'City Tour Cusco',
        serviceType: 'shared',
        date: testDate,
        pax: 2,
        totalPrice: 100,
        currency: 'USD',
        customerFirstName: 'Maria',
        customerLastName: 'Gomez',
        customerEmail: 'maria@test.com',
        customerPhone: '984000222',
      },
    });

    resTransferA = await prisma.reservation.create({
      data: {
        agencyId: agencyA.id,
        code: `RES-TR-A-${suffix}`,
        source: 'MANUAL_SAAS',
        operationStatus: 'CONFIRMED',
        serviceTitle: 'Traslado Aeropuerto - Hotel',
        serviceType: 'private',
        vehicleTypeId: vehicleTypeVanA.id,
        date: testDate,
        pax: 5,
        totalPrice: 60,
        currency: 'USD',
        customerFirstName: 'Carlos',
        customerLastName: 'Lopez',
        customerEmail: 'carlos@test.com',
        customerPhone: '984000333',
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: Agency A cannot assign Agency B resource
    // -------------------------------------------------------------------------
    await t.test('1. Agency A cannot assign Agency B resource (cross-tenant rejection)', async () => {
      const res = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            guideId: guideB.id, // Foreign guide
          });
        },
        (err) => err.status === 404 || err.message.includes('no pertenece a tu agencia')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 2: Agency A cannot assign Agency B FleetVehicle
    // -------------------------------------------------------------------------
    await t.test('2. Agency A cannot assign Agency B FleetVehicle (cross-tenant rejection)', async () => {
      const res = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            vehicleId: vehicleB.id, // Foreign vehicle
          });
        },
        (err) => err.status === 404 || err.message.includes('no pertenece a tu agencia')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 3: Inactive guide/driver cannot be assigned
    // -------------------------------------------------------------------------
    await t.test('3. Inactive guide/driver cannot be assigned', async () => {
      const inactiveGuide = await prisma.serviceResource.create({
        data: {
          agencyId: agencyA.id,
          type: 'GUIDE',
          displayName: `Inactive Guide ${suffix}`,
          isActive: false,
        },
      });

      const res = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            guideId: inactiveGuide.id,
          });
        },
        (err) => err.status === 400 && err.message.includes('inactivo')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 4: Inactive vehicle cannot be assigned
    // -------------------------------------------------------------------------
    await t.test('4. Inactive vehicle cannot be assigned', async () => {
      const inactiveVehicle = await prisma.fleetVehicle.create({
        data: {
          agencyId: agencyA.id,
          vehicleTypeId: vehicleTypeVanA.id,
          internalLabel: `Inactive Van ${suffix}`,
          plate: `INACT-${suffix.slice(0, 3)}`,
          capacity: 8,
          isActive: false,
        },
      });

      const res = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            vehicleId: inactiveVehicle.id,
          });
        },
        (err) => err.status === 400 && err.message.includes('inactivo')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 5: Vehicle capacity below pax rejected
    // -------------------------------------------------------------------------
    await t.test('5. Vehicle capacity below pax rejected', async () => {
      // resTransferA has pax: 5. Sedan capacity is 3.
      const smallVehicle = await prisma.fleetVehicle.create({
        data: {
          agencyId: agencyA.id,
          vehicleTypeId: vehicleTypeSedanA.id,
          internalLabel: `Small Sedan ${suffix}`,
          plate: `SM-${suffix.slice(0, 4)}`,
          capacity: 3,
          isActive: true,
        },
      });

      const res = await prisma.reservation.findUnique({ where: { id: resA1.id } }); // resA1 has pax: 4
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            vehicleId: smallVehicle.id,
          });
        },
        (err) => err.status === 400 && err.message.includes('Capacidad insuficiente')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 6: Wrong VehicleType rejected for transfer reservation
    // -------------------------------------------------------------------------
    await t.test('6. Wrong VehicleType rejected for transfer reservation', async () => {
      // resTransferA explicitly contracted vehicleTypeId: vehicleTypeVanA.id
      const sedanVehicle = await prisma.fleetVehicle.create({
        data: {
          agencyId: agencyA.id,
          vehicleTypeId: vehicleTypeSedanA.id, // Incompatible with Van contracted
          internalLabel: `Sedan for Transfer ${suffix}`,
          plate: `SED-${suffix.slice(0, 4)}`,
          capacity: 8, // even if capacity were high, type doesn't match
          isActive: true,
        },
      });

      const res = await prisma.reservation.findUnique({ where: { id: resTransferA.id } });
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resTransferA.id, {
            expectedUpdatedAt: res.updatedAt.toISOString(),
            vehicleId: sedanVehicle.id,
          });
        },
        (err) => err.status === 400 && err.message.includes('no coincide con la categoría contratada')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 7: Same guide concurrently assigned to two reservations on same date: exactly one succeeds
    // -------------------------------------------------------------------------
    await t.test('7. Same guide concurrently assigned to two reservations on same date: exactly one succeeds', async () => {
      const res1 = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      const res2 = await prisma.reservation.findUnique({ where: { id: resA2.id } });

      const results = await Promise.allSettled([
        operations.assignResources(identityA, resA1.id, {
          expectedUpdatedAt: res1.updatedAt.toISOString(),
          guideId: guideA.id,
        }),
        operations.assignResources(identityA, resA2.id, {
          expectedUpdatedAt: res2.updatedAt.toISOString(),
          guideId: guideA.id,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent assignment of same guide on same date must succeed');
      assert.equal(rejected.length, 1, 'Competing concurrent assignment must fail');
      assert.equal(rejected[0].reason.status, 409, 'Conflict must return 409');
    });

    // -------------------------------------------------------------------------
    // TEST 8: Same driver race: exactly one succeeds
    // -------------------------------------------------------------------------
    await t.test('8. Same driver race: exactly one succeeds', async () => {
      // Clear previous assignments to clean state
      await prisma.reservationResourceAssignment.deleteMany({
        where: { reservationId: { in: [resA1.id, resA2.id] } },
      });

      const res1 = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      const res2 = await prisma.reservation.findUnique({ where: { id: resA2.id } });

      const results = await Promise.allSettled([
        operations.assignResources(identityA, resA1.id, {
          expectedUpdatedAt: res1.updatedAt.toISOString(),
          driverId: driverA.id,
        }),
        operations.assignResources(identityA, resA2.id, {
          expectedUpdatedAt: res2.updatedAt.toISOString(),
          driverId: driverA.id,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent assignment of same driver on same date must succeed');
      assert.equal(rejected.length, 1, 'Competing driver assignment must fail');
      assert.equal(rejected[0].reason.status, 409, 'Driver conflict must return 409');
    });

    // -------------------------------------------------------------------------
    // TEST 9: Same physical vehicle race: exactly one succeeds
    // -------------------------------------------------------------------------
    await t.test('9. Same physical vehicle race: exactly one succeeds', async () => {
      await prisma.reservationResourceAssignment.deleteMany({
        where: { reservationId: { in: [resA1.id, resA2.id] } },
      });

      const res1 = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      const res2 = await prisma.reservation.findUnique({ where: { id: resA2.id } });

      const results = await Promise.allSettled([
        operations.assignResources(identityA, resA1.id, {
          expectedUpdatedAt: res1.updatedAt.toISOString(),
          vehicleId: vehicleA.id,
        }),
        operations.assignResources(identityA, resA2.id, {
          expectedUpdatedAt: res2.updatedAt.toISOString(),
          vehicleId: vehicleA.id,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent assignment of same vehicle on same date must succeed');
      assert.equal(rejected.length, 1, 'Competing vehicle assignment must fail');
      assert.equal(rejected[0].reason.status, 409, 'Vehicle conflict must return 409');
    });

    // -------------------------------------------------------------------------
    // TEST 10: Resources may be assigned on different service dates
    // -------------------------------------------------------------------------
    await t.test('10. Resources may be assigned on different service dates', async () => {
      // Create reservation on differentDate
      const resDiffDate = await prisma.reservation.create({
        data: {
          agencyId: agencyA.id,
          code: `RES-DIFF-${suffix}`,
          source: 'MANUAL_SAAS',
          operationStatus: 'CONFIRMED',
          serviceTitle: 'Machu Picchu Tour',
          serviceType: 'shared',
          date: differentDate, // Different date!
          pax: 2,
          totalPrice: 400,
          currency: 'USD',
          customerFirstName: 'David',
          customerLastName: 'Ruiz',
          customerEmail: 'david@test.com',
          customerPhone: '984111222',
        },
      });

      // resA1 on testDate already has vehicleA. Now assign vehicleA to resDiffDate:
      const updated = await operations.assignResources(identityA, resDiffDate.id, {
        expectedUpdatedAt: resDiffDate.updatedAt.toISOString(),
        vehicleId: vehicleA.id,
        guideId: guideA.id,
        driverId: driverA.id,
      });

      assert.ok(updated.vehicle, 'Vehicle successfully assigned on different date');
      assert.equal(updated.vehicle.id, vehicleA.id);
      assert.equal(updated.guide.id, guideA.id);
      assert.equal(updated.driver.id, driverA.id);
    });

    // -------------------------------------------------------------------------
    // TEST 11: Stale expectedUpdatedAt: one mutation succeeds, stale returns 409
    // -------------------------------------------------------------------------
    await t.test('11. Stale expectedUpdatedAt: one mutation succeeds, stale competing mutation returns 409', async () => {
      const resBefore = await prisma.reservation.findUnique({ where: { id: resA1.id } });
      const staleTimestamp = resBefore.updatedAt.toISOString();

      // Mutation 1 succeeds and changes updatedAt
      await operations.assignResources(identityA, resA1.id, {
        expectedUpdatedAt: staleTimestamp,
        note: 'Primera modificación válida',
      });

      // Competing mutation with old expectedUpdatedAt must fail with 409
      await assert.rejects(
        async () => {
          await operations.assignResources(identityA, resA1.id, {
            expectedUpdatedAt: staleTimestamp,
            note: 'Modificación con timestamp obsoleto',
          });
        },
        (err) => err.status === 409 && err.message.includes('modificada por otro usuario')
      );
    });

    // -------------------------------------------------------------------------
    // TEST 12: Historical assignment survives resource deactivation
    // -------------------------------------------------------------------------
    await t.test('12. Historical assignment survives resource deactivation', async () => {
      // Verify resA1 has assignments
      const beforeDeactivation = await operations.getAssignments(agencyA.id, resA1.id);

      // Deactivate guideA and vehicleA
      await prisma.serviceResource.update({
        where: { id: guideA.id },
        data: { isActive: false },
      });
      await prisma.fleetVehicle.update({
        where: { id: vehicleA.id },
        data: { isActive: false },
      });

      // Historical assignment must still exist and be readable
      const afterDeactivation = await operations.getAssignments(agencyA.id, resA1.id);
      assert.deepEqual(afterDeactivation.vehicle?.id, beforeDeactivation.vehicle?.id, 'Vehicle remains attached in history');
      assert.deepEqual(afterDeactivation.driver?.id, beforeDeactivation.driver?.id, 'Driver remains attached in history');
    });

    // -------------------------------------------------------------------------
    // TEST 13: Operational timeline and audit logs verified
    // -------------------------------------------------------------------------
    await t.test('13. Operational timeline events and audit logs are recorded on assignments', async () => {
      const events = await prisma.reservationEvent.findMany({
        where: { reservationId: resA1.id },
        orderBy: { createdAt: 'desc' },
      });
      assert.ok(events.length > 0, 'ReservationEvent timeline must have records');
      const hasOpsEvent = events.some((e) => e.note.includes('Recursos operativos'));
      assert.ok(hasOpsEvent, 'Event note must describe resource assignment');

      const audit = await prisma.adminAuditLog.findFirst({
        where: { entityId: resA1.id, action: 'RESERVATION_RESOURCE_ASSIGNMENT' },
      });
      assert.ok(audit, 'AdminAuditLog must exist for resource assignment');
    });
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Tear down test records in reverse dependency order
    // -------------------------------------------------------------------------
    try {
      if (agencyA && agencyB) {
        await prisma.reservationResourceAssignment.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.reservationEvent.deleteMany({
          where: { reservation: { agencyId: { in: [agencyA.id, agencyB.id] } } },
        });
        await prisma.reservation.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.fleetVehicle.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.serviceResource.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.vehicleType.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.adminAuditLog.deleteMany({
          where: { userId: { in: [userA?.id, userB?.id].filter(Boolean) } },
        });
        await prisma.user.deleteMany({
          where: { agencyId: { in: [agencyA.id, agencyB.id] } },
        });
        await prisma.agency.deleteMany({
          where: { id: { in: [agencyA.id, agencyB.id] } },
        });
      }
    } catch {
      // ignore teardown errors
    }
    await prisma.$disconnect();
  }
});
