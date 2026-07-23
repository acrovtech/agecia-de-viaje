import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { sendReservationConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Izipay envía los datos de respuesta en la propiedad 'kr-answer' y el hash en 'kr-hash'
    const krAnswerRaw = body['kr-answer'];
    const krHash = body['kr-hash'];

    if (!krAnswerRaw) {
      return NextResponse.json({ error: 'Payload de Izipay inválido' }, { status: 400 });
    }

    const answer = typeof krAnswerRaw === 'string' ? JSON.parse(krAnswerRaw) : krAnswerRaw;
    
    const orderId = answer.orderDetails?.orderId;
    const orderStatus = answer.orderStatus; // Ej. 'PAID', 'AUTHORIZED'
    const hmacKey = process.env.IZIPAY_HMAC_SHA256 || process.env.IZIPAY_TEST_PASSWORD || '';

    // Validar firma HMAC-SHA256 si la llave existe
    if (hmacKey && krHash) {
      const calculatedHash = crypto
        .createHmac('sha256', hmacKey)
        .update(typeof krAnswerRaw === 'string' ? krAnswerRaw : JSON.stringify(krAnswerRaw))
        .digest('hex');

      if (calculatedHash !== krHash) {
        console.warn("⚠️ Firma HMAC de Izipay no coincide en IPN.");
      }
    }

    if (orderId && (orderStatus === 'PAID' || orderStatus === 'AUTHORIZED')) {
      console.log(`💳 [IZIPAY IPN] Notificación recibida para Reserva ID: ${orderId} - Estado: ${orderStatus}`);

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
    console.error("❌ Error en Webhook IPN de Izipay:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
