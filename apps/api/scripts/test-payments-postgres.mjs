import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { validatePostgresTestTarget } from './postgres-gate-safety.mjs';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const apiDir = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = new URL('../../../packages/db/prisma/migrations/', import.meta.url);

const rootEnv = path.resolve(rootDir, '.env');
if (existsSync(rootEnv)) {
  try { process.loadEnvFile(rootEnv); } catch { /* ignore */ }
}
const apiEnv = path.resolve(apiDir, '.env');
if (existsSync(apiEnv)) {
  try { process.loadEnvFile(apiEnv); } catch { /* ignore */ }
}

// 1. Validate API_TEST_DATABASE_URL strictly without any fallback to DATABASE_URL
const rawTestDbUrl = process.env.API_TEST_DATABASE_URL;
const validation = validatePostgresTestTarget(rawTestDbUrl, process.env.DATABASE_URL);

if (!validation.ok) {
  console.error('--------------------------------------------------------------------------------');
  console.error(`[GATE ERROR] ${validation.reason}`);
  console.error('[GATE ERROR] SAFETY POLICY: Never fall back to production DATABASE_URL.');
  console.error('--------------------------------------------------------------------------------');
  process.exitCode = 1;
  process.exit(1);
}

const testDbUrl = rawTestDbUrl.trim();
console.log(`[GATE RUNNER] Target test database: ${validation.sanitizedUrl}`);
console.log(`[GATE RUNNER] Host: ${validation.target.hostname}:${validation.target.port}`);
console.log(`[GATE RUNNER] Database: ${validation.target.database}`);
console.log(`[GATE RUNNER] Schema: ${validation.target.schema}`);

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
  PROD_DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL: testDbUrl,
  API_TEST_DATABASE_URL: testDbUrl,
  NODE_ENV: 'test',
};

// 4. Deploy migrations to the disposable test database/schema
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
