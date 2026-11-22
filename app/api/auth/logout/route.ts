import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG, ROUTES } from '../../../../lib/constants';

/**
 * Unified logout handler that clears all possible authentication sessions
 * including Payload CMS admin tokens and NextAuth session cookies.
 */
export async function GET(req: Request) {
  await clearAuthSessionCookies();
  return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
}

export async function POST() {
  await clearAuthSessionCookies();
  return NextResponse.json({ success: true });
}

async function clearAuthSessionCookies() {
  const cookieStore = await cookies();

  // 1. Clear Payload CMS Admin cookie
  cookieStore.delete(APP_CONFIG.COOKIE_TOKEN_NAME);

  // 2. Clear NextAuth session cookies (all variations)
  const authCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
  ];

  authCookies.forEach((name) => {
    cookieStore.delete(name);
  });
}
