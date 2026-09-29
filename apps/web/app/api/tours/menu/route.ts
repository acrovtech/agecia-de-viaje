import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthoritativeHost } from '../../../../lib/storefront-context';

export const dynamic = 'force-dynamic';

async function resolveStorefrontAgency(req: Request) {
  const host = getAuthoritativeHost(req.headers);

  // 1. Host dinámico autoritativo (si no es loopback genérico)
  if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]') {
    // Coincidencia exacta con customDomain
    let agency = await prisma.agency.findFirst({
      where: { customDomain: host, isActive: true },
      select: { id: true, slug: true },
    });
    if (agency) return agency;

    // Subdominio de plataforma
    const baseDomain = process.env.STOREFRONT_BASE_DOMAIN || 'platform.example';
    if (host.endsWith(`.${baseDomain}`)) {
      const subLabel = host.slice(0, -(baseDomain.length + 1));
      if (subLabel && !subLabel.includes('.') && /^[a-z0-9-]+$/.test(subLabel)) {
        agency = await prisma.agency.findFirst({
          where: { subdomain: subLabel, isActive: true },
          select: { id: true, slug: true },
        });
        if (agency) return agency;
      }
    }
  }

  // 2. Fallback por variable de entorno (desarrollo / compatibilidad)
  const legacySlug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (legacySlug && legacySlug.trim()) {
    return prisma.agency.findUnique({
      where: { slug: legacySlug.trim(), isActive: true },
      select: { id: true, slug: true },
    });
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
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
      return NextResponse.json({ error: 'Configuración de storefront no definida' }, { status: process.env.NODE_ENV === 'production' ? 500 : 404 });
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
