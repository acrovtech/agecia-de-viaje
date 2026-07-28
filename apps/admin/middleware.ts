import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, API routes and the login page
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/icon.svg' ||
    pathname === '/logo.svg'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session');

  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const rawValue = sessionCookie.value;

  // 1. Compatibilidad con tokens simples
  if (rawValue === 'MASTER' || rawValue === 'CLIENT') {
    return NextResponse.next();
  }

  // 2. Decodificar y validar token con timestamp de expiración (8 horas)
  try {
    const decodedJson = Buffer.from(rawValue, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedJson);

    if (!payload.role || !payload.exp || Date.now() > payload.exp) {
      // Sesión expirada
      const loginUrl = new URL('/login?expired=1', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_session');
      return response;
    }
  } catch {
    // Cookie corrupta o alterada
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('admin_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
