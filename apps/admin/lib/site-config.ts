/**
 * Configuración centralizada de dominios y URLs públicas para el panel de administración de Incabound.
 * 
 * Permite configurar el dominio de la web pública (storefront) vía variable de entorno NEXT_PUBLIC_SITE_URL
 * o NEXT_PUBLIC_STOREFRONT_URL. Si no se especifica, utiliza el dominio de producción por defecto
 * (https://incabound-web.acrovtech.com) o localhost cuando se ejecuta en entorno local.
 */

export const DEFAULT_PRODUCTION_STOREFRONT_URL = 'https://incabound-web.acrovtech.com';
export const DEFAULT_LOCAL_STOREFRONT_URL = 'https://incabound-web.acrovtech.com';

/**
 * Obtiene la URL pública de la tienda / frontend web para una ruta dada.
 * @param path Ruta opcional (ej: '/tours/machu-picchu', '/blog/mi-articulo', '/transporte')
 * @returns URL absoluta lista para usar en enlaces externos o botones 'Ver tour', 'Ver blog', etc.
 */
export function getStorefrontUrl(path: string = ''): string {
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  // 1. Variable de entorno explícita (NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_STOREFRONT_URL) si se especifica
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const cleanEnvUrl = envUrl.trim().replace(/\/+$/, '');
    return `${cleanEnvUrl}${normalizedPath}`;
  }

  // 2. Dominio oficial de la tienda pública web
  return `${DEFAULT_PRODUCTION_STOREFRONT_URL}${normalizedPath}`;
}
