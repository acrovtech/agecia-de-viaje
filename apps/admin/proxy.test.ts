import { afterEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

afterEach(() => vi.unstubAllEnvs());
function req(path: string, method = 'GET', cookie = `admin_api_session=${'a'.repeat(43)}`) {
  vi.stubEnv('ADMIN_AUTH_MODE', 'api');
  return new NextRequest(`https://admin.example.test${path}`, { method, headers: { cookie } });
}
test('central workspace ignores a legacy cookie', async () => {
  const response = await proxy(req('/workspace', 'GET', 'admin_session=legacy.jwt'));
  expect(response.headers.get('location')).toBe('https://admin.example.test/login');
});
test.each(['/reservas', '/usuarios', '/logs', '/tours/other-agency.svg', '/workspace/content/legacy', '/workspace/resources/legacy'])('unmigrated page %s cannot render in API mode', async (path) => {
  expect((await proxy(req(path))).headers.get('location')).toBe('https://admin.example.test/workspace');
});
test.each(['/api/upload', '/api/seed', '/reservas', '/icon.svg'])('legacy write surface %s is denied', async (path) => {
  expect((await proxy(req(path, 'POST'))).status).toBe(403);
});
test('workspace and login reach their own server authorization', async () => {
  expect((await proxy(req('/workspace'))).headers.get('x-middleware-next')).toBe('1');
  expect((await proxy(req('/workspace/content', 'POST'))).headers.get('x-middleware-next')).toBe('1');
  expect((await proxy(req('/workspace/resources', 'POST'))).headers.get('x-middleware-next')).toBe('1');
  expect((await proxy(req('/workspace/reservations', 'POST'))).headers.get('x-middleware-next')).toBe('1');
  expect((await proxy(req('/login', 'POST', ''))).headers.get('x-middleware-next')).toBe('1');
});
