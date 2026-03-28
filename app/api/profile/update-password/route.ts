import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getT } from '../../../../lib/i18n-server';
import logger from '../../../../lib/logger';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: t('toasts.password_min') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // Verify current password first to ensure requester is the account owner
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: session.user.email,
          password: currentPassword,
        },
      });
    } catch {
      return NextResponse.json({ error: t('toasts.password_current_incorrect') }, { status: 400 });
    }

    // Find the user by email
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
      showHiddenFields: true, // Need this to access authProvider field
    });

    if (result.docs.length === 0) {
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    const dbUser = result.docs[0] as { id: string | number; authProvider?: string };

    // Check if user is a social user
    if (dbUser.authProvider && dbUser.authProvider !== 'email') {
      return NextResponse.json({ error: t('toasts.password_social_error') }, { status: 400 });
    }

    // Update the password - Payload handles hashing automatically for the 'password' field
    await payload.update({
      collection: 'users',
      id: dbUser.id as string | number,
      data: {
        password: newPassword,
      } as { password?: string },
    });

    logger.info({ userId: dbUser.id }, t('toasts.password_updated'));
    return NextResponse.json({ message: t('toasts.password_updated') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.password_update_error');
    logger.error({ error: message }, t('toasts.password_update_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
