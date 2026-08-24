import crypto from 'crypto';

/**
 * Obtiene la clave HMAC adecuada para la firma de Izipay.
 * En producción (NODE_ENV === 'production'), NUNCA se utiliza IZIPAY_TEST_PASSWORD como clave de firma.
 */
export function getIzipayHmacSecret(): string | null {
  const isProduction = process.env.NODE_ENV === 'production';
  const prodHmac = process.env.IZIPAY_HMAC_TEST || process.env.IZIPAY_HMAC_SHA256 || process.env.IZIPAY_HMAC_KEY;

  if (isProduction) {
    if (!prodHmac) {
      console.error('❌ CRÍTICO EN PRODUCCIÓN: No se configuró IZIPAY_HMAC_SHA256 / IZIPAY_HMAC_TEST para la validación de webhooks.');
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
