import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from './lib/jwt';
import { API_SESSION_COOKIE, isApiAdmin } from './lib/admin-mode';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isApiAdmin()) {
    // API mode has a separate surface; old pages and API handlers are not tenant safe yet.
    const isStaticAsset =
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/integrations/') ||
      ['/icon.svg', '/logo.svg', '/favicon.ico'].includes(pathname);
    if (isStaticAsset && ['GET', 'HEAD'].includes(request.method)) return NextResponse.next();
    if (pathname === '/login') return NextResponse.next();

    const isAllowedRoute =
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/') ||
      pathname === '/reservations' ||
      pathname.startsWith('/reservations/') ||
      pathname === '/operations' ||
      pathname.startsWith('/operations/') ||
      pathname === '/catalog' ||
      pathname.startsWith('/catalog/') ||
      pathname === '/resources' ||
      pathname.startsWith('/resources/') ||
      pathname === '/team' ||
      pathname.startsWith('/team/') ||
      pathname === '/notifications' ||
      pathname.startsWith('/notifications/') ||
      pathname === '/content' ||
      pathname.startsWith('/content/') ||
      pathname === '/settings' ||
      pathname.startsWith('/settings/') ||
      pathname === '/workspace' ||
      pathname.startsWith('/workspace/');
    if (!isAllowedRoute) {
      if (pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) {
        return new NextResponse(null, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|integrations).*)'],
};
