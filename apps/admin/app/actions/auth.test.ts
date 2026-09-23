import { afterEach, expect, test, vi } from 'vitest';
const { cookieStore, dbLookup } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() }, dbLookup: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock('@repo/db', () => ({ prisma: { user: { findUnique: dbLookup } } }));
vi.mock('../../lib/jwt', () => ({ createAdminToken: vi.fn() }));
import { loginAction, logoutAction } from './auth';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function setup(status: number, body?: unknown) {
  vi.stubEnv('ADMIN_AUTH_MODE', 'api');
  vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
  const fetchMock = vi.fn().mockResolvedValue(body ? Response.json(body, { status }) : new Response(null, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
function form() {
  const data = new FormData();
  data.set('email', 'u@example.test'); data.set('password', 'example-password'); data.set('agencySlug', 'agency-a');
  return data;
}
test('central login sets an HttpOnly cookie and never returns the bearer to client state', async () => {
  setup(200, { accessToken: 'a'.repeat(43), tokenType: 'Bearer', expiresAt: new Date(Date.now() + 3600000).toISOString(), agencyId: 'a' });
  vi.stubEnv('NODE_ENV', 'production');
  await expect(loginAction(null, form())).rejects.toThrow('REDIRECT:/workspace');
  expect(cookieStore.set).toHaveBeenCalledWith('admin_api_session', 'a'.repeat(43), expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }));
  expect(cookieStore.delete).toHaveBeenCalledWith('admin_session');
  expect(dbLookup).not.toHaveBeenCalled();
});
test.each([401, 503])('login failure %i never falls back to the old database', async (status) => {
  setup(status);
  expect(await loginAction(null, form())).toHaveProperty('error');
  expect(cookieStore.set).not.toHaveBeenCalled();
  expect(dbLookup).not.toHaveBeenCalled();
});
test('missing agency is rejected before contacting API', async () => {
  const fetchMock = setup(401);
  const data = form(); data.delete('agencySlug');
  expect(await loginAction(null, data)).toHaveProperty('error');
  expect(fetchMock).not.toHaveBeenCalled();
});
test('logout revokes upstream before deleting the browser session', async () => {
  const fetchMock = setup(204);
  cookieStore.get.mockReturnValue({ value: 'a'.repeat(43) });
  await expect(logoutAction()).rejects.toThrow('REDIRECT:/login');
  expect(fetchMock.mock.calls[0]![0]).toMatch(/\/v1\/auth\/logout$/);
  expect(cookieStore.delete).toHaveBeenCalledWith('admin_api_session');
});
test('failed revocation preserves the cookie and offers retry instead of claiming logout', async () => {
  setup(503);
  cookieStore.get.mockReturnValue({ value: 'a'.repeat(43) });
  await expect(logoutAction()).rejects.toThrow('REDIRECT:/workspace?logout=unavailable');
  expect(cookieStore.delete).not.toHaveBeenCalled();
});
