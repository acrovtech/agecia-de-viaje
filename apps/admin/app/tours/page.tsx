import { prisma } from '@repo/db';
import { ToursClient } from './tours-client';

export const dynamic = 'force-dynamic';

export default async function ToursList() {
  let tours: any[] = [];
  try {
    tours = await prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
  }

  return <ToursClient initialTours={tours} />;
}
