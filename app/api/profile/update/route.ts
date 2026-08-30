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

    const body = await req.json();
    const cleanFirstName =
      typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 50) : undefined;
    const cleanLastName =
      typeof body.lastName === 'string' ? body.lastName.trim().slice(0, 50) : undefined;
    const cleanBio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) : undefined;
    const mascotEnabled = body.mascotEnabled;

    const payload = await getPayload({ config: configPromise });
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: t('errors.user_not_found') }, { status: 404 });
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        ...(cleanFirstName !== undefined && { firstName: cleanFirstName }),
        ...(cleanLastName !== undefined && { lastName: cleanLastName }),
        ...(cleanBio !== undefined && { bio: cleanBio }),
        ...(mascotEnabled !== undefined && { mascotEnabled: Boolean(mascotEnabled) }),
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
