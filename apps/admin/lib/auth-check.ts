import { cookies } from 'next/headers';
import { verifyAdminToken, AdminSessionPayload } from './jwt';

/**
 * Valida si existe una sesión de administrador válida y firmada con JWT en las cookies de la petición.
 */
export async function verifyAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  // Verificar firma criptográfica y expiración del JWT
  return await verifyAdminToken(sessionCookie.value);
}

/**
 * Exige una sesión de administrador activa. Lanza un error si no está autenticado.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await verifyAdminSession();
  if (!session) {
    throw new Error('No autorizado. Se requiere sesión de administrador.');
  }
  return session;
}

/**
 * Exige rol SUPERADMIN (acceso exclusivo para los propietarios del sistema y visor de logs).
 */
export async function requireSuperAdminRole(): Promise<AdminSessionPayload> {
  const session = await requireAdminSession();
  if (session.role !== 'SUPERADMIN') {
    throw new Error('Permisos insuficientes. Se requiere rol SUPERADMIN.');
  }
  return session;
}

/**
 * Exige rol MASTER o SUPERADMIN para operaciones administrativas de gestión y usuarios.
 */
export async function requireMasterRole(): Promise<AdminSessionPayload> {
  const session = await requireAdminSession();
  if (session.role !== 'MASTER' && session.role !== 'SUPERADMIN') {
    throw new Error('Permisos insuficientes. Se requiere rol MASTER o SUPERADMIN.');
  }
  return session;
}

/**
 * Exige que el usuario tenga al menos uno de los roles permitidos especificados.
 * El rol SUPERADMIN tiene acceso universal implícito a todos los recursos.
 */
export async function requireAnyRole(allowedRoles: string[]): Promise<AdminSessionPayload> {
  const session = await requireAdminSession();
  if (session.role === 'SUPERADMIN') {
    return session;
  }

  const normalizedRole = session.role === 'CLIENT' ? 'CONTENT_CREATOR' : session.role;
  const normalizedAllowed = allowedRoles.map((r) => (r === 'CLIENT' ? 'CONTENT_CREATOR' : r));

  if (!normalizedAllowed.includes(normalizedRole)) {
    throw new Error(
      `Permisos insuficientes. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`
    );
  }
  return session;
}

/**
 * Exige rol OPERATOR, MASTER o SUPERADMIN (Gestión de reservas, pasajeros y estados de pago).
 */
export async function requireOperatorOrMaster(): Promise<AdminSessionPayload> {
  return await requireAnyRole(['SUPERADMIN', 'MASTER', 'OPERATOR']);
}

/**
 * Exige rol CONTENT_CREATOR, MASTER o SUPERADMIN (Gestión de tours, itinerarios, blogs y megamenú).
 */
export async function requireContentOrMaster(): Promise<AdminSessionPayload> {
  return await requireAnyRole(['SUPERADMIN', 'MASTER', 'CONTENT_CREATOR', 'CLIENT']);
}


