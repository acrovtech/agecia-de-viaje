import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
