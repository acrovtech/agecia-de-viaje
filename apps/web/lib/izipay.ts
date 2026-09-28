import crypto from 'crypto';

/**
 * Obtiene la clave HMAC adecuada para la firma de Izipay.
 * En producción (NODE_ENV === 'production'), NUNCA se utiliza IZIPAY_TEST_PASSWORD como clave de firma.
 */
export function getIzipayHmacSecret(): string | null {
  const isProduction = process.env.NODE_ENV === 'production';
  const prodHmac = process.env.IZIPAY_HMAC_SHA256 || process.env.IZIPAY_HMAC_KEY || process.env.IZIPAY_HASH_KEY || process.env.IZIPAY_HMAC_PROD || process.env.IZIPAY_HMAC_TEST;

  if (isProduction) {
    if (!prodHmac) {
      console.error('❌ CRÍTICO EN PRODUCCIÓN: No se configuró IZIPAY_HMAC_SHA256 / IZIPAY_HASH_KEY para la validación de webhooks.');
      return null;
    }
    return prodHmac;
  }

  // En entorno de desarrollo o staging se permite el uso de la clave de prueba de Izipay
  return prodHmac || process.env.IZIPAY_PASSWORD_TEST || process.env.IZIPAY_TEST_PASSWORD || null;
}

/**
 * Verifica la firma HMAC-SHA256 enviada por Izipay usando comparación en tiempo constante (timingSafeEqual).
 * @param payload - String u objeto raw recibido en kr-answer
 * @param receivedHash - Hash hexadecimal recibido en kr-hash
 * @param secret - Clave secreta HMAC
 */
export function verifyIzipayHMAC(
  payload: string | object | null | undefined,
  receivedHash: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!payload || !receivedHash || !secret) {
    return false;
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    const receivedBuffer = Buffer.from(receivedHash, 'hex');

    if (calculatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
/**
 * Obtiene la clave pública de cliente para Izipay en el navegador (NEXT_PUBLIC_*).
 * En producción (NODE_ENV === 'production'):
 * - NUNCA utiliza claves demo hardcodeadas.
 * - NUNCA prefiere claves de prueba (_TEST) por encima de la clave oficial.
 * - Requiere NEXT_PUBLIC_IZIPAY_PUBLIC_KEY y falla de forma segura (null) si está ausente.
 * En desarrollo/staging:
 * - Permite fallback ordenado a NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST.
 */
export function getIzipayClientPublicKey(): string | null {
  const isProduction = process.env.NODE_ENV === 'production';
  const prodKey = (process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY || '').trim();

  if (isProduction) {
    if (!prodKey) {
      console.error('❌ CRÍTICO EN PRODUCCIÓN: NEXT_PUBLIC_IZIPAY_PUBLIC_KEY ausente.');
      return null;
    }
    return prodKey;
  }

  const testKey = (process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST || '').trim();
  return prodKey || testKey || null;
}

