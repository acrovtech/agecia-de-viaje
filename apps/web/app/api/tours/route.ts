import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const tour = await prisma.tour.findUnique({
        where: { slug, isPublished: true },
        include: {
          categories: true,
          privatePricing: { orderBy: { pax: 'asc' } },
        }
      });
      return NextResponse.json({ tour });
    }

    const tours = await prisma.tour.findMany({
      where: { isPublished: true },
      include: {
        categories: true,
        privatePricing: { orderBy: { pax: 'asc' } },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const categories = await prisma.category.findMany({
      where: { tours: { some: { isPublished: true } } },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ tours, categories });
  } catch (error) {
    logger('error', 'Error fetching tours:', error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}
