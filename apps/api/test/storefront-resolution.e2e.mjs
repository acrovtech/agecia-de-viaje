import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { application, config } from './helpers.mjs';

test('Dynamic Storefront & Domain Resolution (P2.5)', async (t) => {
  const agencyA = {
    id: 'agency-a-id',
    name: 'Inca Expeditions',
    slug: 'agency-a',
    subdomain: 'inca',
    customDomain: 'www.incaexpeditions.com',
    logoUrl: 'https://r2.test/agencies/agency-a-id/agency_logo/logo.webp',
    iconUrl: 'https://r2.test/agencies/agency-a-id/agency_icon/icon.webp',
    isActive: true,
  };

  const agencyB = {
    id: 'agency-b-id',
    name: 'Cusco Adventures',
    slug: 'agency-b',
    subdomain: 'cusco',
    customDomain: 'www.cusco-adventures.com',
    logoUrl: null,
    iconUrl: null,
    isActive: true,
  };

  const agencyInactive = {
    id: 'agency-inactive-id',
    name: 'Inactive Tours',
    slug: 'agency-inactive',
    subdomain: 'inactive',
    customDomain: 'www.inactive-tours.com',
    logoUrl: null,
    iconUrl: null,
    isActive: false,
  };

  const agencyUnpublished = {
    id: 'agency-unpub-id',
    name: 'Secret Agency',
    slug: 'agency-unpub',
    subdomain: 'secret',
    customDomain: 'www.secret-agency.com',
    logoUrl: null,
    iconUrl: null,
    isActive: true,
  };

  const state = {
    agencies: [agencyA, agencyB, agencyInactive, agencyUnpublished],
  };

  const mockPrisma = {
    agency: {
      findFirst: async ({ where }) => {
        return state.agencies.find((a) => {
          if (where.customDomain && a.customDomain !== where.customDomain) return false;
          if (where.subdomain && a.subdomain !== where.subdomain) return false;
          if (where.slug && a.slug !== where.slug) return false;
          if (where.isActive !== undefined && a.isActive !== where.isActive) return false;
          return true;
        }) ?? null;
      },
      findUnique: async ({ where }) => {
        return state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null;
      },
    },
    $queryRaw: async () => [],
    $transaction: async (fn) => fn(mockPrisma),
  };

  // Default app: trust proxy = false, publicAgencySlugs = agency-a, agency-b
  const app = await application(
    config({
      API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b',
      STOREFRONT_BASE_DOMAIN: 'platform.example',
      STOREFRONT_TRUST_FORWARDED_HOST: 'false',
    }),
    mockPrisma
  );

  // App with trusted forwarded host enabled
  const trustedApp = await application(
    config({
      API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b',
      STOREFRONT_BASE_DOMAIN: 'platform.example',
      STOREFRONT_TRUST_FORWARDED_HOST: 'true',
    }),
    mockPrisma
  );

  // 1. EXACT CUSTOM DOMAIN RESOLUTION
  await t.test('1. Exact custom domain resolution', async () => {
    const resA = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.incaexpeditions.com');
    assert.equal(resA.status, 200);
    assert.equal(resA.body.slug, 'agency-a');
    assert.equal(resA.body.name, 'Inca Expeditions');
    assert.equal(resA.body.customDomain, 'www.incaexpeditions.com');
    assert.equal(resA.body.canonicalHost, 'www.incaexpeditions.com');
    assert.equal(resA.body.canonicalOrigin, 'https://www.incaexpeditions.com');
    // Ensure internal database IDs and secrets are not leaked
    assert.equal(resA.body.agencyId, undefined);
    assert.equal(resA.body.id, undefined);

    const resB = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.cusco-adventures.com');
    assert.equal(resB.status, 200);
    assert.equal(resB.body.slug, 'agency-b');
    assert.equal(resB.body.name, 'Cusco Adventures');
  });

  // 2. PLATFORM SUBDOMAIN RESOLUTION
  await t.test('2. Platform subdomain resolution (subdomain.platform.example)', async () => {
    const resA = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=inca.platform.example');
    assert.equal(resA.status, 200);
    assert.equal(resA.body.slug, 'agency-a');
    // When customDomain exists, canonicalHost points to customDomain
    assert.equal(resA.body.canonicalHost, 'www.incaexpeditions.com');

    const resB = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=cusco.platform.example');
    assert.equal(resB.status, 200);
    assert.equal(resB.body.slug, 'agency-b');
  });

  // 3. DOMAIN BOUNDARY & PLATFORM ROOT PROTECTION
  await t.test('3. Platform root domain and subdomain boundary protection', async () => {
    // Platform root itself must not resolve to any agency
    const resRoot = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=platform.example');
    assert.equal(resRoot.status, 404);

    // Attacker appending platform domain must not resolve to agency A
    const resAttacker = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=inca.platform.example.attacker.com');
    assert.equal(resAttacker.status, 404);

    // Nested subdomains exceeding single label must not resolve
    const resNested = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=sub.inca.platform.example');
    assert.equal(resNested.status, 404);
  });

  // 4. UNKNOWN / INACTIVE / UNPUBLISHED AGENCIES FAIL CLOSED WITH 404
  await t.test('4. Unknown, inactive, and unpublished agencies fail closed with 404', async () => {
    // Unknown custom domain
    const resUnknown = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.nonexistent.com');
    assert.equal(resUnknown.status, 404);

    // Inactive agency custom domain and subdomain
    const resInactiveCustom = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.inactive-tours.com');
    assert.equal(resInactiveCustom.status, 404);

    const resInactiveSub = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=inactive.platform.example');
    assert.equal(resInactiveSub.status, 404);

    // Unpublished agency (active in DB but not in API_PUBLIC_AGENCY_SLUGS allowlist)
    const resUnpub = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.secret-agency.com');
    assert.equal(resUnpub.status, 404);
  });

  // 5. HOST NORMALIZATION & INJECTION REJECTION
  await t.test('5. Host normalization and injection rejection', async () => {
    // Mixed case and port stripped safely
    const resCasePort = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=WWW.INCAEXPEDITIONS.COM:443');
    assert.equal(resCasePort.status, 200);
    assert.equal(resCasePort.body.slug, 'agency-a');

    // Trailing FQDN dot stripped safely
    const resDot = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.incaexpeditions.com.');
    assert.equal(resDot.status, 200);
    assert.equal(resDot.body.slug, 'agency-a');

    // Multiple host injection (comma) rejected
    const resComma = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=evil.com,%20www.incaexpeditions.com');
    assert.equal(resComma.status, 404);

    // Scheme or path injection rejected
    const resScheme = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=https://www.incaexpeditions.com');
    assert.equal(resScheme.status, 404);

    const resPath = await request(app.getHttpServer())
      .get('/v1/storefront-resolution?host=www.incaexpeditions.com/path');
    assert.equal(resPath.status, 404);
  });

  // 6. HOST SPOOFING RESISTANCE
  await t.test('6. Host spoofing: X-Forwarded-Host cannot override Host header by default', async () => {
    // Request with Host: www.incaexpeditions.com and X-Forwarded-Host: www.cusco-adventures.com
    const res = await request(app.getHttpServer())
      .get('/v1/storefront-resolution')
      .set('Host', 'www.incaexpeditions.com')
      .set('X-Forwarded-Host', 'www.cusco-adventures.com');

    assert.equal(res.status, 200);
    // Must remain Agency A because X-Forwarded-Host is not trusted by default
    assert.equal(res.body.slug, 'agency-a');

    // In trusted proxy mode: X-Forwarded-Host is honored when explicitly configured
    const trustedRes = await request(trustedApp.getHttpServer())
      .get('/v1/storefront-resolution')
      .set('Host', 'internal-proxy.local')
      .set('X-Forwarded-Host', 'www.cusco-adventures.com');

    assert.equal(trustedRes.status, 200);
    assert.equal(trustedRes.body.slug, 'agency-b');
  });

  // 7. TENANT INTERCEPTOR ROUTE SLUG VS HOST CONSISTENCY
  await t.test('7. TenantInterceptor rejects cross-tenant Host vs route slug mismatch', async () => {
    // Host resolves to Agency A, but route requests /v1/storefronts/agency-b/...
    const mismatchRes = await request(app.getHttpServer())
      .get('/v1/storefronts/agency-b/tours')
      .set('Host', 'www.incaexpeditions.com');

    assert.equal(mismatchRes.status, 403);
    assert.equal(mismatchRes.body.error?.code, 'FORBIDDEN');
  });

  await app.close();
  await trustedApp.close();
});
