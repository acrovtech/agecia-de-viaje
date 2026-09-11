import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  verifyAdminSession, 
  requireAdminSession, 
  requireSuperAdminRole,
  requireMasterRole,
  requireAnyRole,
  requireOperatorOrMaster,
  requireContentOrMaster
} from './auth-check';
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
      email: 'operator@agenciadeviajes.com',
    });

    const session = await verifyAdminSession();
    expect(session).toEqual({
      role: 'CLIENT',
      email: 'operator@agenciadeviajes.com',
    });
  });

  it('requireAdminSession debe retornar el payload si existe sesión válida', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'operator@agenciadeviajes.com',
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
      email: 'master@agenciadeviajes.com',
    });

    const session = await requireMasterRole();
    expect(session.role).toBe('MASTER');
  });

  it('requireMasterRole debe lanzar un error explícito cuando el rol es CLIENT u OPERATOR', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'client@agenciadeviajes.com',
    });

    await expect(requireMasterRole()).rejects.toThrow(
      'Permisos insuficientes. Se requiere rol MASTER o SUPERADMIN.'
    );
  });

  it('requireOperatorOrMaster debe permitir el acceso a OPERATOR y MASTER', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'OPERATOR',
      email: 'operator@agenciadeviajes.com',
    });

    const session = await requireOperatorOrMaster();
    expect(session.role).toBe('OPERATOR');
  });

  it('requireContentOrMaster debe permitir el acceso a CONTENT_CREATOR y MASTER', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CONTENT_CREATOR',
      email: 'content@agenciadeviajes.com',
    });

    const session = await requireContentOrMaster();
    expect(session.role).toBe('CONTENT_CREATOR');
  });

  it('requireSuperAdminRole debe permitir el acceso exclusivo a SUPERADMIN', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'SUPERADMIN',
      email: 'root@agenciadeviajes.com',
    });

    const session = await requireSuperAdminRole();
    expect(session.role).toBe('SUPERADMIN');
  });

  it('requireSuperAdminRole debe rechazar a MASTER con error explícito', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'MASTER',
      email: 'master@agenciadeviajes.com',
    });

    await expect(requireSuperAdminRole()).rejects.toThrow(
      'Permisos insuficientes. Se requiere rol SUPERADMIN.'
    );
  });

  it('requireMasterRole debe permitir la ejecución a SUPERADMIN', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'SUPERADMIN',
      email: 'root@agenciadeviajes.com',
    });

    const session = await requireMasterRole();
    expect(session.role).toBe('SUPERADMIN');
  });

  it('SUPERADMIN debe tener acceso universal en requireAnyRole', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'SUPERADMIN',
      email: 'root@agenciadeviajes.com',
    });

    const session = await requireAnyRole(['CONTENT_CREATOR']);
    expect(session.role).toBe('SUPERADMIN');
  });
});
