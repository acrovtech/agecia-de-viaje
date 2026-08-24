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
      const transactionUuid = answer.transactions?.[0]?.uuid || 'IZIPAY_PAID';

      // 1. Transición atómica e idempotente: solo muta si la reserva está actualmente en estado PENDING
      const updateResult = await prisma.reservation.updateMany({
        where: {
          id: orderId,
          status: 'PENDING'
        },
        data: {
          status: 'PAID',
          paymentReference: transactionUuid
        }
      });

      // 2. Si count === 1, esta llamada realizó legítimamente la primera transición PENDING -> PAID
      if (updateResult.count === 1) {
        logger('info', `IZIPAY IPN: Transición PENDING -> PAID exitosa para Reserva ID: ${orderId} - Estado Izipay: ${orderStatus}`);

        const updatedReservation = await prisma.reservation.findUnique({
          where: { id: orderId },
          include: { tour: true }
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
            tourTitle: updatedReservation.tour?.title || 'Tour Inca Bound',
            formattedDate: formattedDate,
            pax: updatedReservation.pax,
            totalPrice: updatedReservation.totalPrice,
            pickupHotel: updatedReservation.pickupHotel || undefined
          });
        }
      } else {
        logger('info', `IZIPAY IPN: Notificación repetida o reserva ya procesada para Reserva ID: ${orderId} (count: ${updateResult.count})`);
      }
    }

    return NextResponse.json({ response: 'OK' }, { status: 200 });
  } catch (error: any) {
    logger('error', 'Error en Webhook IPN de Izipay:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
