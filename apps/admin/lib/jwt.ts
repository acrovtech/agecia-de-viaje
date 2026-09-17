import { SignJWT, jwtVerify } from 'jose';

export interface AdminSessionPayload {
  id?: string;
  userId?: string;
  role: string;
  email: string;
  name?: string;
  tokenVersion?: number;
}

/**
 * Obtiene la clave secreta para firmar y verificar tokens JWT.
 * Si ADMIN_SESSION_SECRET no existe en las variables de entorno, lanza un error crítico explícito.
 */
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ CRÍTICO EN PRODUCCIÓN: La variable de entorno ADMIN_SESSION_SECRET o JWT_SECRET no está configurada.'
      );
    }
    // En desarrollo local (localhost), usar clave por defecto para evitar caídas
    return new TextEncoder().encode('admin_local_dev_secret_key_2026');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Genera un token JWT firmado criptográficamente con HMAC SHA-256 (HS256) con duración de 8 horas.
 */
export async function createAdminToken(payload: AdminSessionPayload): Promise<string> {
  const secretKey = getJwtSecretKey();
  return await new SignJWT({
    id: payload.id,
    role: payload.role,
    email: payload.email,
    name: payload.name,
    tokenVersion: payload.tokenVersion ?? 1,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey);
}

/**
 * Verifica la firma criptográfica y la vigencia del token JWT.
 * Retorna el payload de la sesión si es válido, o null si la firma fue alterada o expiró.
 */
export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    
    if (typeof payload.role === 'string' && typeof payload.email === 'string') {
      return {
        id: typeof payload.id === 'string' ? payload.id : undefined,
        role: payload.role,
        email: payload.email,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : undefined,
      };
    }
    return null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ADMIN_SESSION_SECRET')) {
      throw error;
    }
    return null;
  }
}
