import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import { application, config } from './helpers.mjs';
import { STORAGE_ADAPTER } from '../dist/media/storage/storage-adapter.interface.js';
import { MockStorageAdapter } from '../dist/media/storage/mock-storage.adapter.js';

// Pre-crafted valid image buffers
const VALID_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.alloc(100, 0x11),
]);

const VALID_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
  Buffer.alloc(100, 0x22),
]);

const VALID_WEBP = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
  Buffer.alloc(100, 0x33),
]);

function createTestSession(state, agencyId, role) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const userId = `user-${agencyId}-${role.toLowerCase()}`;
  const membershipId = `mem-${agencyId}-${role.toLowerCase()}`;
  const sessionId = `sess-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 6)}`;
  const password = 'mock-password-hash';
  const passwordHash = createHash('sha256').update(password).digest('hex');

  let user = state.users.find((u) => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      email: `${role.toLowerCase()}@${agencyId}.test`,
      password,
      isActive: true,
      lockedUntil: null,
      tokenVersion: 1,
    };
    state.users.push(user);
  }

  let membership = state.memberships.find((m) => m.id === membershipId);
  if (!membership) {
    membership = {
      id: membershipId,
      userId,
      agencyId,
      role,
      isActive: true,
    };
    state.memberships.push(membership);
  }

  const session = {
    id: sessionId,
    membershipId,
    tokenHash,
    tokenVersion: 1,
    passwordHash,
    expiresAt: new Date(Date.now() + 3600_000),
    revokedAt: null,
  };
  state.apiSessions.push(session);

  return token;
}

