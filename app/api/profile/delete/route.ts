import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { APP_CONFIG } from '../../../../lib/constants';
import { getT } from '../../../../lib/i18n-server';
import logger from '../../../../lib/logger';

export async function DELETE(_req: Request) {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const payload = await getPayloadInstance();

    // Find the user by email
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    const dbUser = result.docs[0];
    const userId = dbUser.id;

    // Cascade delete user progress & analytics records to prevent orphan data
    try {
      await payload.delete({
        collection: 'algorithm-progress',
        where: { user: { equals: userId } },
        overrideAccess: true,
      });
      await payload.delete({
        collection: 'course-progress',
        where: { user: { equals: userId } },
        overrideAccess: true,
      });
      await payload.delete({
        collection: 'learning-events',
        where: { user: { equals: userId } },
        overrideAccess: true,
      });
      await payload.delete({
        collection: 'bug-reports',
        where: { user: { equals: userId } },
        overrideAccess: true,
      });
      await payload.delete({
        collection: 'search-analytics',
        where: { user: { equals: userId } },
        overrideAccess: true,
      });
    } catch (cleanupErr) {
      logger.warn({ userId, error: cleanupErr }, 'Non-fatal error during user cascade deletion');
    }

    // Delete the user
    await payload.delete({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    });

    logger.info({ userId }, t('toasts.account_deleted'));
    const response = NextResponse.json({ message: t('toasts.account_deleted') });
    const authCookies = [
      APP_CONFIG.COOKIE_TOKEN_NAME,
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
    ];
    authCookies.forEach((name) => {
      response.cookies.delete(name);
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.delete_error');
    logger.error({ error: message }, t('toasts.delete_error'));
    return NextResponse.json({ error: t('toasts.delete_error') }, { status: 400 });
  }
}
