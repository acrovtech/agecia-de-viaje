export const API_SESSION_COOKIE = 'admin_api_session';

export function isApiAdmin(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawMode = process.env.ADMIN_AUTH_MODE;
  const mode = rawMode ? rawMode.trim().toLowerCase() : '';

  if (isProduction) {
    if (mode !== 'api') {
      throw new Error(
        'Configuración de seguridad inválida: ADMIN_AUTH_MODE=api es obligatorio en entorno de producción. Modo legado prohibido.'
      );
    }
    return true;
  }

  // En development y test:
  // Si no está definido o está vacío, el modo predeterminado y seguro es 'api'
  if (!mode || mode === 'api') {
    return true;
  }

  if (mode === 'legacy') {
    return false;
  }

  throw new Error(`ADMIN_AUTH_MODE inválido: "${rawMode}". Solo se permite "api" o "legacy" en desarrollo/test.`);
}

