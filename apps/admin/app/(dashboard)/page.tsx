import { prisma } from '@repo/db';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [toursCount, blogsCount, allReservations] = await Promise.all([
    prisma.tour.count(),
    prisma.blog.count(),
    prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tour: true,
        transfer: true,
        vehicleType: true,
      },
    }),
  ]);

  return (
    <DashboardClient
      initialReservations={allReservations}
      toursCount={toursCount}
      blogsCount={blogsCount}
    />
  );
}
