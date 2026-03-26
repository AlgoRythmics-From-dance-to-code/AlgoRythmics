import { auth } from '../../../../auth';
import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jsonwebtoken from 'jsonwebtoken';
import { APP_CONFIG, ROUTES } from '../../../../lib/constants';

export async function GET() {
  const baseUrl = APP_CONFIG.BASE_URL;

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=no-session`, baseUrl));
    }

    const payload = await getPayload({ config: configPromise });

    // Find the user in Payload
    const result = await payload.find({
      collection: 'users',
      where: {
        email: { equals: session.user.email },
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=user-not-found`, baseUrl));
    }

    const user = result.docs[0];

    // Generate a Payload-compatible JWT token directly
    // Payload uses the PAYLOAD_SECRET env var to sign tokens
    const payloadSecret = process.env.PAYLOAD_SECRET || 'fallback-secret';
    const token = jsonwebtoken.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'users',
      },
      payloadSecret,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set(APP_CONFIG.COOKIE_TOKEN_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: APP_CONFIG.TOKEN_EXPIRATION,
    });

    return NextResponse.redirect(new URL(ROUTES.HOME, baseUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown social error';
    console.error('Social callback error details:', message);
    return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=social-login-failed&detail=${encodeURIComponent(message)}`, baseUrl));
  }
}
