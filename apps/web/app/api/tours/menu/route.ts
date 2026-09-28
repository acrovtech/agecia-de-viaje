import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

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

export async function GET() {
  try {
    const storefrontSlug = getStorefrontSlug();
    if (!storefrontSlug) {
      return NextResponse.json({ error: 'Configuración de storefront no definida' }, { status: 500 });
    }

    const agency = await prisma.agency.findUnique({
      where: { slug: storefrontSlug, isActive: true },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agencia no encontrada o inactiva' }, { status: 404 });
    }

    const tours = await prisma.tour.findMany({
      where: {
        agencyId: agency.id,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        region: true,
        menuGroup: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json(tours);
  } catch (error) {
    console.error('Error fetching menu tours:', error);
    return NextResponse.json({ error: 'Failed to fetch menu tours' }, { status: 500 });
  }
}
