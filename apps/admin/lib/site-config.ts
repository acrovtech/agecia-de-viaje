/**
 * Configuración centralizada de dominios y URLs públicas para el panel de administración de Incabound.
 * 
 * Permite configurar el dominio de la web pública (storefront) vía variable de entorno NEXT_PUBLIC_SITE_URL
 * o NEXT_PUBLIC_STOREFRONT_URL. Si no se especifica, utiliza el dominio de producción por defecto
 * (https://incabound-web.acrovtech.com) o localhost cuando se ejecuta en entorno local.
 */

export const DEFAULT_PRODUCTION_STOREFRONT_URL = 'https://incabound-web.acrovtech.com';
export const DEFAULT_LOCAL_STOREFRONT_URL = 'http://localhost:3000';

/**
 * Obtiene la URL pública de la tienda / frontend web para una ruta dada.
 * @param path Ruta opcional (ej: '/tours/machu-picchu', '/blog/mi-articulo', '/transporte')
 * @returns URL absoluta lista para usar en enlaces externos o botones 'Ver tour', 'Ver blog', etc.
 */
export function getStorefrontUrl(path: string = ''): string {
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  // 1. Variable de entorno explícita (NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_STOREFRONT_URL)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const cleanEnvUrl = envUrl.trim().replace(/\/+$/, '');
    return `${cleanEnvUrl}${normalizedPath}`;
  }

  // 2. Ejecución en el navegador (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Entorno local de desarrollo
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${DEFAULT_LOCAL_STOREFRONT_URL}${normalizedPath}`;
    }

    // Servidor / staging / producción
    return `${DEFAULT_PRODUCTION_STOREFRONT_URL}${normalizedPath}`;
  }

  // 3. Ejecución en servidor (SSR / Server Actions / API routes)
  if (process.env.NODE_ENV === 'production') {
    return `${DEFAULT_PRODUCTION_STOREFRONT_URL}${normalizedPath}`;
  }

  return `${DEFAULT_LOCAL_STOREFRONT_URL}${normalizedPath}`;
}
