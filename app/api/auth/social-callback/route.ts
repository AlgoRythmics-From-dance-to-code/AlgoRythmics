import { auth } from '../../../../auth';
import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jsonwebtoken from 'jsonwebtoken';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login?error=no-session', baseUrl));
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
      return NextResponse.redirect(new URL('/login?error=user-not-found', baseUrl));
    }

    const user = result.docs[0];

    // Generate a Payload-compatible JWT token directly
    // Payload uses the PAYLOAD_SECRET env var to sign tokens
    const payloadSecret = process.env.PAYLOAD_SECRET || process.env.DATABASE_URL || '';
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
    cookieStore.set('payload-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL('/', baseUrl));
  } catch (error) {
    console.error('Social callback error:', error);
    return NextResponse.redirect(new URL('/login?error=social-login-failed', baseUrl));
  }
}
