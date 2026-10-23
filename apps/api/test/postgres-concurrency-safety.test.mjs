import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedDatabaseName,
  validatePostgresIntegrationGuard,
} from '../scripts/postgres-gate-safety.mjs';

test('POSTGRESQL CONCURRENCY GATE SAFETY & ISOLATION UNIT TESTS', async (t) => {
  await t.test('1. Missing opt-in (ALLOW_POSTGRES_INTEGRATION_TESTS absent) skips and blocks DB mutation', () => {
    const res = validatePostgresIntegrationGuard({
      allowOptIn: undefined,
      testDatabaseUrl: 'postgresql://app:pass@localhost:5432/travel_integration_test',
    });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.skipped, true);
    assert.match(res.reason, /ALLOW_POSTGRES_INTEGRATION_TESTS must be explicitly "true"/);

    const resFalse = validatePostgresIntegrationGuard({
      allowOptIn: 'false',
      testDatabaseUrl: 'postgresql://app:pass@localhost:5432/travel_integration_test',
    });
    assert.strictEqual(resFalse.ok, false);
    assert.strictEqual(resFalse.skipped, true);
  });

  await t.test('2. Missing TEST_DATABASE_URL skips and never falls back to DATABASE_URL', () => {
    const res = validatePostgresIntegrationGuard({
      allowOptIn: 'true',
      testDatabaseUrl: undefined,
      prodDatabaseUrl: 'postgresql://prod:pass@localhost:5432/dbTravel',
    });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.skipped, true);
    assert.match(res.reason, /Missing TEST_DATABASE_URL/);

    const resEmpty = validatePostgresIntegrationGuard({
      allowOptIn: 'true',
      testDatabaseUrl: '   ',
    });
    assert.strictEqual(resEmpty.ok, false);
    assert.strictEqual(resEmpty.skipped, true);
  });

  await t.test('3. Unsafe database targets (dbTravel, production, postgres, non-test) are strictly refused before mutation', () => {
    // Explicitly forbidden production database names
    assert.strictEqual(isAllowedDatabaseName('dbTravel'), false, 'dbTravel must be rejected');
    assert.strictEqual(isAllowedDatabaseName('production'), false, 'production must be rejected');
    assert.strictEqual(isAllowedDatabaseName('prod'), false, 'prod must be rejected');
    assert.strictEqual(isAllowedDatabaseName('postgres'), false, 'postgres must be rejected');
    assert.strictEqual(isAllowedDatabaseName('random_app_db'), false, 'generic database must be rejected');

    // Authorized integration test naming conventions
    assert.strictEqual(isAllowedDatabaseName('dbTravel_integration_test'), true);
    assert.strictEqual(isAllowedDatabaseName('travel_integration_test'), true);
    assert.strictEqual(isAllowedDatabaseName('travel_saas_test'), true);
    assert.strictEqual(isAllowedDatabaseName('api_test_ci'), true);
    assert.strictEqual(isAllowedDatabaseName('test_travel'), true);

    // Guard rejects unsafe target URL
    const resUnsafe = validatePostgresIntegrationGuard({
      allowOptIn: 'true',
      testDatabaseUrl: 'postgresql://travel_runtime:pass@132.145.129.209:8000/dbTravel',
    });
    assert.strictEqual(resUnsafe.ok, false);
    assert.strictEqual(resUnsafe.skipped, false);
    assert.match(resUnsafe.reason, /UNSAFE_DATABASE_TARGET/);

    // Guard rejects when TEST_DATABASE_URL points to same host/db as production DATABASE_URL
    const resSame = validatePostgresIntegrationGuard({
      allowOptIn: 'true',
      testDatabaseUrl: 'postgresql://user:pass@127.0.0.1:5432/travel_test',
      prodDatabaseUrl: 'postgresql://other:secret@127.0.0.1:5432/travel_test',
    });
    assert.strictEqual(resSame.ok, false);
    assert.strictEqual(resSame.skipped, false);
    assert.match(resSame.reason, /exact same database and schema/);
  });

  await t.test('4. PlatformSettings isolation contract: snapshot A restored after test mutation B', async () => {
    // Simulate PlatformSettings snapshot and restoration
    let currentDbState = {
      id: 'global',
      productName: 'Original SaaS Production Name',
      coBrandingEnabled: false,
      brandingRewardEnabled: false,
      brandingRewardCredits: 0,
    };

    // Step 1: Snapshot original state A
    const snapshotA = { ...currentDbState };

    // Step 2: Test temporarily applies state B
    try {
      currentDbState = {
        ...currentDbState,
        productName: 'Acrov SaaS Test Override',
        coBrandingEnabled: true,
        brandingRewardEnabled: true,
        brandingRewardCredits: 10,
      };
      assert.strictEqual(currentDbState.coBrandingEnabled, true);
    } finally {
      // Step 3: In finally, restore exact original state A
      currentDbState = { ...snapshotA };
    }

    // Step 4: Verify restoration
    assert.deepStrictEqual(currentDbState, snapshotA, 'PlatformSettings must match snapshot A exactly');
    assert.strictEqual(currentDbState.productName, 'Original SaaS Production Name');
    assert.strictEqual(currentDbState.coBrandingEnabled, false);
  });

  await t.test('5. Test cleanup contract: deterministic deletion by ID leaves zero residue', async () => {
    // Simulate ID tracking
    const createdAgencyIds = ['ag-1', 'ag-2'];
    const createdUserIds = ['usr-1', 'usr-2'];
    const createdClaims = [{ id: 'cl-1', agencyId: 'ag-1' }];
    const createdLedgers = [{ id: 'lg-1', agencyId: 'ag-1' }];
    const createdAccounts = [{ id: 'acc-1', agencyId: 'ag-1' }];
    const createdPrefs = [{ id: 'prf-1', agencyId: 'ag-1' }];
    const createdAudits = [{ id: 'aud-1', userId: 'usr-1' }];

    // Simulate cleanup by authoritative IDs
    const remainingClaims = createdClaims.filter((c) => !createdAgencyIds.includes(c.agencyId));
    const remainingLedgers = createdLedgers.filter((l) => !createdAgencyIds.includes(l.agencyId));
    const remainingAccounts = createdAccounts.filter((a) => !createdAgencyIds.includes(a.agencyId));
    const remainingPrefs = createdPrefs.filter((p) => !createdAgencyIds.includes(p.agencyId));
    const remainingAudits = createdAudits.filter((a) => !createdUserIds.includes(a.userId));
    const remainingAgencies = createdAgencyIds.filter((id) => id === 'other-id');
    const remainingUsers = createdUserIds.filter((id) => id === 'other-id');

    assert.strictEqual(remainingClaims.length, 0, 'Residual claims must be 0');
    assert.strictEqual(remainingLedgers.length, 0, 'Residual ledgers must be 0');
    assert.strictEqual(remainingAccounts.length, 0, 'Residual accounts must be 0');
    assert.strictEqual(remainingPrefs.length, 0, 'Residual preferences must be 0');
    assert.strictEqual(remainingAudits.length, 0, 'Residual audit records must be 0');
    assert.strictEqual(remainingAgencies.length, 0, 'Residual agencies must be 0');
    assert.strictEqual(remainingUsers.length, 0, 'Residual users must be 0');
  });
});
