import { describe, it, expect } from 'vitest';
import { createAdminToken, verifyAdminToken } from './jwt';

describe('Admin JWT Lifecycle & Security', () => {
  process.env.ADMIN_SESSION_SECRET = 'unit_test_super_secret_jwt_key_2026_safe';

  it('debe crear un token JWT válido y verificar su payload con éxito', async () => {
    const payload = {
      role: 'MASTER',
      email: 'admin@agenciadeviajes.com',
    };

    const token = await createAdminToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // Formato JWT header.payload.signature

    const verified = await verifyAdminToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('MASTER');
    expect(verified?.email).toBe('admin@agenciadeviajes.com');
  });

  it('debe rechazar un token adulterado o con firma forjada', async () => {
    const payload = {
      role: 'CLIENT',
      email: 'operator@agenciadeviajes.com',
    };

    const token = await createAdminToken(payload);
    const parts = token.split('.');
    // Modificar el cuerpo del token
    const forgedToken = `${parts[0]}.eyJyZXN0IjoidGFtcGVyZWQifQ.${parts[2]}`;

    const verified = await verifyAdminToken(forgedToken);
    expect(verified).toBeNull();
  });

  it('debe retornar null ante tokens vacíos o nulos', async () => {
    expect(await verifyAdminToken('')).toBeNull();
  });
});
