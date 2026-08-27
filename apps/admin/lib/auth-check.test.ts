import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdminSession, requireAdminSession, requireMasterRole } from './auth-check';
import * as jwtModule from './jwt';

// Mock de next/headers
let mockCookieMap: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (key: string) => {
      const val = mockCookieMap[key];
      return val ? { value: val } : undefined;
    },
  }),
}));

describe('Admin Authorization Guards (verifyAdminSession, requireAdminSession & requireMasterRole)', () => {
  beforeEach(() => {
    mockCookieMap = {};
    vi.restoreAllMocks();
  });

  it('verifyAdminSession debe retornar null si no hay cookie de sesión', async () => {
    const session = await verifyAdminSession();
    expect(session).toBeNull();
  });

  it('verifyAdminSession debe validar y retornar el payload si la cookie JWT es legítima', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'operator@incabound.com',
    });

    const session = await verifyAdminSession();
    expect(session).toEqual({
      role: 'CLIENT',
      email: 'operator@incabound.com',
    });
  });

  it('requireAdminSession debe retornar el payload si existe sesión válida', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'operator@incabound.com',
    });

    const session = await requireAdminSession();
    expect(session.role).toBe('CLIENT');
  });

  it('requireAdminSession debe lanzar un error explícito si no hay sesión activa', async () => {
    await expect(requireAdminSession()).rejects.toThrow(
      'No autorizado. Se requiere sesión de administrador.'
    );
  });

  it('requireMasterRole debe permitir la ejecución cuando el rol es MASTER', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'MASTER',
      email: 'master@incabound.com',
    });

    const session = await requireMasterRole();
    expect(session.role).toBe('MASTER');
  });

  it('requireMasterRole debe lanzar un error explícito cuando el rol es CLIENT', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'client@incabound.com',
    });

    await expect(requireMasterRole()).rejects.toThrow(
      'Permisos insuficientes. Se requiere rol MASTER.'
    );
  });
});
