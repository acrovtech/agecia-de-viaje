import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const krAnswerStr = params.get('kr-answer');
    const krHash = params.get('kr-hash');
    
    if (!krAnswerStr || !krHash) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const hmacKey = process.env.IZIPAY_HMAC_KEY;

    if (!hmacKey) {
      console.error('IziPay IPN: Llave HMAC no configurada');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Validar firma
    const calculatedHash = crypto.createHmac('sha256', hmacKey).update(krAnswerStr).digest('hex');
    if (calculatedHash !== krHash) {
      console.error('IziPay IPN: Firma inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Procesar la respuesta
    const answer = JSON.parse(krAnswerStr);
    const orderId = answer.orderDetails.orderId;
    const orderStatus = answer.orderStatus; // e.g., 'PAID', 'UNPAID', 'RUNNING'

    console.log(`IziPay IPN Recibido. Orden: ${orderId}, Status: ${orderStatus}`);

    // Si el pago es exitoso, actualizar el estado de la reserva en la Base de Datos
    if (orderStatus === 'PAID') {
      await prisma.reservation.update({
        where: { id: orderId },
        data: { status: 'PAID' }
      });
      console.log(`Reserva ${orderId} actualizada a PAID.`);
    }

    // IziPay requiere que devuelvas un 200 OK con texto para confirmar recepción
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Error procesando IPN de Izipay:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
