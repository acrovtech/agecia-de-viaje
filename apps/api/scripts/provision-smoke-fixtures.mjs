import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from './postgres-gate-safety.mjs';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const apiDir = fileURLToPath(new URL('../', import.meta.url));

const rootEnv = path.resolve(rootDir, '.env');
if (existsSync(rootEnv)) {
  try { process.loadEnvFile(rootEnv); } catch { /* ignore */ }
}
const apiEnv = path.resolve(apiDir, '.env');
if (existsSync(apiEnv)) {
  try { process.loadEnvFile(apiEnv); } catch { /* ignore */ }
}

// Strictly require API_TEST_DATABASE_URL or TEST_DATABASE_URL. Never fall back to normal DATABASE_URL.
const rawTestDbUrl = process.env.API_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL;
const validation = validatePostgresTestTarget(rawTestDbUrl, process.env.PROD_DATABASE_URL || process.env.DATABASE_URL);

if (!validation.ok) {
  console.error('--------------------------------------------------------------------------------');
  console.error(`[SMOKE FIXTURE ERROR] ${validation.reason}`);
  console.error('[SMOKE FIXTURE ERROR] SAFETY POLICY: Refusing non-test target. Never mutate production.');
  console.error('--------------------------------------------------------------------------------');
  process.exit(1);
}

const testDbUrl = rawTestDbUrl.trim();
console.log(`[SMOKE FIXTURE] Provisioning ephemeral smoke fixtures on: ${validation.sanitizedUrl}`);

const prisma = new PrismaClient({
  datasources: { db: { url: testDbUrl } },
});

try {
  await prisma.agency.upsert({
    where: { slug: 'demo' },
    update: {
      name: 'Demo Agency',
      subdomain: 'demo',
      isActive: true,
    },
    create: {
      name: 'Demo Agency',
      slug: 'demo',
      subdomain: 'demo',
      isActive: true,
    },
  });
  console.log('[SMOKE FIXTURE] Successfully provisioned "demo" agency fixture in ephemeral test database.');
} catch (error) {
  console.error('[SMOKE FIXTURE ERROR] Failed to provision fixtures:', error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
