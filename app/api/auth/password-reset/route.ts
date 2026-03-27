import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: t('toasts.unexpected_error_desc') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // Call Payload's resetPassword operation
    // This will handle the token verification and hashing the new password
    await (payload.resetPassword as any)({
      collection: 'users',
      data: {
        token,
        password,
      },
      overrideAccess: true,
    });
    return NextResponse.json({
      title: t('login.reset_password_success_title'),
      message: t('login.reset_password_success_desc')
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');

    // Check if it's a "Token is invalid" error from Payload
    if (message.includes('token') || message.includes('invalid') || message.includes('expired')) {
        return NextResponse.json({ error: t('login.errors.reset_token_invalid') }, { status: 400 });
    }

    logger.error({ error: message }, 'Reset password error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
