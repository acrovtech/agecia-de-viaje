import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getApiInternalUrl(): string {
  const url = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: API_INTERNAL_URL o NEXT_PUBLIC_API_URL es obligatorio en producción');
    }
    return 'http://127.0.0.1:3002';
  }
  return url;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let krAnswerRaw = '';
    let krHash = req.headers.get('kr-hash') || '';

    // Soporte para ambos formatos oficiales de Izipay: x-www-form-urlencoded y JSON
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const rawText = await req.text();
      const params = new URLSearchParams(rawText);
      krAnswerRaw = params.get('kr-answer') || '';
      krHash = params.get('kr-hash') || krHash;
    } else {
      const rawText = await req.text();
      try {
        const json = JSON.parse(rawText);
        if (typeof json['kr-answer'] === 'string') {
          krAnswerRaw = json['kr-answer'];
        } else if (json['kr-answer']) {
          krAnswerRaw = JSON.stringify(json['kr-answer']);
        }
        krHash = json['kr-hash'] || krHash;
      } catch {
        return NextResponse.json({ error: 'Payload de webhook malformado' }, { status: 400 });
      }
    }

    if (!krAnswerRaw || !krHash) {
      return NextResponse.json(
        { error: 'Payload de Izipay incompleto (kr-answer y kr-hash requeridos)' },
        { status: 400 },
      );
    }

    const apiBaseUrl = getApiInternalUrl();

    // Reenvío con preservación del string exacto firmado para verificación criptográfica autoritativa
    const apiResponse = await fetch(`${apiBaseUrl}/v1/payments/izipay/ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kr-hash': krHash,
      },
      body: JSON.stringify({
        'kr-answer': krAnswerRaw,
        'kr-hash': krHash,
      }),
      cache: 'no-store',
    });

    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      logger('warn', `IPN rechazado por la API central (${apiResponse.status}): ${JSON.stringify(result)}`);
      return NextResponse.json(result, { status: apiResponse.status });
    }

    if (result.success && result.status === 'PAID') {
      logger('info', `IZIPAY IPN: Confirmado por API central (código: ${result.reservationCode})`);
    } else if (result.status === 'REVIEW_REQUIRED') {
      logger('warn', `IZIPAY IPN: Requiere revisión manual (${result.reviewReason})`);
    }

    // La entrega de notificaciones pertenece exclusivamente al Outbox transaccional de NestJS
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger('error', 'Error en Webhook IPN de Izipay:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar IPN' }, { status: 500 });
  }
}


