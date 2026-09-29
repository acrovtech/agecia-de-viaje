import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';
import { StorefrontResolverService } from '../dist/tenant/storefront-resolver.service.js';

test('Dynamic Storefront & Domain Resolution Real PostgreSQL Gate (P2.5)', async (t) => {
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

  const suffix = randomUUID().slice(0, 8);
  const baseDomain = 'platform.example';

  let agencyA, agencyB, agencyInactive, agencyUnpublished;
  let tourA, tourB;

  try {
    // -------------------------------------------------------------------------
    // Setup: Seed test agencies and tours in isolated PostgreSQL
    // -------------------------------------------------------------------------
    agencyA = await prisma.agency.create({
      data: {
        name: `Gate Storefront A ${suffix}`,
        slug: `sf-a-${suffix}`,
        subdomain: `inca-${suffix}`,
        customDomain: `www.inca-${suffix}.com`,
        isActive: true,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: `Gate Storefront B ${suffix}`,
        slug: `sf-b-${suffix}`,
        subdomain: `cusco-${suffix}`,
        customDomain: `www.cusco-${suffix}.com`,
        isActive: true,
      },
    });

    agencyInactive = await prisma.agency.create({
      data: {
        name: `Gate Inactive Agency ${suffix}`,
        slug: `sf-inactive-${suffix}`,
        subdomain: `disabled-${suffix}`,
        customDomain: `www.disabled-${suffix}.com`,
        isActive: false,
      },
    });

    agencyUnpublished = await prisma.agency.create({
      data: {
        name: `Gate Unpublished Agency ${suffix}`,
        slug: `sf-unpub-${suffix}`,
        subdomain: `unpub-${suffix}`,
        customDomain: `www.unpub-${suffix}.com`,
        isActive: true, // Active in DB but NOT in API_PUBLIC_AGENCY_SLUGS
      },
    });

    // Create identical tour slugs across agencyA and agencyB
    tourA = await prisma.tour.create({
      data: {
        agencyId: agencyA.id,
        title: `Machu Picchu Classic A ${suffix}`,
        slug: `machu-picchu-${suffix}`,
        description: `Description for Tour A ${suffix}`,
        duration: '1 day',
        bannerImage: '/test-a.webp',
        cardImage: '/test-a.webp',
        sharedPrice: 250,
        isPublished: true,
      },
    });

    tourB = await prisma.tour.create({
      data: {
        agencyId: agencyB.id,
        title: `Machu Picchu Classic B ${suffix}`,
        slug: `machu-picchu-${suffix}`,
        description: `Description for Tour B ${suffix}`,
        duration: '2 days',
        bannerImage: '/test-b.webp',
        cardImage: '/test-b.webp',
        sharedPrice: 350,
        isPublished: true,
      },
    });

    const config = {
      storefrontBaseDomain: baseDomain,
      storefrontTrustForwardedHost: false,
      publicAgencySlugs: [agencyA.slug, agencyB.slug, agencyInactive.slug], // agencyUnpublished is intentionally excluded
      nodeEnv: 'production',
    };

    const resolver = new StorefrontResolverService(prisma, config);

    // -------------------------------------------------------------------------
    // 1. Exact custom domain resolution
    // -------------------------------------------------------------------------
    await t.test('1. Exact custom domain resolution matches active agency', async () => {
      const resultA = await resolver.resolveByHost(`www.inca-${suffix}.com`);
      assert.equal(resultA.slug, agencyA.slug);
      assert.equal(resultA.agencyId, agencyA.id);
      assert.equal(resultA.canonicalHost, `www.inca-${suffix}.com`);
      assert.equal(resultA.canonicalOrigin, `https://www.inca-${suffix}.com`);

      const resultB = await resolver.resolveByHost(`WWW.CUSCO-${suffix}.COM:443`);
      assert.equal(resultB.slug, agencyB.slug);
      assert.equal(resultB.agencyId, agencyB.id);
      assert.equal(resultB.canonicalHost, `www.cusco-${suffix}.com`);
      assert.equal(resultB.canonicalOrigin, `https://www.cusco-${suffix}.com`);
    });

    // -------------------------------------------------------------------------
    // 2. Platform subdomain resolution
    // -------------------------------------------------------------------------
    await t.test('2. Platform subdomain resolution (subdomain.baseDomain)', async () => {
      const result = await resolver.resolveByHost(`inca-${suffix}.${baseDomain}`);
      assert.equal(result.slug, agencyA.slug);
      assert.equal(result.agencyId, agencyA.id);
      // Precedence: canonical host prefers customDomain when defined
      assert.equal(result.canonicalHost, `www.inca-${suffix}.com`);
    });

    // -------------------------------------------------------------------------
    // 3. Platform root hostname and domain-boundary defense
    // -------------------------------------------------------------------------
    await t.test('3. Platform root domain and subdomain boundary fail closed', async () => {
      // Platform root domain itself must not resolve to any tenant
      await assert.rejects(
        () => resolver.resolveByHost(baseDomain),
        (err) => err?.status === 404,
        'Root platform domain must reject with 404'
      );

      // Suffix boundary: inca-suffix.platform.example.attacker.com must NOT match
      await assert.rejects(
        () => resolver.resolveByHost(`inca-${suffix}.${baseDomain}.attacker.com`),
        (err) => err?.status === 404,
        'Subdomain ending in attacker.com must reject with 404'
      );

      // Multi-level subdomain (e.g. evil.inca.platform.example)
      await assert.rejects(
        () => resolver.resolveByHost(`evil.inca-${suffix}.${baseDomain}`),
        (err) => err?.status === 404,
        'Nested subdomain must reject with 404'
      );
    });

    // -------------------------------------------------------------------------
    // 4. Unknown host and inactive agency fail closed with 404
    // -------------------------------------------------------------------------
    await t.test('4. Unknown host and inactive agency fail closed with 404', async () => {
      await assert.rejects(
        () => resolver.resolveByHost(`nonexistent-${suffix}.com`),
        (err) => err?.status === 404,
        'Unknown host must throw 404'
      );

      // Inactive agency subdomain
      await assert.rejects(
        () => resolver.resolveByHost(`disabled-${suffix}.${baseDomain}`),
        (err) => err?.status === 404,
        'Inactive agency subdomain must throw 404'
      );

      // Inactive agency customDomain
      await assert.rejects(
        () => resolver.resolveByHost(`www.disabled-${suffix}.com`),
        (err) => err?.status === 404,
        'Inactive agency custom domain must throw 404'
      );
    });

    // -------------------------------------------------------------------------
    // 5. Publication gate enforcement
    // -------------------------------------------------------------------------
    await t.test('5. Active agency excluded from API_PUBLIC_AGENCY_SLUGS fails closed with 404', async () => {
      await assert.rejects(
        () => resolver.resolveByHost(`unpub-${suffix}.${baseDomain}`),
        (err) => err?.status === 404,
        'Unpublished agency subdomain must throw 404'
      );

      await assert.rejects(
        () => resolver.resolveByHost(`www.unpub-${suffix}.com`),
        (err) => err?.status === 404,
        'Unpublished agency custom domain must throw 404'
      );
    });

    // -------------------------------------------------------------------------
    // 6. Host spoofing: X-Forwarded-Host cannot override Host header
    // -------------------------------------------------------------------------
    await t.test('6. Host spoofing: X-Forwarded-Host cannot override Host header in default mode', async () => {
      const headers = {
        host: `inca-${suffix}.${baseDomain}`,
        'x-forwarded-host': `cusco-${suffix}.${baseDomain}`,
      };

      const authoritativeHost = resolver.getAuthoritativeHost(headers);
      assert.equal(authoritativeHost, `inca-${suffix}.${baseDomain}`);

      const resolved = await resolver.resolveByHost(authoritativeHost);
      assert.equal(resolved.slug, agencyA.slug);
      assert.notEqual(resolved.slug, agencyB.slug);
    });

    // -------------------------------------------------------------------------
    // 7. Cross-tenant catalog isolation with identical tour slug
    // -------------------------------------------------------------------------
    await t.test('7. Cross-tenant catalog isolation: same tour slug across distinct hostnames', async () => {
      const tourSlug = `machu-picchu-${suffix}`;

      // Query from Host A
      const tenantA = await resolver.resolveByHost(`www.inca-${suffix}.com`);
      const tourFoundA = await prisma.tour.findFirst({
        where: {
          agencyId: tenantA.agencyId,
          slug: tourSlug,
        },
      });

      assert.ok(tourFoundA);
      assert.equal(tourFoundA.id, tourA.id);
      assert.equal(tourFoundA.title, `Machu Picchu Classic A ${suffix}`);
      assert.equal(tourFoundA.sharedPrice, 250);

      // Query from Host B
      const tenantB = await resolver.resolveByHost(`www.cusco-${suffix}.com`);
      const tourFoundB = await prisma.tour.findFirst({
        where: {
          agencyId: tenantB.agencyId,
          slug: tourSlug,
        },
      });

      assert.ok(tourFoundB);
      assert.equal(tourFoundB.id, tourB.id);
      assert.equal(tourFoundB.title, `Machu Picchu Classic B ${suffix}`);
      assert.equal(tourFoundB.sharedPrice, 350);

      // Assert they are completely independent and no leakage occurred
      assert.notEqual(tourFoundA.id, tourFoundB.id);
      assert.notEqual(tourFoundA.agencyId, tourFoundB.agencyId);
    });

    // -------------------------------------------------------------------------
    // 8. Simultaneous concurrent requests: request-scoped isolation
    // -------------------------------------------------------------------------
    await t.test('8. Simultaneous concurrent requests: verify complete tenant isolation', async () => {
      const concurrency = 20;
      const tasks = [];

      for (let i = 0; i < concurrency; i++) {
        const isA = i % 2 === 0;
        const host = isA ? `www.inca-${suffix}.com` : `www.cusco-${suffix}.com`;
        const expectedSlug = isA ? agencyA.slug : agencyB.slug;
        const expectedAgencyId = isA ? agencyA.id : agencyB.id;

        tasks.push(
          resolver.resolveByHost(host).then((ctx) => {
            assert.equal(ctx.slug, expectedSlug, `Request #${i} returned wrong slug`);
            assert.equal(ctx.agencyId, expectedAgencyId, `Request #${i} returned wrong agencyId`);
          })
        );
      }

      await Promise.all(tasks);
    });
  } finally {
    // Cleanup in target schema
    try {
      if (tourA?.id || tourB?.id) {
        await prisma.tour.deleteMany({
          where: { id: { in: [tourA?.id, tourB?.id].filter(Boolean) } },
        });
      }
      if (agencyA?.id || agencyB?.id || agencyInactive?.id || agencyUnpublished?.id) {
        await prisma.agency.deleteMany({
          where: {
            id: {
              in: [agencyA?.id, agencyB?.id, agencyInactive?.id, agencyUnpublished?.id].filter(Boolean),
            },
          },
        });
      }
    } catch (cleanupError) {
      console.warn('Warning during PostgreSQL test cleanup:', cleanupError);
    } finally {
      await prisma.$disconnect();
    }
  }
});
