import { afterEach, expect, test, vi } from 'vitest';

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

import { platformLoginAction, platformLogoutAction } from './platform-auth';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function setup(status: number, body?: unknown) {
  vi.stubEnv('ADMIN_AUTH_MODE', 'api');
  vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
  const fetchMock = vi.fn().mockResolvedValue(
    body ? Response.json(body, { status }) : new Response(null, { status })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function platformForm() {
  const data = new FormData();
  data.set('email', 'superadmin@platform.test');
  data.set('password', 'SuperSecurePass123*');
  return data;
}

test('platform login sets dedicated platform_admin_session HttpOnly cookie and redirects to /platform', async () => {
  setup(200, {
    accessToken: 'p'.repeat(43),
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
    admin: {
      id: 'admin_1',
      email: 'superadmin@platform.test',
      displayName: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });
  vi.stubEnv('NODE_ENV', 'production');

  await expect(platformLoginAction(null, platformForm())).rejects.toThrow('REDIRECT:/platform');

  expect(cookieStore.set).toHaveBeenCalledWith(
    'platform_admin_session',
    'p'.repeat(43),
    expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
  );
});

test('platform login failure 401 returns controlled error without setting cookie', async () => {
  setup(401);
  const result = await platformLoginAction(null, platformForm());
  expect(result).toHaveProperty('error');
  expect(result.error).toContain('Credenciales incorrectas');
  expect(cookieStore.set).not.toHaveBeenCalled();
});

test('platform login validates password <= 72 bytes before network call', async () => {
  const fetchMock = setup(200);
  const data = platformForm();
  data.set('password', 'a'.repeat(73));
  const result = await platformLoginAction(null, data);
  expect(result).toHaveProperty('error');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('platform logout revokes session upstream and deletes platform_admin_session cookie', async () => {
  const fetchMock = setup(204);
  cookieStore.get.mockReturnValue({ value: 'p'.repeat(43) });

  await expect(platformLogoutAction()).rejects.toThrow('REDIRECT:/platform/login');
  expect(fetchMock.mock.calls[0]![0]).toMatch(/\/v1\/platform\/auth\/logout$/);
  expect(cookieStore.delete).toHaveBeenCalledWith('platform_admin_session');
});
