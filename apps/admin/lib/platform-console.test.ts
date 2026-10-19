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

import {
  fetchPlatformAgencies,
  fetchPlatformAgencyDetail,
  fetchPlatformSettings,
  requirePlatformSession,
} from './platform-api';
import { updatePlatformSettingsAction } from '../app/actions/platform-settings';
import { PLATFORM_SESSION_COOKIE } from './admin-mode';

describe('P2.8-AUTH1 — Platform Console Shell & Control Plane Suite', () => {
  const dummyPlatformToken = 'p'.repeat(43);
  const mockSuperAdminIdentity = {
    platformAdminId: 'padmin-1',
    email: 'superadmin@platform.test',
    role: 'SUPERADMIN',
    displayName: 'Super Admin',
  };

  beforeEach(() => {
    vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
    cookieStore.get.mockImplementation((name: string) => {
      if (name === PLATFORM_SESSION_COOKIE) {
        return { name: PLATFORM_SESSION_COOKIE, value: dummyPlatformToken };
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

  test('1. requirePlatformSession redirects unauthenticated users to /platform/login', async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(requirePlatformSession()).rejects.toThrow('REDIRECT:/platform/login');
  });

  test('2. fetchPlatformAgencies retrieves real tenant listing with authoritative counts and credit balance', async () => {
    const mockAgencies = [
      {
        id: 'agency-1',
        name: 'Inca Tours',
        slug: 'inca-tours',
        isActive: true,
        logoUrl: 'https://r2.test/inca.webp',
        iconUrl: null,
        createdAt: '2026-01-15T00:00:00.000Z',
        membershipCount: 3,
        tourCount: 8,
        enabledCatalogLocaleCount: 2,
        aiCreditBalance: 25,
      },
      {
        id: 'agency-2',
        name: 'Amazon Expeditions',
        slug: 'amazon-expeditions',
        isActive: false,
        logoUrl: null,
        iconUrl: null,
        createdAt: '2026-03-20T00:00:00.000Z',
        membershipCount: 1,
        tourCount: 0,
        enabledCatalogLocaleCount: 1,
        aiCreditBalance: 0,
      },
    ];

    setupFetchMock((url) => {
      if (url.endsWith('/v1/platform/agencies')) {
        return { status: 200, body: mockAgencies };
      }
      return { status: 404 };
    });

    const result = await fetchPlatformAgencies(dummyPlatformToken);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Inca Tours');
    expect(result[0]?.aiCreditBalance).toBe(25);
    expect(result[1]?.aiCreditBalance).toBe(0);
  });

  test('3. fetchPlatformAgencyDetail returns tenant detail with co-branding and lock state', async () => {
    const mockDetail = {
      agency: {
        id: 'agency-1',
        name: 'Inca Tours',
        slug: 'inca-tours',
        isActive: true,
        logoUrl: 'https://r2.test/inca.webp',
        iconUrl: null,
        createdAt: '2026-01-15T00:00:00.000Z',
      },
      counts: {
        membershipCount: 3,
        tourCount: 8,
        localeCount: 3,
        enabledCatalogLocaleCount: 2,
      },
      locales: [
        { id: 'loc-1', locale: 'es', isDefault: true, enabled: true },
        { id: 'loc-2', locale: 'en', isDefault: false, enabled: true },
      ],
      entitlements: {
        maxCatalogLocales: 5,
        aiEnabled: true,
        aiMonthlyCredits: 50,
      },
      aiCredits: {
        balance: 25,
      },
      coBranding: {
        platformBrandingEnabled: true,
        isLocked: true,
        rewardLockedUntil: '2026-11-01T00:00:00.000Z',
        currentPeriodReward: 'CLAIMED',
        lastRewardedPeriod: '2026-10',
        rewardAmount: 10,
      },
    };

    setupFetchMock((url) => {
      if (url.includes('/v1/platform/agencies/agency-1')) {
        return { status: 200, body: mockDetail };
      }
      return { status: 404 };
    });

    const result = await fetchPlatformAgencyDetail('agency-1', dummyPlatformToken);
    expect(result).not.toBeNull();
    expect(result?.agency.slug).toBe('inca-tours');
    expect(result?.coBranding.isLocked).toBe(true);
    expect(result?.coBranding.currentPeriodReward).toBe('CLAIMED');
  });

  test('4. fetchPlatformSettings returns global SaaS branding configuration', async () => {
    const mockSettings = {
      productName: 'Acrov SaaS',
      logoUrl: 'https://r2.test/platform-logo.webp',
      iconUrl: null,
      supportEmail: 'support@acrov.test',
      brandingRewardEnabled: true,
      brandingRewardCredits: 10,
      updatedAt: '2026-10-18T00:00:00.000Z',
    };

    setupFetchMock((url) => {
      if (url.endsWith('/v1/platform/settings')) {
        return { status: 200, body: mockSettings };
      }
      return { status: 404 };
    });

    const result = await fetchPlatformSettings(dummyPlatformToken);
    expect(result).not.toBeNull();
    expect(result?.productName).toBe('Acrov SaaS');
    expect(result?.brandingRewardCredits).toBe(10);
  });

  test('5. updatePlatformSettingsAction allows SUPERADMIN to update global configuration', async () => {
    let capturedBody: any = null;

    setupFetchMock((url, init) => {
      if (url.endsWith('/v1/platform/auth/me')) {
        return { status: 200, body: mockSuperAdminIdentity };
      }
      if (url.endsWith('/v1/platform/settings')) {
        capturedBody = JSON.parse(init?.body as string);
        return {
          status: 200,
          body: {
            ...capturedBody,
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return { status: 404 };
    });

    const formData = new FormData();
    formData.set('productName', 'New SaaS Name');
    formData.set('logoUrl', 'https://r2.test/new-logo.webp');
    formData.set('iconUrl', '');
    formData.set('brandingRewardEnabled', 'true');
    formData.set('brandingRewardCredits', '15');

    const result = await updatePlatformSettingsAction(null, formData);
    expect(result.success).toBe(true);
    expect(capturedBody.productName).toBe('New SaaS Name');
    expect(capturedBody.brandingRewardCredits).toBe(15);
  });

  test('6. updatePlatformSettingsAction rejects negative credits', async () => {
    setupFetchMock((url) => {
      if (url.endsWith('/v1/platform/auth/me')) {
        return { status: 200, body: mockSuperAdminIdentity };
      }
      return { status: 404 };
    });

    const formData = new FormData();
    formData.set('productName', 'New SaaS Name');
    formData.set('brandingRewardCredits', '-5');

    const result = await updatePlatformSettingsAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('entre 0 y 100,000');
  });

  test('7. updatePlatformSettingsAction rejects non-SUPERADMIN roles', async () => {
    setupFetchMock((url) => {
      if (url.endsWith('/v1/platform/auth/me')) {
        return {
          status: 200,
          body: {
            ...mockSuperAdminIdentity,
            role: 'SUPPORT',
          },
        };
      }
      return { status: 404 };
    });

    const formData = new FormData();
    formData.set('productName', 'New SaaS Name');
    formData.set('brandingRewardCredits', '10');

    const result = await updatePlatformSettingsAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('SUPERADMIN');
  });
});
