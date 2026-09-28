import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePostgresTestTarget,
  parsePostgresTarget,
  sanitizeDatabaseUrl,
  formatTargetSummary,
} from '../scripts/postgres-gate-safety.mjs';

test('1. missing API_TEST_DATABASE_URL is rejected', () => {
  const prod = 'postgresql://user:secret@db.example.com:5432/travel_saas';

  const resEmpty = validatePostgresTestTarget('', prod);
  assert.equal(resEmpty.ok, false);
  assert.match(resEmpty.reason, /Missing API_TEST_DATABASE_URL/);

  const resNull = validatePostgresTestTarget(null, prod);
  assert.equal(resNull.ok, false);
  assert.match(resNull.reason, /Missing API_TEST_DATABASE_URL/);

  const resUndefined = validatePostgresTestTarget(undefined, prod);
  assert.equal(resUndefined.ok, false);
  assert.match(resUndefined.reason, /Missing API_TEST_DATABASE_URL/);
});

test('2. same production DB and schema is rejected for target isolation', () => {
  // Exact same host, port, db name, and schema
  const prod = 'postgresql://user:pass1@db.example.com:5432/travel_saas_test?schema=public';
  const testTarget = 'postgresql://user:pass2@db.example.com:5432/travel_saas_test?schema=public';

  const res = validatePostgresTestTarget(testTarget, prod);
  assert.equal(res.ok, false);
  assert.match(res.reason, /exact same database and schema/);

  // Even if port is omitted in one and default 5432 in the other
  const prodNoPort = 'postgresql://user:pass@db.example.com/travel_saas_test';
  const testWithPort = 'postgresql://user:pass@db.example.com:5432/travel_saas_test';
  const resPortNorm = validatePostgresTestTarget(testWithPort, prodNoPort);
  assert.equal(resPortNorm.ok, false);
  assert.match(resPortNorm.reason, /exact same database and schema/);

  // Even if schema is omitted in one (defaults to public) and explicit ?schema=public in the other
  const prodNoSchema = 'postgresql://user:pass@db.example.com:5432/travel_saas_test';
  const testExplicitPublic = 'postgresql://user:pass@db.example.com:5432/travel_saas_test?schema=public';
  const resSchemaNorm = validatePostgresTestTarget(testExplicitPublic, prodNoSchema);
  assert.equal(resSchemaNorm.ok, false);
  assert.match(resSchemaNorm.reason, /exact same database and schema/);
});

test('3. same host with different _test database is allowed', () => {
  const prod = 'postgresql://produser:secret@db.example.com:5432/travel_saas';
  const testTarget = 'postgresql://testuser:secret@db.example.com:5432/travel_saas_test';

  const res = validatePostgresTestTarget(testTarget, prod);
  assert.equal(res.ok, true);
  assert.equal(res.target.hostname, 'db.example.com');
  assert.equal(res.target.port, 5432);
  assert.equal(res.target.database, 'travel_saas_test');
  assert.equal(res.target.schema, 'public');
});

test('4. same DB with dedicated schema=payment_test is allowed', () => {
  const prod = 'postgresql://user:secret@db.example.com:5432/travel_saas?schema=public';
  const testTarget = 'postgresql://user:secret@db.example.com:5432/travel_saas?schema=payment_test';

  const res = validatePostgresTestTarget(testTarget, prod);
  assert.equal(res.ok, true);
  assert.equal(res.target.hostname, 'db.example.com');
  assert.equal(res.target.database, 'travel_saas');
  assert.equal(res.target.schema, 'payment_test');
});

test('5. managed/cloud hosts with explicit test database or schema are allowed', () => {
  const prod = 'postgresql://user:pass@db.example.com:5432/travel_saas';

  // Supabase
  const resSupabase = validatePostgresTestTarget(
    'postgresql://postgres:secret@db.projectref.supabase.co:5432/postgres?schema=payment_integration_test',
    prod,
  );
  assert.equal(resSupabase.ok, true);
  assert.equal(resSupabase.target.hostname, 'db.projectref.supabase.co');
  assert.equal(resSupabase.target.schema, 'payment_integration_test');

  // Neon
  const resNeon = validatePostgresTestTarget(
    'postgresql://neonuser:secret@ep-cool-lake-123.us-east-2.aws.neon.tech:5432/travel_saas_test?sslmode=require',
    prod,
  );
  assert.equal(resNeon.ok, true);
  assert.equal(resNeon.target.database, 'travel_saas_test');

  // AWS RDS
  const resRds = validatePostgresTestTarget(
    'postgresql://rdsadmin:secret@travel-saas.c9akj.us-east-1.rds.amazonaws.com:5432/agency_test',
    prod,
  );
  assert.equal(resRds.ok, true);
  assert.equal(resRds.target.database, 'agency_test');
});

test('6. production-looking database without test marker in db or schema is rejected', () => {
  // Merely having "test" in hostname is NOT sufficient
  const hostOnlyTest = 'postgresql://user:pass@test-cluster.example.com:5432/travel_saas';
  const resHostOnly = validatePostgresTestTarget(hostOnlyTest);
  assert.equal(resHostOnly.ok, false);
  assert.match(resHostOnly.reason, /do not contain an explicit "test" marker/);

  // Common production names without schema marker
  const resProd = validatePostgresTestTarget('postgresql://user:pass@db.example.com:5432/production');
  assert.equal(resProd.ok, false);

  const resDefaultPg = validatePostgresTestTarget('postgresql://user:pass@db.example.com:5432/postgres');
  assert.equal(resDefaultPg.ok, false);

  const resPublic = validatePostgresTestTarget('postgresql://user:pass@db.example.com:5432/travel_saas?schema=public');
  assert.equal(resPublic.ok, false);
});

test('7. credentials never appear in sanitized output or formatted summaries', () => {
  const sensitiveUrl = 'postgresql://saas_admin:super_secret_p%40ssword_999@db.example.com:5432/travel_saas_test';
  const sanitized = sanitizeDatabaseUrl(sensitiveUrl);

  assert.ok(!sanitized.includes('super_secret_p%40ssword_999'), 'Password must never appear in sanitized URL');
  assert.ok(!sanitized.includes('saas_admin'), 'Username must never appear in sanitized URL');
  assert.equal(sanitized, 'postgresql://***:***@db.example.com:5432/travel_saas_test');

  const target = parsePostgresTarget(sensitiveUrl);
  const summary = formatTargetSummary(target);
  assert.equal(summary, 'db.example.com:5432/travel_saas_test (schema: public)');
  assert.ok(!summary.includes('super_secret'));
  assert.ok(!summary.includes('saas_admin'));
});
