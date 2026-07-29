import { SignJWT, jwtVerify } from 'jose';

export interface AdminSessionPayload {
  role: string;
  email: string;
}

/**
 * Obtiene la clave secreta para firmar y verificar tokens JWT.
 * Si ADMIN_SESSION_SECRET no existe en las variables de entorno, lanza un error crítico explícito.
 */
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      '❌ CRÍTICO: La variable de entorno ADMIN_SESSION_SECRET no está configurada. Debe definir una clave secreta segura antes de iniciar el panel de administración.'
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Genera un token JWT firmado criptográficamente con HMAC SHA-256 (HS256) con duración de 8 horas.
 */
export async function createAdminToken(payload: AdminSessionPayload): Promise<string> {
  const secretKey = getJwtSecretKey();
  return await new SignJWT({ role: payload.role, email: payload.email })
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
        role: payload.role,
        email: payload.email,
      };
    }
    return null;
  } catch (error) {
    // Si el secreto no está configurado, relanzar para prevenir funcionamiento inseguro
    if (error instanceof Error && error.message.includes('ADMIN_SESSION_SECRET')) {
      throw error;
    }
    return null;
  }
}
