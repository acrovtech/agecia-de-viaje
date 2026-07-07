import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tours = await prisma.tour.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ tours, categories });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}
