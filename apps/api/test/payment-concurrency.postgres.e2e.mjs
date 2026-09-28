import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, ReservationPaymentStatus, ReservationStatus, BookingStatus } from '@repo/db/prisma';

const testDbUrl = process.env.API_TEST_DATABASE_URL;

if (!testDbUrl) {
  test('PostgreSQL concurrency integration test suite (SKIPPED: API_TEST_DATABASE_URL not configured)', { skip: true }, () => {
    // Explicitly skipped when disposable test database is not provided.
    // NEVER run concurrency tests against production DATABASE_URL.
  });
} else {
  const prisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
  });

  test.before(async () => {
    // Sanity check to avoid running against non-test databases
    if (!testDbUrl.includes('test')) {
      throw new Error('API_TEST_DATABASE_URL must be a disposable test database containing "test" in its connection string.');
    }
    await prisma.$connect();
  });

  test.after(async () => {
    await prisma.$disconnect();
  });

  test('PostgreSQL: Same requestKey race inserts exactly one reservation and winner recovers', async () => {
    const testAgencySlug = `test-race-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: {
        name: 'Test Agency',
        slug: testAgencySlug,
        isActive: true,
      },
    });

    const requestKey = `race-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const baseData = {
      agencyId: agency.id,
      code: `RES-${Date.now().toString(36).toUpperCase()}`,
      requestKey,
      requestHash: 'hash-abc-123',
      customerFirstName: 'Race',
      customerLastName: 'Tester',
      customerEmail: 'racetester@example.test',
      customerPhone: '+51999999999',
      date: new Date('2026-10-01'),
      pax: 2,
      serviceTitle: 'Test Service',
      serviceType: 'shared',
      totalPrice: 100,
      totalMinor: 10000,
      paidMinor: 0,
      unitPriceMinor: 5000,
      status: ReservationStatus.PENDING,
      bookingStatus: BookingStatus.PENDING,
      paymentStatus: ReservationPaymentStatus.PENDING,
    };

    // Dos inserts concurrentes con la misma clave (agencyId, requestKey)
    const results = await Promise.allSettled([
      prisma.reservation.create({ data: { ...baseData, code: `${baseData.code}-A` } }),
      prisma.reservation.create({ data: { ...baseData, code: `${baseData.code}-B` } }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactamente 1 debe ganar y 1 debe fallar con error P2002 de restricción única
    assert.equal(fulfilled.length, 1, 'Exactly one concurrent insert must succeed');
    assert.equal(rejected.length, 1, 'Losing insert must be rejected');
    assert.equal(rejected[0].reason.code, 'P2002', 'Losing insert must fail with P2002 unique constraint violation');

    // Recuperación de la reserva ganadora
    const winning = await prisma.reservation.findFirst({
      where: { agencyId: agency.id, requestKey },
    });
    assert.ok(winning, 'Winning reservation must exist in PostgreSQL');
    assert.equal(winning.id, fulfilled[0].value.id);

    // Cleanup
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  test('PostgreSQL: Same payment IPN race causes exactly one transition, one coupon increment and one outbox event', async () => {
    const testAgencySlug = `test-ipn-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'IPN Agency', slug: testAgencySlug, isActive: true },
    });

    const coupon = await prisma.coupon.create({
      data: {
        agencyId: agency.id,
        code: `IPNRACE-${Date.now().toString(36).toUpperCase()}`,
        discountType: 'FIXED',
        discountValue: 10,
        timesUsed: 0,
        usageLimit: 5,
        isActive: true,
      },
    });

    const reservation = await prisma.reservation.create({
      data: {
        agencyId: agency.id,
        code: `IPNRES-${Date.now().toString(36).toUpperCase()}`,
        couponId: coupon.id,
        customerFirstName: 'IPN',
        customerLastName: 'Racer',
        customerEmail: 'ipnracer@example.test',
        customerPhone: '+51999999998',
        date: new Date('2026-10-01'),
        pax: 1,
        serviceTitle: 'IPN Tour',
        serviceType: 'shared',
        totalPrice: 50,
        totalMinor: 5000,
        paidMinor: 0,
        unitPriceMinor: 5000,
        status: ReservationStatus.PENDING,
        bookingStatus: BookingStatus.PENDING,
        paymentStatus: ReservationPaymentStatus.PENDING,
      },
    });

    const txUuid = `tx-race-${Date.now()}`;

    // Simulación de dos llamadas concurrentes a la transacción de IPN
    const simulateIpnTx = async () => {
      return prisma.$transaction(async (tx) => {
        const updateResult = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            paymentStatus: ReservationPaymentStatus.PENDING,
          },
          data: {
            status: ReservationStatus.PAID,
            bookingStatus: BookingStatus.CONFIRMED,
            paymentStatus: ReservationPaymentStatus.PAID,
            paidMinor: 5000,
            paymentReference: txUuid,
          },
        });

        if (updateResult.count === 0) {
          return { applied: false };
        }

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });

        await tx.paymentNotification.create({
          data: {
            legacyId: reservation.id,
            audience: 'CUSTOMER',
            kind: 'ORDER_CONFIRMED',
            state: 'PENDING',
            snapshot: { reservationCode: reservation.code, txUuid },
          },
        });

        return { applied: true };
      });
    };

    const [tx1, tx2] = await Promise.all([simulateIpnTx(), simulateIpnTx()]);

    const appliedCount = (tx1.applied ? 1 : 0) + (tx2.applied ? 1 : 0);
    assert.equal(appliedCount, 1, 'Only one IPN transaction must apply the transition');

    // Verificar en la base de datos real
    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    assert.equal(updatedCoupon.timesUsed, 1, 'Coupon timesUsed must be incremented exactly once');

    const outboxRecords = await prisma.paymentNotification.findMany({ where: { legacyId: reservation.id } });
    assert.equal(outboxRecords.length, 1, 'Exactly one outbox notification must be created');

    // Cleanup
    await prisma.paymentNotification.deleteMany({ where: { legacyId: reservation.id } });
    await prisma.reservation.delete({ where: { id: reservation.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });

  test('PostgreSQL: Coupon last-use race allows exactly one claim when usageLimit = 1', async () => {
    const testAgencySlug = `test-coupon-agency-${Date.now()}`;
    const agency = await prisma.agency.create({
      data: { name: 'Coupon Agency', slug: testAgencySlug, isActive: true },
    });

    const coupon = await prisma.coupon.create({
      data: {
        agencyId: agency.id,
        code: `LASTUSE-${Date.now().toString(36).toUpperCase()}`,
        discountType: 'FIXED',
        discountValue: 10,
        timesUsed: 0,
        usageLimit: 1, // Sólo 1 uso permitido
        isActive: true,
      },
    });

    const [r1, r2] = await Promise.all([
      prisma.reservation.create({
        data: {
          agencyId: agency.id,
          code: `RES-CUP-1-${Date.now()}`,
          couponId: coupon.id,
          customerFirstName: 'A',
          customerLastName: 'A',
          customerEmail: 'a@example.test',
          customerPhone: '+51999999991',
          date: new Date('2026-10-01'),
          pax: 1,
          serviceTitle: 'Service 1',
          serviceType: 'shared',
          totalPrice: 40,
          totalMinor: 4000,
          paidMinor: 0,
          unitPriceMinor: 4000,
          status: ReservationStatus.PENDING,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: ReservationPaymentStatus.PENDING,
        },
      }),
      prisma.reservation.create({
        data: {
          agencyId: agency.id,
          code: `RES-CUP-2-${Date.now()}`,
          couponId: coupon.id,
          customerFirstName: 'B',
          customerLastName: 'B',
          customerEmail: 'b@example.test',
          customerPhone: '+51999999992',
          date: new Date('2026-10-01'),
          pax: 1,
          serviceTitle: 'Service 2',
          serviceType: 'shared',
          totalPrice: 40,
          totalMinor: 4000,
          paidMinor: 0,
          unitPriceMinor: 4000,
          status: ReservationStatus.PENDING,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: ReservationPaymentStatus.PENDING,
        },
      }),
    ]);

    // Ambas reservas compiten por reclamar el único uso del cupón
    const claimCouponTx = async (res) => {
      return prisma.$transaction(async (tx) => {
        const claim = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            timesUsed: { lt: 1 },
          },
          data: {
            timesUsed: { increment: 1 },
          },
        });

        if (claim.count === 0) {
          // Capacidad agotada: transiciona a REVIEW
          await tx.reservation.update({
            where: { id: res.id },
            data: {
              status: ReservationStatus.PENDING,
              bookingStatus: BookingStatus.PENDING,
              paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
              paidMinor: 4000,
              paymentReference: `tx-${res.id}`,
            },
          });
          return { claimed: false, status: 'PAYMENT_RECEIVED_REVIEW' };
        }

        await tx.reservation.update({
          where: { id: res.id },
          data: {
            status: ReservationStatus.PAID,
            bookingStatus: BookingStatus.CONFIRMED,
            paymentStatus: ReservationPaymentStatus.PAID,
            paidMinor: 4000,
            paymentReference: `tx-${res.id}`,
          },
        });
        return { claimed: true, status: 'PAID' };
      });
    };

    const [res1, res2] = await Promise.all([claimCouponTx(r1), claimCouponTx(r2)]);

    const claims = [res1, res2].filter((r) => r.claimed);
    const reviews = [res1, res2].filter((r) => !r.claimed);

    assert.equal(claims.length, 1, 'Exactly one reservation must win the coupon claim');
    assert.equal(reviews.length, 1, 'Losing reservation must transition to REVIEW');
    assert.equal(reviews[0].status, 'PAYMENT_RECEIVED_REVIEW');

    const finalCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    assert.equal(finalCoupon.timesUsed, 1, 'Coupon timesUsed must not exceed usageLimit (1)');

    // Cleanup
    await prisma.reservation.deleteMany({ where: { agencyId: agency.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.agency.delete({ where: { id: agency.id } });
  });
}
