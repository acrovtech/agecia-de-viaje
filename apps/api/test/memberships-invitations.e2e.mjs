import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { application, config } from './helpers.mjs';

function createTestSession(state, agencyId, role, overrides = {}) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const userId = overrides.userId || `user-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 4)}`;
  const membershipId = overrides.membershipId || `mem-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 4)}`;
  const sessionId = `sess-${agencyId}-${role.toLowerCase()}-${randomUUID().slice(0, 6)}`;
  const password = overrides.password || 'TestPass123!';
  const passwordHash = createHash('sha256').update(password).digest('hex');

  let user = state.users.find((u) => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      email: overrides.email || `${role.toLowerCase()}-${userId}@${agencyId}.test`,
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
      isActive: overrides.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user,
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

  return { token, userId, membershipId };
}

test('Membership Management & Invitation Lifecycle (Parts B & C)', async (t) => {
  const agencyA = { id: 'agency-a-id', name: 'Agencia A', slug: 'agency-a', isActive: true };
  const agencyB = { id: 'agency-b-id', name: 'Agencia B', slug: 'agency-b', isActive: true };

  const state = {
    agencies: [agencyA, agencyB],
    users: [],
    memberships: [],
    apiSessions: [],
    invitations: [],
    auditLogs: [],
  };

  const mockPrisma = {
    agency: {
      findUnique: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
      findFirst: async ({ where }) => state.agencies.find((a) => (where.id ? a.id === where.id : a.slug === where.slug)) ?? null,
    },
    user: {
      findUnique: async ({ where }) => state.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
      create: async ({ data }) => {
        const row = { id: `user-${randomUUID().slice(0, 8)}`, ...data };
        state.users.push(row);
        return row;
      },
    },
    agencyMembership: {
      findFirst: async ({ where }) => {
        return state.memberships.find((m) => {
          if (where.id && m.id !== where.id) return false;
          if (where.agencyId && m.agencyId !== where.agencyId) return false;
          if (where.userId && m.userId !== where.userId) return false;
          return true;
        }) ?? null;
      },
      findUnique: async ({ where }) => {
        if (where.agencyId_userId) {
          return state.memberships.find((m) => m.agencyId === where.agencyId_userId.agencyId && m.userId === where.agencyId_userId.userId) ?? null;
        }
        return state.memberships.find((m) => m.id === where.id) ?? null;
      },
      findMany: async ({ where }) => {
        return state.memberships.filter((m) => {
          if (where.agencyId && m.agencyId !== where.agencyId) return false;
          if (where.id?.gt && m.id <= where.id.gt) return false;
          return true;
        });
      },
      update: async ({ where, data }) => {
        const mem = state.memberships.find((m) => m.id === where.id);
        if (!mem) throw new Error('Membership not found');
        Object.assign(mem, data, { updatedAt: new Date() });
        return { ...mem, user: state.users.find((u) => u.id === mem.userId) };
      },
      delete: async ({ where }) => {
        const idx = state.memberships.findIndex((m) => m.id === where.id);
        if (idx !== -1) state.memberships.splice(idx, 1);
        return { success: true };
      },
      create: async ({ data }) => {
        const user = state.users.find((u) => u.id === data.userId);
        const row = {
          id: `mem-${randomUUID().slice(0, 8)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          user,
        };
        state.memberships.push(row);
        return row;
      },
    },
    agencyInvitation: {
      findUnique: async ({ where, include }) => {
        let inv = null;
        if (where.tokenHash) {
          inv = state.invitations.find((i) => i.tokenHash === where.tokenHash) ?? null;
        } else if (where.id) {
          inv = state.invitations.find((i) => i.id === where.id) ?? null;
        }
        if (inv && include?.agency) {
          const agency = state.agencies.find((a) => a.id === inv.agencyId);
          return { ...inv, agency };
        }
        return inv;
      },
      findFirst: async ({ where }) => {
        return state.invitations.find((i) => {
          if (where.id && i.id !== where.id) return false;
          if (where.agencyId && i.agencyId !== where.agencyId) return false;
          return true;
        }) ?? null;
      },
      findMany: async ({ where }) => {
        return state.invitations
          .filter((i) => i.agencyId === where.agencyId)
          .map((inv) => {
            const user = state.users.find((u) => u.id === inv.invitedById);
            return {
              ...inv,
              invitedBy: user ? { id: user.id, name: user.name, email: user.email } : null,
            };
          });
      },
      upsert: async ({ where, create, update }) => {
        let inv = state.invitations.find(
          (i) => i.agencyId === where.agencyId_email.agencyId && i.email === where.agencyId_email.email
        );
        if (!inv) {
          inv = {
            id: `inv-${randomUUID().slice(0, 8)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            acceptedAt: null,
            revokedAt: null,
            ...create,
          };
          state.invitations.push(inv);
        } else {
          Object.assign(inv, update, { updatedAt: new Date() });
        }
        return { ...inv };
      },
      update: async ({ where, data }) => {
        const inv = state.invitations.find((i) => i.id === where.id);
        if (!inv) throw new Error('Invitation not found');
        Object.assign(inv, data, { updatedAt: new Date() });
        return { ...inv };
      },
    },
    apiSession: {
      findUnique: async ({ where }) => {
        const session = state.apiSessions.find((s) => s.tokenHash === where.tokenHash);
        if (!session) return null;
        const membership = state.memberships.find((m) => m.id === session.membershipId);
        if (!membership) return null;
        const user = state.users.find((u) => u.id === membership.userId);
        const agency = state.agencies.find((a) => a.id === membership.agencyId);
        return { ...session, membership: { ...membership, user, agency } };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const s of state.apiSessions) {
          if (where.membershipId && s.membershipId !== where.membershipId) continue;
          if (where.revokedAt === null && s.revokedAt !== null) continue;
          Object.assign(s, data);
          count++;
        }
        return { count };
      },
    },
    adminAuditLog: {
      create: async ({ data }) => {
        const row = { id: `log-${randomUUID().slice(0, 8)}`, createdAt: new Date(), ...data };
        state.auditLogs.push(row);
        return row;
      },
    },
    transactionalNotification: {
      upsert: async ({ create }) => {
        return { id: `notif-${randomUUID().slice(0, 8)}`, ...create, createdAt: new Date(), updatedAt: new Date() };
      },
      create: async ({ data }) => {
        return { id: `notif-${randomUUID().slice(0, 8)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      },
      findUnique: async () => null,
      findMany: async () => [],
    },
    $queryRaw: async (queryParts, ...params) => {
      // Simulate PostgreSQL row lock queries for owner protection or invitation acceptance
      const fullQuery = Array.isArray(queryParts) ? queryParts.join(' ') : String(queryParts);
      if (fullQuery.includes('AgencyMembership') && fullQuery.includes('OWNER')) {
        const agencyId = params[0];
        const activeOwners = state.memberships.filter(
          (m) => m.agencyId === agencyId && m.role === 'OWNER' && m.isActive
        );
        return activeOwners.map((o) => ({ id: o.id }));
      }
      if (fullQuery.includes('AgencyInvitation')) {
        const tokenHash = params[0];
        const inv = state.invitations.find((i) => i.tokenHash === tokenHash);
        return inv ? [inv] : [];
      }
      return [];
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  const app = await application(
    config({ API_AUTH_ENABLED: 'true', API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b' }),
    mockPrisma
  );

  const ownerA = createTestSession(state, 'agency-a-id', 'OWNER');
  const adminA = createTestSession(state, 'agency-a-id', 'ADMIN');
  const editorA = createTestSession(state, 'agency-a-id', 'EDITOR');
  const operatorA = createTestSession(state, 'agency-a-id', 'OPERATOR');
  const viewerA = createTestSession(state, 'agency-a-id', 'VIEWER');
  const ownerB = createTestSession(state, 'agency-b-id', 'OWNER');

  // 1. ROLE AUTHORITY MATRIX: INVITATIONS
  await t.test('1. Role authority matrix for invitations', async () => {
    // EDITOR cannot invite
    const edRes = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${editorA.token}`)
      .send({ email: 'new-editor@agency-a.test', role: 'VIEWER' });
    assert.equal(edRes.status, 403);

    // ADMIN cannot invite ADMIN
    const adminToAdmin = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email: 'another-admin@agency-a.test', role: 'ADMIN' });
    assert.equal(adminToAdmin.status, 403);

    // No one can invite OWNER (excluded by schema)
    const inviteOwner = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ email: 'new-owner@agency-a.test', role: 'OWNER' });
    assert.equal(inviteOwner.status, 400);

    // ADMIN can invite OPERATOR
    const adminToOp = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email: 'new-op@agency-a.test', role: 'OPERATOR' });
    assert.equal(adminToOp.status, 201);
    assert.equal(adminToOp.body.notificationState, 'PENDING');

    // OWNER can invite ADMIN
    const ownerToAdmin = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ email: 'sub-admin@agency-a.test', role: 'ADMIN' });
    assert.equal(ownerToAdmin.status, 201);
    assert.equal(ownerToAdmin.body.notificationState, 'PENDING');
  });

  // 2. OWNER PROTECTION: Cannot demote, deactivate, or delete the final active OWNER
  await t.test('2. Final Owner Protection prevents zero active owners', async () => {
    // Demote sole owner -> 409
    const demoteRes = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${ownerA.membershipId}`)
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ role: 'ADMIN' });
    assert.equal(demoteRes.status, 409);

    // Deactivate sole owner -> 409
    const deactRes = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${ownerA.membershipId}`)
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ isActive: false });
    assert.equal(deactRes.status, 409);

    // Delete sole owner -> 409
    const deleteRes = await request(app.getHttpServer())
      .delete(`/v1/agencies/agency-a-id/memberships/${ownerA.membershipId}`)
      .set('Authorization', `Bearer ${ownerA.token}`);
    assert.equal(deleteRes.status, 409);
  });

  // 3. ADMIN RESTRICTIONS ON MEMBERSHIPS
  await t.test('3. Admin restrictions on modifying memberships', async () => {
    // ADMIN cannot modify OWNER
    const modOwner = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${ownerA.membershipId}`)
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ role: 'VIEWER' });
    assert.equal(modOwner.status, 403);

    // ADMIN cannot delete member (delete is OWNER-only)
    const delMem = await request(app.getHttpServer())
      .delete(`/v1/agencies/agency-a-id/memberships/${editorA.membershipId}`)
      .set('Authorization', `Bearer ${adminA.token}`);
    assert.equal(delMem.status, 403);

    // ADMIN can modify EDITOR role to VIEWER
    const modEditor = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${editorA.membershipId}`)
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ role: 'VIEWER' });
    assert.equal(modEditor.status, 200);
    assert.equal(modEditor.body.role, 'VIEWER');
  });

  // 4. SESSION REVOCATION ON ROLE CHANGE AND DEACTIVATION
  await t.test('4. Session revocation on role change and deactivation', async () => {
    // Check that editor's session was revoked during the role change above
    const editorSession = state.apiSessions.find((s) => s.membershipId === editorA.membershipId);
    assert.ok(editorSession.revokedAt, 'Expected session to be revoked on role change');

    // Recreate active session for operator
    const opSession = state.apiSessions.find((s) => s.membershipId === operatorA.membershipId);
    assert.equal(opSession.revokedAt, null);

    // Deactivate operator
    const deactOp = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${operatorA.membershipId}`)
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ isActive: false });
    assert.equal(deactOp.status, 200);

    // Session is now revoked
    assert.ok(opSession.revokedAt, 'Expected session to be revoked on deactivation');
  });

  // 5. INVITATIONS LIFECYCLE: PUBLIC LOOKUP & ACCEPTANCE
  await t.test('5. Public Invitation Lookup & Acceptance for New User', async () => {
    // Create invitation for new user
    const createRes = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ email: 'fresh-hire@example.test', role: 'OPERATOR' });

    assert.equal(createRes.status, 201);
    const rawToken = createRes.body._devRawToken;
    assert.ok(rawToken, 'Dev raw token should be returned in test mode');

    // Public lookup
    const lookupRes = await request(app.getHttpServer()).get(`/v1/invitations/${rawToken}`);
    assert.equal(lookupRes.status, 200);
    assert.equal(lookupRes.body.agencyName, 'Agencia A');
    assert.equal(lookupRes.body.email, 'fresh-hire@example.test');
    assert.equal(lookupRes.body.role, 'OPERATOR');
    assert.equal(lookupRes.body.isExistingUser, false);

    // Password validation: multibyte Unicode password (40 chars <= 72, but 80 bytes > 72 UTF-8 bytes) -> rejected 400
    const unicodePass = 'ñ'.repeat(40);
    const unicodeRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({
        name: 'Fresh Hire',
        password: unicodePass,
      });
    assert.equal(unicodeRes.status, 400);
    assert.equal(unicodeRes.body.error?.code, 'INVALID_REQUEST');
    // Password content must NEVER be exposed in error response
    assert.ok(!JSON.stringify(unicodeRes.body).includes(unicodePass), 'Password must not be exposed in error response');

    // Password exceeding 72 ASCII bytes (73 bytes) -> rejected 400
    const longAsciiRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({
        name: 'Fresh Hire',
        password: 'A'.repeat(73),
      });
    assert.equal(longAsciiRes.status, 400);

    // Password under 8 characters -> rejected 400
    const shortPassRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({
        name: 'Fresh Hire',
        password: 'Short1',
      });
    assert.equal(shortPassRes.status, 400);

    // Safe boundary accepted: exactly 72 ASCII characters / bytes
    const safeBoundaryPass = 'A'.repeat(72);
    const acceptBoundaryProbe = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({
        name: 'Fresh Hire',
        password: safeBoundaryPass,
      });
    assert.equal(acceptBoundaryProbe.status, 200);
    assert.equal(acceptBoundaryProbe.body.success, true);

    // Replay protection: cannot accept same invitation twice
    const replayRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({
        name: 'Fresh Hire Again',
        password: 'SecurePassword123!',
      });
    assert.equal(replayRes.status, 409);
  });

  // 6. INVITATION ACCEPTANCE FOR EXISTING USER WITHOUT PASSWORD OVERWRITE
  await t.test('6. Invitation acceptance for Existing User requires password verification', async () => {
    const existingPassword = 'ExistingUserPass123!';
    const passwordHash = await hash(existingPassword, 10);
    const existingUser = {
      id: 'existing-global-user-id',
      email: 'global-traveler@example.test',
      name: 'Global Traveler',
      password: passwordHash,
      isActive: true,
      lockedUntil: null,
      tokenVersion: 1,
    };
    state.users.push(existingUser);

    // Create invitation for this existing user in Agency A
    const createRes = await request(app.getHttpServer())
      .post('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ email: 'global-traveler@example.test', role: 'EDITOR' });
    const rawToken = createRes.body._devRawToken;

    // Public lookup reports isExistingUser = true
    const lookupRes = await request(app.getHttpServer()).get(`/v1/invitations/${rawToken}`);
    assert.equal(lookupRes.body.isExistingUser, true);

    // Wrong password rejected with 401
    const wrongPassRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({ password: 'WrongPassword!' });
    assert.equal(wrongPassRes.status, 401);

    // Correct password succeeds
    const correctRes = await request(app.getHttpServer())
      .post(`/v1/invitations/${rawToken}/accept`)
      .send({ password: existingPassword });
    assert.equal(correctRes.status, 200);

    // Verify existing user password was NOT overwritten
    const checkUser = state.users.find((u) => u.id === 'existing-global-user-id');
    assert.equal(checkUser.password, passwordHash);

    // Verify membership created
    const mem = state.memberships.find(
      (m) => m.agencyId === 'agency-a-id' && m.userId === 'existing-global-user-id'
    );
    assert.ok(mem);
    assert.equal(mem.role, 'EDITOR');
  });

  // 7. CROSS-TENANT ISOLATION
  await t.test('7. Cross-tenant isolation on memberships and invitations', async () => {
    // Agency B OWNER cannot list Agency A memberships
    const listRes = await request(app.getHttpServer())
      .get('/v1/agencies/agency-a-id/memberships')
      .set('Authorization', `Bearer ${ownerB.token}`);
    assert.equal(listRes.status, 403);

    // Agency B OWNER cannot modify Agency A membership
    const patchRes = await request(app.getHttpServer())
      .patch(`/v1/agencies/agency-a-id/memberships/${adminA.membershipId}`)
      .set('Authorization', `Bearer ${ownerB.token}`)
      .send({ role: 'OPERATOR' });
    assert.equal(patchRes.status, 403);

    // Agency B OWNER cannot list Agency A invitations
    const listInvRes = await request(app.getHttpServer())
      .get('/v1/agencies/agency-a-id/invitations')
      .set('Authorization', `Bearer ${ownerB.token}`);
    assert.equal(listInvRes.status, 403);
  });

  // 8. AUDIT LOG VALIDATION
  await t.test('8. AdminAuditLog verifies membership & invitation audit actions', async () => {
    const actions = state.auditLogs.map((l) => l.action);
    assert.ok(actions.includes('MEMBERSHIP_INVITED'), 'MEMBERSHIP_INVITED should be logged');
    assert.ok(actions.includes('MEMBERSHIP_ROLE_CHANGED'), 'MEMBERSHIP_ROLE_CHANGED should be logged');
    assert.ok(actions.includes('MEMBERSHIP_DEACTIVATED'), 'MEMBERSHIP_DEACTIVATED should be logged');
    assert.ok(actions.includes('INVITATION_ACCEPTED'), 'INVITATION_ACCEPTED should be logged');
  });

  // 9. DEDICATED INVITATION ACCEPT RATE LIMIT THROTTLE (10 attempts / 60s)
  await t.test('9. Public invitation acceptance endpoint enforces dedicated rate limit (10 attempts / 60s)', async () => {
    let throttled429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await request(app.getHttpServer())
        .post('/v1/invitations/throttle-probe-token/accept')
        .send({ password: 'ProbePassword123!' });
      if (res.status === 429) {
        throttled429 = true;
        break;
      }
    }
    assert.ok(throttled429, 'Expected HTTP 429 Too Many Requests when exceeding acceptance throttle');
  });

  await app.close();
});
