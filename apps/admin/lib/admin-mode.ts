export const API_SESSION_COOKIE = 'admin_api_session';

export function isApiAdmin(): boolean {
  const mode = process.env.ADMIN_AUTH_MODE ?? 'legacy';
  if (mode !== 'legacy' && mode !== 'api') throw new Error('ADMIN_AUTH_MODE inválido.');
  return mode === 'api';
}
