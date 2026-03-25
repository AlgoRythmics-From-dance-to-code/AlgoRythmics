import { getPayload } from 'payload';
import configPromise from '../../../payload.config';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
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

      return NextResponse.json({ message: 'Email verified successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Verify Account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
