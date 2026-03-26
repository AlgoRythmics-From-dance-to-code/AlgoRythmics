import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, bio } = await req.json();
    const payload = await getPayload({ config: configPromise });

    // Find the user by email
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dbUser = result.docs[0];

    // Update the user
    await payload.update({
      collection: 'users',
      id: dbUser.id,
      data: {
        firstName,
        lastName,
        bio,
      } as any,
    });

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    console.error('Profile Update Route Error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
