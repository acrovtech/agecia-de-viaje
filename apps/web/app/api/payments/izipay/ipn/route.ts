import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { sendReservationConfirmationEmail } from '@/lib/email';
import { verifyIzipayHMAC, getIzipayHmacSecret } from '@/lib/izipay';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Izipay envía los datos de respuesta en la propiedad 'kr-answer' y el hash en 'kr-hash'
    const krAnswerRaw = body['kr-answer'];
    const krHash = body['kr-hash'];

    if (!krAnswerRaw || !krHash) {
      return NextResponse.json({ error: 'Payload de Izipay inválido' }, { status: 400 });
    }

    const hmacKey = getIzipayHmacSecret();

    if (!hmacKey) {
      logger('error', 'Izipay IPN Error: No se configuró la llave HMAC adecuada.');
      return NextResponse.json({ error: 'Configuración de seguridad incompleta' }, { status: 500 });
    }

    // Validar firma HMAC con comparación en tiempo constante
    const isValidSignature = verifyIzipayHMAC(krAnswerRaw, krHash, hmacKey);

    if (!isValidSignature) {
      logger('warn', 'IZIPAY IPN RECHAZADO: Firma HMAC inválida.');
      return NextResponse.json({ error: 'Firma HMAC de Izipay inválida' }, { status: 401 });
    }

    const answer = typeof krAnswerRaw === 'string' ? JSON.parse(krAnswerRaw) : krAnswerRaw;
    const orderId = answer.orderDetails?.orderId;
    const orderStatus = answer.orderStatus; // Ej. 'PAID', 'AUTHORIZED'

    if (orderId && (orderStatus === 'PAID' || orderStatus === 'AUTHORIZED')) {
      logger('info', `IZIPAY IPN: Notificación válida recibida para Reserva ID: ${orderId} - Estado: ${orderStatus}`);

      // 1. Actualizar estado de la Reserva a PAID en PostgreSQL
      const updatedReservation = await prisma.reservation.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentReference: answer.transactions?.[0]?.uuid || 'IZIPAY_PAID'
        }
      });

      const tour = await prisma.tour.findUnique({
        where: { id: updatedReservation.tourId }
      });

      // 2. Disparar el envío del correo de confirmación de reserva al turista
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
    }

    return NextResponse.json({ response: 'OK' }, { status: 200 });
  } catch (error: any) {
    logger('error', 'Error en Webhook IPN de Izipay:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
