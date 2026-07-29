type LogLevel = 'info' | 'warn' | 'error';

/**
 * Logger estructurado mínimo para producción y desarrollo
 */
export function logger(level: LogLevel, message: string, meta?: any) {
  if (process.env.NODE_ENV === 'production' && level === 'info') {
    return; // Silenciar logs informativos de depuración en producción
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (level === 'error') {
    console.error(prefix, message, meta !== undefined ? meta : '');
  } else if (level === 'warn') {
    console.warn(prefix, message, meta !== undefined ? meta : '');
  } else {
    console.log(prefix, message, meta !== undefined ? meta : '');
  }
}
