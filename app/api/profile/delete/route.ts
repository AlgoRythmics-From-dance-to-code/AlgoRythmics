import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getT } from '../../../../lib/i18n-server';
import logger from '../../../../lib/logger';

export async function DELETE(req: Request) {
  const t = await getT();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const payload = await getPayload({ config: configPromise });

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

    // Delete the user
    await payload.delete({
      collection: 'users',
      id: dbUser.id,
    });

    logger.info({ userId: dbUser.id }, t('toasts.account_deleted'));
    return NextResponse.json({ message: t('toasts.account_deleted') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.delete_error');
    logger.error({ error: message }, t('toasts.delete_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
