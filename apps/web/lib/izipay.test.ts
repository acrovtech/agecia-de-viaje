import { describe, it, expect, afterEach } from 'vitest';
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

describe('getIzipayClientPublicKey', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('en producción, requiere NEXT_PUBLIC_IZIPAY_PUBLIC_KEY y falla (null) si está ausente', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY;
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST = 'test_key_123';

    const { getIzipayClientPublicKey } = await import('./izipay');
    expect(getIzipayClientPublicKey()).toBeNull();
  });

  it('en producción, no prefiere una clave de prueba sobre la oficial ni usa demo key', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY = 'prod_public_key_abc';
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST = 'test_key_123';

    const { getIzipayClientPublicKey } = await import('./izipay');
    expect(getIzipayClientPublicKey()).toBe('prod_public_key_abc');
  });

  it('en desarrollo, permite fallback a NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY;
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY_TEST = 'test_key_123';

    const { getIzipayClientPublicKey } = await import('./izipay');
    expect(getIzipayClientPublicKey()).toBe('test_key_123');
  });
});

