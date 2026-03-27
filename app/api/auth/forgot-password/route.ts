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

    // Find the user to check rate limiting
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    });

    if (users.docs.length === 0) {
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    const user = users.docs[0] as any;

    // Check if the user is using an email provider
    // Social login accounts (Google, Facebook, etc.) cannot reset passwords this way
    if (user.authProvider && user.authProvider !== 'email') {
      return NextResponse.json({ error: t('login.errors.social_account_error') }, { status: 400 });
    }

    const lastRequest = user.lastResetRequest ? new Date(user.lastResetRequest).getTime() : 0;
    const now = Date.now();
    
    // 15 minutes limit (15 * 60 * 1000 ms)
    if (now - lastRequest < 15 * 60 * 1000) {
      return NextResponse.json(
        { error: t('login.errors.rate_limit_error') }, 
        { status: 429 }
      );
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
    await (payload as any).update({
      collection: 'users',
      id: user.id,
      data: {
        lastResetRequest: new Date().toISOString(),
      },
      overrideAccess: true,
    });

    return NextResponse.json({ 
      title: t('login.forgot_password_success_title'),
      message: t('login.forgot_password_success_desc') 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.unexpected_error');
    logger.error({ error: message }, 'Forgot password error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
