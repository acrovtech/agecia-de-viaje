import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthoritativeHost, resolveCurrentStorefront } from '../../../lib/storefront-context';

export const dynamic = 'force-dynamic';

async function resolveStorefrontAgency(req: Request) {
  const host = getAuthoritativeHost(req.headers);

  // 1. Resolver autoritativamente mediante el servicio central (valida exactitud, isActive, y API_PUBLIC_AGENCY_SLUGS)
  const storefrontContext = await resolveCurrentStorefront(host || undefined);
  if (storefrontContext?.slug) {
    const agency = await prisma.agency.findUnique({
      where: { slug: storefrontContext.slug, isActive: true },
      select: { id: true, slug: true },
    });
    if (agency) return agency;
  }

  // 2. En producción, NUNCA usar fallback a variables de entorno estáticas para hosts no resueltos
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // 3. Fallback ÚNICAMENTE en desarrollo local / test cuando no hay resolución de host
  const legacySlug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (legacySlug && legacySlug.trim()) {
    return prisma.agency.findUnique({
      where: { slug: legacySlug.trim(), isActive: true },
      select: { id: true, slug: true },
    });
  }

  return prisma.agency.findUnique({
    where: { slug: 'incabound', isActive: true },
    select: { id: true, slug: true },
  });
}

export async function GET(req: Request) {
  try {
    const agency = await resolveStorefrontAgency(req);
    if (!agency) {
      return NextResponse.json({ error: 'Storefront no encontrado o inactivo' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const tour = await prisma.tour.findFirst({
        where: {
          agencyId: agency.id,
          slug,
          isPublished: true,
        },
        include: {
          categories: true,
          privatePricing: { orderBy: { pax: 'asc' } },
        },
      });
      return NextResponse.json({ tour });
    }

    const tours = await prisma.tour.findMany({
      where: {
        agencyId: agency.id,
        isPublished: true,
      },
      include: {
        categories: true,
        privatePricing: { orderBy: { pax: 'asc' } },
      },
      orderBy: {
        title: 'asc',
      },
    });

    const categories = await prisma.category.findMany({
      where: {
        agencyId: agency.id,
        tours: {
          some: {
            agencyId: agency.id,
            isPublished: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ tours, categories });
  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}
