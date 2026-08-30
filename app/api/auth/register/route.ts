import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { ROLES } from '../../../../lib/constants';
import logger from '../../../../lib/logger';
import { getT } from '../../../../lib/i18n-server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const t = await getT();
  try {
    const body = await req.json();
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 50) : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim().slice(0, 50) : '';

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        { error: t('login.errors.email_required') || 'Érvényes e-mail cím megadása kötelező.' },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error:
            t('login.errors.password_too_short') ||
            'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
        },
        { status: 400 },
      );
    }

    const payload = await getPayload({ config: configPromise });

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: rawEmail } },
      limit: 1,
      depth: 0,
    });

    if (existingUsers.docs.length > 0) {
      return NextResponse.json(
        {
          error:
            t('login.errors.user_already_exists') || 'Ezzel az e-mail címmel már létezik fiók.',
        },
        { status: 409 },
      );
    }

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
        email: rawEmail,
        password,
        firstName,
        lastName,
        role: ROLES.USER as 'user',
      } as CreateUser,
    });

    logger.info({ email: rawEmail }, t('toasts.register_success'));
    return NextResponse.json({ message: t('toasts.register_success') });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('toasts.register_error');
    logger.error({ error: message }, t('toasts.register_error'));
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
