import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, APP_CONFIG, API_ROUTES } from './lib/constants';

/**
 * Authentication & Redirect Middleware (named 'proxy' per Next.js 16+ convention)
 * Manages protected routes and synchronizes session states between frontend and admin.
 */
export default function middleware(request: NextRequest) {
  // 1. Extract session tokens
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  const payloadToken = request.cookies.get(APP_CONFIG.COOKIE_TOKEN_NAME)?.value;
  const token = nextAuthToken || payloadToken;

  const { pathname } = request.nextUrl;

  // 2. Identify route categories
  const isAdmin = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith(ROUTES.LOGIN) || pathname.startsWith(ROUTES.REGISTER);
  const isProtectedRoute =
    pathname.startsWith(ROUTES.ALGORITHMS) ||
    pathname.startsWith(ROUTES.COURSES) ||
    pathname.startsWith(ROUTES.PROFILE);

  const isApiOrStatic =
    pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.');

  // 3. Bypass static files and API immediately
  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // 4. Admin Session Synchronization:
  // If we are on the admin panel login page, but still have a NextAuth session, 
  // we might be in a "partially logged out" state from Payload. 
  // We don't auto-login here, but we allow the page to load correctly.
  if (isAdmin) {
    return NextResponse.next();
  }

  // 5. Frontend Protected Routes
  if (!token && isProtectedRoute) {
    const url = new URL(ROUTES.LOGIN, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 6. Auth Guest Guard (Login/Register accessible only to guests)
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  return NextResponse.next();
}

/**
 * Middleware Matcher Configuration
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
