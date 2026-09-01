import { prisma, Reservation, Tour } from '@repo/db';
import { ReservasClient } from './reservas-client';

type ReservationWithTour = Reservation & { tour: Tour | null };

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  let reservas: ReservationWithTour[] = [];
  try {
    reservas = await prisma.reservation.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { tour: true }
    });
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return <ReservasClient initialReservas={reservas} />;
}
