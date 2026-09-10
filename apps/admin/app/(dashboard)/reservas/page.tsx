import { prisma, Reservation, Tour, Transfer, VehicleType } from '@repo/db';
import { ReservasClient } from './reservas-client';

export type ReservationWithRelations = Reservation & { 
  tour: Tour | null;
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
};

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  let reservas: ReservationWithRelations[] = [];
  try {
    reservas = await prisma.reservation.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { 
        tour: true,
        transfer: true,
        vehicleType: true
      }
    });
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return <ReservasClient initialReservas={reservas} />;
}
