import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '../../../../lib/constants';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { email, password, remember } = await req.json();
    const payload = await getPayloadInstance();

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    });

    if (result.token) {
      const expiration =
        remember === true
          ? APP_CONFIG.TOKEN_EXPIRATION_REMEMBER_ME
          : APP_CONFIG.TOKEN_EXPIRATION_DEFAULT;
      const cookieStore = await cookies();
      cookieStore.set(APP_CONFIG.COOKIE_TOKEN_NAME, result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiration,
      });
    }

    logger.info({ email }, t('toasts.login_success'));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.login_error');
    logger.error({ error: message }, t('toasts.login_error'));
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
