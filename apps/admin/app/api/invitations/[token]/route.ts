import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies GET /api/invitations/:token to the central API
 * GET /v1/invitations/:token (public endpoint).
 * No admin auth required — this is a public invitation lookup.
 */
export async function GET(
  _req: NextRequest,
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

  try {
    const res = await fetch(
      `${origin}/v1/invitations/${encodeURIComponent(token)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      },
    );

    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'Error de conexión con la API' },
      { status: 503 },
    );
  }
}
