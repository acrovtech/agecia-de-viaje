import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { application, config } from './helpers.mjs';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';

test('Strict Multi-Tenancy & Tenant-Scoped Constraints (P2.2)', async (t) => {
  // 1. Mandatory test database URL - never silently fall back to DATABASE_URL
  const rawTestDbUrl = process.env.API_TEST_DATABASE_URL;
  if (!rawTestDbUrl || typeof rawTestDbUrl !== 'string' || rawTestDbUrl.trim() === '') {
    throw new Error(
      'API_TEST_DATABASE_URL is mandatory for PostgreSQL multi-tenant tests. Silently falling back to DATABASE_URL is strictly forbidden.'
    );
  }

  // 2. Validate safety against production URL; reject same database + schema; enforce test marker
  const safety = validatePostgresTestTarget(
    rawTestDbUrl.trim(),
    process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  );
  if (!safety.ok) {
    throw new Error(`[SAFETY VIOLATION] Target rejected: ${safety.reason}`);
  }

  const databaseUrl = rawTestDbUrl.trim();
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID().slice(0, 8);

  let agencyA, agencyB, userA, userB, tokenA, tokenB, app, server;

  try {
    // -------------------------------------------------------------------------
    // Setup: Create Agency A and Agency B with isolated users and memberships
    // -------------------------------------------------------------------------
    agencyA = await prisma.agency.create({
      data: { name: `Agency A ${suffix}`, slug: `agency-a-${suffix}`, subdomain: `agency-a-${suffix}`, isActive: true }
    });
    agencyB = await prisma.agency.create({
      data: { name: `Agency B ${suffix}`, slug: `agency-b-${suffix}`, subdomain: `agency-b-${suffix}`, isActive: true }
    });

    const passwordA = `pass-a-${suffix}`;
    const passwordB = `pass-b-${suffix}`;
    userA = await prisma.user.create({
      data: { email: `user-a-${suffix}@example.test`, password: await hash(passwordA, 10), isActive: true }
    });
    userB = await prisma.user.create({
      data: { email: `user-b-${suffix}@example.test`, password: await hash(passwordB, 10), isActive: true }
    });

    const membershipA = await prisma.agencyMembership.create({
      data: { agencyId: agencyA.id, userId: userA.id, role: 'ADMIN', isActive: true }
    });
    const membershipB = await prisma.agencyMembership.create({
      data: { agencyId: agencyB.id, userId: userB.id, role: 'ADMIN', isActive: true }
    });

    // Start NestJS application
    app = await application(config({
      DATABASE_URL: databaseUrl,
      API_AUTH_ENABLED: 'true',
      API_PUBLIC_AGENCY_SLUGS: `${agencyA.slug},${agencyB.slug}`,
    }));
    server = app.getHttpServer();

    // Authenticate User A and User B
    const loginA = await request(server).post('/v1/auth/login').send({
      email: userA.email, password: passwordA, agencySlug: agencyA.slug
    }).expect(200);
    tokenA = loginA.body.accessToken;

    const loginB = await request(server).post('/v1/auth/login').send({
      email: userB.email, password: passwordB, agencySlug: agencyB.slug
    }).expect(200);
    tokenB = loginB.body.accessToken;

    // Helper functions
    const writeA = (method, path, body) => request(server)[method](path).auth(tokenA, { type: 'bearer' }).send(body);
    const writeB = (method, path, body) => request(server)[method](path).auth(tokenB, { type: 'bearer' }).send(body);
    const readA = (path) => request(server).get(path).auth(tokenA, { type: 'bearer' });
    const readB = (path) => request(server).get(path).auth(tokenB, { type: 'bearer' });

    // =========================================================================
    // SECTION 9: CROSS-TENANT CATALOG TESTS (SAME IDENTIFIER ACROSS TENANTS)
    // =========================================================================

    await t.test('9.1 Tours: Agency A and Agency B can both independently create the same slug', async () => {
      const tourSlug = `machu-picchu-${suffix}`;
      const tourData = {
        title: 'Machu Picchu Tour',
        slug: tourSlug,
        description: 'Iconic tour',
        duration: '1 day',
        bannerImage: '/banner.webp',
        cardImage: '/card.webp',
        region: 'Cusco',
        hasSharedService: true,
        sharedPrice: 150.0,
      };

      // Agency A creates machu-picchu
      const resA = await writeA('post', `/v1/agencies/${agencyA.id}/catalog/tours`, tourData).expect(201);
      assert.equal(resA.body.slug, tourSlug);
      const tourAId = resA.body.id;

      // Agency B creates identical slug machu-picchu
      const resB = await writeB('post', `/v1/agencies/${agencyB.id}/catalog/tours`, tourData).expect(201);
      assert.equal(resB.body.slug, tourSlug);
      const tourBId = resB.body.id;

      assert.notEqual(tourAId, tourBId, 'Tours must have distinct primary keys');

      // Duplicate within SAME agency must fail with 409 Conflict (P2002)
      const dupA = await writeA('post', `/v1/agencies/${agencyA.id}/catalog/tours`, tourData).expect(409);
      assert.equal(dupA.body.error.code, 'CONFLICT');
    });

    await t.test('9.2 Transfers: Agency A and Agency B can both independently create the same slug', async () => {
      const transferSlug = `cusco-airport-hotel-${suffix}`;
      const transferData = {
        title: 'Cusco Airport Transfer',
        slug: transferSlug,
        origin: 'Aeropuerto',
        destination: 'Hotel',
        duration: '30 min',
        tripType: 'Solo ida',
        bannerImage: null,
        description: null,
        isActive: true,
        hasSharedService: true,
        sharedPrice: 20.0,
      };

      // Agency A creates transfer
      const resA = await writeA('post', `/v1/agencies/${agencyA.id}/catalog/transfers`, transferData).expect(201);
      assert.equal(resA.body.slug, transferSlug);

      // Agency B creates identical transfer slug
      const resB = await writeB('post', `/v1/agencies/${agencyB.id}/catalog/transfers`, transferData).expect(201);
      assert.equal(resB.body.slug, transferSlug);

      // Duplicate within Agency A must fail with 409 Conflict
      const dupA = await writeA('post', `/v1/agencies/${agencyA.id}/catalog/transfers`, transferData).expect(409);
      assert.equal(dupA.body.error.code, 'CONFLICT');
    });

    await t.test('9.3 Coupons: Agency A and Agency B can both independently create the same code', async () => {
      const couponCode = `SUMMER20-${suffix}`.toUpperCase();

      // Agency A creates SUMMER20
      const couponA = await prisma.coupon.create({
        data: {
          agencyId: agencyA.id,
          code: couponCode,
          name: 'Summer Promo A',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          isActive: true,
        }
      });
      assert.equal(couponA.code, couponCode);
      assert.equal(couponA.agencyId, agencyA.id);

      // Agency B creates identical coupon code SUMMER20
      const couponB = await prisma.coupon.create({
        data: {
          agencyId: agencyB.id,
          code: couponCode,
          name: 'Summer Promo B',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          isActive: true,
        }
      });
      assert.equal(couponB.code, couponCode);
      assert.equal(couponB.agencyId, agencyB.id);

      // Duplicate within SAME agency must fail with unique constraint violation
      await assert.rejects(
        () => prisma.coupon.create({
          data: {
            agencyId: agencyA.id,
            code: couponCode,
            name: 'Duplicate Promo',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            isActive: true,
          }
        }),
        (err) => err.code === 'P2002'
      );
    });

    await t.test('9.4 VehicleTypes: Agency A and Agency B can both independently create the same code', async () => {
      const vehicleCode = `suv-exec-${suffix}`;

      const vehA = await prisma.vehicleType.create({
        data: {
          agencyId: agencyA.id,
          code: vehicleCode,
          name: 'SUV Ejecutiva Agency A',
          maxPax: 4,
          maxLuggage: 4,
          image: '/suv.webp',
          features: ['AC', 'WiFi'],
          isActive: true,
        }
      });
      assert.equal(vehA.code, vehicleCode);
      assert.equal(vehA.agencyId, agencyA.id);

      const vehB = await prisma.vehicleType.create({
        data: {
          agencyId: agencyB.id,
          code: vehicleCode,
          name: 'SUV Ejecutiva Agency B',
          maxPax: 4,
          maxLuggage: 4,
          image: '/suv.webp',
          features: ['AC'],
          isActive: true,
        }
      });
      assert.equal(vehB.code, vehicleCode);
      assert.equal(vehB.agencyId, agencyB.id);

      // Duplicate within SAME agency must fail with P2002
      await assert.rejects(
        () => prisma.vehicleType.create({
          data: {
            agencyId: agencyA.id,
            code: vehicleCode,
            name: 'Duplicate SUV',
            maxPax: 4,
            maxLuggage: 4,
            image: '/suv.webp',
            features: [],
            isActive: true,
          }
        }),
        (err) => err.code === 'P2002'
      );
    });

    // =========================================================================
    // SECTION 10: CROSS-TENANT ACCESS & ISOLATION TESTS
    // =========================================================================

    let tourB, transferB, vehicleB, couponB;

    await t.test('Setup resources belonging strictly to Agency B', async () => {
      tourB = await prisma.tour.create({
        data: {
          agencyId: agencyB.id,
          title: 'Agency B Private Tour',
          slug: `b-tour-${suffix}`,
          description: 'Desc B',
          duration: '2 days',
          bannerImage: '/b.webp',
          cardImage: '/b.webp',
          hasSharedService: true,
          sharedPrice: 100.0,
          isPublished: true,
        }
      });

      transferB = await prisma.transfer.create({
        data: {
          agencyId: agencyB.id,
          title: 'Agency B Transfer',
          slug: `b-transfer-${suffix}`,
          origin: 'Origin B',
          destination: 'Dest B',
          duration: '1h',
          hasSharedService: true,
          sharedPrice: 30.0,
          isPublished: true,
          isActive: true,
        }
      });

      vehicleB = await prisma.vehicleType.create({
        data: {
          agencyId: agencyB.id,
          code: `van-${suffix}`,
          name: 'Agency B Van',
          maxPax: 8,
          maxLuggage: 8,
          image: '/van.webp',
          features: ['AC'],
          isActive: true,
        }
      });

      couponB = await prisma.coupon.create({
        data: {
          agencyId: agencyB.id,
          code: `COUPONB-${suffix}`.toUpperCase(),
          discountType: 'PERCENTAGE',
          discountValue: 10,
          isActive: true,
        }
      });
    });

    await t.test('10.1 Agency A CANNOT read Agency B tour by ID (returns 404)', async () => {
      await readA(`/v1/agencies/${agencyA.id}/catalog/tours/${tourB.id}`).expect(404);
    });

    await t.test('10.2 Agency A CANNOT update Agency B tour (returns 404)', async () => {
      await writeA('put', `/v1/agencies/${agencyA.id}/catalog/tours/${tourB.id}`, {
        title: 'Tampered Tour',
        slug: `tampered-${suffix}`,
        description: 'Hacked',
        duration: '1 day',
        bannerImage: '/img.webp',
        cardImage: '/img.webp',
        region: null,
        hasSharedService: true,
        sharedPrice: 10.0,
        expectedUpdatedAt: tourB.updatedAt.toISOString(),
      }).expect(404);

      // Verify DB was NOT modified
      const freshTourB = await prisma.tour.findUnique({ where: { id: tourB.id } });
      assert.equal(freshTourB.title, 'Agency B Private Tour');
    });

    await t.test('10.3 Agency A CANNOT read Agency B transfer by ID (returns 404)', async () => {
      await readA(`/v1/agencies/${agencyA.id}/catalog/transfers/${transferB.id}`).expect(404);
    });

    await t.test('10.4 Agency A CANNOT update Agency B transfer (returns 404)', async () => {
      await writeA('put', `/v1/agencies/${agencyA.id}/catalog/transfers/${transferB.id}`, {
        title: 'Tampered Transfer',
        slug: `tampered-tr-${suffix}`,
        origin: 'Hacked',
        destination: 'Hacked',
        duration: '1h',
        tripType: 'Solo ida',
        bannerImage: null,
        description: null,
        isActive: true,
        hasSharedService: true,
        sharedPrice: 5.0,
        expectedUpdatedAt: transferB.updatedAt.toISOString(),
      }).expect(404);
    });

    await t.test('10.5 Agency A CANNOT access Agency B path (returns 403 Forbidden)', async () => {
      await readA(`/v1/agencies/${agencyB.id}/catalog/tours`).expect(403);
      await writeA('post', `/v1/agencies/${agencyB.id}/catalog/tours`, {
        title: 'Injected Tour',
        slug: `injected-${suffix}`,
        description: 'Desc',
        duration: '1d',
        bannerImage: '/img.webp',
        cardImage: '/img.webp',
        region: null,
        hasSharedService: true,
        sharedPrice: 10.0,
      }).expect(403);
    });

    // =========================================================================
    // SECTION 11: VEHICLE OWNERSHIP & CROSS-TENANT PRICING REJECTION
    // =========================================================================

    await t.test('11.1 Transfer from Agency A CANNOT link to VehicleType from Agency B in pricing (returns 400)', async () => {
      // Create transfer in Agency A with private service
      const transferA = await prisma.transfer.create({
        data: {
          agencyId: agencyA.id,
          title: 'Agency A Private Transfer',
          slug: `a-priv-tr-${suffix}`,
          origin: 'Cusco',
          destination: 'Ollantaytambo',
          duration: '1h 30m',
          hasPrivateService: true,
          hasSharedService: false,
          isPublished: false,
          isActive: true,
        }
      });

      // Try to assign Agency B vehicle to Agency A transfer
      await writeA('put', `/v1/agencies/${agencyA.id}/catalog/transfers/${transferA.id}/content`, {
        hasPrivateService: true,
        vehiclePrices: [{ vehicleId: vehicleB.id, price: 65.0 }],
        expectedUpdatedAt: transferA.updatedAt.toISOString(),
      }).expect(400);

      // Verify no TransferVehiclePrice was created
      const prices = await prisma.transferVehiclePrice.findMany({
        where: { transferId: transferA.id }
      });
      assert.equal(prices.length, 0, 'Cross-tenant vehicle price must not be persisted');
    });

    await t.test('11.2 Real Foreign Service Checkout: calling Agency A with Agency B tour returns exact 404', async () => {
      // Setup published Tour B strictly owned by Agency B
      assert.equal(tourB.agencyId, agencyB.id);
      assert.equal(tourB.isPublished, true);

      const idempotencyKey = randomUUID();
      const checkoutRes = await request(server)
        .post(`/v1/storefronts/${agencyA.slug}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          customerFirstName: 'Attacker',
          customerLastName: 'User',
          customerEmail: 'attacker@example.test',
          customerPhone: '+51999888777',
          items: [{
            slug: tourB.slug,
            serviceType: 'shared',
            date: '2026-10-15',
            pax: 2,
          }],
        });

      // Must return exact 404 because Agency A must not resolve Agency B's service
      assert.equal(checkoutRes.status, 404, `Expected exact 404, got ${checkoutRes.status}: ${JSON.stringify(checkoutRes.body)}`);
      assert.equal(checkoutRes.body.error?.code, 'NOT_FOUND', 'Expected error code NOT_FOUND');

      // Assert no Agency A reservation is created using Tour B
      const reservationsWithTourB = await prisma.reservation.count({
        where: {
          agencyId: agencyA.id,
          tourId: tourB.id,
        },
      });
      assert.equal(reservationsWithTourB, 0, 'No Agency A reservation must be created using Tour B');

      // Assert no cross-tenant ReservationItem link exists
      const reservationItemsWithTourB = await prisma.reservationItem.count({
        where: {
          tourId: tourB.id,
          reservation: {
            agencyId: agencyA.id,
          },
        },
      });
      assert.equal(reservationItemsWithTourB, 0, 'No cross-tenant ReservationItem link must exist');
    });

    await t.test('11.3 Real Foreign Coupon: calling Agency A checkout with valid Tour A and Agency B coupon returns exact 400', async () => {
      // 1. Create a valid published Agency A tour specifically for this test
      const tourAValid = await prisma.tour.create({
        data: {
          agencyId: agencyA.id,
          title: 'Agency A Valid Tour',
          slug: `tour-a-valid-${suffix}`,
          description: 'Valid published tour owned by Agency A',
          duration: '1 day',
          bannerImage: '/a.webp',
          cardImage: '/a.webp',
          hasSharedService: true,
          sharedPrice: 80.0,
          isPublished: true,
        },
      });

      // 2. Create coupon owned ONLY by Agency B with a unique code
      const uniqueCouponCodeB = `COUPON-ONLY-B-${suffix}`.toUpperCase();
      const couponOnlyB = await prisma.coupon.create({
        data: {
          agencyId: agencyB.id,
          code: uniqueCouponCodeB,
          name: 'Agency B Isolated Coupon',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          isActive: true,
          timesUsed: 0,
        },
      });

      // Confirm no Agency A coupon has the same code
      const couponCountInA = await prisma.coupon.count({
        where: { agencyId: agencyA.id, code: uniqueCouponCodeB },
      });
      assert.equal(couponCountInA, 0, 'Agency A must not have this coupon code');

      const initialTimesUsed = couponOnlyB.timesUsed;
      const idempotencyKey = randomUUID();

      // 3. Call the REAL Agency A checkout with Agency A's own valid tour, Agency B's coupon code, and valid data
      const checkoutRes = await request(server)
        .post(`/v1/storefronts/${agencyA.slug}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          customerFirstName: 'Legit',
          customerLastName: 'Traveler',
          customerEmail: 'traveler@example.test',
          customerPhone: '+51987654321',
          items: [{
            slug: tourAValid.slug,
            serviceType: 'shared',
            date: '2026-10-20',
            pax: 2,
          }],
          couponCode: uniqueCouponCodeB,
        });

      // 4. Must return exact 400 with existing invalid-coupon behavior
      assert.equal(checkoutRes.status, 400, `Expected exact 400, got ${checkoutRes.status}: ${JSON.stringify(checkoutRes.body)}`);
      assert.equal(checkoutRes.body.error?.code, 'INVALID_REQUEST', 'Expected error code INVALID_REQUEST');

      // 5. Verify Agency B coupon timesUsed does not change
      const refreshedCouponB = await prisma.coupon.findUnique({
        where: { id: couponOnlyB.id },
      });
      assert.equal(refreshedCouponB.timesUsed, initialTimesUsed, 'Agency B coupon timesUsed must NOT change');

      // 6. Verify no successful reservation using Agency B coupon is persisted
      const reservationsWithCouponB = await prisma.reservation.count({
        where: {
          couponId: couponOnlyB.id,
        },
      });
      assert.equal(reservationsWithCouponB, 0, 'No reservation must be persisted using Agency B coupon');

      // 7. Verify no reservation in Agency A was created from this failed checkout attempt
      const reservationsInA = await prisma.reservation.count({
        where: {
          agencyId: agencyA.id,
          customerEmail: 'traveler@example.test',
          tourId: tourAValid.id,
        },
      });
      assert.equal(reservationsInA, 0, 'No reservation in Agency A must be persisted when coupon fails');
    });

  } finally {
    if (app) await app.close();
    // Cleanup test agencies
    if (agencyA && agencyB) {
      await prisma.agency.deleteMany({ where: { id: { in: [agencyA.id, agencyB.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    }
    await prisma.$disconnect();
  }
});
