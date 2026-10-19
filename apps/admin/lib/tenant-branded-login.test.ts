import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

import { fetchPublicAdminLoginContext, type PublicAdminLoginContext } from './central-api';
import { loginAction } from '../app/actions/auth';
import { API_SESSION_COOKIE, TENANT_HINT_COOKIE } from './admin-mode';

describe('P2.8-AUTH1 — Tenant Branded Login & Context Suite', () => {
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

  test('1. fetchPublicAdminLoginContext resolves Incabound branding with co-branding enabled', async () => {
    const mockContext: PublicAdminLoginContext = {
      agency: {
        slug: 'incabound',
        name: 'Incabound Travel',
        logoUrl: 'https://r2.example.com/incabound-logo.webp',
        iconUrl: null,
      },
      platformBranding: {
        enabled: true,
        productName: 'Acrov SaaS',
        logoUrl: 'https://r2.example.com/platform-logo.webp',
        iconUrl: null,
      },
    };

    const fetchMock = mockFetch(200, mockContext);

    const result = await fetchPublicAdminLoginContext('incabound');

    expect(result).not.toBeNull();
    expect(result?.agency.slug).toBe('incabound');
    expect(result?.agency.name).toBe('Incabound Travel');
    expect(result?.platformBranding.enabled).toBe(true);
    expect(fetchMock.mock.calls[0]![0]).toBe('http://127.0.0.1:3002/v1/public/admin-login-context/incabound');
  });

  test('2. fetchPublicAdminLoginContext returns null on 404 (nonexistent or inactive agency) without leaking errors', async () => {
    mockFetch(404, { statusCode: 404, message: 'Agencia no encontrada o inactiva' });

    const result = await fetchPublicAdminLoginContext('inactive-agency');

    expect(result).toBeNull();
  });

  test('3. fetchPublicAdminLoginContext fails closed without network call if agencySlug is malformed', async () => {
    const fetchMock = mockFetch(200);

    const result = await fetchPublicAdminLoginContext('../traversal');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('4. Co-branding resolution: platform branding disabled reflects in context', async () => {
    const mockContext: PublicAdminLoginContext = {
      agency: {
        slug: 'pure-white-label',
        name: 'White Label Agency',
        logoUrl: 'https://r2.example.com/agency.webp',
        iconUrl: null,
      },
      platformBranding: {
        enabled: false,
        productName: 'Acrov SaaS',
        logoUrl: null,
        iconUrl: null,
      },
    };

    mockFetch(200, mockContext);

    const result = await fetchPublicAdminLoginContext('pure-white-label');

    expect(result?.platformBranding.enabled).toBe(false);
  });

  test('5. Branding fallback hierarchy: missing logos fall back gracefully', async () => {
    const mockContext: PublicAdminLoginContext = {
      agency: {
        slug: 'no-logo-agency',
        name: 'No Logo Tours',
        logoUrl: null,
        iconUrl: 'https://r2.example.com/icon.webp',
      },
      platformBranding: {
        enabled: true,
        productName: 'Acrov SaaS',
        logoUrl: null,
        iconUrl: null, // Should fall back to application /icon.svg
      },
    };

    mockFetch(200, mockContext);

    const result = await fetchPublicAdminLoginContext('no-logo-agency');

    expect(result?.agency.logoUrl).toBeNull();
    expect(result?.agency.iconUrl).toBe('https://r2.example.com/icon.webp');
    expect(result?.platformBranding.logoUrl).toBeNull();
    expect(result?.platformBranding.productName).toBe('Acrov SaaS');
  });

  test('6. Login action transmits route-resolved agencySlug to Central API with email/password', async () => {
    const fetchMock = mockFetch(200, {
      accessToken: 't'.repeat(43),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      agencyId: 'agency_inca',
    });

    const formData = new FormData();
    formData.set('email', 'guide@incabound.test');
    formData.set('password', 'ValidPass2026!');
    formData.set('agencySlug', 'incabound'); // From hidden route context

    await expect(loginAction(null, formData)).rejects.toThrow('REDIRECT:/dashboard');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:3002/v1/auth/login');
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      email: 'guide@incabound.test',
      password: 'ValidPass2026!',
      agencySlug: 'incabound',
    });

    expect(cookieStore.set).toHaveBeenCalledWith(
      API_SESSION_COOKIE,
      't'.repeat(43),
      expect.objectContaining({ httpOnly: true })
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      TENANT_HINT_COOKIE,
      'incabound',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' })
    );
  });

  test('7. Valid credentials without membership in route tenant are rejected by Central API', async () => {
    mockFetch(401, { statusCode: 401, message: 'Unauthorized' });

    const formData = new FormData();
    formData.set('email', 'guide@other-agency.test');
    formData.set('password', 'ValidPass2026!');
    formData.set('agencySlug', 'incabound');

    const result = await loginAction(null, formData);

    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Revisa tus credenciales y el acceso a la agencia');
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
