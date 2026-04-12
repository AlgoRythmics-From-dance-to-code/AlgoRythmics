import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, APP_CONFIG } from './lib/constants';

const locales = APP_CONFIG.LOCALES as unknown as string[];
const defaultLocale = APP_CONFIG.DEFAULT_LOCALE;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Route categories - bypass static files and API immediately
  // These should NOT have locale prefixes handled by our middleware logic
  const isApiOrStatic =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/flags') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('og-image.png') ||
    pathname.includes('.');

  if (isApiOrStatic) {
    return NextResponse.next();
  }

  // 2. Admin Panel Bypass
  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) {
    return NextResponse.next();
  }

  // 3. Locale Detection & Redirection
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameLocale) {
    // Redirect if there is no locale
    const localeSelection = getLocale(request);
    const url = new URL(`/${localeSelection}${pathname === '/' ? '' : pathname}`, request.url);

    // Preserve search params
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    return NextResponse.redirect(url);
  }

  // 4. Session/Token Check
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  const payloadToken = request.cookies.get(APP_CONFIG.COOKIE_TOKEN_NAME)?.value;
  const token = nextAuthToken || payloadToken;

  // 5. Protected Routes & Auth Pages Logic (Locale-Aware)
  const currentLocale = pathnameLocale;
  const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';

  const isAuthPage =
    pathnameWithoutLocale.startsWith(ROUTES.LOGIN) ||
    pathnameWithoutLocale.startsWith(ROUTES.REGISTER);
  const isProtectedRoute =
    pathnameWithoutLocale.startsWith(ROUTES.ALGORITHMS) ||
    pathnameWithoutLocale.startsWith(ROUTES.COURSES) ||
    pathnameWithoutLocale.startsWith(ROUTES.PROFILE);

  // 5a. Frontend Protected Routes Guard
  if (!token && isProtectedRoute) {
    const url = new URL(`/${currentLocale}${ROUTES.LOGIN}`, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 5b. Guest Guard (redirect away from /login if already authenticated)
  if (token && isAuthPage) {
    const homePath = ROUTES.HOME === '/' ? '' : ROUTES.HOME;
    return NextResponse.redirect(new URL(`/${currentLocale}${homePath}`, request.url));
  }

  return NextResponse.next();
}

function getLocale(request: NextRequest) {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;

  // 2. Check browser language (Accept-Language header)
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].split('-')[0].toLowerCase())
      .find((lang) => locales.includes(lang));

    if (preferred) return preferred;
  }

  // 3. Fallback
  return defaultLocale;
}

/**
 * Middleware Matcher Configuration
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|flags|og-image.png).*)'],
};
