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
