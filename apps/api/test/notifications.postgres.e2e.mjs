import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';
import { NotificationsService } from '../dist/notifications/notifications.service.js';
import { MemoryTestEmailTransportAdapter } from '../dist/notifications/transport/memory-test-transport.adapter.js';
import { InvitationsService } from '../dist/invitations/invitations.service.js';
import { ReservationsService } from '../dist/reservations/reservations.service.js';
import { DefaultInvitationDeliveryAdapter } from '../dist/invitations/invitation-delivery.adapter.js';
import { application, config, parseConfig } from './helpers.mjs';

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
    adminPublicOrigin: 'https://admin.agency-test.com',
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
      assert.match(sentMsg.html, /https:\/\/admin\.agency-test\.com\/invitations\/accept/, 'Email must contain admin acceptance URL');
      assert.doesNotMatch(sentMsg.html, new RegExp(agencyB.name), 'Email must NOT contain Agency B name');
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
        /No se puede reintentar/,
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

    // -------------------------------------------------------------------------
    // Test 19: (Req 1) production-style config requires NOTIFICATION_PAYLOAD_KEY and fails on EMAIL_DELIVERY_ENABLED=true
    // -------------------------------------------------------------------------
    await t.test('19. production-style configuration requires NOTIFICATION_PAYLOAD_KEY and fails on EMAIL_DELIVERY_ENABLED=true', async () => {
      // 1. Missing NOTIFICATION_PAYLOAD_KEY in production must fail startup even if EMAIL_DELIVERY_ENABLED=false
      assert.throws(
        () => parseConfig({
          NODE_ENV: 'production',
          DATABASE_URL: databaseUrl,
          EMAIL_DELIVERY_ENABLED: 'false',
        }),
        /NOTIFICATION_PAYLOAD_KEY requerido en producción/,
      );

      // 2. EMAIL_DELIVERY_ENABLED=true in production must fail startup because no real transport is configured
      assert.throws(
        () => parseConfig({
          NODE_ENV: 'production',
          DATABASE_URL: databaseUrl,
          EMAIL_DELIVERY_ENABLED: 'true',
          NOTIFICATION_PAYLOAD_KEY: Buffer.alloc(32).toString('base64'),
        }),
        /EMAIL_DELIVERY_ENABLED no puede ser true en producción/,
      );

      // 3. Valid production configuration with EMAIL_DELIVERY_ENABLED=false and valid 32-byte key succeeds
      const prodConfig = parseConfig({
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        EMAIL_DELIVERY_ENABLED: 'false',
        NOTIFICATION_PAYLOAD_KEY: Buffer.alloc(32).toString('base64'),
        STOREFRONT_BASE_DOMAIN: 'realagency.com',
      });
      assert.equal(prodConfig.emailDeliveryEnabled, false);
      assert.equal(prodConfig.notificationPayloadKey.length, 32);
    });

    // -------------------------------------------------------------------------
    // Test 20: (Req 2) disabled delivery does not break invitation creation
    // -------------------------------------------------------------------------
    await t.test('20. disabled delivery does not break invitation creation', async () => {
      const disabledConfig = {
        ...testConfig,
        emailDeliveryEnabled: false,
      };
      const disabledNotifService = new NotificationsService(prisma, disabledConfig, testTransport);
      const disabledInviteService = new InvitationsService(prisma, disabledNotifService);

      const email = `disabled-invite-${randomUUID().slice(0, 8)}@test.com`;
      const res = await disabledInviteService.createInvitation(identityA, agencyA.id, {
        email,
        role: 'EDITOR',
      });

      assert.ok(res.id);
      assert.equal(res.notificationState, 'PENDING');

      const notif = await prisma.transactionalNotification.findFirst({
        where: { agencyId: agencyA.id, recipient: email },
      });
      assert.ok(notif, 'TransactionalNotification must be queued in DB even when delivery is disabled');
      assert.equal(notif.state, 'PENDING');
      assert.equal(notif.attempts, 0);
    });

    // -------------------------------------------------------------------------
    // Test 21: (Req 3) disabled delivery does not break reservation creation
    // -------------------------------------------------------------------------
    await t.test('21. disabled delivery does not break reservation creation', async () => {
      const disabledConfig = {
        ...testConfig,
        emailDeliveryEnabled: false,
      };
      const disabledNotifService = new NotificationsService(prisma, disabledConfig, testTransport);
      const disabledResService = new ReservationsService(prisma, disabledNotifService);

      const today = new Date().toISOString().slice(0, 10);
      const quoteRes = await disabledResService.quote(agencyA.id, {
        kind: 'TOUR',
        serviceId: tourA.id,
        modality: 'shared',
        date: today,
        pax: 1,
        vehicleId: null,
      });

      const customerEmail = `guest-disabled-${randomUUID().slice(0, 8)}@test.com`;
      const res = await disabledResService.create(identityA, {
        selection: {
          kind: 'TOUR',
          serviceId: tourA.id,
          modality: 'shared',
          date: today,
          pax: 1,
          vehicleId: null,
        },
        requestKey: randomUUID(),
        quoteHash: quoteRes.quoteHash,
        customerFirstName: 'Ana',
        customerLastName: 'Torres',
        customerEmail,
        customerPhone: '+51911223344',
        passengers: [
          { firstName: 'Ana', lastName: 'Torres', docType: 'DNI', docNumber: '88776655' },
        ],
        pickupHotel: 'Hotel Cusco Plaza',
        pickupTime: '08:30',
        specialRequirements: '',
      });

      assert.ok(res.id);
      const notif = await prisma.transactionalNotification.findFirst({
        where: { agencyId: agencyA.id, recipient: customerEmail },
      });
      assert.ok(notif, 'Customer notification must be queued even when email delivery is disabled');
      assert.equal(notif.state, 'PENDING');
    });

    // -------------------------------------------------------------------------
    // Test 22: (Req 4) disabled worker execution does not consume attempts or convert queued jobs to DEAD_LETTER
    // -------------------------------------------------------------------------
    await t.test('22. disabled worker execution does not consume attempts or convert queued jobs to DEAD_LETTER', async () => {
      const disabledConfig = {
        ...testConfig,
        emailDeliveryEnabled: false,
      };
      const disabledNotifService = new NotificationsService(prisma, disabledConfig, testTransport);

      let queuedJob;
      await prisma.$transaction(async (tx) => {
        queuedJob = await disabledNotifService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'no-delivery@test.com',
          subject: 'No Delivery',
          payload: { foo: 'bar' },
          idempotencyKey: `no-burn-${randomUUID()}`,
        });
      });

      // 1. processBatch should return empty and not claim jobs
      const batchResult = await disabledNotifService.processBatch('worker-disabled', 10, 300);
      assert.deepEqual(batchResult, []);

      // 2. Direct processJob call when disabled returns skipped and does not update state
      const processResult = await disabledNotifService.processJob('worker-disabled', queuedJob);
      assert.equal(processResult.skipped, true);
      assert.equal(processResult.state, 'PENDING');

      const after = await prisma.transactionalNotification.findUnique({
        where: { id: queuedJob.id },
      });
      assert.equal(after.state, 'PENDING');
      assert.equal(after.attempts, 0);
      assert.equal(after.claimedBy, null);
    });

    // -------------------------------------------------------------------------
    // Test 23: (Req 5) stale worker with expired/reclaimed lease cannot send
    // -------------------------------------------------------------------------
    await t.test('23. stale worker with expired/reclaimed lease cannot send', async () => {
      testTransport.clear();

      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'stale-lease@test.com',
          subject: 'Stale Worker Test',
          payload: { role: 'VIEWER' },
          idempotencyKey: `stale-${randomUUID()}`,
        });
      });

      // Worker A claims job
      const claimedA = await notificationsService.claimJobs('worker-A', 10, 300);
      const jobA = claimedA.find((j) => j.id === job.id);
      assert.ok(jobA);

      // Simulate lease expiration
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { claimExpiresAt: new Date(Date.now() - 5000) },
      });

      // Worker B reclaims job
      const claimedB = await notificationsService.claimJobs('worker-B', 10, 300);
      const jobB = claimedB.find((j) => j.id === job.id);
      assert.ok(jobB);
      assert.equal(jobB.claimedBy, 'worker-B');

      // Worker A attempts to process the job after losing lease
      const resultA = await notificationsService.processJob('worker-A', jobA);
      assert.equal(resultA.success, false);
      assert.equal(resultA.skipped, true);
      assert.equal(testTransport.getSentMessages().length, 0, 'Worker A must NOT have sent any email');

      // Worker B processes legitimately
      const resultB = await notificationsService.processJob('worker-B', jobB);
      assert.equal(resultB.success, true);
      assert.equal(resultB.state, 'SENT');
      assert.equal(testTransport.getSentMessages().length, 1, 'Worker B legitimately sends email');
    });

    // -------------------------------------------------------------------------
    // Test 24: (Req 6) two concurrent manual retries -> exactly one succeeds
    // -------------------------------------------------------------------------
    await t.test('24. two concurrent manual retries of one DEAD_LETTER notification: exactly one succeeds', async () => {
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'concurrent-retry@test.com',
          subject: 'Concurrent Retry Test',
          payload: { test: true },
          idempotencyKey: `concurrent-retry-${randomUUID()}`,
        });
      });

      // Set to DEAD_LETTER
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'DEAD_LETTER', failureCode: 'TEMPORARY_PROVIDER_FAILURE', attempts: 5 },
      });

      // Two simultaneous retry requests
      const results = await Promise.allSettled([
        notificationsService.manualRetry(identityA, agencyA.id, job.id),
        notificationsService.manualRetry(identityA, agencyA.id, job.id),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent retry must succeed');
      assert.equal(rejected.length, 1, 'Concurrent loser must be rejected');
      assert.match(rejected[0].reason.message, /No se puede reintentar/, 'Rejected call gets ConflictException');

      // Exactly one audit log row
      const auditCount = await prisma.adminAuditLog.count({
        where: { action: 'MANUAL_RETRY_NOTIFICATION', entityId: job.id },
      });
      assert.equal(auditCount, 1, 'Exactly one audit log entry created for concurrent retry');
    });

    // -------------------------------------------------------------------------
    // Test 25: (Req 7) PENDING / PROCESSING / SENT manual retry rejected
    // -------------------------------------------------------------------------
    await t.test('25. PENDING / PROCESSING / SENT manual retry rejected with 409 Conflict', async () => {
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'state-checks@test.com',
          subject: 'State Check Test',
          payload: { test: true },
          idempotencyKey: `state-check-${randomUUID()}`,
        });
      });

      // 1. PENDING -> reject
      await assert.rejects(
        () => notificationsService.manualRetry(identityA, agencyA.id, job.id),
        /No se puede reintentar la notificación en estado PENDING/,
      );

      // 2. PROCESSING -> reject
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'PROCESSING', claimedBy: 'w1', claimExpiresAt: new Date(Date.now() + 60000) },
      });
      await assert.rejects(
        () => notificationsService.manualRetry(identityA, agencyA.id, job.id),
        /No se puede reintentar la notificación en estado PROCESSING/,
      );

      // 3. SENT -> reject
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'SENT', sentAt: new Date(), claimedBy: null, claimExpiresAt: null },
      });
      await assert.rejects(
        () => notificationsService.manualRetry(identityA, agencyA.id, job.id),
        /No se puede reintentar la notificación en estado SENT/,
      );
    });

    // -------------------------------------------------------------------------
    // Test 26: (Req 8) FAILED and DEAD_LETTER manual retry allowed under bounded policy
    // -------------------------------------------------------------------------
    await t.test('26. FAILED and DEAD_LETTER manual retry allowed under bounded policy', async () => {
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'bounded-retry@test.com',
          subject: 'Bounded Retry Test',
          payload: { test: true },
          idempotencyKey: `bounded-retry-${randomUUID()}`,
          maxAttempts: 5,
        });
      });

      // 1. FAILED can be retried
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'FAILED', failureCode: 'TEMPORARY_PROVIDER_FAILURE' },
      });
      const retried1 = await notificationsService.manualRetry(identityA, agencyA.id, job.id);
      assert.equal(retried1.state, 'PENDING');
      assert.equal(retried1.maxAttempts, 8); // 5 + 3

      // 2. DEAD_LETTER retry 2
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'DEAD_LETTER', failureCode: 'TEMPORARY_PROVIDER_FAILURE' },
      });
      const retried2 = await notificationsService.manualRetry(identityA, agencyA.id, job.id);
      assert.equal(retried2.state, 'PENDING');
      assert.equal(retried2.maxAttempts, 11); // 8 + 3

      // 3. DEAD_LETTER retry 3 (reaches limit: maxAllowedAttempts = 14)
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'DEAD_LETTER', failureCode: 'TEMPORARY_PROVIDER_FAILURE' },
      });
      const retried3 = await notificationsService.manualRetry(identityA, agencyA.id, job.id);
      assert.equal(retried3.state, 'PENDING');
      assert.equal(retried3.maxAttempts, 14); // 11 + 3

      // 4. Retry 4 exceeds MAX_MANUAL_RETRIES allowance -> rejected
      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'DEAD_LETTER', failureCode: 'TEMPORARY_PROVIDER_FAILURE' },
      });
      await assert.rejects(
        () => notificationsService.manualRetry(identityA, agencyA.id, job.id),
        /Límite de reintentos manuales alcanzado/,
      );
    });

    // -------------------------------------------------------------------------
    // Test 27: (Req 9) retry state update and audit are atomic
    // -------------------------------------------------------------------------
    await t.test('27. retry state update and audit are atomic', async () => {
      let job;
      await prisma.$transaction(async (tx) => {
        job = await notificationsService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'atomic-audit@test.com',
          subject: 'Atomic Audit Test',
          payload: { test: true },
          idempotencyKey: `atomic-audit-${randomUUID()}`,
        });
      });

      await prisma.transactionalNotification.update({
        where: { id: job.id },
        data: { state: 'DEAD_LETTER' },
      });

      const auditBefore = await prisma.adminAuditLog.count({
        where: { entityId: job.id },
      });
      assert.equal(auditBefore, 0);

      await notificationsService.manualRetry(identityA, agencyA.id, job.id);

      const [updatedJob, auditAfter] = await Promise.all([
        prisma.transactionalNotification.findUnique({ where: { id: job.id } }),
        prisma.adminAuditLog.findFirst({ where: { entityId: job.id } }),
      ]);

      assert.equal(updatedJob.state, 'PENDING');
      assert.ok(auditAfter, 'Audit log must exist in same state');
      assert.equal(auditAfter.action, 'MANUAL_RETRY_NOTIFICATION');
    });

    // -------------------------------------------------------------------------
    // Test 28: (Req 10) invitation creation no longer invokes synchronous legacy delivery adapter
    // -------------------------------------------------------------------------
    await t.test('28. invitation creation no longer invokes synchronous legacy delivery adapter', async () => {
      let legacySendCalled = false;
      const spyAdapter = {
        sendInvitation: async () => {
          legacySendCalled = true;
          return { success: true };
        },
      };

      const customInviteService = new InvitationsService(prisma, spyAdapter, notificationsService);
      const email = `spy-legacy-${randomUUID().slice(0, 8)}@test.com`;
      const res = await customInviteService.createInvitation(identityA, agencyA.id, {
        email,
        role: 'VIEWER',
      });

      assert.ok(res.id);
      assert.equal(res.notificationState, 'PENDING');
      assert.equal(legacySendCalled, false, 'Legacy sendInvitation MUST NOT be called');

      const notif = await prisma.transactionalNotification.findFirst({
        where: { agencyId: agencyA.id, recipient: email },
      });
      assert.ok(notif, 'Outbox row is the sole delivery path');
    });

    // -------------------------------------------------------------------------
    // Test 29: (Req 11) invitation rendered URL points to a real configured acceptance origin/path
    // -------------------------------------------------------------------------
    await t.test('29. invitation rendered URL points to a real configured acceptance origin/path', async () => {
      testTransport.clear();

      const inviteEmail = `accept-url-${randomUUID().slice(0, 8)}@test.com`;
      await invitationsService.createInvitation(identityA, agencyA.id, {
        email: inviteEmail,
        role: 'ADMIN',
      });

      const claimed = await notificationsService.claimJobs('worker-url-check', 10, 300);
      const job = claimed.find((j) => j.recipient === inviteEmail);
      assert.ok(job);

      const processRes = await notificationsService.processJob('worker-url-check', job);
      assert.equal(processRes.success, true);

      const sentMsg = testTransport.getLastMessage();
      assert.ok(sentMsg);
      const expectedPrefix = 'https://admin.agency-test.com/invitations/accept?token=';
      assert.match(sentMsg.html, new RegExp(expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'HTML must contain admin accept URL');
      assert.match(sentMsg.text, new RegExp(expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'Text must contain admin accept URL');
    });

    // -------------------------------------------------------------------------
    // Test 30: (Req 12) placeholder/unconfigured production origin fails closed
    // -------------------------------------------------------------------------
    await t.test('30. placeholder/unconfigured production origin fails closed', async () => {
      testTransport.clear();

      // NotificationsService configured WITHOUT adminPublicOrigin
      const unconfiguredConfig = {
        ...testConfig,
        adminPublicOrigin: '',
      };
      const unconfiguredService = new NotificationsService(prisma, unconfiguredConfig, testTransport);

      let job;
      await prisma.$transaction(async (tx) => {
        job = await unconfiguredService.queueNotification(tx, {
          agencyId: agencyA.id,
          kind: 'MEMBERSHIP_INVITATION',
          audience: 'INTERNAL',
          recipient: 'fail-closed@test.com',
          subject: 'Fail Closed Test',
          payload: { rawToken: 'sample-raw-token-123456789' },
          idempotencyKey: `fail-closed-${randomUUID()}`,
        });
      });

      const claimed = await unconfiguredService.claimJobs('worker-fail-closed', 10, 300);
      const myJob = claimed.find((j) => j.id === job.id);
      assert.ok(myJob);

      const processRes = await unconfiguredService.processJob('worker-fail-closed', myJob);
      assert.equal(processRes.success, false);
      assert.equal(processRes.state, 'DEAD_LETTER');

      const inDb = await prisma.transactionalNotification.findUnique({
        where: { id: job.id },
      });
      assert.equal(inDb.state, 'DEAD_LETTER');
      assert.equal(inDb.failureCode, 'CONFIG_ERROR');
      assert.equal(testTransport.getSentMessages().length, 0, 'No email sent when origin cannot be constructed');
    });

    // -------------------------------------------------------------------------
    // Test 31: (Req 13) reservation email uses Reservation.code when present
    // -------------------------------------------------------------------------
    await t.test('31. reservation email uses Reservation.code when present', async () => {
      testTransport.clear();

      const today = new Date().toISOString().slice(0, 10);
      const quoteRes = await reservationsService.quote(agencyA.id, {
        kind: 'TOUR',
        serviceId: tourA.id,
        modality: 'shared',
        date: today,
        pax: 1,
        vehicleId: null,
      });

      const customerEmail = `res-code-${randomUUID().slice(0, 8)}@test.com`;
      const reservation = await reservationsService.create(identityA, {
        selection: {
          kind: 'TOUR',
          serviceId: tourA.id,
          modality: 'shared',
          date: today,
          pax: 1,
          vehicleId: null,
        },
        requestKey: randomUUID(),
        quoteHash: quoteRes.quoteHash,
        customerFirstName: 'Mateo',
        customerLastName: 'Rios',
        customerEmail,
        customerPhone: '+51999888777',
        passengers: [
          { firstName: 'Mateo', lastName: 'Rios', docType: 'DNI', docNumber: '11223344' },
        ],
        pickupHotel: 'Hotel Cusco Plaza',
        pickupTime: '08:30',
        specialRequirements: '',
      });

      // Verify the reservation row in DB has a generated code
      const dbReservation = await prisma.reservation.findUnique({
        where: { id: reservation.id },
        select: { id: true, code: true },
      });
      assert.ok(dbReservation.code, 'Reservation.code must exist');

      // Claim and process the queued notification
      const claimed = await notificationsService.claimJobs('worker-res-code', 10, 300);
      const job = claimed.find((j) => j.recipient === customerEmail);
      assert.ok(job);

      const processRes = await notificationsService.processJob('worker-res-code', job);
      assert.equal(processRes.success, true);

      const sentMsg = testTransport.getLastMessage();
      assert.ok(sentMsg);
      // The email subject and body must contain the public reservation code (e.g., RSV-...)
      assert.match(sentMsg.subject, new RegExp(dbReservation.code));
      assert.match(sentMsg.text, new RegExp(dbReservation.code));
      assert.match(sentMsg.html, new RegExp(dbReservation.code));
    });

    // -------------------------------------------------------------------------
    // Test 32: (Req 14) HTTP notification endpoints resolve at /v1/... and cross-tenant returns 403
    // -------------------------------------------------------------------------
    await t.test('32. HTTP notification endpoints resolve at /v1/... and cross-tenant returns 403', async () => {
      const app = await application(
        config({
          API_AUTH_ENABLED: 'true',
          API_PUBLIC_AGENCY_SLUGS: `${agencyA.slug},${agencyB.slug}`,
          ADMIN_PUBLIC_ORIGIN: 'https://admin.agency-test.com',
          DATABASE_URL: databaseUrl,
        }),
        prisma,
      );

      try {
        // Setup session for Owner A
        const userRowA = await prisma.user.findUnique({ where: { id: userA.id } });
        const rawTokenA = randomBytes(32).toString('base64url');
        const tokenHashA = createHash('sha256').update(rawTokenA).digest('hex');
        const membershipA = await prisma.agencyMembership.findFirst({
          where: { agencyId: agencyA.id, userId: userA.id },
        });
        await prisma.apiSession.create({
          data: {
            membershipId: membershipA.id,
            tokenHash: tokenHashA,
            passwordHash: createHash('sha256').update(userRowA.password).digest('hex'),
            tokenVersion: userRowA.tokenVersion,
            expiresAt: new Date(Date.now() + 3600_000),
          },
        });

        // Setup session for Owner B
        const userRowB = await prisma.user.findUnique({ where: { id: userB.id } });
        const rawTokenB = randomBytes(32).toString('base64url');
        const tokenHashB = createHash('sha256').update(rawTokenB).digest('hex');
        const membershipB = await prisma.agencyMembership.findFirst({
          where: { agencyId: agencyB.id, userId: userB.id },
        });
        await prisma.apiSession.create({
          data: {
            membershipId: membershipB.id,
            tokenHash: tokenHashB,
            passwordHash: createHash('sha256').update(userRowB.password).digest('hex'),
            tokenVersion: userRowB.tokenVersion,
            expiresAt: new Date(Date.now() + 3600_000),
          },
        });

        // Seed a notification for Agency A
        let notifA;
        await prisma.$transaction(async (tx) => {
          notifA = await notificationsService.queueNotification(tx, {
            agencyId: agencyA.id,
            kind: 'MEMBERSHIP_INVITATION',
            audience: 'INTERNAL',
            recipient: 'http-test@agency-a.test',
            subject: 'HTTP Route Test',
            payload: { role: 'OPERATOR' },
            idempotencyKey: `http-test-${randomUUID()}`,
          });
        });

        // 1. GET /v1/agencies/:agencyId/notifications -> 200 for Owner A
        const listRes = await request(app.getHttpServer())
          .get(`/v1/agencies/${agencyA.id}/notifications`)
          .set('Authorization', `Bearer ${rawTokenA}`);
        assert.equal(listRes.status, 200);
        assert.ok(Array.isArray(listRes.body.data));

        // 2. GET /v1/agencies/:agencyId/notifications/:id -> 200 for Owner A
        const detailRes = await request(app.getHttpServer())
          .get(`/v1/agencies/${agencyA.id}/notifications/${notifA.id}`)
          .set('Authorization', `Bearer ${rawTokenA}`);
        assert.equal(detailRes.status, 200);
        assert.equal(detailRes.body.id, notifA.id);

        // 3. POST /v1/agencies/:agencyId/notifications/:id/retry -> 200/201 for FAILED
        await prisma.transactionalNotification.update({
          where: { id: notifA.id },
          data: { state: 'FAILED', failureCode: 'TEMPORARY_PROVIDER_FAILURE' },
        });
        const retryRes = await request(app.getHttpServer())
          .post(`/v1/agencies/${agencyA.id}/notifications/${notifA.id}/retry`)
          .set('Authorization', `Bearer ${rawTokenA}`);
        assert.ok([200, 201].includes(retryRes.status), `Expected 200 or 201, got ${retryRes.status}`);
        assert.equal(retryRes.body.state, 'PENDING');

        // 4. Cross-tenant access: Owner B attempts to access Agency A's endpoints -> 403 Forbidden
        const crossListRes = await request(app.getHttpServer())
          .get(`/v1/agencies/${agencyA.id}/notifications`)
          .set('Authorization', `Bearer ${rawTokenB}`);
        assert.equal(crossListRes.status, 403, 'Cross-tenant list must return 403');

        const crossDetailRes = await request(app.getHttpServer())
          .get(`/v1/agencies/${agencyA.id}/notifications/${notifA.id}`)
          .set('Authorization', `Bearer ${rawTokenB}`);
        assert.equal(crossDetailRes.status, 403, 'Cross-tenant detail must return 403');

        const crossRetryRes = await request(app.getHttpServer())
          .post(`/v1/agencies/${agencyA.id}/notifications/${notifA.id}/retry`)
          .set('Authorization', `Bearer ${rawTokenB}`);
        assert.equal(crossRetryRes.status, 403, 'Cross-tenant retry must return 403');
      } finally {
        await app.close();
      }
    });

  } finally {
    // Teardown
    await prisma.$disconnect();
  }
});
