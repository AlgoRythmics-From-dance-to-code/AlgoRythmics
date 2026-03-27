import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: t('login.errors.email_required') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
      depth: 0,
    });

    if (users.docs.length === 0) {
      // Return success even if not found to prevent user enumeration
      return NextResponse.json({
        title: t('login.forgot_password_success_title'),
        message: t('login.forgot_password_success_desc'),
      });
    }

    interface LocalUser {
      id: string | number;
      authProvider?: string;
      lastResetRequest?: string;
    }
    const user = users.docs[0] as unknown as LocalUser;

    // Check if the user is using an email provider
    // Social login accounts (Google, Facebook, etc.) cannot reset passwords this way
    if (user.authProvider && user.authProvider !== 'email') {
      // Return success but don't perform the reset to prevent revealing account provider
      return NextResponse.json({
        title: t('login.forgot_password_success_title'),
        message: t('login.forgot_password_success_desc'),
      });
    }

    const lastRequest = user.lastResetRequest ? new Date(user.lastResetRequest).getTime() : 0;
    const now = Date.now();

    // 15 minutes limit (15 * 60 * 1000 ms)
    if (now - lastRequest < 15 * 60 * 1000) {
      return NextResponse.json({ error: t('login.errors.rate_limit_error') }, { status: 429 });
    }

    // Trigger Payload's forgotPassword operation
    // This will generate the token and send the email via the generateEmailHTML we configured
    await payload.forgotPassword({
      collection: 'users',
      data: {
        email,
      },
    });

    // Update the last request time
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        lastResetRequest: new Date().toISOString(),
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      title: t('login.forgot_password_success_title'),
      message: t('login.forgot_password_success_desc'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');
    logger.error({ error: message }, 'Forgot password error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
