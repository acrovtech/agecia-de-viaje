import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tours = await prisma.tour.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        region: true,
        menuGroup: true,
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    return NextResponse.json(tours);
  } catch (error) {
    console.error("Error fetching menu tours:", error);
    return NextResponse.json({ error: "Failed to fetch menu tours" }, { status: 500 });
  }
}
