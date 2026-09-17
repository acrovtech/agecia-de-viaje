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
  let availableCoupons: { id: string; code: string; discountType: string; discountValue: number }[] = [];

  try {
    const [dbReservas, dbTours, dbTransfers, dbVehicles, dbCoupons] = await Promise.all([
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
      }),
      (prisma as any).coupon.findMany({
        where: { isActive: true },
        select: { id: true, code: true, discountType: true, discountValue: true },
        orderBy: { code: 'asc' }
      })
    ]);

    reservas = dbReservas as any;
    availableTours = dbTours.map(t => ({ id: t.id, title: t.title, sharedPrice: t.sharedPrice ?? 0 }));
    availableTransfers = dbTransfers.map(t => ({ id: t.id, title: t.title, sharedPrice: t.sharedPrice ?? 0 }));
    availableVehicles = dbVehicles;
    availableCoupons = dbCoupons;
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return (
    <ReservasClient 
      initialReservas={reservas} 
      availableTours={availableTours}
      availableTransfers={availableTransfers}
      availableVehicles={availableVehicles}
      availableCoupons={availableCoupons}
    />
  );
}
