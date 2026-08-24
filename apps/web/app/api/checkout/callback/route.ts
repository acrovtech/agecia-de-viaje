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

    // NOTA DE SEGURIDAD: El callback no muta el estado de la reserva a PAID.
    // La única autoridad para la transición a PAID es el Webhook IPN firmado de Izipay.
    logger('info', `IZIPAY CALLBACK: Petición recibida para Orden: ${orderId}, Estado: ${orderStatus}. Sin mutación de BD.`);

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    logger('error', 'Error procesando callback de Izipay:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
