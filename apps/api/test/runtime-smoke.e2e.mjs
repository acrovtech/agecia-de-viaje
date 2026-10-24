import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import request from 'supertest';
import { createApplication } from '../dist/application.js';
import { parseConfig } from '../dist/config.js';

if (existsSync('.env')) loadEnvFile('.env');

test('RUNTIME SMOKE SUITE (Phase 6 Post-Merge) - READ-ONLY', async (t) => {
  const config = parseConfig({
    ...process.env,
    API_AUTH_ENABLED: 'true',
  });

  const app = await createApplication(config);
  await app.init();
  const server = app.getHttpServer();

  try {
    await t.test('A. DATABASE: Application API establishes PostgreSQL connection', async () => {
      const readyRes = await request(server).get('/health/ready');
      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.body?.status, 'ok');
    });

    await t.test('B. API HEALTH: Liveness and readiness endpoints report 200 ok', async () => {
      const liveRes = await request(server).get('/health/live');
      assert.strictEqual(liveRes.status, 200);
      assert.strictEqual(liveRes.body?.status, 'ok');

      const readyRes = await request(server).get('/health/ready');
      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.body?.status, 'ok');
    });

    await t.test('C. PLATFORM LOGIN: /v1/platform/auth/login endpoint responds without 500', async () => {
      const authRes = await request(server)
        .post('/v1/platform/auth/login')
        .send({ email: 'probe@platform.local', password: 'ProbePassword123!' });
      // Non-existent admin must fail with 401 Unauthorized, never 500
      assert.strictEqual(authRes.status, 401);
    });

    await t.test('D. TENANT LOGIN: /v1/public/admin-login-context/:agencySlug returns agency identity and branding', async () => {
      const contextRes = await request(server).get('/v1/public/admin-login-context/demo');
      assert.strictEqual(contextRes.status, 200);
      assert.strictEqual(contextRes.body?.agency?.slug, 'demo');
      assert.strictEqual(typeof contextRes.body?.platformBranding?.enabled, 'boolean');
      assert.strictEqual(typeof contextRes.body?.platformBranding?.productName, 'string');
      // Verify no secrets leaked
      assert.strictEqual(contextRes.body?.agency?.id, undefined);
    });

    await t.test('E. PLATFORM DASHBOARD: /v1/platform/agencies and /settings require platform auth', async () => {
      const agenciesRes = await request(server).get('/v1/platform/agencies');
      assert.strictEqual(agenciesRes.status, 401);

      const settingsRes = await request(server).get('/v1/platform/settings');
      assert.strictEqual(settingsRes.status, 401);
    });

    await t.test('F. TENANT DASHBOARD: /v1/auth/me rejects unauthenticated requests', async () => {
      const sessionRes = await request(server).get('/v1/auth/me');
      assert.strictEqual(sessionRes.status, 401);
    });

    await t.test('G. GLOBAL CO-BRANDING: Resolver state loads cleanly', async () => {
      const contextRes = await request(server).get('/v1/public/admin-login-context/demo');
      assert.strictEqual(contextRes.status, 200);
      assert.ok('enabled' in contextRes.body.platformBranding);
    });

    await t.test('H. CREDIT REWARD: Read availability without state mutation', async () => {
      // Unauthenticated claim request must be rejected with 401 without modifying database state
      const claimRes = await request(server).post('/v1/agencies/demo/settings/branding/reward');
      assert.strictEqual(claimRes.status, 401);
    });
  } finally {
    await app.close();
  }
});
