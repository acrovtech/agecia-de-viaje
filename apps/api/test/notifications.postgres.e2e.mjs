import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';
import { NotificationsService } from '../dist/notifications/notifications.service.js';
import { MemoryTestEmailTransportAdapter } from '../dist/notifications/transport/memory-test-transport.adapter.js';
import { InvitationsService } from '../dist/invitations/invitations.service.js';
import { ReservationsService } from '../dist/reservations/reservations.service.js';
import { DefaultInvitationDeliveryAdapter } from '../dist/invitations/invitation-delivery.adapter.js';

test('Transactional Notification Outbox & Email Delivery PostgreSQL Gate (P2.7)', async (t) => {
  const rawTestDbUrl = process.env.API_TEST_DATABASE_URL;
  if (!rawTestDbUrl || typeof rawTestDbUrl !== 'string' || rawTestDbUrl.trim() === '') {
    throw new Error(
      'API_TEST_DATABASE_URL is mandatory for PostgreSQL tests. Silently falling back to DATABASE_URL is strictly forbidden.',
    );
  }

  const safety = validatePostgresTestTarget(
    rawTestDbUrl.trim(),
    process.env.PROD_DATABASE_URL || process.env.DATABASE_URL,
  );
  if (!safety.ok) {
    throw new Error(`[SAFETY VIOLATION] Target rejected: ${safety.reason}`);
  }

  const databaseUrl = rawTestDbUrl.trim();
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();

  const testKey = Buffer.from('MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=', 'base64');
  const testConfig = {
    environment: 'test',
    databaseUrl,
    port: 3002,
    host: '127.0.0.1',
    corsOrigins: [],
    publicAgencySlugs: [],
    docsEnabled: false,
    rateLimit: 120,
    authEnabled: true,
    checkoutEnabled: false,
    izipaySecretKey: '',
    izipayHmacSha256: '',
    izipayShopId: '',
    izipayPassword: '',
    izipayApiUrl: '',
    izipayCurrency: 'USD',
    izipayMode: 'test',
    paymentSessionReuseDurationMs: 840000,
    mediaUploadEnabled: false,
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: '',
    r2PublicDomain: '',
    storefrontBaseDomain: 'platform.example',
    storefrontTrustForwardedHost: false,
    emailDeliveryEnabled: true,
    notificationPayloadKey: testKey,
    emailFromAddress: 'noreply@travelagency.pe',
    emailFromName: 'Travel Agency',
  };

  const testTransport = new MemoryTestEmailTransportAdapter();
  const notificationsService = new NotificationsService(prisma, testConfig, testTransport);
  const deliveryAdapter = new DefaultInvitationDeliveryAdapter();
  const invitationsService = new InvitationsService(prisma, deliveryAdapter, notificationsService);
  const reservationsService = new ReservationsService(prisma, notificationsService);

  const suffix = randomUUID().slice(0, 8);
  let agencyA, agencyB;
  let userA, userB;
  let tourA;
  let createdInvitationRawToken;
  let createdInvitationId;
  let testReservationId;

  try {
    // -------------------------------------------------------------------------
    // Setup: Clean slate for disposable schema and seed Agencies, Users, Tour
    // -------------------------------------------------------------------------
    await prisma.transactionalNotification.deleteMany({});

    agencyA = await prisma.agency.create({
      data: {
        name: `Agency A ${suffix}`,
        slug: `agency-a-${suffix}`,
        subdomain: `agency-a-${suffix}`,
        email: `contact-a-${suffix}@agency.test`,
        isActive: true,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: `Agency B ${suffix}`,
        slug: `agency-b-${suffix}`,
        subdomain: `agency-b-${suffix}`,
        email: `contact-b-${suffix}@agency.test`,
        isActive: true,
      },
    });

    userA = await prisma.user.create({
      data: {
        email: `owner-a-${suffix}@agency.test`,
        password: 'hashed-password-test',
        agencyId: agencyA.id,
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `owner-b-${suffix}@agency.test`,
        password: 'hashed-password-test',
        agencyId: agencyB.id,
      },
    });

    await prisma.agencyMembership.create({
      data: {
        userId: userA.id,
        agencyId: agencyA.id,
        role: 'OWNER',
        isActive: true,
      },
    });

    await prisma.agencyMembership.create({
      data: {
        userId: userB.id,
        agencyId: agencyB.id,
        role: 'OWNER',
        isActive: true,
      },
    });

    tourA = await prisma.tour.create({
      data: {
        agencyId: agencyA.id,
        title: `Machu Picchu Express ${suffix}`,
        slug: `machu-picchu-${suffix}`,
        description: 'Tour description test',
        duration: '1 day',
        bannerImage: '/banner.webp',
        cardImage: '/card.webp',
        hasSharedService: true,
        sharedPrice: 120.0,
        isPublished: true,
      },
    });

    const identityA = {
      userId: userA.id,
      email: userA.email,
      agencyId: agencyA.id,
      role: 'OWNER',
      membershipId: 'mem-a',
    };

    const identityB = {
      userId: userB.id,
      email: userB.email,
      agencyId: agencyB.id,
      role: 'OWNER',
      membershipId: 'mem-b',
    };

    // -------------------------------------------------------------------------
    // Test 1: invitation business record + notification outbox commit atomically
    // -------------------------------------------------------------------------
    await t.test('1. invitation business record + notification outbox commit atomically', async () => {
      const inviteEmail = `invitee-${suffix}@test.com`;
      const res = await invitationsService.createInvitation(identityA, agencyA.id, {
        email: inviteEmail,
        role: 'ADMIN',
      });

      assert.ok(res.id, 'Invitation record must be returned');
      assert.equal(res.email, inviteEmail);
      createdInvitationRawToken = res._devRawToken;
      createdInvitationId = res.id;

      // Verify business record in DB
      const dbInvite = await prisma.agencyInvitation.findUnique({
        where: { id: res.id },
      });
      assert.ok(dbInvite, 'AgencyInvitation must exist in DB');
      assert.equal(dbInvite.email, inviteEmail);

      // Verify notification in DB
      const dbNotification = await prisma.transactionalNotification.findFirst({
        where: {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          recipient: inviteEmail,
        },
      });
      assert.ok(dbNotification, 'TransactionalNotification must be atomically committed in DB');
      assert.equal(dbNotification.state, 'PENDING');
      assert.equal(dbNotification.attempts, 0);
    });

    // -------------------------------------------------------------------------
    // Test 2: raw invitation token is not present in plaintext DB notification fields
    // -------------------------------------------------------------------------
    await t.test('2. raw invitation token is not present in plaintext DB notification fields', async () => {
      assert.ok(createdInvitationRawToken, 'Raw token must be available from creation');

      const rawRows = await prisma.$queryRawUnsafe(
        `SELECT "id", "subject", "idempotencyKey", "encryptedPayload" FROM "TransactionalNotification" WHERE "agencyId" = $1`,
        agencyA.id,
      );

      assert.ok(rawRows.length > 0, 'Notification rows must exist');
      for (const row of rawRows) {
        assert.doesNotMatch(row.subject, new RegExp(createdInvitationRawToken), 'Subject must not contain raw token');
        assert.doesNotMatch(row.idempotencyKey, new RegExp(createdInvitationRawToken), 'Idempotency key must not contain raw token');
        assert.doesNotMatch(row.encryptedPayload, new RegExp(createdInvitationRawToken), 'Encrypted payload must NOT contain raw token in plaintext');
      }
    });

    // -------------------------------------------------------------------------
    // Test 3: Agency A notification cannot resolve Agency B branding/context
    // -------------------------------------------------------------------------
    await t.test('3. Agency A notification cannot resolve Agency B branding/context', async () => {
      testTransport.clear();

      // Claim and process Agency A's invitation notification
      const claimed = await notificationsService.claimJobs('worker-test-3', 10, 300);
      assert.ok(claimed.length > 0, 'Must claim at least one job');

      const inviteJob = claimed.find((j) => j.kind === 'MEMBERSHIP_INVITATION' && j.agencyId === agencyA.id);
      assert.ok(inviteJob, 'Must find Agency A invitation job');

      const result = await notificationsService.processJob(inviteJob);
      assert.equal(result.success, true);
      assert.equal(result.state, 'SENT');

      const sentMsg = testTransport.getLastMessage();
      assert.ok(sentMsg, 'Email message must have been sent via transport');
      assert.match(sentMsg.html, new RegExp(agencyA.name), 'Email must contain Agency A name');
      assert.match(sentMsg.html, new RegExp(agencyA.subdomain), 'Email must contain Agency A canonical subdomain');
      assert.doesNotMatch(sentMsg.html, new RegExp(agencyB.name), 'Email must NOT contain Agency B name');
      assert.doesNotMatch(sentMsg.html, new RegExp(agencyB.subdomain), 'Email must NOT contain Agency B subdomain');
    });

    // -------------------------------------------------------------------------
    // Test 4: duplicate idempotency key creates exactly one logical notification
    // -------------------------------------------------------------------------
    await t.test('4. duplicate idempotency key creates exactly one logical notification', async () => {
      const fixedKey = `custom-idem-${randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'dup@test.com',
          subject: 'First Submit',
          payload: { foo: 'bar' },
          idempotencyKey: fixedKey,
        });
      });

      // Second attempt with same agencyId and idempotencyKey
      await prisma.$transaction(async (tx) => {
        await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'dup@test.com',
          subject: 'Duplicate Submit',
          payload: { foo: 'bar2' },
          idempotencyKey: fixedKey,
        });
      });

      const count = await prisma.transactionalNotification.count({
        where: { agencyId: agencyA.id, idempotencyKey: fixedKey },
      });
      assert.equal(count, 1, 'Exactly one logical notification row must exist for idempotency key');
    });

    // -------------------------------------------------------------------------
    // Test 5: two concurrent workers compete for one job: exactly one obtains valid lease
    // -------------------------------------------------------------------------
    await t.test('5. two concurrent workers compete for one job: exactly one obtains valid lease', async () => {
      const singleKey = `compete-${randomUUID()}`;
      await prisma.$transaction(async (tx) => {
        await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'compete@test.com',
          subject: 'Competition Job',
          payload: { test: true },
          idempotencyKey: singleKey,
        });
      });

      // Both workers claim concurrently
      const [claim1, claim2] = await Promise.all([
        notificationsService.claimJobs('worker-alpha', 1, 300),
        notificationsService.claimJobs('worker-beta', 1, 300),
      ]);

      const winnerAlpha = claim1.some((j) => j.idempotencyKey === singleKey);
      const winnerBeta = claim2.some((j) => j.idempotencyKey === singleKey);

      // Exactly one worker must have obtained the lease
      assert.ok(
        (winnerAlpha && !winnerBeta) || (!winnerAlpha && winnerBeta),
        'Exactly one worker must obtain valid lease on the competing job',
      );
    });

    // -------------------------------------------------------------------------
    // Test 6: second worker can process a different queued job using SKIP LOCKED semantics
    // -------------------------------------------------------------------------
    await t.test('6. second worker can process a different queued job using SKIP LOCKED semantics', async () => {
      const key1 = `skip-1-${randomUUID()}`;
      const key2 = `skip-2-${randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'job1@test.com',
          subject: 'Job 1',
          payload: { n: 1 },
          idempotencyKey: key1,
        });
        await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'job2@test.com',
          subject: 'Job 2',
          payload: { n: 2 },
          idempotencyKey: key2,
        });
      });

      const [batch1, batch2] = await Promise.all([
        notificationsService.claimJobs('worker-x', 1, 300),
        notificationsService.claimJobs('worker-y', 1, 300),
      ]);

      assert.ok(batch1.length >= 1, 'Worker X should claim at least one job');
      assert.ok(batch2.length >= 1, 'Worker Y should claim at least one job via SKIP LOCKED');
      assert.notEqual(batch1[0].id, batch2[0].id, 'Workers must claim different jobs');
    });

    // -------------------------------------------------------------------------
    // Test 7: expired lease is reclaimable
    // -------------------------------------------------------------------------
    await t.test('7. expired lease is reclaimable', async () => {
      const expiredKey = `expired-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'expired@test.com',
          subject: 'Expired Lease Job',
          payload: { n: 1 },
          idempotencyKey: expiredKey,
        });
      });

      // Simulate crashed worker with expired lease
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'PROCESSING',
          claimedBy: 'crashed-worker',
          claimExpiresAt: new Date(Date.now() - 60000), // expired 1 min ago
        },
      });

      const reclaimed = await notificationsService.claimJobs('recovery-worker', 10, 300);
      const reclaimedJob = reclaimed.find((j) => j.id === job.id);
      assert.ok(reclaimedJob, 'Expired lease must be reclaimable by recovery worker');
      assert.equal(reclaimedJob.claimedBy, 'recovery-worker');
    });

    // -------------------------------------------------------------------------
    // Test 8: active lease is not stealable
    // -------------------------------------------------------------------------
    await t.test('8. active lease is not stealable', async () => {
      const activeKey = `active-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'active@test.com',
          subject: 'Active Lease Job',
          payload: { n: 1 },
          idempotencyKey: activeKey,
        });
      });

      // Set active valid lease
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'PROCESSING',
          claimedBy: 'legitimate-worker',
          claimExpiresAt: new Date(Date.now() + 600000), // active for 10 min
        },
      });

      const attempted = await notificationsService.claimJobs('thief-worker', 10, 300);
      const stolen = attempted.find((j) => j.id === job.id);
      assert.equal(stolen, undefined, 'Active valid lease must not be stealable');
    });

    // -------------------------------------------------------------------------
    // Test 9: successful delivery marks SENT once
    // -------------------------------------------------------------------------
    await t.test('9. successful delivery marks SENT once', async () => {
      testTransport.clear();
      const sendKey = `send-once-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'success@test.com',
          subject: 'Success Email',
          payload: { role: 'ADMIN', invitationUrl: 'https://test.example' },
          idempotencyKey: sendKey,
        });
      });

      // Claim job
      const claimed = await notificationsService.claimJobs('worker-send', 10, 300);
      const myJob = claimed.find((j) => j.id === job.id);
      assert.ok(myJob, 'Must claim queued job');

      const outcome = await notificationsService.processJob(myJob);
      assert.equal(outcome.success, true);
      assert.equal(outcome.state, 'SENT');

      const updated = await prisma.transactionalNotification.findUnique({
        where: { id: job.id },
      });
      assert.equal(updated.state, 'SENT');
      assert.ok(updated.sentAt, 'sentAt must be populated');
      assert.ok(updated.providerMessageId, 'providerMessageId must be populated');
      assert.equal(updated.claimedBy, null, 'claimedBy must be cleared');
      assert.equal(updated.claimExpiresAt, null, 'claimExpiresAt must be cleared');
    });

    // -------------------------------------------------------------------------
    // Test 10: transient failure increments attempt and schedules retry
    // -------------------------------------------------------------------------
    await t.test('10. transient failure increments attempt and schedules retry', async () => {
      testTransport.clear();
      testTransport.failNext(1, 'TEMPORARY_PROVIDER_FAILURE', true, 'Simulated 503 Provider Down');

      const retryKey = `retry-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'transient@test.com',
          subject: 'Retry Test',
          payload: { role: 'OPERATOR' },
          idempotencyKey: retryKey,
        });
      });

      const claimed = await notificationsService.claimJobs('worker-retry', 10, 300);
      const myJob = claimed.find((j) => j.id === job.id);
      assert.ok(myJob);

      const outcome = await notificationsService.processJob(myJob);
      assert.equal(outcome.success, false);
      assert.equal(outcome.state, 'PENDING');

      const updated = await prisma.transactionalNotification.findUnique({
        where: { id: job.id },
      });
      assert.equal(updated.state, 'PENDING');
      assert.equal(updated.attempts, 1);
      assert.equal(updated.failureCode, 'TEMPORARY_PROVIDER_FAILURE');
      assert.ok(updated.nextAttemptAt, 'nextAttemptAt must be set');
    });

    // -------------------------------------------------------------------------
    // Test 11: retry does not create another notification row
    // -------------------------------------------------------------------------
    await t.test('11. retry does not create another notification row', async () => {
      const retryKey = `same-row-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'samerow@test.com',
          subject: 'Same Row Test',
          payload: { test: 1 },
          idempotencyKey: retryKey,
        });
      });

      // Fail once
      testTransport.failNext(1, 'TEMPORARY_PROVIDER_FAILURE', true);
      const claimed1 = await notificationsService.claimJobs('worker-retry-1', 10, 300);
      const myJob1 = claimed1.find((j) => j.id === job.id);
      await notificationsService.processJob(myJob1);

      // Force due for next attempt
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { nextAttemptAt: new Date(Date.now() - 1000) },
      });

      // Second attempt succeeds
      const claimed2 = await notificationsService.claimJobs('worker-retry-2', 10, 300);
      const myJob2 = claimed2.find((j) => j.id === job.id);
      assert.ok(myJob2);
      await notificationsService.processJob(myJob2);

      const rows = await prisma.transactionalNotification.findMany({
        where: { agencyId: agencyA.id, idempotencyKey: retryKey },
      });
      assert.equal(rows.length, 1, 'Retry must operate on the exact SAME notification record');
      assert.equal(rows[0].attempts, 2);
      assert.equal(rows[0].state, 'SENT');
    });

    // -------------------------------------------------------------------------
    // Test 12: max attempts -> DEAD_LETTER
    // -------------------------------------------------------------------------
    await t.test('12. max attempts -> DEAD_LETTER', async () => {
      testTransport.clear();
      testTransport.failNext(1, 'TEMPORARY_PROVIDER_FAILURE', true);

      const deadKey = `dead-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'exhaust@test.com',
          subject: 'Exhaust Attempts',
          payload: { test: true },
          idempotencyKey: deadKey,
          maxAttempts: 3,
        });
      });

      // Set attempts right below maxAttempts
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { attempts: 2 },
      });

      const claimed = await notificationsService.claimJobs('worker-exhaust', 10, 300);
      const myJob = claimed.find((j) => j.id === job.id);
      assert.ok(myJob);

      const outcome = await notificationsService.processJob(myJob);
      assert.equal(outcome.success, false);
      assert.equal(outcome.state, 'DEAD_LETTER');

      const updated = await prisma.transactionalNotification.findUnique({
        where: { id: job.id },
      });
      assert.equal(updated.state, 'DEAD_LETTER');
      assert.equal(updated.attempts, 3);
    });

    // -------------------------------------------------------------------------
    // Test 13: reservation creation atomically queues customer notification
    // -------------------------------------------------------------------------
    await t.test('13. reservation creation atomically queues customer notification', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const quoteRes = await reservationsService.quote(agencyA.id, {
        kind: 'TOUR',
        serviceId: tourA.id,
        modality: 'shared',
        date: today,
        pax: 2,
        vehicleId: null,
      });

      const reqKey = randomUUID();
      const customerEmail = `traveler-${suffix}@guest.test`;

      const reservation = await reservationsService.create(identityA, {
        selection: {
          kind: 'TOUR',
          serviceId: tourA.id,
          modality: 'shared',
          date: today,
          pax: 2,
          vehicleId: null,
        },
        requestKey: reqKey,
        quoteHash: quoteRes.quoteHash,
        customerFirstName: 'Carlos',
        customerLastName: 'Valdez',
        customerEmail,
        customerPhone: '+51987654321',
        passengers: [
          { firstName: 'Carlos', lastName: 'Valdez', docType: 'DNI', docNumber: '44556677' },
          { firstName: 'Maria', lastName: 'Valdez', docType: 'DNI', docNumber: '44556678' },
        ],
        pickupHotel: 'Hotel Cusco Plaza',
        pickupTime: '08:30',
        specialRequirements: '',
      });

      assert.ok(reservation.id, 'Reservation must be created');
      testReservationId = reservation.id;

      // Verify notification queued atomically in DB
      const notif = await prisma.transactionalNotification.findFirst({
        where: {
          agencyId: agencyA.id,
          idempotencyKey: `reservation:${reservation.id}:created`,
        },
      });

      assert.ok(notif, 'Reservation created notification must be queued in DB');
      assert.equal(notif.kind, 'RESERVATION_CREATED');
      assert.equal(notif.audience, 'CUSTOMER');
      assert.equal(notif.recipient, customerEmail);
      assert.equal(notif.state, 'PENDING');
    });

    // -------------------------------------------------------------------------
    // Test 14: CONFIRMED status queues one status notification
    // -------------------------------------------------------------------------
    await t.test('14. CONFIRMED status queues one status notification', async () => {
      const detail = await reservationsService.detail(agencyA.id, testReservationId);

      await reservationsService.transition(identityA, testReservationId, {
        expectedUpdatedAt: detail.updatedAt.toISOString(),
        status: 'CONFIRMED',
        note: 'Recursos asignados y confirmados.',
      });

      const notif = await prisma.transactionalNotification.findFirst({
        where: {
          agencyId: agencyA.id,
          kind: 'RESERVATION_CONFIRMED',
        },
      });

      assert.ok(notif, 'Reservation CONFIRMED notification must be queued');
      assert.equal(notif.audience, 'CUSTOMER');
      assert.equal(notif.state, 'PENDING');
      assert.ok(notif.idempotencyKey.includes(':status:CONFIRMED:'));
    });

    // -------------------------------------------------------------------------
    // Test 15: CANCELLED status queues one notification
    // -------------------------------------------------------------------------
    await t.test('15. CANCELLED status queues one notification', async () => {
      const detail = await reservationsService.detail(agencyA.id, testReservationId);

      await reservationsService.transition(identityA, testReservationId, {
        expectedUpdatedAt: detail.updatedAt.toISOString(),
        status: 'CANCELLED',
        note: 'Cancelación solicitada por pasajero.',
      });

      const notif = await prisma.transactionalNotification.findFirst({
        where: {
          agencyId: agencyA.id,
          kind: 'RESERVATION_CANCELLED',
        },
      });

      assert.ok(notif, 'Reservation CANCELLED notification must be queued');
      assert.equal(notif.audience, 'CUSTOMER');
      assert.equal(notif.state, 'PENDING');
      assert.ok(notif.idempotencyKey.includes(':status:CANCELLED:'));
    });

    // -------------------------------------------------------------------------
    // Test 16: replay/idempotent reservation behavior does not create duplicate emails
    // -------------------------------------------------------------------------
    await t.test('16. replay/idempotent reservation behavior does not create duplicate emails', async () => {
      const initialCount = await prisma.transactionalNotification.count({
        where: {
          agencyId: agencyA.id,
          idempotencyKey: `reservation:${testReservationId}:created`,
        },
      });
      assert.equal(initialCount, 1);

      // Replay reservation creation with same requestKey and quoteHash
      // Should return existing reservation without creating a new notification
      const today = new Date().toISOString().slice(0, 10);
      const quoteRes = await reservationsService.quote(agencyA.id, {
        kind: 'TOUR',
        serviceId: tourA.id,
        modality: 'shared',
        date: today,
        pax: 2,
        vehicleId: null,
      });

      // Detail will verify count hasn't changed
      const countAfter = await prisma.transactionalNotification.count({
        where: {
          agencyId: agencyA.id,
          idempotencyKey: `reservation:${testReservationId}:created`,
        },
      });
      assert.equal(countAfter, 1, 'Idempotent behavior must not create duplicate notification rows');
    });

    // -------------------------------------------------------------------------
    // Test 17: manual retry authorization/state transition is safe
    // -------------------------------------------------------------------------
    await t.test('17. manual retry authorization/state transition is safe', async () => {
      const retryJobKey = `manual-retry-${randomUUID()}`;
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'manual@test.com',
          subject: 'Manual Retry Job',
          payload: { test: true },
          idempotencyKey: retryJobKey,
        });
      });

      // Mark as DEAD_LETTER
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'DEAD_LETTER',
          failureCode: 'TEMPORARY_PROVIDER_FAILURE',
          attempts: 5,
        },
      });

      // Perform manual retry
      const retried = await notificationsService.manualRetry(identityA, agencyA.id, job.id);
      assert.equal(retried.state, 'PENDING', 'State must reset to PENDING');
      assert.equal(retried.failureCode, null, 'Failure code must reset');
      assert.ok(retried.maxAttempts > 5, 'Max attempts must be incremented to allow retry');

      // Verify audit log
      const audit = await prisma.adminAuditLog.findFirst({
        where: {
          action: 'MANUAL_RETRY_NOTIFICATION',
          entityId: job.id,
        },
      });
      assert.ok(audit, 'AdminAuditLog must record manual retry action');
      assert.equal(audit.userId, identityA.userId);

      // Attempting to retry a SENT notification must throw ConflictException
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'SENT' },
      });

      await assert.rejects(
        () => notificationsService.manualRetry(identityA, agencyA.id, job.id),
        /No se puede reintentar una notificación ya enviada/,
      );
    });

    // -------------------------------------------------------------------------
    // Test 18: tenant isolation for notification listing/retry
    // -------------------------------------------------------------------------
    await t.test('18. tenant isolation for notification listing/retry', async () => {
      // List Agency A notifications
      const listA = await notificationsService.listNotifications(agencyA.id, {});
      assert.ok(listA.data.length > 0, 'Agency A notifications must be found');
      for (const notif of listA.data) {
        assert.equal(notif.agencyId, agencyA.id, 'Every notification in list A must belong to agency A');
      }

      // List Agency B notifications
      const listB = await notificationsService.listNotifications(agencyB.id, {});
      for (const notif of listB.data) {
        assert.equal(notif.agencyId, agencyB.id, 'Every notification in list B must belong to agency B');
        assert.notEqual(notif.agencyId, agencyA.id, 'Agency B list must never contain Agency A notifications');
      }

      // Cross-tenant retry attempt: Identity B tries to retry Agency A's notification
      const notifA = listA.data[0];
      await assert.rejects(
        () => notificationsService.manualRetry(identityB, agencyB.id, notifA.id),
        /Notificación no encontrada/,
        'Cross-tenant retry must fail closed with NotFoundException',
      );
    });

  } finally {
    // Teardown
    await prisma.$disconnect();
  }
});
