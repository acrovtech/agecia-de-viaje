import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from './lib/jwt';
import { API_SESSION_COOKIE, isApiAdmin } from './lib/admin-mode';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isApiAdmin()) {
    // API mode has a separate surface; old pages and API handlers are not tenant safe yet.
    const asset = ['/icon.svg', '/logo.svg', '/favicon.ico'].includes(pathname);
    if (asset && ['GET', 'HEAD'].includes(request.method)) return NextResponse.next();
    if (pathname === '/login') return NextResponse.next();
    if (!['/workspace', '/workspace/content', '/workspace/resources', '/workspace/reservations'].includes(pathname)) {
      if (pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) {
        return new NextResponse(null, { status: 403 });
      }
      return NextResponse.redirect(new URL('/workspace', request.url));
    }
    const token = request.cookies.get(API_SESSION_COOKIE)?.value;
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return NextResponse.redirect(new URL('/login', request.url));
    // Authoritative session and agency authorization happen again in the server page and API.
    return NextResponse.next();
  }

  // Permitir assets estáticos, login e imágenes
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

  // Verificar la firma criptográfica (JWT HS256) y expiración de 8h del token de sesión
  const validSession = await verifyAdminToken(sessionCookie.value);

  if (!validSession) {
    // Firma inválida, token forjado o sesión expirada
    const loginUrl = new URL('/login?expired=1', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('admin_session');
    return response;
  }

  return NextResponse.next();
}

// Alias para compatibilidad hacia atrás
export const middleware = proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
