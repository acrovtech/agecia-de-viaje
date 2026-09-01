import { cache } from 'react';
import { prisma } from '@repo/db';

/**
 * Consulta de blog por slug deduplicada por ciclo de request (React.cache).
 * Normaliza el slug y busca de forma tolerante a encoding y mayúsculas.
 */
export const getBlogBySlug = cache(async (slug: string) => {
  if (!slug) return null;
  const raw = slug.trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw).trim();
  } catch (e) {
    // Si falla el decode, usar el raw
  }

  return prisma.blog.findFirst({
    where: {
      OR: [
        { slug: decoded },
        { slug: decoded.toLowerCase() },
        { slug: raw },
        { slug: raw.toLowerCase() },
      ],
    },
    include: {
      paragraphs: { orderBy: { order: 'asc' } },
    },
  });
});
