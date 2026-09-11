import { prisma } from './index';
import bcrypt from 'bcryptjs';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_MINUTES = 15;

/**
 * Genera el hash seguro de contraseña usando bcrypt con factor de costo 10.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, 10);
}

/**
 * Verifica una contraseña en texto plano contra su hash almacenado.
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}

/**
 * Determina si una cuenta de usuario se encuentra temporalmente bloqueada por exceso de intentos fallidos.
 */
export function isAccountLocked(user: { lockedUntil?: Date | null }): boolean {
  if (!user.lockedUntil) return false;
  return new Date() < new Date(user.lockedUntil);
}

/**
 * Registra un intento de inicio de sesión fallido, incrementando el contador y bloqueando la cuenta
 * automáticamente si supera el umbral permitido (protección contra ataques de fuerza bruta).
 */
export async function recordLoginFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ isLocked: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, failedLoginAttempts: true, lockedUntil: true },
  });

  if (!user) {
    // Registro de auditoría anónimo para detectar ataques dirigidos o escaneos
    await createAuditEntry({
      action: 'LOGIN_FAILED_UNKNOWN_EMAIL',
      entity: 'User',
      details: { attemptedEmail: normalizedEmail },
      ipAddress,
      userAgent,
    });
    return { isLocked: false, remainingAttempts: 0 };
  }

  const newFailedAttempts = user.failedLoginAttempts + 1;
  const shouldLock = newFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + ACCOUNT_LOCKOUT_MINUTES * 60 * 1000)
    : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: newFailedAttempts,
      ...(shouldLock ? { lockedUntil } : {}),
    },
  });

  await createAuditEntry({
    userId: user.id,
    action: shouldLock ? 'ACCOUNT_LOCKED_BRUTE_FORCE' : 'LOGIN_FAILED',
    entity: 'User',
    entityId: user.id,
    details: {
      failedAttempts: newFailedAttempts,
      threshold: MAX_FAILED_LOGIN_ATTEMPTS,
      lockedUntil: lockedUntil?.toISOString(),
    },
    ipAddress,
    userAgent,
  });

  return {
    isLocked: shouldLock,
    remainingAttempts: Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - newFailedAttempts),
    lockedUntil,
  };
}

/**
 * Registra un inicio de sesión exitoso, reiniciando contadores de bloqueo y actualizando telemetría de seguridad.
 */
export async function recordLoginSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress ?? null,
    },
  });

  await createAuditEntry({
    userId,
    action: 'LOGIN_SUCCESS',
    entity: 'User',
    entityId: userId,
    details: { loginTimestamp: new Date().toISOString() },
    ipAddress,
    userAgent,
  });
}

/**
 * Invalida de inmediato todas las sesiones activas de un usuario (tokenVersion incrementado).
 * Útil cuando se cambia contraseña, se revoca acceso o se detecta actividad sospechosa.
 */
export async function revokeAllUserSessions(
  userId: string,
  performedByUserId?: string,
  reason = 'Admin revocation'
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
        passwordChangedAt: new Date(),
      },
    }),
    prisma.adminSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    }),
  ]);

  await createAuditEntry({
    userId: performedByUserId ?? userId,
    action: 'REVOKE_ALL_SESSIONS',
    entity: 'User',
    entityId: userId,
    details: { reason, timestamp: new Date().toISOString() },
  });
}

/**
 * Inserta un registro inmutable en la bitácora de auditoría forense (`AdminAuditLog`).
 */
export async function createAuditEntry(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    // No interrumpir el flujo principal si falla el log, pero registrarlo en consola
    console.error('❌ Error al registrar evento de auditoría en la DB:', error);
    return null;
  }
}
