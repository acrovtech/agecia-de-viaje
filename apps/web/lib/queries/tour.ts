import { cache } from 'react';
import { prisma } from '@repo/db';
import { apiCatalog, type ApiTourDetail } from '../api-catalog';

/**
 * Consulta de tour por slug deduplicada por ciclo de request (React.cache).
 * Consume prioritariamente el catálogo versionado de la API central NestJS
 * para desacoplar el frontend y garantizar aislamiento multi-agencia.
 */
async function queryTourFromDb(decoded: string, raw: string) {
  return prisma.tour.findFirst({
    where: {
      isPublished: true,
      OR: [
        { slug: decoded },
        { slug: decoded.toLowerCase() },
        { slug: raw },
        { slug: raw.toLowerCase() },
      ],
    },
    include: {
      categories: true,
      images: { orderBy: { order: 'asc' } },
      itineraries: { orderBy: { order: 'asc' } },
      inclusions: { orderBy: { order: 'asc' } },
      exclusions: { orderBy: { order: 'asc' } },
      recommendations: { orderBy: { order: 'asc' } },
      faqs: { orderBy: { order: 'asc' } },
      privatePricing: { orderBy: { pax: 'asc' } },
    },
  });
}

export type TourQueryResult = NonNullable<Awaited<ReturnType<typeof queryTourFromDb>>> | ApiTourDetail;

/**
 * Consulta de tour por slug deduplicada por ciclo de request (React.cache).
 * Consume prioritariamente el catálogo versionado de la API central NestJS
 * para desacoplar el frontend y garantizar aislamiento multi-agencia.
 */
export const getTourBySlug = cache(async (slug: string): Promise<TourQueryResult | null> => {
  if (!slug) return null;
  const raw = slug.trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw).trim();
  } catch (e) {
    // Si falla el decode, usar el raw
  }

  // In API mode a missing/disabled agency must never fall back to unscoped legacy data.
  if (apiCatalog.isEnabled()) {
    return apiCatalog.getTourBySlug(decoded);
  }

  // Legacy single-agency mode until all frontend queries are migrated.
  return queryTourFromDb(decoded, raw);
});
