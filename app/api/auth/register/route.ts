import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { ROLES } from '../../../../lib/constants';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

export async function POST(req: Request) {
  const t = await getT();
  try {
    const { email, password, firstName, lastName } = await req.json();
    const payload = await getPayload({ config: configPromise });

    interface CreateUser {
      email: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role: 'user' | 'admin';
    }
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        firstName,
        lastName,
        role: ROLES.USER as 'user',
      } as CreateUser,
    });

    logger.info({ email }, t('toasts.register_success'));
    return NextResponse.json({ message: t('toasts.register_success') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.register_error');
    logger.error({ error: message }, t('toasts.register_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
