import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Sanitize URL for safe logging (never leak credentials)
function sanitizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '[invalid-url]';
  }
}

// Strict validation of disposable test database URL
function validateTestDatabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    console.error('--------------------------------------------------------------------------------');
    console.error('[GATE ERROR] Missing API_TEST_DATABASE_URL environment variable.');
    console.error('[GATE ERROR] A dedicated disposable PostgreSQL test database is required.');
    console.error('[GATE ERROR] SAFETY POLICY: Never fall back to production DATABASE_URL.');
    console.error('--------------------------------------------------------------------------------');
    return null;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    console.error('[GATE ERROR] API_TEST_DATABASE_URL is not a valid URL.');
    return null;
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    console.error(`[GATE ERROR] API_TEST_DATABASE_URL protocol must be postgresql: or postgres:, got: ${parsed.protocol}`);
    return null;
  }

  const pathname = parsed.pathname.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  // Database name must clearly indicate a disposable test database
  if (!pathname || pathname === '/' || !pathname.includes('test')) {
    console.error(`[GATE ERROR] Database name in "${sanitizeUrl(rawUrl)}" does not contain "test".`);
    console.error('[GATE ERROR] SAFETY POLICY: The database name must contain "test" to ensure a disposable target.');
    return null;
  }

  // Reject known managed/production hosts
  const forbiddenHosts = ['supabase.co', 'rds.amazonaws.com', 'neon.tech', 'cockroachlabs.cloud', 'elephantsql.com'];
  if (forbiddenHosts.some((h) => hostname.includes(h)) || hostname.includes('prod')) {
    console.error(`[GATE ERROR] Host in "${sanitizeUrl(rawUrl)}" appears to be a production/cloud managed database.`);
    console.error('[GATE ERROR] SAFETY POLICY: Refusing connection to potential production database.');
    return null;
  }

  return rawUrl.trim();
}

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const apiDir = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = new URL('../../packages/db/prisma/migrations/', import.meta.url);

// 1. Validate API_TEST_DATABASE_URL strictly without any fallback
const testDbUrl = validateTestDatabaseUrl(process.env.API_TEST_DATABASE_URL);
if (!testDbUrl) {
  process.exitCode = 1;
  process.exit(1);
}

console.log(`[GATE RUNNER] Target test database: ${sanitizeUrl(testDbUrl)}`);

// 2. Verify migrations directory
let hasMigrations = false;
try {
  hasMigrations = readdirSync(migrationsDir, { withFileTypes: true }).some((entry) => entry.isDirectory());
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (!hasMigrations) {
  console.error('[GATE ERROR] No Prisma migrations found in packages/db/prisma/migrations/. Cannot deploy schema.');
  process.exitCode = 1;
  process.exit(1);
}

// 3. Prepare isolated child environment mapping API_TEST_DATABASE_URL to DATABASE_URL
// Does NOT mutate developer's persistent shell environment
const childEnv = {
  ...process.env,
  DATABASE_URL: testDbUrl,
  API_TEST_DATABASE_URL: testDbUrl,
  NODE_ENV: 'test',
};

// 4. Deploy migrations to the disposable test database
console.log('[GATE RUNNER] Applying Prisma migrations to disposable test database...');
const migrateResult = spawnSync('pnpm --filter @repo/db exec prisma migrate deploy', {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
  env: childEnv,
});

if (migrateResult.status !== 0) {
  console.error(`[GATE ERROR] Prisma migration failed with exit code ${migrateResult.status ?? 1}`);
  process.exitCode = migrateResult.status ?? 1;
  process.exit(process.exitCode);
}

console.log('[GATE RUNNER] Migrations deployed successfully.');

// 5. Execute payment PostgreSQL concurrency integration suite
console.log('[GATE RUNNER] Running PostgreSQL payment integration suite...');
const testResult = spawnSync('node --test test/payment-concurrency.postgres.e2e.mjs', {
  cwd: apiDir,
  shell: true,
  stdio: 'inherit',
  env: childEnv,
});

if (testResult.status !== 0) {
  console.error(`[GATE ERROR] Payment PostgreSQL test suite failed with exit code ${testResult.status ?? 1}`);
  process.exitCode = testResult.status ?? 1;
  process.exit(process.exitCode);
}

console.log('[GATE RUNNER] POSTGRESQL PAYMENT GATE PASSED');
process.exitCode = 0;
