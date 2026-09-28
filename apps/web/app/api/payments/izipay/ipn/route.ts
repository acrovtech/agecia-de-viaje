import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { sendReservationConfirmationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const krAnswerRaw = body['kr-answer'];
    const krHash = body['kr-hash'] || req.headers.get('kr-hash') || '';

    if (!krAnswerRaw) {
      return NextResponse.json({ error: 'Payload de Izipay inválido' }, { status: 400 });
    }

    const apiBaseUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002';

    // Delegación autoritativa al dominio central de pagos NestJS
    const apiResponse = await fetch(`${apiBaseUrl}/v1/payments/izipay/ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kr-hash': krHash,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      logger('warn', `IPN rechazado por la API central (${apiResponse.status}): ${JSON.stringify(result)}`);
      return NextResponse.json(result, { status: apiResponse.status });
    }

    // Si el pago fue confirmado autoritativamente por NestJS
    if (result.success && result.status === 'PAID') {
      const orderId = result.reservationCode;
      logger('info', `IZIPAY IPN: Confirmado por API central para orden: ${orderId}`);

      // Notificación por email al cliente (no bloqueante de la transacción de pago)
      try {
        const reservation = await prisma.reservation.findFirst({
          where: {
            OR: [{ code: orderId }, { id: orderId }],
          },
          include: {
            tour: true,
            transfer: true,
            items: {
              include: {
                tour: true,
                transfer: true,
              },
            },
          },
        });

        if (reservation) {
          const formattedDate = new Date(reservation.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          let serviceTitle = reservation.tour?.title;
          if (!serviceTitle && reservation.transfer) {
            serviceTitle = `Traslado: ${reservation.transfer.origin} - ${reservation.transfer.destination}`;
          }
          if (reservation.items && reservation.items.length > 0) {
            const itemTitles = reservation.items.map((it) =>
              it.tour?.title || (it.transfer ? `Traslado: ${it.transfer.origin} a ${it.transfer.destination}` : 'Servicio Inca Bound'),
            );
            serviceTitle = itemTitles.join(' + ');
          }
          serviceTitle = serviceTitle || 'Expedición Inca Bound';

          await sendReservationConfirmationEmail({
            reservationId: reservation.id,
            customerName: `${reservation.customerFirstName} ${reservation.customerLastName}`,
            customerEmail: reservation.customerEmail,
            tourTitle: serviceTitle,
            formattedDate: formattedDate,
            pax: reservation.pax,
            totalPrice: reservation.totalPrice,
            pickupHotel: reservation.pickupHotel || undefined,
          });
        }
      } catch (emailError) {
        logger('error', 'Error enviando correo de confirmación post-IPN:', emailError);
      }
    } else if (result.status === 'REVIEW_REQUIRED') {
      logger('warn', `IZIPAY IPN: Transacción requiere revisión manual (${result.reviewReason})`);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger('error', 'Error en Webhook IPN de Izipay:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar IPN' }, { status: 500 });
  }
}

