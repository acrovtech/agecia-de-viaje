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
 * Exige rol MASTER para operaciones administrativas destructivas o de configuración crítica.
 */
export async function requireMasterRole(): Promise<AdminSessionPayload> {
  const session = await requireAdminSession();
  if (session.role !== 'MASTER') {
    throw new Error('Permisos insuficientes. Se requiere rol MASTER.');
  }
  return session;
}
