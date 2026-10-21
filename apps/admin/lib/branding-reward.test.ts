import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

import { fetchAgencyBranding, type AgencyBrandingInfo } from './settings-loader';
import { updateAgencyBrandingAction, claimBrandingRewardAction } from './settings-actions';
import { API_SESSION_COOKIE } from './admin-mode';

describe('P2.8-AUTH1 — Co-Branding & Monthly AI Credit Reward Suite', () => {
  const dummyToken = 'a'.repeat(43);
  const mockIdentity = {
    userId: 'user-1',
    email: 'admin@agency.test',
    agencyId: 'agency-1',
    membershipId: 'mem-1',
    role: 'OWNER',
    agencyName: 'Agency One',
    agencySlug: 'agency-one',
  };

  beforeEach(() => {
    vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
    cookieStore.get.mockImplementation((name: string) => {
      if (name === API_SESSION_COOKIE) {
        return { name: API_SESSION_COOKIE, value: dummyToken };
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function setupFetchMock(handler: (url: string, init?: RequestInit) => { status: number; body?: unknown }) {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const res = handler(url, init);
      return Promise.resolve(
        res.body !== undefined
          ? Response.json(res.body, { status: res.status })
          : new Response(null, { status: res.status })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  test('1. fetchAgencyBranding returns branding preference, reward state and platform configuration', async () => {
    const mockBranding: AgencyBrandingInfo = {
      platformBrandingEnabled: true,
      coBrandingGloballyEnabled: true,
      effectivePlatformBranding: true,
      rewardLockedUntil: '2026-11-01T00:00:00.000Z',
      lastRewardPeriod: '2026-10',
      isLocked: true,
      isCurrentPeriodClaimed: true,
      currentPeriod: '2026-10',
      rewardCredits: 10,
      brandingRewardEnabledGlobally: true,
      productName: 'Acrov SaaS',
      platformLogoUrl: 'https://r2.test/platform-logo.webp',
      platformIconUrl: null,
    };

    setupFetchMock((url) => {
      if (url.includes('/settings/branding')) {
        return { status: 200, body: mockBranding };
      }
      return { status: 404 };
    });

    const result = await fetchAgencyBranding('agency-1', dummyToken);
    expect(result).toEqual(mockBranding);
    expect(result?.isLocked).toBe(true);
    expect(result?.rewardCredits).toBe(10);
  });

  test('2. updateAgencyBrandingAction updates platformBrandingEnabled without sending reward parameters', async () => {
    let capturedBody: any = null;
    let capturedUrl: string = '';

    setupFetchMock((url, init) => {
      if (url.endsWith('/v1/auth/me')) {
        return { status: 200, body: mockIdentity };
      }
      if (url.includes('/settings/branding')) {
        capturedUrl = url;
        capturedBody = JSON.parse(init?.body as string);
        return {
          status: 200,
          body: {
            platformBrandingEnabled: false,
            rewardLockedUntil: null,
            lastRewardPeriod: null,
            isLocked: false,
            isCurrentPeriodClaimed: false,
            currentPeriod: '2026-10',
            rewardCredits: 10,
            brandingRewardEnabledGlobally: true,
            productName: 'Acrov SaaS',
            platformLogoUrl: null,
            platformIconUrl: null,
          },
        };
      }
      return { status: 404 };
    });

    const formData = new FormData();
    formData.set('platformBrandingEnabled', 'false');

    const result = await updateAgencyBrandingAction(null, formData);
    expect(result.success).toBe(true);
    expect(capturedUrl).toBe('http://127.0.0.1:3002/v1/agencies/agency-1/settings/branding');
    expect(capturedBody).toEqual({ platformBrandingEnabled: false });
    // Verify client NEVER sends credits, period or lock values
    expect(capturedBody.credits).toBeUndefined();
    expect(capturedBody.period).toBeUndefined();
    expect(capturedBody.rewardLockedUntil).toBeUndefined();
  });

  test('3. updateAgencyBrandingAction returns error message when Central API returns 409 Conflict due to active lock', async () => {
    setupFetchMock((url) => {
      if (url.endsWith('/v1/auth/me')) {
        return { status: 200, body: mockIdentity };
      }
      if (url.includes('/settings/branding')) {
        return {
          status: 409,
          body: {
            statusCode: 409,
            message: 'El co-branding está bloqueado hasta el próximo ciclo porque esta agencia recibió la recompensa de créditos IA.',
          },
        };
      }
      return { status: 404 };
    });

    const formData = new FormData();
    formData.set('platformBrandingEnabled', 'false');

    const result = await updateAgencyBrandingAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('bloqueado');
  });

  test('4. claimBrandingRewardAction triggers atomic reward claim without client sending credits or period', async () => {
    let capturedBody: any = null;
    let capturedMethod: string = '';

    setupFetchMock((url, init) => {
      if (url.endsWith('/v1/auth/me')) {
        return { status: 200, body: mockIdentity };
      }
      if (url.includes('/settings/branding/reward')) {
        capturedMethod = init?.method || '';
        capturedBody = init?.body ? JSON.parse(init.body as string) : undefined;
        return {
          status: 201,
          body: {
            success: true,
            claimed: true,
            creditsAwarded: 10,
            period: '2026-10',
            lockedUntil: '2026-11-01T00:00:00.000Z',
            platformBrandingEnabled: true,
            balance: 50,
            message: 'Recompensa de 10 créditos IA reclamada con éxito para el período 2026-10.',
          },
        };
      }
      return { status: 404 };
    });

    const result = await claimBrandingRewardAction(null);
    expect(result.success).toBe(true);
    expect(result.message).toContain('+10 créditos IA');
    expect(capturedMethod).toBe('POST');
    // Body should be empty / contains no credit amount or period from client
    expect(capturedBody).toEqual({});
  });

  test('5. claimBrandingRewardAction handles 409 Conflict when already claimed in current period', async () => {
    setupFetchMock((url) => {
      if (url.endsWith('/v1/auth/me')) {
        return { status: 200, body: mockIdentity };
      }
      if (url.includes('/settings/branding/reward')) {
        return {
          status: 409,
          body: {
            statusCode: 409,
            message: 'La agencia ya reclamó la recompensa de co-branding para el período 2026-10.',
          },
        };
      }
      return { status: 404 };
    });

    const result = await claimBrandingRewardAction(null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('ya reclamó');
  });
});
