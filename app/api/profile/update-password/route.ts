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

    const { currentPassword, newPassword } = await req.json();
    const payload = await getPayload({ config: configPromise });

    // Find the user by email
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
      limit: 1,
      showHiddenFields: true, // Need this to access password field
    });

    const dbUser = result.docs[0] as any;

    // Check if user is a social user
    if (dbUser.authProvider && dbUser.authProvider !== 'email') {
      return NextResponse.json(
        { error: 'Közösségi bejelentkezéssel nem módosíthatod a jelszavadat itt.' },
        { status: 400 }
      );
    }

    // Update the password - Payload handles hashing automatically for the 'password' field
    await payload.update({
      collection: 'users',
      id: dbUser.id,
      data: {
        password: newPassword,
      } as any,
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
