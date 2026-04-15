import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { token, password } = await req.json();

    const MIN_PASSWORD_LENGTH = 8;
    if (!token || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: t('toasts.unexpected_error_desc') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // Call Payload's resetPassword operation
    // This will handle the token verification and hashing the new password
    await payload.resetPassword({
      collection: 'users',
      data: {
        token,
        password,
      },
      overrideAccess: true,
    });
    return NextResponse.json({
      title: t('login.reset_password_success_title'),
      message: t('login.reset_password_success_desc'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');

    // Check if it's a "Token is invalid" error from Payload
    if (message.includes('Token is invalid') || message.includes('expired')) {
      return NextResponse.json({ error: t('login.errors.reset_token_invalid') }, { status: 400 });
    }

    logger.error({ error: message }, 'Reset password error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const t = await getT();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: t('login.errors.reset_token_invalid') },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      },
    );
  }

  try {
    const payload = await getPayload({ config: configPromise });

    // Look for user with this token
    // Payload stores these in internal fields
    const users = await payload.find({
      collection: 'users',
      where: {
        _resetPasswordToken: {
          equals: token,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (!users.docs.length) {
      return NextResponse.json({ error: t('login.errors.reset_token_invalid') }, { status: 400 });
    }

    const user = users.docs[0] as any;
    const expiration = user._resetPasswordExpiration ? new Date(user._resetPasswordExpiration).getTime() : 0;
    const now = Date.now();

    if (!expiration || now > expiration) {
      return NextResponse.json(
        { error: t('login.errors.reset_token_invalid') },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        },
      );
    }

    return NextResponse.json(
      { valid: true },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      },
    );
  } catch (error) {
    logger.error({ error }, 'Validate reset token error');
    return NextResponse.json(
      { error: t('toasts.unexpected_error') },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      },
    );
  }
}
