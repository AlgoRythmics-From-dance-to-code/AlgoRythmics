import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, APP_CONFIG, API_ROUTES } from './lib/constants';

/**
 * Shared Middleware (named 'proxy' for this project's configuration)
 * Handles route protection and identifies session-sync loops.
 */
export default function middleware(request: NextRequest) {
  // 1. Check for all possible session tokens
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  const payloadToken = request.cookies.get(APP_CONFIG.COOKIE_TOKEN_NAME)?.value;
  const token = nextAuthToken || payloadToken;

  const { pathname } = request.nextUrl;

  // 2. Route categories
  const isApiOrStatic =
    pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');
  const isAdmin = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith(ROUTES.LOGIN) || pathname.startsWith(ROUTES.REGISTER);
  const isProtectedRoute =
    pathname.startsWith(ROUTES.ALGORITHMS) ||
    pathname.startsWith(ROUTES.COURSES) ||
    pathname.startsWith(ROUTES.PROFILE);

  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // 3. Admin Panel Session Loop-Breaker:
  // If we just logged out of Admin (/admin/logout -> /admin/login), 
  // but we still have an active NextAuth session, we MUST force a full logout. 
  // Otherwise, a re-login loop happens.
  if (isAdmin) {
    if (pathname.includes('/login') && nextAuthToken && !payloadToken) {
      // Force user to our unified logout to clear everything
      return NextResponse.redirect(new URL(API_ROUTES.AUTH.LOGOUT, request.url));
    }
    return NextResponse.next();
  }

  // 4. Frontend Protected Routes
  if (!token && isProtectedRoute) {
    const url = new URL(ROUTES.LOGIN, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 5. Auth Guest Guard (e.g. redirect away from /login if logged in)
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
