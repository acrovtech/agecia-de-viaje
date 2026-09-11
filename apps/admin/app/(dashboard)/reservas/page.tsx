import { prisma, Reservation, Tour, Transfer, VehicleType } from '@repo/db';
import { ReservasClient } from './reservas-client';

export type ReservationWithRelations = Reservation & { 
  tour: Tour | null;
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
  marketingCode?: string | null;
  source?: string | null;
};

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  let reservas: ReservationWithRelations[] = [];
  let availableTours: { id: string; title: string; sharedPrice: number }[] = [];
  let availableTransfers: { id: string; title: string; sharedPrice: number }[] = [];
  let availableVehicles: { id: string; name: string; code: string }[] = [];

  try {
    const [dbReservas, dbTours, dbTransfers, dbVehicles] = await Promise.all([
      prisma.reservation.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { 
          tour: true,
          transfer: true,
          vehicleType: true
        }
      }),
      prisma.tour.findMany({
        select: { id: true, title: true, sharedPrice: true },
        orderBy: { title: 'asc' }
      }),
      prisma.transfer.findMany({
        select: { id: true, title: true, sharedPrice: true },
        orderBy: { title: 'asc' }
      }),
      prisma.vehicleType.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { order: 'asc' }
      })
    ]);

    reservas = dbReservas as any;
    availableTours = dbTours;
    availableTransfers = dbTransfers;
    availableVehicles = dbVehicles;
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return (
    <ReservasClient 
      initialReservas={reservas} 
      availableTours={availableTours}
      availableTransfers={availableTransfers}
      availableVehicles={availableVehicles}
    />
  );
}
