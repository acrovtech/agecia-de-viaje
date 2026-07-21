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

  if (!sessionCookie || (sessionCookie.value !== 'MASTER' && sessionCookie.value !== 'CLIENT')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
