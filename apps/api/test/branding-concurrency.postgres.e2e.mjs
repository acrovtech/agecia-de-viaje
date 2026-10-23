import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import { PrismaClient } from '@repo/db/prisma';
import { createApplication } from '../dist/application.js';
import { parseConfig } from '../dist/config.js';
import { SettingsService } from '../dist/settings/settings.service.js';
import {
  validatePostgresIntegrationGuard,
  isAllowedDatabaseName,
} from '../scripts/postgres-gate-safety.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');

const guard = validatePostgresIntegrationGuard();

if (!guard.ok) {
  if (guard.skipped) {
    test(`REAL POSTGRESQL CONCURRENCY GATE (SKIPPED: ${guard.reason})`, { skip: true }, () => {});
  } else {
    test('REAL POSTGRESQL CONCURRENCY GATE (SAFETY REJECTION)', () => {
      assert.fail(`SAFETY_GUARD_REJECTION: ${guard.reason}`);
    });
  }
} else {
  test('REAL POSTGRESQL CONCURRENCY & TRANSACTIONAL HARDENING GATE', async (t) => {
    const testDbUrl = new URL(guard.testDatabaseUrl);
    // Provide adequate connection pool capacity for 20 concurrent requests
    testDbUrl.searchParams.set('connection_limit', '30');
    testDbUrl.searchParams.set('pool_timeout', '30');
    const effectiveTestUrl = testDbUrl.toString();

    const prisma = new PrismaClient({
      datasources: { db: { url: effectiveTestUrl } },
    });
    await prisma.$connect();

    // 1. Production Rejection: Verify current_database() at SQL level
    const [dbRow] = await prisma.$queryRaw`SELECT current_database();`;
    const activeDb = dbRow?.current_database;
    if (!activeDb || !isAllowedDatabaseName(activeDb)) {
      await prisma.$disconnect();
      assert.fail(
        `UNSAFE_DATABASE_TARGET: Server reports current_database() is "${activeDb}", which is not an authorized test database! Refusing execution.`
      );
    }

    // 2. Generate unique testRunId for isolated namespace
    const testRunId = randomBytes(6).toString('hex');

    // 3. Platform Settings Isolation: Snapshot before test execution
    const originalPlatformSettings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });

    // Configure global platform settings for branding reward
    await prisma.platformSettings.upsert({
      where: { id: 'global' },
      update: {
        coBrandingEnabled: true,
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      },
      create: {
        id: 'global',
        productName: 'Acrov SaaS',
        coBrandingEnabled: true,
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      },
    });

    const config = parseConfig({
      ...process.env,
      DATABASE_URL: effectiveTestUrl,
      API_AUTH_ENABLED: 'true',
    });
    const app = await createApplication(config);
    await app.init();
    const server = app.getHttpServer();

    // Track created resources by authoritative ID for clean teardown
    const createdAgencyIds = [];
    const createdUserIds = [];
    const createdMembershipIds = [];

    async function createTestTenant(prefix) {
      const suffix = randomBytes(4).toString('hex');
      const slug = `pg-conc-${testRunId}-${prefix}-${suffix}`;
      const agency = await prisma.agency.create({
        data: {
          slug,
          subdomain: slug,
          name: `PG Concurrency ${testRunId} Agency`,
          isActive: true,
        },
      });
      createdAgencyIds.push(agency.id);

      const email = `admin-${testRunId}-${prefix}-${suffix}@test.local`;
      const user = await prisma.user.create({
        data: {
          email,
          password: '$2a$10$dummyHashToSatisfySchemaConstraintOnlyNotUsedDirectly',
          name: `Concurrency User ${testRunId}`,
          isActive: true,
        },
      });
      createdUserIds.push(user.id);

      const membership = await prisma.agencyMembership.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          role: 'OWNER',
          isActive: true,
        },
      });
      createdMembershipIds.push(membership.id);

      const rawToken = randomBytes(32).toString('base64url');
      await prisma.apiSession.create({
        data: {
          membershipId: membership.id,
          tokenHash: digest(rawToken),
          tokenVersion: 1,
          passwordHash: digest(user.password),
          expiresAt: new Date(Date.now() + 3600_000),
        },
      });

      return {
        agency,
        user,
        membership,
        token: rawToken,
        identity: {
          userId: user.id,
          email: user.email,
          agencyId: agency.id,
          membershipId: membership.id,
          role: 'OWNER',
          agencyName: agency.name,
          agencySlug: agency.slug,
          sessionId: 'dummy-session-id',
        },
      };
    }

    try {
      // -------------------------------------------------------------------------
      // TEST A: 20 CONCURRENT REWARD CLAIMS
      // -------------------------------------------------------------------------
      await t.test(
        'A. 20 concurrent reward claims serialize into exactly 1 success and 19 controlled 409 conflicts',
        async () => {
          const tenant = await createTestTenant('claims-20');
          const concurrency = 20;

          // Launch 20 simultaneous HTTP POST requests against real PostgreSQL
          const promises = Array.from({ length: concurrency }, () =>
            request(server)
              .post(`/v1/agencies/${tenant.agency.id}/settings/branding/reward`)
              .set('Authorization', `Bearer ${tenant.token}`)
              .send({})
          );

          const responses = await Promise.all(promises);

          const successCount = responses.filter((r) => r.status === 200 || r.status === 201).length;
          const conflictCount = responses.filter((r) => r.status === 409).length;
          const otherCount = responses.filter(
            (r) => r.status !== 200 && r.status !== 201 && r.status !== 409
          ).length;

          if (otherCount > 0) {
            console.error(
              'Unexpected responses in Test A:',
              responses
                .filter((r) => r.status !== 200 && r.status !== 201 && r.status !== 409)
                .map((r) => ({ status: r.status, body: r.body }))
            );
          }

          assert.strictEqual(successCount, 1, `Expected exactly 1 claim to succeed, got ${successCount}`);
          assert.strictEqual(
            conflictCount,
            19,
            `Expected exactly 19 claims to be rejected with 409 Conflict, got ${conflictCount}`
          );
          assert.strictEqual(otherCount, 0, `Expected 0 unhandled errors, got ${otherCount}`);

          // Verify authoritative database state
          const claims = await prisma.brandingRewardClaim.findMany({
            where: { agencyId: tenant.agency.id },
          });
          assert.strictEqual(
            claims.length,
            1,
            'Authoritative database must contain exactly 1 BrandingRewardClaim record'
          );

          const ledgers = await prisma.aiCreditLedger.findMany({
            where: { agencyId: tenant.agency.id },
          });
          assert.strictEqual(
            ledgers.length,
            1,
            'Authoritative database must contain exactly 1 AiCreditLedger record'
          );
          assert.strictEqual(ledgers[0].delta, 10, 'Ledger delta must match rewardCredits (10)');
          assert.strictEqual(ledgers[0].reason, 'BRANDING_REWARD');

          const account = await prisma.aiCreditAccount.findUnique({
            where: { agencyId: tenant.agency.id },
          });
          assert.ok(account, 'AiCreditAccount must exist');
          assert.strictEqual(account.balance, 10, 'AiCreditAccount balance must be incremented by exactly 10');

          const pref = await prisma.agencyBrandingPreference.findUnique({
            where: { agencyId: tenant.agency.id },
          });
          assert.ok(pref, 'AgencyBrandingPreference must exist');
          assert.strictEqual(pref.platformBrandingEnabled, true, 'Co-branding must be enabled');
          assert.ok(pref.rewardLockedUntil, 'rewardLockedUntil must be populated');
          assert.ok(
            new Date(pref.rewardLockedUntil) > new Date(),
            'rewardLockedUntil must be in the future (next calendar month boundary)'
          );
        }
      );

      // -------------------------------------------------------------------------
      // TEST B: CLAIM VS TENANT DISABLE CONCURRENCY
      // -------------------------------------------------------------------------
      await t.test(
        'B. Concurrent claim vs tenant disable serializes safely without invalid intermediate state',
        async () => {
          const tenant = await createTestTenant('claim-vs-disable');

          // Pre-set branding enabled without lock
          await prisma.agencyBrandingPreference.create({
            data: {
              agencyId: tenant.agency.id,
              platformBrandingEnabled: true,
              rewardLockedUntil: null,
            },
          });

          // Concurrently race: claim reward vs disable co-branding
          const [claimRes, disableRes] = await Promise.all([
            request(server)
              .post(`/v1/agencies/${tenant.agency.id}/settings/branding/reward`)
              .set('Authorization', `Bearer ${tenant.token}`)
              .send({}),
            request(server)
              .put(`/v1/agencies/${tenant.agency.id}/settings/branding`)
              .set('Authorization', `Bearer ${tenant.token}`)
              .send({ platformBrandingEnabled: false }),
          ]);

          const prefAfter = await prisma.agencyBrandingPreference.findUnique({
            where: { agencyId: tenant.agency.id },
          });
          const claimsAfter = await prisma.brandingRewardClaim.findMany({
            where: { agencyId: tenant.agency.id },
          });

          // Invariant: Final state must correspond to a valid serialized order.
          // Forbidden: reward minted AND branding disabled while reward lock is active.
          assert.ok(
            !(claimsAfter.length > 0 && prefAfter?.platformBrandingEnabled === false),
            'FORBIDDEN: Reward must not be minted while branding is disabled'
          );

          // Verify serialized outcomes:
          if (claimRes.status === 200 || claimRes.status === 201) {
            assert.strictEqual(claimsAfter.length, 1, 'Exactly 1 claim minted');
            assert.strictEqual(prefAfter.platformBrandingEnabled, true, 'Branding must be true when reward is claimed');
            assert.ok(new Date(prefAfter.rewardLockedUntil) > new Date(), 'Reward lock must be active');
          } else {
            assert.strictEqual(claimRes.status, 409, 'Claim must have been rejected with 409');
            assert.strictEqual(claimsAfter.length, 0, 'No claim minted');
          }
        }
      );

      // -------------------------------------------------------------------------
      // TEST C: FORCED LOCK FAILURE (FAIL CLOSED PROOF)
      // -------------------------------------------------------------------------
      await t.test('C. Forced lock failure fails closed and aborts without mutating state', async () => {
        const tenant = await createTestTenant('fail-closed-lock');

        // Specialized PrismaService wrapper where $queryRaw FOR UPDATE throws
        const failingPrisma = new Proxy(prisma, {
          get(target, prop) {
            if (prop === '$transaction') {
              return async (fn) => {
                return fn(
                  new Proxy(target, {
                    get(t2, p2) {
                      if (p2 === '$queryRaw') {
                        return async () => {
                          throw new Error('SIMULATED_POSTGRES_ROW_LOCK_DEADLOCK_OR_TIMEOUT');
                        };
                      }
                      return Reflect.get(t2, p2);
                    },
                  })
                );
              };
            }
            return Reflect.get(target, prop);
          },
        });

        const service = new SettingsService(failingPrisma);

        await assert.rejects(
          () => service.claimBrandingReward(tenant.identity, tenant.agency.id),
          /SIMULATED_POSTGRES_ROW_LOCK_DEADLOCK_OR_TIMEOUT/,
          'Authoritative lock failure must abort the transaction and bubble the error (FAIL CLOSED)'
        );

        // Verify ZERO records created in PostgreSQL
        const claims = await prisma.brandingRewardClaim.findMany({ where: { agencyId: tenant.agency.id } });
        const ledgers = await prisma.aiCreditLedger.findMany({ where: { agencyId: tenant.agency.id } });
        const prefs = await prisma.agencyBrandingPreference.findMany({ where: { agencyId: tenant.agency.id } });
        const accounts = await prisma.aiCreditAccount.findMany({ where: { agencyId: tenant.agency.id } });

        assert.strictEqual(claims.length, 0, 'No BrandingRewardClaim should exist after lock failure');
        assert.strictEqual(ledgers.length, 0, 'No AiCreditLedger should exist after lock failure');
        assert.strictEqual(prefs.length, 0, 'No AgencyBrandingPreference should exist after lock failure');
        assert.strictEqual(accounts.length, 0, 'No AiCreditAccount should exist after lock failure');
      });

      // -------------------------------------------------------------------------
      // TEST D: TRANSACTION ROLLBACK (MID-TRANSACTION FAILURE)
      // -------------------------------------------------------------------------
      await t.test(
        'D. Mid-transaction failure cleanly rolls back credits and ledger in real PostgreSQL',
        async () => {
          const tenant = await createTestTenant('rollback-test');

          // Pre-create account with 5 credits
          await prisma.aiCreditAccount.create({
            data: { agencyId: tenant.agency.id, balance: 5 },
          });

          await assert.rejects(
            () =>
              prisma.$transaction(async (tx) => {
                // Row lock
                await tx.$queryRaw`SELECT id FROM "Agency" WHERE id = ${tenant.agency.id} FOR UPDATE;`;

                // Step: update account balance
                await tx.aiCreditAccount.update({
                  where: { agencyId: tenant.agency.id },
                  data: { balance: { increment: 10 } },
                });

                // Step: create ledger entry
                await tx.aiCreditLedger.create({
                  data: {
                    agencyId: tenant.agency.id,
                    userId: tenant.user.id,
                    delta: 10,
                    reason: 'BRANDING_REWARD',
                    referenceType: 'BRANDING_PERIOD',
                    referenceId: '2026-10',
                  },
                });

                // Simulated failure before claim record commit
                throw new Error('SIMULATED_MID_TRANSACTION_FAILURE');
              }),
            /SIMULATED_MID_TRANSACTION_FAILURE/
          );

          // Verify PostgreSQL rolled back ALL uncommitted steps
          const accountAfter = await prisma.aiCreditAccount.findUnique({
            where: { agencyId: tenant.agency.id },
          });
          assert.strictEqual(accountAfter.balance, 5, 'Account balance must remain 5 after transaction rollback');

          const ledgersAfter = await prisma.aiCreditLedger.findMany({
            where: { agencyId: tenant.agency.id },
          });
          assert.strictEqual(ledgersAfter.length, 0, 'Ledger entry must be completely rolled back');

          const claimsAfter = await prisma.brandingRewardClaim.findMany({
            where: { agencyId: tenant.agency.id },
          });
          assert.strictEqual(claimsAfter.length, 0, 'Claim record must be absent');
        }
      );
    } finally {
      await app.close();

      // 4. PlatformSettings Restoration
      try {
        if (originalPlatformSettings) {
          await prisma.platformSettings.update({
            where: { id: 'global' },
            data: {
              productName: originalPlatformSettings.productName,
              logoUrl: originalPlatformSettings.logoUrl,
              iconUrl: originalPlatformSettings.iconUrl,
              supportEmail: originalPlatformSettings.supportEmail,
              coBrandingEnabled: originalPlatformSettings.coBrandingEnabled,
              brandingRewardEnabled: originalPlatformSettings.brandingRewardEnabled,
              brandingRewardCredits: originalPlatformSettings.brandingRewardCredits,
            },
          });
        } else {
          await prisma.platformSettings.deleteMany({ where: { id: 'global' } });
        }
      } catch (err) {
        console.error('Failed to restore PlatformSettings:', err);
      }

      // 5. Deterministic Test Artifact Cleanup
      if (createdAgencyIds.length > 0) {
        await prisma.brandingRewardClaim.deleteMany({ where: { agencyId: { in: createdAgencyIds } } });
        await prisma.aiCreditLedger.deleteMany({ where: { agencyId: { in: createdAgencyIds } } });
        await prisma.aiCreditAccount.deleteMany({ where: { agencyId: { in: createdAgencyIds } } });
        await prisma.agencyBrandingPreference.deleteMany({ where: { agencyId: { in: createdAgencyIds } } });
        await prisma.apiSession.deleteMany({ where: { membership: { agencyId: { in: createdAgencyIds } } } });
        await prisma.agencyMembership.deleteMany({ where: { agencyId: { in: createdAgencyIds } } });
        await prisma.agency.deleteMany({ where: { id: { in: createdAgencyIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.adminAuditLog.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }

      // Assert zero residue
      const remainingAgencies = await prisma.agency.count({ where: { id: { in: createdAgencyIds } } });
      const remainingUsers = await prisma.user.count({ where: { id: { in: createdUserIds } } });
      const remainingClaims = await prisma.brandingRewardClaim.count({
        where: { agencyId: { in: createdAgencyIds } },
      });
      const remainingLedgers = await prisma.aiCreditLedger.count({
        where: { agencyId: { in: createdAgencyIds } },
      });
      const remainingAccounts = await prisma.aiCreditAccount.count({
        where: { agencyId: { in: createdAgencyIds } },
      });
      const remainingPrefs = await prisma.agencyBrandingPreference.count({
        where: { agencyId: { in: createdAgencyIds } },
      });
      const remainingAudits = await prisma.adminAuditLog.count({
        where: { userId: { in: createdUserIds } },
      });

      assert.strictEqual(remainingAgencies, 0, 'Residual test agencies must be 0');
      assert.strictEqual(remainingUsers, 0, 'Residual test users must be 0');
      assert.strictEqual(remainingClaims, 0, 'Residual test claims must be 0');
      assert.strictEqual(remainingLedgers, 0, 'Residual test ledgers must be 0');
      assert.strictEqual(remainingAccounts, 0, 'Residual test accounts must be 0');
      assert.strictEqual(remainingPrefs, 0, 'Residual test preferences must be 0');
      assert.strictEqual(remainingAudits, 0, 'Residual test audit logs must be 0');

      await prisma.$disconnect();
    }
  });
}
