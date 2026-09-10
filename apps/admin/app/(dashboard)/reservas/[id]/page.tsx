import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import { ReservaDetailClient } from './reserva-detail-client';
import { SetPageTitle } from '@/components/ui/title-context';

export const dynamic = 'force-dynamic';

export default async function ReservaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const reserva = await prisma.reservation.findUnique({
    where: { id },
    include: { 
      tour: true, 
      transfer: true, 
      vehicleType: true, 
      passengers: true 
    }
  });

  if (!reserva) {
    return notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <SetPageTitle title={`Reserva #${reserva.id.slice(-6).toUpperCase()}`} />
      <ReservaDetailClient initialReserva={reserva} />
    </main>
  );
}
