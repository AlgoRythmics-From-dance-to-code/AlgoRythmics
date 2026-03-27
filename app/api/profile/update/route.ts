import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { firstName, lastName, bio } = await req.json();
    const payload = await getPayload({ config: configPromise });

    // Find the user by email
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      logger.warn({ email: session.user.email }, t('errors.user_not_found')); // User not found during profile update
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    const dbUser = result.docs[0];

    await payload.update({
      collection: 'users',
      id: dbUser.id,
      data: {
        firstName,
        lastName,
        bio,
      } as { firstName?: string; lastName?: string; bio?: string },
    });

    logger.info({ userId: dbUser.id }, t('toasts.profile_updated'));
    return NextResponse.json({ message: t('toasts.profile_updated') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.profile_update_error');
    logger.error({ error: message }, t('toasts.profile_update_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
