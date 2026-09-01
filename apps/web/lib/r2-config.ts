/**
 * Configuración centralizada de Cloudflare R2 / CDN de medios.
 * Permite cambiar el endpoint público vía variable de entorno NEXT_PUBLIC_R2_URL.
 */
const DEFAULT_R2_URL = 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev';

export function getR2PublicUrl(path: string = ''): string {
  const baseUrl = (process.env.NEXT_PUBLIC_R2_URL || process.env.R2_PUBLIC_DOMAIN || DEFAULT_R2_URL).replace(/\/+$/, '');
  if (!path) return baseUrl;
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
}
