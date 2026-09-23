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
import { prisma } from '@repo/db';

// Mock de @repo/db
vi.mock('@repo/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

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
  it('API mode rejects legacy cookies before querying JWT or the database', async () => {
    vi.stubEnv('ADMIN_AUTH_MODE', 'api');
    mockCookieMap['admin_session'] = 'valid.legacy.jwt';
    const verify = vi.spyOn(jwtModule, 'verifyAdminToken');
    const find = vi.mocked(prisma.user.findUnique);
    find.mockClear();
    try {
      expect(await verifyAdminSession()).toBeNull();
      await expect(requireMasterRole()).rejects.toThrow();
      expect(verify).not.toHaveBeenCalled();
      expect(find).not.toHaveBeenCalled();
    } finally { vi.unstubAllEnvs(); }
  });
  beforeEach(() => {
    mockCookieMap = {};
    vi.restoreAllMocks();
    (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
      const email = where.email || '';
      let role = 'CLIENT';
      if (email.includes('root')) role = 'SUPERADMIN';
      else if (email.includes('master')) role = 'MASTER';
      else if (email.includes('operator')) role = 'OPERATOR';
      else if (email.includes('content')) role = 'CONTENT_CREATOR';

      return {
        id: where.id || 'mock-id',
        email: where.email || 'user@agenciadeviajes.com',
        name: 'Mock User',
        role,
        isActive: true,
        lockedUntil: null,
        tokenVersion: 1,
      };
    });
  });

  it('verifyAdminSession debe retornar null si no hay cookie de sesión', async () => {
    const session = await verifyAdminSession();
    expect(session).toBeNull();
  });

  it('verifyAdminSession debe validar y retornar el payload si la cookie JWT es legítima', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'client@agenciadeviajes.com',
    });

    const session = await verifyAdminSession();
    expect(session).toMatchObject({
      role: 'CLIENT',
      email: 'client@agenciadeviajes.com',
    });
  });

  it('requireAdminSession debe retornar el payload si existe sesión válida', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      role: 'CLIENT',
      email: 'client@agenciadeviajes.com',
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

  it('verifyAdminSession debe retornar null si el usuario está inactivo (isActive: false)', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      id: 'usr_inactive',
      role: 'MASTER',
      email: 'inactive@agenciadeviajes.com',
    });
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'usr_inactive',
      email: 'inactive@agenciadeviajes.com',
      isActive: false,
      role: 'MASTER',
      lockedUntil: null,
      tokenVersion: 1,
    });

    const session = await verifyAdminSession();
    expect(session).toBeNull();
  });

  it('verifyAdminSession debe retornar null si el tokenVersion no coincide (sesión revocada)', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      id: 'usr_revoked',
      role: 'MASTER',
      email: 'revoked@agenciadeviajes.com',
      tokenVersion: 1,
    });
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'usr_revoked',
      email: 'revoked@agenciadeviajes.com',
      isActive: true,
      role: 'MASTER',
      lockedUntil: null,
      tokenVersion: 2, // Token revocado tras incremento
    });

    const session = await verifyAdminSession();
    expect(session).toBeNull();
  });

  it('verifyAdminSession debe retornar null si la cuenta se encuentra bloqueada temporalmente', async () => {
    mockCookieMap['admin_session'] = 'valid.jwt.token';
    vi.spyOn(jwtModule, 'verifyAdminToken').mockResolvedValueOnce({
      id: 'usr_locked',
      role: 'OPERATOR',
      email: 'locked@agenciadeviajes.com',
      tokenVersion: 1,
    });
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'usr_locked',
      email: 'locked@agenciadeviajes.com',
      isActive: true,
      role: 'OPERATOR',
      lockedUntil: new Date(Date.now() + 1000 * 60 * 15), // Bloqueado por 15 min
      tokenVersion: 1,
    });

    const session = await verifyAdminSession();
    expect(session).toBeNull();
  });
});
