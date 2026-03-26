import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '../../../../lib/constants';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const payload = await getPayload({ config: configPromise });

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    });

    if (result.token) {
      const cookieStore = await cookies();
      cookieStore.set(APP_CONFIG.COOKIE_TOKEN_NAME, result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: APP_CONFIG.TOKEN_EXPIRATION,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login Route Error:', message);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
