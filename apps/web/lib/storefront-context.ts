import { headers } from 'next/headers';
import { cache } from 'react';
import { normalizeHost } from '@repo/db';

export interface StorefrontContext {
  readonly slug: string;
  readonly name: string;
  readonly subdomain: string;
  readonly customDomain: string | null;
  readonly logoUrl: string | null;
  readonly iconUrl: string | null;
  readonly canonicalHost: string;
  readonly canonicalOrigin: string;
}

function getApiBaseUrl(): string {
  const url = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: API_INTERNAL_URL o NEXT_PUBLIC_API_URL es obligatorio en producción');
    }
    return 'http://127.0.0.1:3002';
  }
  return url;
}

/**
 * Extrae y normaliza el hostname autoritativo de los encabezados HTTP.
 * Invariante: Por defecto, X-Forwarded-Host NO es de confianza salvo que
 * STOREFRONT_TRUST_FORWARDED_HOST esté explícitamente habilitado ('true').
 */
export function getAuthoritativeHost(
  headersSource: Headers | Record<string, string | string[] | undefined> | null | undefined
): string | null {
  if (!headersSource) return null;

  const trustForwarded = process.env.STOREFRONT_TRUST_FORWARDED_HOST === 'true';
  let rawHost: string | null = null;

  if (trustForwarded) {
    if (headersSource instanceof Headers) {
      rawHost = headersSource.get('x-forwarded-host');
    } else {
      const val = headersSource['x-forwarded-host'];
      rawHost = typeof val === 'string' ? val : Array.isArray(val) ? val[0] || null : null;
    }
  }

  if (!rawHost) {
    if (headersSource instanceof Headers) {
      rawHost = headersSource.get('host');
    } else {
      const val = headersSource['host'];
      rawHost = typeof val === 'string' ? val : Array.isArray(val) ? val[0] || null : null;
    }
  }

  return normalizeHost(rawHost);
}

/**
 * Resuelve el contexto de storefront a partir de un hostname explícito
 * llamando a la API central /v1/storefront-resolution.
 */
async function fetchStorefrontFromApi(normalizedHost: string): Promise<StorefrontContext | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${baseUrl}/v1/storefront-resolution?host=${encodeURIComponent(normalizedHost)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as StorefrontContext;
  } catch (err) {
    console.warn(`[storefront-context] Error resolving host "${normalizedHost}" against central API:`, err);
    return null;
  }
}

/**
 * Resuelve el contexto del storefront actual de forma autoritativa.
 *
 * Flujo:
 * 1. Determina el host del request (o explicitHost si se pasa).
 * 2. Normaliza el host con normalizeHost().
 * 3. Consulta la API central /v1/storefront-resolution.
 * 4. Si la resolución falla en modo local / no-producción, permite fallback al slug de desarrollo.
 * 5. En producción, falla cerrado con null ante cualquier error o dominio desconocido.
 *
 * Utiliza React cache() para memoizar por ciclo de vida de request sin estado global mutable.
 */
export const resolveCurrentStorefront = cache(
  async (explicitHost?: string): Promise<StorefrontContext | null> => {
    let host: string | null = null;

    if (explicitHost) {
      host = normalizeHost(explicitHost);
    } else {
      try {
        const headerList = await headers();
        host = getAuthoritativeHost(headerList);
      } catch {
        // Fuera de request context
      }
    }

    // 1. Intentar resolver con la API central si tenemos un host normalizado
    if (host) {
      const context = await fetchStorefrontFromApi(host);
      if (context) {
        return context;
      }
    }

    // 2. Fallback de desarrollo / no-producción
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      const staticSlug =
        process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG || 'incabound';
      return Object.freeze({
        slug: staticSlug,
        name: 'Inca Bound (Dev)',
        subdomain: staticSlug,
        customDomain: null,
        logoUrl: null,
        iconUrl: null,
        canonicalHost: 'localhost:3000',
        canonicalOrigin: 'http://localhost:3000',
      });
    }

    // 3. Producción sin host reconocido: falla cerrado
    return null;
  }
);

/**
 * Genera una URL canónica absoluta segura para el storefront.
 */
export function getCanonicalUrl(path: string, storefront: StorefrontContext): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${storefront.canonicalOrigin}${cleanPath}`;
}
