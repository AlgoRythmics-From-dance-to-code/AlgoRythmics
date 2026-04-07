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

    const { firstName, lastName, bio, mascotEnabled } = await req.json();
    const payload = await getPayload({ config: configPromise });
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        firstName,
        lastName,
        bio,
        mascotEnabled: Boolean(mascotEnabled),
      },
      overrideAccess: true,
    });

    logger.info({ userId }, t('toasts.profile_updated'));
    return NextResponse.json({ message: t('toasts.profile_updated') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.profile_update_error');
    logger.error({ error: message }, t('toasts.profile_update_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
