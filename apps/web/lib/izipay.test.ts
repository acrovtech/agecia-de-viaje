import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyIzipayHMAC, getIzipayHmacSecret } from './izipay';

describe('Izipay HMAC Verification (verifyIzipayHMAC)', () => {
  const secretKey = 'my_test_super_secret_hmac_key';
  const samplePayload = JSON.stringify({
    orderStatus: 'PAID',
    orderDetails: { orderId: 'res_123456789' },
    transactions: [{ uuid: 'tx_abc123', amount: 15000 }]
  });

  const validHash = crypto
    .createHmac('sha256', secretKey)
    .update(samplePayload)
    .digest('hex');

  it('debe retornar true cuando la firma HMAC-SHA256 coincide exactamente', () => {
    const result = verifyIzipayHMAC(samplePayload, validHash, secretKey);
    expect(result).toBe(true);
  });

  it('debe retornar false cuando el payload ha sido adulterado', () => {
    const tamperedPayload = JSON.stringify({
      orderStatus: 'PAID',
      orderDetails: { orderId: 'res_FORGED_ID' }
    });
    const result = verifyIzipayHMAC(tamperedPayload, validHash, secretKey);
    expect(result).toBe(false);
  });

  it('debe retornar false si el hash recibido es incorrecto o forjado', () => {
    const invalidHash = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
    const result = verifyIzipayHMAC(samplePayload, invalidHash, secretKey);
    expect(result).toBe(false);
  });

  it('debe retornar false si alguno de los parámetros es nulo, indefinido o vacío', () => {
    expect(verifyIzipayHMAC('', validHash, secretKey)).toBe(false);
    expect(verifyIzipayHMAC(samplePayload, '', secretKey)).toBe(false);
    expect(verifyIzipayHMAC(samplePayload, validHash, '')).toBe(false);
    expect(verifyIzipayHMAC(null, validHash, secretKey)).toBe(false);
    expect(verifyIzipayHMAC(samplePayload, null, secretKey)).toBe(false);
  });

  it('debe resolver la clave HMAC desde variables de entorno', () => {
    process.env.IZIPAY_HASH_KEY = 'hash_key_env_val';
    expect(getIzipayHmacSecret()).toBe('hash_key_env_val');
    delete process.env.IZIPAY_HASH_KEY;
  });
});
