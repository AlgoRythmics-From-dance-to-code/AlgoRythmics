import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '../../../../lib/constants';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const remember = body?.remember === true;

    if (!email || !password) {
      return NextResponse.json({ error: t('toasts.login_error') }, { status: 400 });
    }

    const payload = await getPayloadInstance();

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    });

    if (result.token) {
      const expiration = remember
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
    return NextResponse.json({ user: result.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.login_error');
    logger.error({ error: message }, t('toasts.login_error'));
    return NextResponse.json({ error: t('toasts.login_error') }, { status: 401 });
  }
}
