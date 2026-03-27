import { auth } from '../../../../auth';
import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    const payload = await getPayload({ config: configPromise });

    // Find the user in Payload
    const result = await payload.find({
      collection: 'users',
      where: {
        email: { equals: session.user.email },
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=user-not-found`, baseUrl));
    }

    const user = result.docs[0];

    const cookieStore = await cookies();
    const rememberMe = cookieStore.get('auth_remember_me')?.value === 'true';
    const expiration = rememberMe ? APP_CONFIG.TOKEN_EXPIRATION_REMEMBER_ME : APP_CONFIG.TOKEN_EXPIRATION_DEFAULT;

    // Generate a Payload-compatible JWT token directly
    // Payload uses the PAYLOAD_SECRET env var to sign tokens
    const payloadSecret = process.env.PAYLOAD_SECRET || 'fallback-secret';
    const token = jsonwebtoken.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'users',
      },
      payloadSecret,
      { expiresIn: expiration }
    );

    cookieStore.set(APP_CONFIG.COOKIE_TOKEN_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiration,
    });

    logger.info({ email: user.email }, t('toasts.login_success'));
    return NextResponse.redirect(new URL(ROUTES.HOME, baseUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error_desc');
    logger.error({ error: message }, t('toasts.unexpected_error'));
    return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=social-login-failed&detail=${encodeURIComponent(message)}`, baseUrl));
  }
}
