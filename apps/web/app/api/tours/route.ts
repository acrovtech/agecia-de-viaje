import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { logger } from '../../../lib/logger';

export const dynamic = 'force-dynamic';

function getStorefrontSlug(): string | null {
  const slug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (!slug || slug.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return 'incabound';
  }
  return slug.trim();
}

export async function GET(req: Request) {
  try {
    const storefrontSlug = getStorefrontSlug();
    if (!storefrontSlug) {
      logger('error', 'Storefront identity missing in production. Failing closed.');
      return NextResponse.json({ error: 'Configuración de storefront no definida' }, { status: 500 });
    }

    const agency = await prisma.agency.findUnique({
      where: { slug: storefrontSlug, isActive: true },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agencia no encontrada o inactiva' }, { status: 404 });
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
      orderBy: { createdAt: 'desc' },
    });

    const categories = await prisma.category.findMany({
      where: {
        agencyId: agency.id,
        tours: { some: { agencyId: agency.id, isPublished: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tours, categories });
  } catch (error) {
    logger('error', 'Error fetching tours:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}
