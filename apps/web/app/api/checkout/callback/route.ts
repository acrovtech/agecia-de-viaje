import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { verifyIzipayHMAC, getIzipayHmacSecret } from '@/lib/izipay';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const krAnswerStr = params.get('kr-answer');
    const krHash = params.get('kr-hash');
    
    if (!krAnswerStr || !krHash) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (kr-answer / kr-hash)' }, { status: 400 });
    }

    const hmacKey = getIzipayHmacSecret();

    if (!hmacKey) {
      logger('error', 'Izipay Callback Error: Llave HMAC no configurada');
      return NextResponse.json({ error: 'Configuración de seguridad incompleta' }, { status: 500 });
    }

    // Validar firma HMAC con función unificada
    const isValidSignature = verifyIzipayHMAC(krAnswerStr, krHash, hmacKey);
    if (!isValidSignature) {
      logger('warn', 'IZIPAY CALLBACK RECHAZADO: Firma HMAC inválida');
      return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 401 });
    }

    // Procesar la respuesta
    const answer = JSON.parse(krAnswerStr);
    const orderId = answer.orderDetails?.orderId;
    const orderStatus = answer.orderStatus; // e.g., 'PAID', 'UNPAID', 'RUNNING'

    logger('info', `IZIPAY CALLBACK: Petición recibida. Orden: ${orderId}, Estado: ${orderStatus}`);

    // Si el pago es exitoso, actualizar el estado de la reserva en la Base de Datos
    if (orderId && orderStatus === 'PAID') {
      await prisma.reservation.update({
        where: { id: orderId },
        data: { status: 'PAID' }
      });
      logger('info', `Reserva ${orderId} actualizada a PAID.`);
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    logger('error', 'Error procesando callback de Izipay:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
