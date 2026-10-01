import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies POST /api/invitations/:token/accept to the central API
 * POST /v1/invitations/:token/accept (public endpoint).
 * No admin auth required — this is a public invitation acceptance endpoint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = process.env.ADMIN_API_URL;
  if (!origin) {
    return NextResponse.json(
      { message: 'API no disponible' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const res = await fetch(
      `${origin}/v1/invitations/${encodeURIComponent(token)}/accept`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      },
    );

    const resBody = await res.json().catch(() => ({}));
    return NextResponse.json(resBody, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'Error de conexión con la API' },
      { status: 503 },
    );
  }
}
