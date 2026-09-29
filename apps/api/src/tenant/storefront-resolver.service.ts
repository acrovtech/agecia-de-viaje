import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { normalizeHost } from './host-normalizer.js';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';

export interface StorefrontPublicMetadata {
  readonly slug: string;
  readonly name: string;
  readonly subdomain: string;
  readonly customDomain: string | null;
  readonly logoUrl: string | null;
  readonly iconUrl: string | null;
  readonly canonicalHost: string;
  readonly canonicalOrigin: string;
}

export interface InternalStorefrontContext extends StorefrontPublicMetadata {
  readonly agencyId: string;
  readonly isActive: boolean;
}

@Injectable()
export class StorefrontResolverService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  /**
   * Resuelve de forma autoritativa un hostname a su contexto de Agencia activo y publicado.
   *
   * Orden de resolución:
   * 1. Coincidencia EXACTA con customDomain (canónico, sin fuzzy matching, sin sufijos).
   * 2. Subdominio de plataforma reconocido (subdomain.STOREFRONT_BASE_DOMAIN).
   * 3. Fallback de desarrollo local (localhost / 127.0.0.1) ÚNICAMENTE fuera de producción.
   *
   * Verificaciones de seguridad:
   * - El root hostname de la plataforma nunca resuelve a una agencia.
   * - La agencia debe estar activa (isActive = true).
   * - La agencia debe pertenecer a publicAgencySlugs (puerta de publicación estricta).
   * - Falla cerrado con 404 neutro ante cualquier error o dominio desconocido.
   */
  async resolveFromHost(rawHost: unknown): Promise<InternalStorefrontContext> {
    const normalizedHost = normalizeHost(rawHost);
    if (!normalizedHost) {
      throw new NotFoundException();
    }

    // 1. Coincidencia exacta con customDomain
    let agency = await this.prisma.agency.findFirst({
      where: {
        customDomain: normalizedHost,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        customDomain: true,
        logoUrl: true,
        iconUrl: true,
        isActive: true,
      },
    });

    // 2. Subdominio de plataforma (ej. inca.platform.example)
    if (!agency && this.config.storefrontBaseDomain) {
      const baseDomain = normalizeHost(this.config.storefrontBaseDomain);
      if (baseDomain && normalizedHost.endsWith(`.${baseDomain}`)) {
        // Extraer la etiqueta de subdominio antes del límite de dominio (.baseDomain)
        const subLabel = normalizedHost.slice(0, -(baseDomain.length + 1));
        // Debe ser una sola etiqueta DNS válida sin puntos intermedios
        if (subLabel && !subLabel.includes('.') && /^[a-z0-9-]+$/.test(subLabel)) {
          agency = await this.prisma.agency.findFirst({
            where: {
              subdomain: subLabel,
              isActive: true,
            },
            select: {
              id: true,
              slug: true,
              name: true,
              subdomain: true,
              customDomain: true,
              logoUrl: true,
              iconUrl: true,
              isActive: true,
            },
          });
        }
      }
    }

    // 3. Fallback explícito de desarrollo local ÚNICAMENTE fuera de producción
    if (!agency && this.config.environment !== 'production') {
      if (normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '[::1]') {
        const devSlug = this.config.publicAgencySlugs[0] || 'incabound';
        agency = await this.prisma.agency.findFirst({
          where: { slug: devSlug, isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            subdomain: true,
            customDomain: true,
            logoUrl: true,
            iconUrl: true,
            isActive: true,
          },
        });
      } else if (normalizedHost.endsWith('.localhost')) {
        const localSub = normalizedHost.slice(0, -'.localhost'.length);
        if (localSub && !localSub.includes('.') && /^[a-z0-9-]+$/.test(localSub)) {
          agency = await this.prisma.agency.findFirst({
            where: { subdomain: localSub, isActive: true },
            select: {
              id: true,
              slug: true,
              name: true,
              subdomain: true,
              customDomain: true,
              logoUrl: true,
              iconUrl: true,
              isActive: true,
            },
          });
        }
      }
    }

    // Si no se encontró ninguna agencia activa: fallo cerrado
    if (!agency || !agency.isActive) {
      throw new NotFoundException();
    }

    // 4. Puerta de publicación: debe estar en publicAgencySlugs
    if (!this.config.publicAgencySlugs.includes(agency.slug)) {
      throw new NotFoundException();
    }

    // 5. Host y origen canónico
    const canonicalHost = agency.customDomain ||
      (this.config.storefrontBaseDomain
        ? `${agency.subdomain}.${this.config.storefrontBaseDomain}`
        : `${agency.subdomain}.localhost`);

    const isLocalDev =
      this.config.environment !== 'production' &&
      (canonicalHost === 'localhost' || canonicalHost === '127.0.0.1' || canonicalHost.endsWith('.localhost'));

    const canonicalOrigin = isLocalDev ? `http://${canonicalHost}` : `https://${canonicalHost}`;

    return Object.freeze({
      agencyId: agency.id,
      slug: agency.slug,
      name: agency.name,
      subdomain: agency.subdomain,
      customDomain: agency.customDomain,
      logoUrl: agency.logoUrl,
      iconUrl: agency.iconUrl,
      canonicalHost,
      canonicalOrigin,
      isActive: agency.isActive,
    });
  }

  /**
   * Resuelve de forma segura retornando null si falla, útil para interceptores.
   */
  async resolveSafe(rawHost: unknown): Promise<InternalStorefrontContext | null> {
    try {
      return await this.resolveFromHost(rawHost);
    } catch {
      return null;
    }
  }

  /**
   * Alias de resolveFromHost para consistencia de API interna.
   */
  async resolveByHost(rawHost: unknown): Promise<InternalStorefrontContext> {
    return this.resolveFromHost(rawHost);
  }

  /**
   * Extrae el host autoritativo desde los headers HTTP aplicando la política de proxy inverso.
   */
  getAuthoritativeHost(headers: Record<string, string | string[] | undefined>): string | null {
    if (this.config.storefrontTrustForwardedHost) {
      const forwarded = headers['x-forwarded-host'];
      if (typeof forwarded === 'string' && forwarded.trim()) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
      }
      if (Array.isArray(forwarded) && typeof forwarded[0] === 'string' && forwarded[0].trim()) {
        const first = forwarded[0].split(',')[0]?.trim();
        if (first) return first;
      }
    }
    const host = headers.host;
    if (typeof host === 'string') {
      return host;
    }
    if (Array.isArray(host) && typeof host[0] === 'string') {
      return host[0];
    }
    return null;
  }

  /**
   * Extrae los metadatos públicos seguros (sin IDs internos de base de datos).
   */
  toPublicMetadata(context: InternalStorefrontContext): StorefrontPublicMetadata {
    return Object.freeze({
      slug: context.slug,
      name: context.name,
      subdomain: context.subdomain,
      customDomain: context.customDomain,
      logoUrl: context.logoUrl,
      iconUrl: context.iconUrl,
      canonicalHost: context.canonicalHost,
      canonicalOrigin: context.canonicalOrigin,
    });
  }
}
