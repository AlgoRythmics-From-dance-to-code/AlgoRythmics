import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, APP_CONFIG } from './lib/constants';

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

  // 3. Bypass static files and API immediately
  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // 4. Admin Panel Bypass:
  // Payload CMS handles its own internal authentication logic.
  // We bypass middleware for all /admin routes to prevent interfering with its internal redirects.
  if (isAdmin) {
    return NextResponse.next();
  }

  // 5. Guest Guard: Redirect authenticated users away from login/register
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.PROFILE, request.url));
  }

  // 6. Frontend Protected Routes Guard
  if (!token && isProtectedRoute) {
    const url = new URL(ROUTES.LOGIN, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Middleware Matcher Configuration
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
