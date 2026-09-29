import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@repo/db/prisma';
import { validatePostgresTestTarget } from '../scripts/postgres-gate-safety.mjs';

test('MediaAsset Real PostgreSQL Migration & Multi-Tenant Isolation Gate (P2.3)', async (t) => {
  // 1. Mandatory test database URL - never silently fall back to DATABASE_URL
  const rawTestDbUrl = process.env.API_TEST_DATABASE_URL;
  if (!rawTestDbUrl || typeof rawTestDbUrl !== 'string' || rawTestDbUrl.trim() === '') {
    throw new Error(
      'API_TEST_DATABASE_URL is mandatory for PostgreSQL media tests. Silently falling back to DATABASE_URL is strictly forbidden.'
    );
  }

  // 2. Validate safety against production URL; reject same database + schema; enforce test marker
  const safety = validatePostgresTestTarget(
    rawTestDbUrl.trim(),
    process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  );
  if (!safety.ok) {
    throw new Error(`[SAFETY VIOLATION] Target rejected: ${safety.reason}`);
  }

  const databaseUrl = rawTestDbUrl.trim();
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID().slice(0, 8);

  let agencyA, agencyB, userA, userB, assetA, assetB;

  try {
    // -------------------------------------------------------------------------
    // Verify migration 20260928030000_tenant_media_storage is recorded in DB
    // -------------------------------------------------------------------------
    await t.test('1. Verify 20260928030000_tenant_media_storage is deployed in target database', async () => {
      const migrationRows = await prisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%tenant_media_storage%'`
      );
      assert.ok(
        migrationRows.length > 0,
        'Expected migration 20260928030000_tenant_media_storage to be applied in _prisma_migrations'
      );
      assert.ok(
        migrationRows[0].finished_at,
        'Expected migration 20260928030000_tenant_media_storage to be finished (not pending or rolled back)'
      );
    });

    // -------------------------------------------------------------------------
    // Setup: Create Agency A and Agency B with isolated users
    // -------------------------------------------------------------------------
    agencyA = await prisma.agency.create({
      data: { name: `Media Agency A ${suffix}`, slug: `media-a-${suffix}`, subdomain: `media-a-${suffix}`, isActive: true }
    });
    agencyB = await prisma.agency.create({
      data: { name: `Media Agency B ${suffix}`, slug: `media-b-${suffix}`, subdomain: `media-b-${suffix}`, isActive: true }
    });

    const passwordA = `pass-a-${suffix}`;
    const passwordB = `pass-b-${suffix}`;
    userA = await prisma.user.create({
      data: { email: `media-user-a-${suffix}@example.test`, password: await hash(passwordA, 10), isActive: true }
    });
    userB = await prisma.user.create({
      data: { email: `media-user-b-${suffix}@example.test`, password: await hash(passwordB, 10), isActive: true }
    });

    await prisma.agencyMembership.create({
      data: { agencyId: agencyA.id, userId: userA.id, role: 'ADMIN', isActive: true }
    });
    await prisma.agencyMembership.create({
      data: { agencyId: agencyB.id, userId: userB.id, role: 'ADMIN', isActive: true }
    });

    // Create baseline MediaAsset for Agency A
    assetA = await prisma.mediaAsset.create({
      data: {
        agencyId: agencyA.id,
        objectKey: `agencies/${agencyA.id}/TOUR_BANNER/${randomUUID()}.webp`,
        publicUrl: `https://pub.example.test/agencies/${agencyA.id}/TOUR_BANNER/a-${suffix}.webp`,
        kind: 'TOUR_BANNER',
        mimeType: 'image/webp',
        byteSize: 1024,
        originalName: 'banner-a.webp',
        uploadedById: userA.id,
      },
    });

    // Create baseline MediaAsset for Agency B
    assetB = await prisma.mediaAsset.create({
      data: {
        agencyId: agencyB.id,
        objectKey: `agencies/${agencyB.id}/TOUR_BANNER/${randomUUID()}.webp`,
        publicUrl: `https://pub.example.test/agencies/${agencyB.id}/TOUR_BANNER/b-${suffix}.webp`,
        kind: 'TOUR_BANNER',
        mimeType: 'image/webp',
        byteSize: 2048,
        originalName: 'banner-b.webp',
        uploadedById: userB.id,
      },
    });

    // -------------------------------------------------------------------------
    // Assertions
    // -------------------------------------------------------------------------

    await t.test('2. MediaAsset.agencyId is strictly required (NOT NULL)', async () => {
      await assert.rejects(
        async () => {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "MediaAsset" ("id", "agencyId", "objectKey", "publicUrl", "kind", "mimeType", "byteSize", "createdAt", "updatedAt") ` +
            `VALUES ($1, NULL, $2, $3, $4, $5, $6, NOW(), NOW())`,
            randomUUID(),
            `agencies/orphan/${randomUUID()}.webp`,
            'https://pub.example.test/orphan.webp',
            'TOUR_BANNER',
            'image/webp',
            500
          );
        },
        (err) => {
          return (
            err?.message?.includes('23502') ||
            err?.code === 'P2010' ||
            /null value in column "agencyId"|violates not-null constraint/i.test(err?.message || '')
          );
        },
        'Expected PostgreSQL not-null constraint failure (23502) when agencyId is null'
      );
    });

    await t.test('3. Invalid/non-existent agencyId foreign key fails', async () => {
      const nonExistentAgencyId = `non-existent-${randomUUID()}`;
      await assert.rejects(
        async () => {
          await prisma.mediaAsset.create({
            data: {
              agencyId: nonExistentAgencyId,
              objectKey: `agencies/${nonExistentAgencyId}/TOUR_BANNER/${randomUUID()}.webp`,
              publicUrl: 'https://pub.example.test/fk-fail.webp',
              kind: 'TOUR_BANNER',
              mimeType: 'image/webp',
              byteSize: 500,
            },
          });
        },
        /foreign key constraint|violates foreign key/i,
        'Expected PostgreSQL foreign key violation when agencyId does not exist'
      );
    });

    await t.test('4. Duplicate objectKey fails unique constraint', async () => {
      await assert.rejects(
        async () => {
          // Attempt to insert another media asset with Agency B using Agency A's objectKey
          await prisma.mediaAsset.create({
            data: {
              agencyId: agencyB.id,
              objectKey: assetA.objectKey,
              publicUrl: 'https://pub.example.test/duplicate-key.webp',
              kind: 'TOUR_BANNER',
              mimeType: 'image/webp',
              byteSize: 100,
            },
          });
        },
        /Unique constraint failed|duplicate key value/i,
        'Expected PostgreSQL unique constraint violation on duplicate objectKey'
      );
    });

    await t.test('5. Tenant query for Agency A strictly excludes Agency B', async () => {
      // Find all assets for Agency A
      const assetsForA = await prisma.mediaAsset.findMany({
        where: { agencyId: agencyA.id },
      });
      const idsForA = assetsForA.map((a) => a.id);
      assert.ok(idsForA.includes(assetA.id), 'Agency A query must include assetA');
      assert.ok(!idsForA.includes(assetB.id), 'Agency A query must strictly exclude assetB');

      // Tenant-scoped findFirst for assetB under agencyA must return null
      const crossTenantAsset = await prisma.mediaAsset.findFirst({
        where: { id: assetB.id, agencyId: agencyA.id },
      });
      assert.equal(crossTenantAsset, null, 'Agency A must never access asset B by ID');
    });

    await t.test('6. Verify (agencyId, kind) index and objectKey unique index exist in PostgreSQL schema', async () => {
      const indexRows = await prisma.$queryRawUnsafe(
        `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'MediaAsset'`
      );

      const hasAgencyKindIndex = indexRows.some(
        (idx) =>
          idx.indexname === 'MediaAsset_agencyId_kind_idx' ||
          (idx.indexdef && idx.indexdef.includes('"agencyId"') && idx.indexdef.includes('"kind"'))
      );
      assert.ok(hasAgencyKindIndex, 'MediaAsset_agencyId_kind_idx must exist on MediaAsset(agencyId, kind)');

      const hasObjectKeyUnique = indexRows.some(
        (idx) =>
          idx.indexname === 'MediaAsset_objectKey_key' ||
          (idx.indexdef && idx.indexdef.includes('UNIQUE') && idx.indexdef.includes('"objectKey"'))
      );
      assert.ok(hasObjectKeyUnique, 'MediaAsset_objectKey_key unique index must exist');
    });

    await t.test('7. uploadedBy relation behaves correctly (SetNull on user deletion)', async () => {
      // Create temporary user and asset
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-uploader-${suffix}@example.test`,
          password: await hash('temp-pass', 10),
          isActive: true,
        },
      });

      const tempAsset = await prisma.mediaAsset.create({
        data: {
          agencyId: agencyA.id,
          objectKey: `agencies/${agencyA.id}/TOUR_CARD/${randomUUID()}.webp`,
          publicUrl: `https://pub.example.test/temp-${suffix}.webp`,
          kind: 'TOUR_CARD',
          mimeType: 'image/webp',
          byteSize: 500,
          uploadedById: tempUser.id,
        },
      });

      // Verify relation resolves
      const withUser = await prisma.mediaAsset.findUnique({
        where: { id: tempAsset.id },
        include: { uploadedBy: true },
      });
      assert.equal(withUser.uploadedBy?.id, tempUser.id);
      assert.equal(withUser.uploadedBy?.email, tempUser.email);

      // Delete user -> verify MediaAsset.uploadedById becomes null (ON DELETE SET NULL)
      await prisma.user.delete({ where: { id: tempUser.id } });

      const afterUserDelete = await prisma.mediaAsset.findUnique({
        where: { id: tempAsset.id },
      });
      assert.ok(afterUserDelete, 'MediaAsset must remain after user deletion');
      assert.equal(afterUserDelete.uploadedById, null, 'uploadedById must be set to null on user deletion');

      // Cleanup temp asset
      await prisma.mediaAsset.delete({ where: { id: tempAsset.id } });
    });

    await t.test('8. Deleting Agency cascades its MediaAssets (ON DELETE CASCADE)', async () => {
      const cascadeAgency = await prisma.agency.create({
        data: {
          name: `Cascade Agency ${suffix}`,
          slug: `cascade-agency-${suffix}`,
          subdomain: `cascade-${suffix}`,
          isActive: true,
        },
      });

      const cascadeAsset = await prisma.mediaAsset.create({
        data: {
          agencyId: cascadeAgency.id,
          objectKey: `agencies/${cascadeAgency.id}/AGENCY_LOGO/${randomUUID()}.webp`,
          publicUrl: `https://pub.example.test/cascade-${suffix}.webp`,
          kind: 'AGENCY_LOGO',
          mimeType: 'image/webp',
          byteSize: 300,
        },
      });

      // Delete agency
      await prisma.agency.delete({ where: { id: cascadeAgency.id } });

      // Verify asset was cascaded
      const remainingAsset = await prisma.mediaAsset.findUnique({
        where: { id: cascadeAsset.id },
      });
      assert.equal(remainingAsset, null, 'MediaAsset must be deleted when its owning Agency is deleted (CASCADE)');
    });

  } finally {
    // -------------------------------------------------------------------------
    // Cleanup test fixtures
    // -------------------------------------------------------------------------
    if (agencyA && agencyB) {
      await prisma.mediaAsset.deleteMany({
        where: { agencyId: { in: [agencyA.id, agencyB.id] } },
      });
      await prisma.agencyMembership.deleteMany({
        where: { agencyId: { in: [agencyA.id, agencyB.id] } },
      });
      await prisma.agency.deleteMany({
        where: { id: { in: [agencyA.id, agencyB.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [userA.id, userB.id] } },
      });
    }
    await prisma.$disconnect();
  }
});
