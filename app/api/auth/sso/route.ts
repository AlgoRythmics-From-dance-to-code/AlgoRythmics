import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { APP_CONFIG, ROUTES, ROLES } from '../../../../lib/constants';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawRedirect = searchParams.get('redirect') || ROUTES.ADMIN;
  const redirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('\\')
      ? rawRedirect
      : ROUTES.ADMIN;

  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;

    if (!session?.user?.email || (userRole !== ROLES.ADMIN && userRole !== ROLES.EDITOR)) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
      depth: 0,
    });

    if (result.docs.length === 0) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    const dbUser = result.docs[0] as unknown as {
      id: string | number;
      email: string;
      sessions?: Array<{ id: string; createdAt: string; expiresAt: string }>;
    };

    // Create session in Payload database
    const sid = randomUUID();
    const now = new Date();
    const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const existingSessions = Array.isArray(dbUser.sessions) ? [...dbUser.sessions] : [];

    // Keep only non-expired sessions up to 10
    const validSessions = existingSessions
      .filter((s) => !s.expiresAt || new Date(s.expiresAt) > now)
      .slice(-9);

    validSessions.push({
      id: sid,
      createdAt: now.toISOString(),
      expiresAt: expiresDate.toISOString(),
    });

    await payload.update({
      collection: 'users',
      id: dbUser.id,
      data: {
        sessions: validSessions,
      } as unknown as Record<string, unknown>,
      overrideAccess: true,
    });

    // Sign official Payload JWT token with sid session id
    const token = jsonwebtoken.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        collection: 'users',
        sid,
      },
      payload.secret,
      { expiresIn: '7d' },
    );

    const redirectUrl = new URL(redirectPath, req.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set official Payload cookie
    response.cookies.set(APP_CONFIG.COOKIE_TOKEN_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[SSO Error]:', error);
    return NextResponse.redirect(new URL(ROUTES.ADMIN, req.url));
  }
}
