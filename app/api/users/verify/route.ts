import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: t('verify.no_token') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // Payload 3.0 Local API for verification
    // We'll use the find + update pattern as it's the most reliable across versions
    const result = await payload.find({
      collection: 'users',
      where: {
        _verificationToken: {
          equals: token,
        },
      },
      showHiddenFields: true,
    });

    if (result.docs.length > 0) {
      const user = result.docs[0];
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          _verified: true,
          _verificationToken: null,
        },
      });

      logger.info({ userId: user.id }, t('toasts.verify_success'));
      return NextResponse.json({ message: t('toasts.verify_success') });
    } else {
      return NextResponse.json(
        { error: t('verify.error_msg', { error: 'invalid-token' }) },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error, message }, t('toasts.verify_error'));
    return NextResponse.json({ error: t('toasts.verify_error') }, { status: 500 });
  }
}
