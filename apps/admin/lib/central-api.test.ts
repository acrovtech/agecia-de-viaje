import { afterEach, expect, test, vi } from 'vitest';
const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: getCookie }) }));
import { centralLogin, centralLogout, centralRequest, centralSession } from './central-api';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function setup(response: Response) {
  vi.stubEnv('ADMIN_AUTH_MODE', 'api');
  vi.stubEnv('ADMIN_API_URL', 'http://127.0.0.1:3002');
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const identity = { userId: 'user', email: 'u@example.test', agencyId: 'agency-a', membershipId: 'm', role: 'VIEWER', agencyName: 'A', agencySlug: 'agency-a' };

test('server session is validated upstream without caching or sharing browser cookies', async () => {
  const fetchMock = setup(Response.json(identity));
  getCookie.mockReturnValue({ value: 'a'.repeat(43) });
  expect((await centralSession()).identity).toEqual(identity);
  const [url, options] = fetchMock.mock.calls[0]!;
  expect(url).toBe('http://127.0.0.1:3002/v1/auth/me');
  expect(options.cache).toBe('no-store');
  expect(options.redirect).toBe('error');
  expect(options.headers.Authorization).toBe(`Bearer ${'a'.repeat(43)}`);
  expect(options.headers.Cookie).toBeUndefined();
});
test('legacy JWT cannot be used as a central token', async () => {
  const fetchMock = setup(Response.json(identity));
  getCookie.mockReturnValue({ value: 'signed.jwt.value' });
  await expect(centralSession()).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
test.each([401, 403, 503])('upstream failure %i is propagated without a local identity fallback', async (status) => {
  setup(new Response('internal details', { status }));
  getCookie.mockReturnValue({ value: 'a'.repeat(43) });
  await expect(centralSession()).rejects.toMatchObject({ status });
});
test('invalid upstream identity is rejected', async () => {
  setup(Response.json({ ...identity, role: 'SUPERADMIN' }));
  getCookie.mockReturnValue({ value: 'a'.repeat(43) });
  await expect(centralSession()).rejects.toMatchObject({ status: 503 });
});
test('login forwards only credential fields and validates the returned token', async () => {
  const fetchMock = setup(Response.json({ accessToken: 'a'.repeat(43), tokenType: 'Bearer', agencyId: 'agency-a', expiresAt: new Date(Date.now() + 3600000).toISOString() }));
  await centralLogin('u@example.test', 'password', 'agency-a');
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ email: 'u@example.test', password: 'password', agencySlug: 'agency-a' });
});
test('logout accepts an already revoked token but never hides an API outage', async () => {
  setup(new Response(null, { status: 401 }));
  await expect(centralLogout('a'.repeat(43))).resolves.toBeUndefined();
  setup(new Response(null, { status: 503 }));
  await expect(centralLogout('a'.repeat(43))).rejects.toMatchObject({ status: 503 });
});
test('central client is unavailable in legacy mode', async () => {
  const fetchMock = setup(Response.json(identity));
  vi.stubEnv('ADMIN_AUTH_MODE', 'legacy');
  await expect(centralRequest('/v1/auth/me')).rejects.toMatchObject({ status: 403 });
  expect(fetchMock).not.toHaveBeenCalled();
});
