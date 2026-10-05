import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isApiAdmin, API_SESSION_COOKIE } from './lib/admin-mode';
import { proxy } from './proxy';
import {
  verifyAdminSession,
  requireAdminSession,
  requireMasterRole,
  requireOperatorOrMaster,
  requireContentOrMaster,
  requireAnyRole,
} from './lib/auth-check';

// Mock cookies for Next.js headers
let mockCookieStore: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (mockCookieStore[name] ? { name, value: mockCookieStore[name] } : undefined),
    set: vi.fn((name: string, value: string) => { mockCookieStore[name] = value; }),
    delete: vi.fn((name: string) => { delete mockCookieStore[name]; }),
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  revalidatePath: vi.fn(),
}));

vi.mock('@repo/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    reservation: { update: vi.fn(), findUnique: vi.fn() },
    tour: { update: vi.fn(), delete: vi.fn() },
    transfer: { update: vi.fn(), delete: vi.fn() },
    coupon: { findMany: vi.fn() },
  },
  handlePrismaError: (err: any) => err?.message || 'Prisma error',
}));

function makeRequest(path: string, method = 'GET', cookies: Record<string, string> = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(`https://admin.example.test${path}`, {
    method,
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe('SaaS Admin Fail-Closed Security Suite', () => {
  beforeEach(() => {
    mockCookieStore = {};
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('1. Configuration & Fail-Closed Policy (isApiAdmin)', () => {
    it('1. missing ADMIN_AUTH_MODE defaults safely to API in development/test', () => {
      vi.stubEnv('NODE_ENV', 'development');
      delete process.env.ADMIN_AUTH_MODE;
      expect(isApiAdmin()).toBe(true);

      vi.stubEnv('NODE_ENV', 'test');
      delete process.env.ADMIN_AUTH_MODE;
      expect(isApiAdmin()).toBe(true);
    });

    it('2. ADMIN_AUTH_MODE=api selects API mode in all environments', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ADMIN_AUTH_MODE', 'api');
      expect(isApiAdmin()).toBe(true);

      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ADMIN_AUTH_MODE', 'api');
      expect(isApiAdmin()).toBe(true);
    });

    it('3. ADMIN_AUTH_MODE=legacy in production is rejected and throws configuration error', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ADMIN_AUTH_MODE', 'legacy');
      expect(() => isApiAdmin()).toThrowError(/ADMIN_AUTH_MODE=api es obligatorio en entorno de producción/);
    });

    it('4. unknown ADMIN_AUTH_MODE values are rejected in development and production', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ADMIN_AUTH_MODE', 'unsupported_mode');
      expect(() => isApiAdmin()).toThrowError(/ADMIN_AUTH_MODE inválido/);

      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ADMIN_AUTH_MODE', 'unsupported_mode');
      expect(() => isApiAdmin()).toThrowError(/ADMIN_AUTH_MODE=api es obligatorio en entorno de producción/);
    });

    it('5. production without explicit ADMIN_AUTH_MODE=api fails closed immediately', () => {
      vi.stubEnv('NODE_ENV', 'production');
      delete process.env.ADMIN_AUTH_MODE;
      expect(() => isApiAdmin()).toThrowError(/ADMIN_AUTH_MODE=api es obligatorio en entorno de producción/);

      vi.stubEnv('ADMIN_AUTH_MODE', '');
      expect(() => isApiAdmin()).toThrowError(/ADMIN_AUTH_MODE=api es obligatorio en entorno de producción/);
    });
  });

  describe('2. Proxy & Routing Isolation', () => {
    const validApiToken = 'a'.repeat(43);

    beforeEach(() => {
      vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    });

    it('6. /workspace works in API mode with valid API session token', async () => {
      const req = makeRequest('/workspace', 'GET', { [API_SESSION_COOKIE]: validApiToken });
      const res = await proxy(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('7. legitimate /workspace/... subroutes are not accidentally blocked', async () => {
      const subroutes = [
        '/workspace/content',
        '/workspace/resources',
        '/workspace/reservations',
        '/workspace/content/tours/edit',
        '/workspace/resources/vehicles/new',
        '/workspace/reservations/preview/123',
      ];

      for (const route of subroutes) {
        const req = makeRequest(route, 'GET', { [API_SESSION_COOKIE]: validApiToken });
        const res = await proxy(req);
        expect(res.headers.get('x-middleware-next')).toBe('1');
      }
    });

    it('8. legacy dashboard routes redirect safely to /dashboard in API mode for GET', async () => {
      const legacyPages = ['/', '/reservas', '/tours', '/transporte', '/usuarios', '/cupones', '/blogs', '/megamenus', '/logs'];

      for (const page of legacyPages) {
        const req = makeRequest(page, 'GET', { [API_SESSION_COOKIE]: validApiToken });
        const res = await proxy(req);
        expect(res.headers.get('location')).toBe('https://admin.example.test/dashboard');
      }
    });

    it('9. legacy mutation and API paths receive 403 Forbidden in API mode', async () => {
      const forbiddenCalls = [
        { path: '/api/upload', method: 'POST' },
        { path: '/api/seed', method: 'GET' },
        { path: '/api/seed', method: 'POST' },
        { path: '/reservas', method: 'POST' },
        { path: '/tours', method: 'POST' },
        { path: '/transporte', method: 'POST' },
        { path: '/usuarios', method: 'POST' },
        { path: '/cupones', method: 'POST' },
        { path: '/icon.svg', method: 'POST' },
      ];

      for (const { path, method } of forbiddenCalls) {
        const req = makeRequest(path, method, { [API_SESSION_COOKIE]: validApiToken });
        const res = await proxy(req);
        expect(res.status).toBe(403);
      }
    });

    it('10. static assets required by login and workspace still work for GET/HEAD', async () => {
      const staticAssets = ['/icon.svg', '/logo.svg', '/favicon.ico', '/_next/static/css/app.css', '/integrations/izipay.png'];

      for (const asset of staticAssets) {
        const reqGet = makeRequest(asset, 'GET');
        const resGet = await proxy(reqGet);
        expect(resGet.headers.get('x-middleware-next')).toBe('1');

        const reqHead = makeRequest(asset, 'HEAD');
        const resHead = await proxy(reqHead);
        expect(resHead.headers.get('x-middleware-next')).toBe('1');
      }
    });
  });

  describe('3. Legacy Action Isolation & Invariant', () => {
    beforeEach(() => {
      vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    });

    it('11. legacy reservation guards reject API session and throw unauthorized', async () => {
      mockCookieStore[API_SESSION_COOKIE] = 'a'.repeat(43);
      expect(await verifyAdminSession()).toBeNull();
      await expect(requireOperatorOrMaster()).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
    });

    it('12. legacy tour guards reject API session and throw unauthorized', async () => {
      mockCookieStore[API_SESSION_COOKIE] = 'a'.repeat(43);
      expect(await verifyAdminSession()).toBeNull();
      await expect(requireContentOrMaster()).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
    });

    it('13. legacy transfer guards reject API session and throw unauthorized', async () => {
      mockCookieStore[API_SESSION_COOKIE] = 'a'.repeat(43);
      expect(await verifyAdminSession()).toBeNull();
      await expect(requireOperatorOrMaster()).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
      await expect(requireMasterRole()).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
    });

    it('14. legacy user and coupon guards reject API session and throw unauthorized', async () => {
      mockCookieStore[API_SESSION_COOKIE] = 'a'.repeat(43);
      expect(await verifyAdminSession()).toBeNull();
      await expect(requireMasterRole()).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
      await expect(requireAnyRole(['MASTER', 'MARKETING'])).rejects.toThrow('No autorizado. Se requiere sesión de administrador.');
    });
  });

  describe('4. Authentication Mechanism', () => {
    beforeEach(() => {
      vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    });

    it('15. legacy admin_session JWT does not authorize workspace in API mode', async () => {
      const req = makeRequest('/workspace', 'GET', { admin_session: 'legacy.jwt.token' });
      const res = await proxy(req);
      expect(res.headers.get('location')).toBe('https://admin.example.test/login');
    });

    it('16. missing API session cannot access workspace and redirects to login', async () => {
      const req = makeRequest('/workspace', 'GET', {});
      const res = await proxy(req);
      expect(res.headers.get('location')).toBe('https://admin.example.test/login');
    });

    it('17. malformed/invalid API session token format is rejected and redirects to login', async () => {
      const invalidTokens = ['too-short', 'invalid!chars@123', 'a'.repeat(42), 'a'.repeat(44)];
      for (const token of invalidTokens) {
        const req = makeRequest('/workspace', 'GET', { [API_SESSION_COOKIE]: token });
        const res = await proxy(req);
        expect(res.headers.get('location')).toBe('https://admin.example.test/login');
      }
    });
  });
});
