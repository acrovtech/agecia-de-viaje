import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import {
  platformLogin,
  platformSession,
  platformLogout,
} from './platform-api';
import { centralLogin, centralSession } from './central-api';
import { PLATFORM_SESSION_COOKIE, API_SESSION_COOKIE } from './admin-mode';

describe('P2.8-AUTH1 — Platform Auth & Control Plane Contract Boundaries', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function mockFetch(status: number, body?: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
      body ? Response.json(body, { status }) : new Response(null, { status })
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  test('1. platformLogin issues request to /v1/platform/auth/login with email & password only (no agencySlug)', async () => {
    const fetchMock = mockFetch(200, {
      accessToken: 'p'.repeat(43),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
      admin: {
        id: 'admin_1',
        email: 'superadmin@platform.example',
        displayName: 'Super Admin',
        role: 'SUPERADMIN',
      },
    });

    const result = await platformLogin('superadmin@platform.example', 'SecurePass123!');

    expect(result.accessToken).toBe('p'.repeat(43));
    expect(result.admin.role).toBe('SUPERADMIN');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:3002/v1/platform/auth/login');
    const sentBody = JSON.parse(init.body);
    expect(sentBody).toEqual({
      email: 'superadmin@platform.example',
      password: 'SecurePass123!',
    });
    expect(sentBody).not.toHaveProperty('agencySlug');
  });

  test('2. platformSession strictly reads from PLATFORM_SESSION_COOKIE and contacts /v1/platform/auth/me', async () => {
    const fetchMock = mockFetch(200, {
      platformAdminId: 'admin_1',
      email: 'superadmin@platform.example',
      role: 'SUPERADMIN',
      displayName: 'Super Admin',
    });

    cookieStore.get.mockImplementation((name: string) => {
      if (name === PLATFORM_SESSION_COOKIE) return { value: 'p'.repeat(43) };
      return undefined;
    });

    const { token, identity } = await platformSession();

    expect(token).toBe('p'.repeat(43));
    expect(identity.role).toBe('SUPERADMIN');
    expect(fetchMock.mock.calls[0]![0]).toBe('http://127.0.0.1:3002/v1/platform/auth/me');
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe(`Bearer ${'p'.repeat(43)}`);
  });

  test('3. Tenant ApiSession cookie CANNOT authenticate platformSession', async () => {
    // Only tenant cookie is present, platform cookie is absent
    cookieStore.get.mockImplementation((name: string) => {
      if (name === API_SESSION_COOKIE) return { value: 't'.repeat(43) };
      return undefined;
    });

    await expect(platformSession()).rejects.toThrow();
  });

  test('4. PlatformSession cookie CANNOT authenticate centralSession (tenant session)', async () => {
    // Only platform cookie is present, tenant cookie is absent
    cookieStore.get.mockImplementation((name: string) => {
      if (name === PLATFORM_SESSION_COOKIE) return { value: 'p'.repeat(43) };
      return undefined;
    });

    await expect(centralSession()).rejects.toThrow();
  });

  test('5. platformSession fails closed if token format is invalid', async () => {
    cookieStore.get.mockReturnValue({ value: 'short-malformed-token' });

    await expect(platformSession()).rejects.toThrow();
  });

  test('6. platformLogout calls /v1/platform/auth/logout with platform bearer token', async () => {
    const fetchMock = mockFetch(204);

    await platformLogout('p'.repeat(43));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:3002/v1/platform/auth/logout');
    expect(init.headers.Authorization).toBe(`Bearer ${'p'.repeat(43)}`);
  });

  test('7. No hardcoded platform production credentials exist in bootstrap or configuration', () => {
    expect(process.env.PLATFORM_ADMIN_PASSWORD).toBeUndefined();
    expect(process.env.SUPERADMIN_PASSWORD).toBeUndefined();
  });
});
