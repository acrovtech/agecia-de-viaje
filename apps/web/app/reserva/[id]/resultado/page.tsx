import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import { ResultadoClient } from './resultado-client';

interface ResultadoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ResultadoPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';

  return {
    title: `Estado de Reserva #${id.slice(-8).toUpperCase()} - Agencia de Viajes`,
    description: 'Comprobante y estado oficial de tu reserva.',
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default async function ResultadoPage({ params }: ResultadoPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';

  if (!id) {
    notFound();
  }

  // Consultar el estado legítimo de la reserva en PostgreSQL
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      tour: true,
      transfer: true,
      passengers: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!reservation) {
    notFound();
  }

  const serviceTitle = reservation.tour?.title || 
    (reservation.transfer ? `Traslado: ${reservation.transfer.origin} a ${reservation.transfer.destination}` : 'Servicio Reservado');

  const initialReservation = {
    id: reservation.id,
    tourId: reservation.tourId,
    transferId: reservation.transferId,
    tourTitle: serviceTitle,
    tourSlug: reservation.tour?.slug || reservation.transfer?.slug,
    customerFirstName: reservation.customerFirstName,
    customerLastName: reservation.customerLastName,
    customerEmail: reservation.customerEmail,
    date: reservation.date.toISOString(),
    pax: reservation.pax,
    totalPrice: reservation.totalPrice,
    pickupHotel: reservation.pickupHotel,
    status: reservation.status as 'PENDING' | 'PAID' | 'CANCELLED',
    passengers: reservation.passengers.map(p => ({
      firstName: p.firstName,
      lastName: p.lastName,
      docType: p.docType,
      docNumber: p.docNumber && p.docNumber.length >= 4
        ? `***${p.docNumber.slice(-4)}`
        : (p.docNumber ? '****' : ''),
    }))
  };

  return <ResultadoClient initialReservation={initialReservation} />;
}
