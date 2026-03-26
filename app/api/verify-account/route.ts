import { getPayload } from 'payload';
import configPromise from '../../../payload.config';
import { NextResponse } from 'next/server';
import logger from '../../../lib/logger';
import { getT } from '../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: t('verify.no_token') }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // Use find + update pattern for reliability
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
      return NextResponse.json({ error: t('verify.no_token') }, { status: 400 });
    }
  } catch (error: any) {
    logger.error({ error: error.message || error }, t('toasts.verify_error'));
    return NextResponse.json({ error: error.message || t('toasts.verify_error') }, { status: 500 });
  }
}
