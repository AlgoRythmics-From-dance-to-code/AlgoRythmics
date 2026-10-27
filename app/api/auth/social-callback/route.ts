import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { APP_CONFIG, ROUTES } from '../../../../lib/constants';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function GET() {
  const baseUrl = APP_CONFIG.BASE_URL;
  const t = await getT();

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=no-session`, baseUrl));
    }

    const payload = await getPayloadInstance();

    // Find the user in Payload
    const result = await payload.find({
      collection: 'users',
      where: {
        email: { equals: session.user.email },
      },
      limit: 1,
      depth: 0, // Minimize data fetched
    });

    if (result.docs.length === 0) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=user-not-found`, baseUrl));
    }

    const user = result.docs[0] as unknown as {
      id: string | number;
      email: string;
      sessions?: Array<{ id: string; createdAt: string; expiresAt: string }>;
    };

    const cookieStore = await cookies();
    const rememberMe = cookieStore.get('auth_remember_me')?.value === 'true';
    const expiration = rememberMe
      ? APP_CONFIG.TOKEN_EXPIRATION_REMEMBER_ME
      : APP_CONFIG.TOKEN_EXPIRATION_DEFAULT;

    // Create a valid session in Payload database (required by Payload v3 session verification)
    const sid = randomUUID();
    const now = new Date();
    const expiresDate = new Date(Date.now() + expiration * 1000);
    const existingSessions = Array.isArray(user.sessions) ? [...user.sessions] : [];
    const validSessions = existingSessions
      .filter((s) => !s.expiresAt || new Date(s.expiresAt) > now)
      .slice(-9);

    validSessions.push({
      id: sid,
      createdAt: now.toISOString(),
      expiresAt: expiresDate.toISOString(),
    });

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        sessions: validSessions,
      } as Record<string, unknown>,
      overrideAccess: true,
    });

    // Sign with payload.secret (hashed by Payload v3) and include sid
    const token = jsonwebtoken.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'users',
        sid,
      },
      payload.secret,
      { expiresIn: expiration },
    );

    const response = NextResponse.redirect(new URL(ROUTES.HOME, baseUrl));
    response.cookies.set(APP_CONFIG.COOKIE_TOKEN_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiration,
    });

    logger.info({ email: user.email }, t('toasts.login_success'));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error_desc');
    logger.error({ error: message }, t('toasts.unexpected_error'));
    return NextResponse.redirect(
      new URL(
        `${ROUTES.LOGIN}?error=social-login-failed&detail=${encodeURIComponent(message)}`,
        baseUrl,
      ),
    );
  }
}
