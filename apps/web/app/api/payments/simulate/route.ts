import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { sendReservationConfirmationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId es requerido' }, { status: 400 });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'PAID',
        paymentReference: 'SIMULATED_TEST_PAYMENT'
      }
    });

    const tour = await prisma.tour.findUnique({
      where: { id: updatedReservation.tourId }
    });

    if (updatedReservation) {
      const formattedDate = new Date(updatedReservation.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await sendReservationConfirmationEmail({
        reservationId: updatedReservation.id,
        customerName: `${updatedReservation.customerFirstName} ${updatedReservation.customerLastName}`,
        customerEmail: updatedReservation.customerEmail,
        tourTitle: tour?.title || 'Tour Inca Bound',
        formattedDate: formattedDate,
        pax: updatedReservation.pax,
        totalPrice: updatedReservation.totalPrice,
        pickupHotel: updatedReservation.pickupHotel || undefined
      });
    }

    return NextResponse.json({ success: true, reservation: updatedReservation });
  } catch (error: any) {
    logger('error', "Error en pago simulado:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
