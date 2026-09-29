import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';
import { MembershipsService } from '../dist/memberships/memberships.service.js';
import { InvitationsService } from '../dist/invitations/invitations.service.js';
import { DefaultInvitationDeliveryAdapter } from '../dist/invitations/invitation-delivery.adapter.js';
import { SettingsService } from '../dist/settings/settings.service.js';

test('Agency Self-Service Settings, Memberships & Invitations Real PostgreSQL Gate (P2.4)', async (t) => {
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

  const deliveryAdapter = new DefaultInvitationDeliveryAdapter();
  // PrismaService extends PrismaClient
  const membershipsService = new MembershipsService(prisma);
  const invitationsService = new InvitationsService(prisma, deliveryAdapter);
  const settingsService = new SettingsService(prisma);

  const suffix = randomUUID().slice(0, 8);
  let agencyA, agencyB, userA1, userA2, userB, memA1, memA2, memB;

  try {
    // -------------------------------------------------------------------------
    // 1. Verify migration 20260928040000_agency_invitations is deployed
    // -------------------------------------------------------------------------
    await t.test('1. Verify 20260928040000_agency_invitations is deployed in target database', async () => {
      const migrationRows = await prisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%agency_invitations%'`
      );
      assert.ok(
        migrationRows.length > 0,
        'Expected migration 20260928040000_agency_invitations to be applied in _prisma_migrations'
      );
      assert.ok(
        migrationRows[0].finished_at,
        'Expected migration 20260928040000_agency_invitations to be finished'
      );
    });

    // -------------------------------------------------------------------------
    // Setup: Create test agencies and members
    // -------------------------------------------------------------------------
    agencyA = await prisma.agency.create({
      data: {
        name: `Gate Agency A ${suffix}`,
        slug: `gate-a-${suffix}`,
        subdomain: `gate-a-${suffix}`,
        isActive: true,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: `Gate Agency B ${suffix}`,
        slug: `gate-b-${suffix}`,
        subdomain: `gate-b-${suffix}`,
        isActive: true,
      },
    });

    const passHash = await hash('SecurePass123!', 10);
    userA1 = await prisma.user.create({
      data: { email: `owner1-${suffix}@gate-test.com`, name: 'Owner One', password: passHash, isActive: true },
    });
    userA2 = await prisma.user.create({
      data: { email: `owner2-${suffix}@gate-test.com`, name: 'Owner Two', password: passHash, isActive: true },
    });
    userB = await prisma.user.create({
      data: { email: `ownerb-${suffix}@gate-test.com`, name: 'Owner B', password: passHash, isActive: true },
    });

    memA1 = await prisma.agencyMembership.create({
      data: { agencyId: agencyA.id, userId: userA1.id, role: 'OWNER', isActive: true },
    });
    memA2 = await prisma.agencyMembership.create({
      data: { agencyId: agencyA.id, userId: userA2.id, role: 'OWNER', isActive: true },
    });
    memB = await prisma.agencyMembership.create({
      data: { agencyId: agencyB.id, userId: userB.id, role: 'OWNER', isActive: true },
    });

    const identityA1 = {
      userId: userA1.id,
      email: userA1.email,
      agencyId: agencyA.id,
      membershipId: memA1.id,
      role: 'OWNER',
      agencyName: agencyA.name,
      agencySlug: agencyA.slug,
    };

    const identityA2 = {
      userId: userA2.id,
      email: userA2.email,
      agencyId: agencyA.id,
      membershipId: memA2.id,
      role: 'OWNER',
      agencyName: agencyA.name,
      agencySlug: agencyA.slug,
    };

    const identityB = {
      userId: userB.id,
      email: userB.email,
      agencyId: agencyB.id,
      membershipId: memB.id,
      role: 'OWNER',
      agencyName: agencyB.name,
      agencySlug: agencyB.slug,
    };

    // -------------------------------------------------------------------------
    // 2. CONCURRENCY GATE: Final OWNER Protection under concurrent demotion
    // -------------------------------------------------------------------------
    await t.test('2. Concurrency Gate: race demoting two owners leaves at least one active owner', async () => {
      // Both owner 1 and owner 2 attempt to demote themselves to OPERATOR simultaneously
      const results = await Promise.allSettled([
        membershipsService.update(identityA1, agencyA.id, memA1.id, { role: 'OPERATOR' }),
        membershipsService.update(identityA2, agencyA.id, memA2.id, { role: 'OPERATOR' }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one demotion should succeed');
      assert.equal(rejected.length, 1, 'The competing demotion must be rejected with 409 Conflict');
      assert.match(
        rejected[0].reason.message,
        /único propietario activo/i,
        'Rejection message must indicate final owner protection'
      );

      // Verify directly in PostgreSQL that exactly one active OWNER remains
      const activeOwners = await prisma.agencyMembership.findMany({
        where: {
          agencyId: agencyA.id,
          role: 'OWNER',
          isActive: true,
        },
      });

      assert.equal(activeOwners.length, 1, 'Exactly 1 active OWNER must remain in PostgreSQL');

      // Attempting to demote or deactivate the remaining active owner must fail
      const lastOwner = activeOwners[0];
      const lastIdentity = lastOwner.id === memA1.id ? identityA1 : identityA2;

      await assert.rejects(
        () => membershipsService.update(lastIdentity, agencyA.id, lastOwner.id, { isActive: false }),
        /único propietario activo/i
      );

      await assert.rejects(
        () => membershipsService.delete(lastIdentity, agencyA.id, lastOwner.id),
        /único propietario activo/i
      );
    });

    // -------------------------------------------------------------------------
    // 3. CONCURRENCY GATE: Replay Protection under concurrent acceptance
    // -------------------------------------------------------------------------
    await t.test('3. Concurrency Gate: concurrent acceptance of same invitation token', async () => {
      // Active remaining owner creates an invitation
      const activeOwnerIdentity = (await prisma.agencyMembership.findFirst({
        where: { agencyId: agencyA.id, role: 'OWNER', isActive: true },
      })).id === memA1.id ? identityA1 : identityA2;

      const inviteEmail = `concurrent-accept-${suffix}@example.test`;
      const invRes = await invitationsService.createInvitation(activeOwnerIdentity, agencyA.id, {
        email: inviteEmail,
        role: 'EDITOR',
      });

      const rawToken = invRes._devRawToken;
      assert.ok(rawToken, 'Dev raw token must be returned');

      // Two concurrent acceptance requests racing with the exact same token
      const acceptResults = await Promise.allSettled([
        invitationsService.acceptInvitation(rawToken, { name: 'Concurrent Winner', password: 'Password123!' }),
        invitationsService.acceptInvitation(rawToken, { name: 'Concurrent Loser', password: 'Password123!' }),
      ]);

      const fulfilled = acceptResults.filter((r) => r.status === 'fulfilled');
      const rejected = acceptResults.filter((r) => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent acceptance must succeed');
      assert.equal(rejected.length, 1, 'The competing acceptance must be rejected');

      // In PostgreSQL: exactly 1 User created, 1 Membership created, invitation marked accepted once
      const createdUser = await prisma.user.findUnique({
        where: { email: inviteEmail },
      });
      assert.ok(createdUser, 'User must exist in DB');

      const memberships = await prisma.agencyMembership.findMany({
        where: { agencyId: agencyA.id, userId: createdUser.id },
      });
      assert.equal(memberships.length, 1, 'Exactly 1 membership must exist in DB');

      const invitationRow = await prisma.agencyInvitation.findUnique({
        where: { id: invRes.id },
      });
      assert.ok(invitationRow.acceptedAt, 'Invitation must have acceptedAt timestamp');
    });

    // -------------------------------------------------------------------------
    // 4. CONCURRENCY GATE: Unique constraint on (agencyId, email) for invitations
    // -------------------------------------------------------------------------
    await t.test('4. Concurrency Gate: concurrent invitation creation/reissue for same email', async () => {
      const activeOwnerIdentity = (await prisma.agencyMembership.findFirst({
        where: { agencyId: agencyA.id, role: 'OWNER', isActive: true },
      })).id === memA1.id ? identityA1 : identityA2;

      const duplicateEmail = `race-invite-${suffix}@example.test`;

      // Concurrent invite creation for same (agencyId, email)
      const raceResults = await Promise.allSettled([
        invitationsService.createInvitation(activeOwnerIdentity, agencyA.id, {
          email: duplicateEmail,
          role: 'VIEWER',
        }),
        invitationsService.createInvitation(activeOwnerIdentity, agencyA.id, {
          email: duplicateEmail,
          role: 'OPERATOR',
        }),
      ]);

      // Both should settle safely (upsert handles race or serializes)
      const rows = await prisma.agencyInvitation.findMany({
        where: {
          agencyId: agencyA.id,
          email: duplicateEmail,
        },
      });

      assert.equal(rows.length, 1, 'Exactly 1 row must exist for (agencyId, email) in PostgreSQL');
    });

    // -------------------------------------------------------------------------
    // 5. CROSS-TENANT ISOLATION IN REAL POSTGRESQL
    // -------------------------------------------------------------------------
    await t.test('5. Real PostgreSQL cross-tenant isolation enforcement', async () => {
      // Agency B cannot access Agency A profile
      await assert.rejects(
        () => settingsService.updateProfile(identityB, agencyA.id, { name: 'Hacked' }),
        /No tienes permiso/i
      );

      // Agency B cannot access Agency A legal profile
      await assert.rejects(
        () => settingsService.updateLegalProfile(identityB, agencyA.id, { ruc: '20111111111', legalName: 'Hacked', fiscalAddress: 'Hacked' }),
        /No tienes permiso/i
      );

      // Agency B cannot list Agency A members
      await assert.rejects(
        () => membershipsService.list(identityB, agencyA.id),
        /No tienes acceso/i
      );

      // Agency B cannot invite to Agency A
      await assert.rejects(
        () => invitationsService.createInvitation(identityB, agencyA.id, { email: 'foreign@test.com', role: 'VIEWER' }),
        /No tienes permiso/i
      );
    });

    // -------------------------------------------------------------------------
    // 6. CONCURRENCY GATE: Agency Profile Simultaneous Update with same expectedUpdatedAt
    // -------------------------------------------------------------------------
    await t.test('6. Concurrency Gate: Agency profile simultaneous update with same expectedUpdatedAt', async () => {
      // 1. Read current updatedAt
      const currentAgency = await prisma.agency.findUniqueOrThrow({
        where: { id: agencyA.id },
      });
      const initialTimestamp = currentAgency.updatedAt.toISOString();

      // 2. Issue two concurrent updateProfile() calls using exact same expectedUpdatedAt
      const name1 = `Winner Agency ${suffix}`;
      const name2 = `Loser Agency ${suffix}`;

      const updateResults = await Promise.allSettled([
        settingsService.updateProfile(identityA1, agencyA.id, {
          name: name1,
          expectedUpdatedAt: initialTimestamp,
        }),
        settingsService.updateProfile(identityA2, agencyA.id, {
          name: name2,
          expectedUpdatedAt: initialTimestamp,
        }),
      ]);

      const fulfilled = updateResults.filter((r) => r.status === 'fulfilled');
      const rejected = updateResults.filter((r) => r.status === 'rejected');

      // Exactly one succeeds, exactly one fails with 409 Conflict
      assert.equal(fulfilled.length, 1, 'Exactly one concurrent profile update must succeed');
      assert.equal(rejected.length, 1, 'The competing profile update must be rejected with 409 Conflict');
      assert.equal(rejected[0].reason.status, 409, 'Rejection should be HTTP 409 Conflict');
      assert.match(
        rejected[0].reason.message,
        /modificado por otro usuario/i,
        'Error message must indicate stale update'
      );

      // Final DB value equals the successful winner
      const finalAgency = await prisma.agency.findUniqueOrThrow({
        where: { id: agencyA.id },
      });
      assert.equal(finalAgency.name, fulfilled[0].value.name);
    });

    // -------------------------------------------------------------------------
    // 7. CONCURRENCY GATE: Legal Profile Initial Creation Race (expectedUpdatedAt = null)
    // -------------------------------------------------------------------------
    await t.test('7. Concurrency Gate: Legal profile simultaneous initial create with expectedUpdatedAt = null', async () => {
      // Ensure no LegalProfile exists for agencyA yet
      await prisma.legalProfile.deleteMany({
        where: { agencyId: agencyA.id },
      });

      // Two concurrent requests both expect no profile yet (expectedUpdatedAt: null)
      const ruc1 = '20123456781';
      const ruc2 = '20123456782';

      const createResults = await Promise.allSettled([
        settingsService.updateLegalProfile(identityA1, agencyA.id, {
          ruc: ruc1,
          legalName: `Initial Legal Winner ${suffix}`,
          fiscalAddress: 'Av. Concurrente 100',
          expectedUpdatedAt: null,
        }),
        settingsService.updateLegalProfile(identityA2, agencyA.id, {
          ruc: ruc2,
          legalName: `Initial Legal Loser ${suffix}`,
          fiscalAddress: 'Av. Concurrente 200',
          expectedUpdatedAt: null,
        }),
      ]);

      const fulfilled = createResults.filter((r) => r.status === 'fulfilled');
      const rejected = createResults.filter((r) => r.status === 'rejected');

      // Exactly one creates; the other receives 409 Conflict instead of overwriting
      assert.equal(fulfilled.length, 1, 'Exactly one initial legal profile create must succeed');
      assert.equal(rejected.length, 1, 'The competing initial create must be rejected with 409 Conflict');
      assert.equal(rejected[0].reason.status, 409, 'Rejection should be HTTP 409 Conflict');
      assert.match(
        rejected[0].reason.message,
        /ya fue creado por otro usuario/i,
        'Error message must indicate already created conflict'
      );

      // Exactly 1 LegalProfile exists in DB, matching winner
      const finalLegal = await prisma.legalProfile.findUniqueOrThrow({
        where: { agencyId: agencyA.id },
      });
      assert.equal(finalLegal.data.ruc, fulfilled[0].value.ruc);
    });

    // -------------------------------------------------------------------------
    // 8. CONCURRENCY GATE: Legal Profile Simultaneous Update with same expectedUpdatedAt
    // -------------------------------------------------------------------------
    await t.test('8. Concurrency Gate: Legal profile simultaneous update with same expectedUpdatedAt', async () => {
      // 1. Read existing LegalProfile updatedAt
      const currentLegal = await prisma.legalProfile.findUniqueOrThrow({
        where: { agencyId: agencyA.id },
      });
      const legalTimestamp = currentLegal.updatedAt.toISOString();

      // 2. Issue two concurrent updates with exact same expectedUpdatedAt
      const updateLegalResults = await Promise.allSettled([
        settingsService.updateLegalProfile(identityA1, agencyA.id, {
          ruc: currentLegal.data.ruc,
          legalName: `Legal Update Alpha ${suffix}`,
          fiscalAddress: 'Calle Berlin 100',
          expectedUpdatedAt: legalTimestamp,
        }),
        settingsService.updateLegalProfile(identityA2, agencyA.id, {
          ruc: currentLegal.data.ruc,
          legalName: `Legal Update Beta ${suffix}`,
          fiscalAddress: 'Calle Berlin 200',
          expectedUpdatedAt: legalTimestamp,
        }),
      ]);

      const fulfilled = updateLegalResults.filter((r) => r.status === 'fulfilled');
      const rejected = updateLegalResults.filter((r) => r.status === 'rejected');

      // Exactly one succeeds; the other receives 409 Conflict
      assert.equal(fulfilled.length, 1, 'Exactly one concurrent legal update must succeed');
      assert.equal(rejected.length, 1, 'The competing legal update must be rejected with 409 Conflict');
      assert.equal(rejected[0].reason.status, 409, 'Rejection should be HTTP 409 Conflict');
      assert.match(
        rejected[0].reason.message,
        /modificado por otro usuario/i,
        'Error message must indicate stale update'
      );

      // DB value matches winner
      const freshLegal = await prisma.legalProfile.findUniqueOrThrow({
        where: { agencyId: agencyA.id },
      });
      assert.equal(freshLegal.data.legalName, fulfilled[0].value.legalName);
    });
  } finally {
    // Cleanup created test records
    try {
      if (agencyA?.id) {
        await prisma.adminAuditLog.deleteMany({
          where: { details: { path: ['agencyId'], equals: agencyA.id } },
        });
        await prisma.configurationAudit.deleteMany({
          where: { agencyId: agencyA.id },
        });
        await prisma.agencyInvitation.deleteMany({
          where: { agencyId: agencyA.id },
        });
        await prisma.agencyMembership.deleteMany({
          where: { agencyId: agencyA.id },
        });
        await prisma.legalProfile.deleteMany({
          where: { agencyId: agencyA.id },
        });
        await prisma.agency.delete({ where: { id: agencyA.id } }).catch(() => {});
      }
      if (agencyB?.id) {
        await prisma.adminAuditLog.deleteMany({
          where: { details: { path: ['agencyId'], equals: agencyB.id } },
        });
        await prisma.configurationAudit.deleteMany({
          where: { agencyId: agencyB.id },
        });
        await prisma.agencyInvitation.deleteMany({
          where: { agencyId: agencyB.id },
        });
        await prisma.agencyMembership.deleteMany({
          where: { agencyId: agencyB.id },
        });
        await prisma.legalProfile.deleteMany({
          where: { agencyId: agencyB.id },
        });
        await prisma.agency.delete({ where: { id: agencyB.id } }).catch(() => {});
      }
      if (userA1?.id) await prisma.user.delete({ where: { id: userA1.id } }).catch(() => {});
      if (userA2?.id) await prisma.user.delete({ where: { id: userA2.id } }).catch(() => {});
      if (userB?.id) await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
      await prisma.user.deleteMany({
        where: { email: { contains: suffix } },
      }).catch(() => {});
    } catch {
      // Ignore cleanup error
    }
    await prisma.$disconnect();
  }
});