test('Tenant-Safe Media Storage & R2 Upload Pipeline (P2.3)', async (t) => {
  const agencyA = { id: 'agency-a-id', name: 'Agency A', slug: 'agency-a', isActive: true };
  const agencyB = { id: 'agency-b-id', name: 'Agency B', slug: 'agency-b', isActive: true };

  const state = {
    agencies: [agencyA, agencyB],
    users: [],
    memberships: [],
    apiSessions: [],
    mediaAssets: [],
    auditLogs: [],
  };

  const mockPrisma = {
    agency: {
      findFirst: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      findUnique: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
    },
    user: {
      findUnique: async ({ where }) => state.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
    },
    agencyMembership: {
      findFirst: async ({ where }) => state.memberships.find((m) => m.userId === where.userId && m.agencyId === where.agencyId) ?? null,
    },
    apiSession: {
      findUnique: async ({ where }) => {
        const session = state.apiSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!session) return null;
        const membership = state.memberships.find((m) => m.id === session.membershipId);
        if (!membership) return null;
        const user = state.users.find((u) => u.id === membership.userId);
        const agency = state.agencies.find((a) => a.id === membership.agencyId);
        return {
          ...session,
          membership: {
            ...membership,
            user,
            agency,
          },
        };
      },
    },
    mediaAsset: {
      create: async ({ data }) => {
        const row = {
          id: `med-${randomUUID().slice(0, 8)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.mediaAssets.push(row);
        return row;
      },
      findMany: async ({ where, take, skip, cursor }) => {
        let results = state.mediaAssets.filter((m) => {
          if (where.agencyId && m.agencyId !== where.agencyId) return false;
          if (where.kind && m.kind !== where.kind) return false;
          return true;
        });
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (cursor) {
          const idx = results.findIndex((r) => r.id === cursor.id);
          if (idx !== -1) results = results.slice(idx + (skip || 0));
        }
        return results.slice(0, take);
      },
      findFirst: async ({ where }) => {
        return state.mediaAssets.find((m) => {
          if (where.id && m.id !== where.id) return false;
          if (where.agencyId && m.agencyId !== where.agencyId) return false;
          return true;
        }) ?? null;
      },
      findUnique: async ({ where }) => {
        return state.mediaAssets.find((m) => m.id === where.id) ?? null;
      },
      delete: async ({ where }) => {
        const idx = state.mediaAssets.findIndex((m) => m.id === where.id);
        if (idx !== -1) {
          return state.mediaAssets.splice(idx, 1)[0];
        }
        return null;
      },
    },
    adminAuditLog: {
      create: async ({ data }) => {
        state.auditLogs.push(data);
        return data;
      },
    },
    $transaction: async (fn) => fn(mockPrisma),
    $disconnect: async () => {},
  };

  const storageAdapter = new MockStorageAdapter();

  const app = await application(
    config({
      API_AUTH_ENABLED: 'true',
      API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b',
      R2_ACCOUNT_ID: 'test-account-id',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_BUCKET_NAME: 'test-bucket',
      R2_PUBLIC_DOMAIN: 'https://cdn.example.test',
    }),
    mockPrisma,
    [],
    (builder) => {
      builder.overrideProvider(STORAGE_ADAPTER).useValue(storageAdapter);
    }
  );

  const server = app.getHttpServer();

  const tokenAdminA = createTestSession(state, agencyA.id, 'ADMIN');
  const tokenEditorA = createTestSession(state, agencyA.id, 'EDITOR');
  const tokenViewerA = createTestSession(state, agencyA.id, 'VIEWER');
  const tokenAdminB = createTestSession(state, agencyB.id, 'ADMIN');

  let assetA, assetB;

  try {
    // -------------------------------------------------------------------------
    // 1. Upload & Tenant Namespace Isolation
    // -------------------------------------------------------------------------
    await t.test('1.1 Agency A uploads valid JPEG: correctly namespaced and stored', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_BANNER')
        .attach('file', VALID_JPEG, 'banner.jpg');

      assert.equal(res.status, 201);
      assert.equal(res.body.agencyId, agencyA.id);
      assert.equal(res.body.kind, 'TOUR_BANNER');
      assert.equal(res.body.mimeType, 'image/jpeg');
      assert.match(res.body.objectKey, new RegExp(`^agencies/${agencyA.id}/tour-banner/[a-f0-9\\-]+\\.jpg$`));
      assert.equal(res.body.publicUrl, `https://cdn.example.test/${res.body.objectKey}`);

      // Verify object exists in storage adapter
      assert.ok(storageAdapter.hasObject(res.body.objectKey), 'Object must be stored in storage adapter');

      // Verify audit log
      const audit = state.auditLogs.find((a) => a.action === 'MEDIA_UPLOAD' && a.entityId === res.body.id);
      assert.ok(audit, 'MEDIA_UPLOAD audit log must be recorded');
      assert.equal(audit.details.agencyId, agencyA.id);
      assert.equal(audit.details.kind, 'TOUR_BANNER');

      assetA = res.body;
    });

    await t.test('1.2 Agency B uploads valid WEBP: correctly namespaced under Agency B', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyB.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .field('kind', 'TOUR_CARD')
        .attach('file', VALID_WEBP, 'card.webp');

      assert.equal(res.status, 201);
      assert.equal(res.body.agencyId, agencyB.id);
      assert.equal(res.body.kind, 'TOUR_CARD');
      assert.match(res.body.objectKey, new RegExp(`^agencies/${agencyB.id}/tour-card/[a-f0-9\\-]+\\.webp$`));
      assert.ok(storageAdapter.hasObject(res.body.objectKey));

      assetB = res.body;
    });

    await t.test('1.3 Editor role can upload media', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenEditorA}`)
        .field('kind', 'VEHICLE')
        .attach('file', VALID_PNG, 'van.png');

      assert.equal(res.status, 201);
      assert.equal(res.body.kind, 'VEHICLE');
      assert.equal(res.body.agencyId, agencyA.id);
    });

    // -------------------------------------------------------------------------
    // 2. Client Filename & Path Traversal Injection Defense
    // -------------------------------------------------------------------------
    await t.test('2.1 Malicious traversal filename does NOT affect objectKey namespace', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'BLOG')
        .attach('file', VALID_PNG, '../../agency-b/secrets/exploit.png');

      assert.equal(res.status, 201);
      assert.equal(res.body.agencyId, agencyA.id);
      // Key MUST start with Agency A's namespace and contain NO directory traversal
      assert.ok(!res.body.objectKey.includes('..'), 'Object key must never contain traversal');
      assert.ok(!res.body.objectKey.includes('agency-b'), 'Object key must never leak foreign agency');
      assert.match(res.body.objectKey, new RegExp(`^agencies/${agencyA.id}/blogs/[a-f0-9\\-]+\\.png$`));
    });

    // -------------------------------------------------------------------------
    // 3. Media Kind Validation
    // -------------------------------------------------------------------------
    await t.test('3.1 Unknown media kind is rejected with 400', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'MALICIOUS_KIND')
        .attach('file', VALID_JPEG, 'image.jpg');

      assert.equal(res.status, 400);
    });

    await t.test('3.2 Missing media kind is rejected with 400', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .attach('file', VALID_JPEG, 'image.jpg');

      assert.equal(res.status, 400);
    });

    // -------------------------------------------------------------------------
    // 4. File Type Security & Magic Bytes
    // -------------------------------------------------------------------------
    await t.test('4.1 Rejects fake JPEG (text with .jpg extension) with 400', async () => {
      const fakeJpeg = Buffer.from('Plain text content pretending to be JPEG');
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_BANNER')
        .attach('file', fakeJpeg, 'fake.jpg');

      assert.equal(res.status, 400);
    });

    await t.test('4.2 Rejects SVG file with 400', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'AGENCY_LOGO')
        .attach('file', svg, 'logo.svg');

      assert.equal(res.status, 400);
    });

    await t.test('4.3 Rejects HTML script polyglot with 400', async () => {
      const html = Buffer.from('<!doctype html><html><script>alert("hack")</script></html>');
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_CARD')
        .attach('file', html, 'card.html');

      assert.equal(res.status, 400);
    });

    await t.test('4.4 Rejects missing file attachment with 400', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_BANNER');

      assert.equal(res.status, 400);
    });

    // -------------------------------------------------------------------------
    // 5. Cross-Tenant Boundaries & Role Enforcement on Upload
    // -------------------------------------------------------------------------
    await t.test('5.1 Agency A cannot upload to Agency B path (returns 403)', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyB.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_BANNER')
        .attach('file', VALID_JPEG, 'image.jpg');

      assert.equal(res.status, 403);
    });

    await t.test('5.2 VIEWER role cannot upload media (returns 403)', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenViewerA}`)
        .field('kind', 'TOUR_BANNER')
        .attach('file', VALID_JPEG, 'image.jpg');

      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------------------
    // 6. Cross-Tenant Listing Isolation
    // -------------------------------------------------------------------------
    await t.test('6.1 Agency A lists only Agency A media, zero Agency B media leaked', async () => {
      const res = await request(server)
        .get(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);

      // Verify EVERY returned asset belongs strictly to Agency A
      for (const item of res.body.data) {
        assert.equal(item.agencyId, agencyA.id, 'Every item must belong to Agency A');
        assert.notEqual(item.id, assetB.id, 'Agency B asset must NOT appear in Agency A list');
      }
    });

    await t.test('6.2 VIEWER role in Agency A can list media (returns 200)', async () => {
      const res = await request(server)
        .get(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenViewerA}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    await t.test('6.3 Agency A cannot list Agency B media (returns 403)', async () => {
      const res = await request(server)
        .get(`/v1/agencies/${agencyB.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------------------
    // 7. Cross-Tenant Deletion Isolation & Role Enforcement
    // -------------------------------------------------------------------------
    await t.test('7.1 Agency A CANNOT delete Agency B asset via Agency A path (returns 404)', async () => {
      const res = await request(server)
        .delete(`/v1/agencies/${agencyA.id}/media/${assetB.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      assert.equal(res.status, 404);
      // Verify Asset B is still present in storage
      assert.ok(storageAdapter.hasObject(assetB.objectKey), 'Asset B must not be deleted');
    });

    await t.test('7.2 Agency A CANNOT delete Agency B asset via Agency B path (returns 403)', async () => {
      const res = await request(server)
        .delete(`/v1/agencies/${agencyB.id}/media/${assetB.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      assert.equal(res.status, 403);
      assert.ok(storageAdapter.hasObject(assetB.objectKey));
    });

    await t.test('7.3 VIEWER role CANNOT delete media (returns 403)', async () => {
      const res = await request(server)
        .delete(`/v1/agencies/${agencyA.id}/media/${assetA.id}`)
        .set('Authorization', `Bearer ${tokenViewerA}`);

      assert.equal(res.status, 403);
      assert.ok(storageAdapter.hasObject(assetA.objectKey));
    });

    await t.test('7.4 Agency A deletes its own asset successfully', async () => {
      const res = await request(server)
        .delete(`/v1/agencies/${agencyA.id}/media/${assetA.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.id, assetA.id);

      // Verify removed from storage
      assert.ok(!storageAdapter.hasObject(assetA.objectKey), 'Object must be deleted from storage');

      // Verify MEDIA_DELETE audit log recorded
      const deleteAudit = state.auditLogs.find((a) => a.action === 'MEDIA_DELETE' && a.entityId === assetA.id);
      assert.ok(deleteAudit, 'MEDIA_DELETE audit log must be recorded');
      assert.equal(deleteAudit.details.agencyId, agencyA.id);
    });

    // -------------------------------------------------------------------------
    // 8. Storage Failure Propagation
    // -------------------------------------------------------------------------
    await t.test('8.1 Storage adapter put failure returns 503 and does not persist asset', async () => {
      storageAdapter.shouldFail = true;
      storageAdapter.failureMessage = 'Cloudflare R2 unreachable';

      const initialCount = state.mediaAssets.length;

      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .field('kind', 'TOUR_GALLERY')
        .attach('file', VALID_JPEG, 'gallery.jpg');

      assert.equal(res.status, 503);
      assert.equal(state.mediaAssets.length, initialCount, 'No asset record must be persisted if storage fails');

      storageAdapter.shouldFail = false;
    });

  } finally {
    await app.close();
  }
});

test('R2 Storage Configuration: Fail-Closed Behavior (P2.3)', async (t) => {
  const agencyA = { id: 'agency-a-id', name: 'Agency A', slug: 'agency-a', isActive: true };
  const state = {
    agencies: [agencyA],
    users: [],
    memberships: [],
    apiSessions: [],
    mediaAssets: [],
    auditLogs: [],
  };

  const mockPrisma = {
    agency: {
      findFirst: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      findUnique: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
    },
    user: {
      findUnique: async ({ where }) => state.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
    },
    agencyMembership: {
      findFirst: async ({ where }) => state.memberships.find((m) => m.userId === where.userId && m.agencyId === where.agencyId) ?? null,
    },
    apiSession: {
      findUnique: async ({ where }) => {
        const session = state.apiSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!session) return null;
        const membership = state.memberships.find((m) => m.id === session.membershipId);
        if (!membership) return null;
        const user = state.users.find((u) => u.id === membership.userId);
        const agency = state.agencies.find((a) => a.id === membership.agencyId);
        return {
          ...session,
          membership: {
            ...membership,
            user,
            agency,
          },
        };
      },
    },
    mediaAsset: {},
    adminAuditLog: {},
    $transaction: async (fn) => fn(mockPrisma),
    $disconnect: async () => {},
  };

  // App configured with real R2StorageAdapter but WITHOUT R2 credentials
  const app = await application(
    config({
      API_AUTH_ENABLED: 'true',
      API_PUBLIC_AGENCY_SLUGS: 'agency-a',
      // Explicitly missing R2 credentials
      R2_ACCOUNT_ID: '',
      R2_ACCESS_KEY_ID: '',
      R2_SECRET_ACCESS_KEY: '',
      R2_BUCKET_NAME: '',
      R2_PUBLIC_DOMAIN: '',
    }),
    mockPrisma
  );

  const server = app.getHttpServer();
  const token = createTestSession(state, agencyA.id, 'ADMIN');

  try {
    await t.test('Unconfigured R2 fails closed with 503 and NEVER returns fake /uploads/...', async () => {
      const res = await request(server)
        .post(`/v1/agencies/${agencyA.id}/media`)
        .set('Authorization', `Bearer ${token}`)
        .field('kind', 'TOUR_BANNER')
        .attach('file', VALID_JPEG, 'banner.jpg');

      // Must fail closed with 503 Service Unavailable
      assert.equal(res.status, 503);
      assert.notEqual(res.status, 200);
      assert.notEqual(res.status, 201);

      // Verify no fake /uploads/ URL was returned
      assert.ok(!JSON.stringify(res.body).includes('/uploads/'), 'Must never return fake /uploads/ fallback');
    });
  } finally {
    await app.close();
  }
});
