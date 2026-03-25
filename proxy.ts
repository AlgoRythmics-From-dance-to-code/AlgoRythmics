import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_CONFIG, ROUTES } from './lib/constants';

export function proxy(request: NextRequest) {
  // Check for the payload token cookie
  const token = request.cookies.get(APP_CONFIG.COOKIE_TOKEN_NAME)?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith(ROUTES.LOGIN) || pathname.startsWith(ROUTES.REGISTER);
  const isHomePage = pathname === ROUTES.HOME;
  // Admin logic: Payload handles its own auth, so we don't redirect to /login
  const isAdmin = pathname.startsWith('/admin');
  
  const isApiOrStatic =
    pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');

  // Bypass API routes and static files immediately
  if (isApiOrStatic || isAdmin) {
    return NextResponse.next();
  }

  // Define truly protected paths
  const isProtectedRoute = pathname.startsWith(ROUTES.ALGORITHMS) || pathname.startsWith(ROUTES.COURSES);

  // If unauthenticated and trying to access protected frontend route (Algorithms, Courses)
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // If authenticated and trying to access auth pages (Login/Register), redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
