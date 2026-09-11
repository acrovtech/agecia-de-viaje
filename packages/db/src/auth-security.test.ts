import { describe, it, expect } from 'vitest';
import { 
  hashPassword, 
  verifyPassword, 
  isAccountLocked, 
  MAX_FAILED_LOGIN_ATTEMPTS, 
  ACCOUNT_LOCKOUT_MINUTES 
} from './auth-security';

describe('Database Auth & Security Logic (@repo/db/auth-security)', () => {
  it('debe hashear contraseñas con bcrypt de forma no determinista y verificarla exitosamente', async () => {
    const rawPass = 'GenericSecure2026*';
    const hash1 = await hashPassword(rawPass);
    const hash2 = await hashPassword(rawPass);

    expect(hash1).not.toBe(rawPass);
    expect(hash1).not.toBe(hash2); // Sales distintas
    expect(await verifyPassword(rawPass, hash1)).toBe(true);
    expect(await verifyPassword('WrongPassword123!', hash1)).toBe(false);
  });

  it('isAccountLocked debe retornar false si lockedUntil es null o indefinido', () => {
    expect(isAccountLocked({})).toBe(false);
    expect(isAccountLocked({ lockedUntil: null })).toBe(false);
  });

  it('isAccountLocked debe retornar true si lockedUntil está en el futuro', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // En 10 minutos
    expect(isAccountLocked({ lockedUntil: futureDate })).toBe(true);
  });

  it('isAccountLocked debe retornar false si lockedUntil ya expiró', () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000); // Hace 5 minutos
    expect(isAccountLocked({ lockedUntil: pastDate })).toBe(false);
  });

  it('debe validar las constantes de umbral de seguridad', () => {
    expect(MAX_FAILED_LOGIN_ATTEMPTS).toBe(5);
    expect(ACCOUNT_LOCKOUT_MINUTES).toBe(15);
  });
});
