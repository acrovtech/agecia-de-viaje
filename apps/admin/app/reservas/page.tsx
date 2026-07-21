import { prisma, Reservation, Tour } from '@repo/db';
import { ReservasClient } from './reservas-client';

type ReservationWithTour = Reservation & { tour: Tour | null };

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  let reservas: ReservationWithTour[] = [];
  try {
    reservas = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tour: true }
    });
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestión de Reservas y Pagos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los pedidos de viajes, datos de los clientes y estados de pago con Izipay.
          </p>
        </div>
      </div>

      <ReservasClient initialReservas={reservas} />
    </div>
  );
}
