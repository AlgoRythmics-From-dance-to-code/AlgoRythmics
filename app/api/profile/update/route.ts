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
      return NextResponse.json({ error: t('toasts.unexpected_error_desc') }, { status: 401 });
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
      logger.warn({ email: session.user.email }, t('toasts.delete_error')); // Simple fallback
      return NextResponse.json({ error: t('toasts.delete_error') }, { status: 404 });
    }

    const dbUser = result.docs[0];

    const updatedUser = await payload.update({
      collection: 'users',
      id: dbUser.id,
      data: {
        firstName,
        lastName,
        bio,
      } as any,
    });

    logger.info({ userId: dbUser.id }, t('toasts.profile_updated'));
    return NextResponse.json({ message: t('toasts.profile_updated') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.profile_update_error');
    logger.error({ error: message }, t('toasts.profile_update_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
