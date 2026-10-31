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
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isProtectedRoute =
    pathname.startsWith(ROUTES.COURSES) ||
    pathname.startsWith(ROUTES.PROFILE) ||
    pathname.startsWith(ROUTES.ADMIN_STATISTICS) ||
    pathname.startsWith(ROUTES.STUDIO);

  // 3. Bypass static files and API immediately
  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // 4. Admin Panel SSO & Bypass:
  // If user is authenticated on frontend but missing Payload cookie, sync via SSO
  if (isAdmin) {
    if (!payloadToken && nextAuthToken && !pathname.startsWith('/admin/login')) {
      const ssoUrl = new URL('/api/auth/sso', request.url);
      ssoUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(ssoUrl);
    }
    return NextResponse.next();
  }

  // 5. Guest Guard: Redirect authenticated users away from login/register
  // DEPRECATED: We now handle this via server components in /login and /register
  // because middleware cannot validate if a JWT is actually expired.
  // if (token && isAuthPage) {
  //   return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  // }

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
