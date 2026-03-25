import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for the payload token cookie
  const token = request.cookies.get('payload-token')?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isHomePage = pathname === '/';
  const isPublicPage = isHomePage || pathname === '/about' || pathname.startsWith('/verify');
  const isAdmin = pathname.startsWith('/admin');
  const isApiOrStatic =
    pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');

  // Bypass API routes and static files immediately
  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // If unauthenticated and trying to access protected route (anything other than public, auth, admin)
  if (!token && !isPublicPage && !isAuthPage && !isAdmin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
