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

// Ensure isolated schema: notifications_test
const url = new URL(rawTestDbUrl.trim());
url.searchParams.set('schema', 'notifications_test');
const testDbUrl = url.toString();

const isolatedValidation = validatePostgresTestTarget(testDbUrl, process.env.DATABASE_URL);
console.log(`[GATE RUNNER] Target test database: ${isolatedValidation.sanitizedUrl}`);
console.log(`[GATE RUNNER] Host: ${isolatedValidation.target.hostname}:${isolatedValidation.target.port}`);
console.log(`[GATE RUNNER] Database: ${isolatedValidation.target.database}`);
console.log(`[GATE RUNNER] Schema: ${isolatedValidation.target.schema}`);

// 2. Verify migrations directory contains 20261001000000_transactional_notification_outbox
let migrationEntries = [];
try {
  migrationEntries = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const hasNotificationMigration = migrationEntries.some((name) =>
  name.includes('transactional_notification_outbox')
);
if (!hasNotificationMigration) {
  console.error(
    '[GATE ERROR] Required migration (transactional_notification_outbox) not found in packages/db/prisma/migrations/.'
  );
  process.exitCode = 1;
  process.exit(1);
}

// 3. Prepare isolated child environment mapping API_TEST_DATABASE_URL to DATABASE_URL
const childEnv = {
  ...process.env,
  PROD_DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL: testDbUrl,
  API_TEST_DATABASE_URL: testDbUrl,
  NODE_ENV: 'test',
  NOTIFICATION_PAYLOAD_KEY: 'MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=', // 32 bytes valid base64
  EMAIL_DELIVERY_ENABLED: 'true',
  NOTIFICATION_TEST_FAST_BACKOFF: 'true',
};

// 4. Deploy migrations to the disposable test database/schema
console.log('[GATE RUNNER] Applying Prisma migrations to disposable test schema (notifications_test)...');
const migrateResult = spawnSync('pnpm --filter @repo/db exec prisma migrate deploy', {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
  env: childEnv,
});

if (migrateResult.status !== 0) {
  console.error(`[GATE ERROR] Prisma migration deploy failed with exit code ${migrateResult.status ?? 1}`);
  process.exitCode = migrateResult.status ?? 1;
  process.exit(process.exitCode);
}

console.log('[GATE RUNNER] Migrations deployed successfully.');

// 5. Execute notifications PostgreSQL integration suite
console.log('[GATE RUNNER] Running PostgreSQL Transactional Notifications suite...');
const testResult = spawnSync('node --test test/notifications.postgres.e2e.mjs', {
  cwd: apiDir,
  shell: true,
  stdio: 'inherit',
  env: childEnv,
});

if (testResult.status !== 0) {
  console.error(`[GATE ERROR] PostgreSQL notifications test suite failed with exit code ${testResult.status ?? 1}`);
  process.exitCode = testResult.status ?? 1;
  process.exit(process.exitCode);
}

console.log('--------------------------------------------------------------------------------');
console.log('NOTIFICATIONS POSTGRESQL GATE PASSED');
console.log('--------------------------------------------------------------------------------');
