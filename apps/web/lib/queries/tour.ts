import { cache } from 'react';
import { prisma } from '@repo/db';

/**
 * Consulta de tour por slug deduplicada por ciclo de request (React.cache).
 * Normaliza el slug y busca de forma tolerante a encoding y mayúsculas.
 */
export const getTourBySlug = cache(async (slug: string) => {
  if (!slug) return null;
  const raw = slug.trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw).trim();
  } catch (e) {
    // Si falla el decode, usar el raw
  }

  return prisma.tour.findFirst({
    where: {
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
});
