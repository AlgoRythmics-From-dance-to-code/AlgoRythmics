import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Delete the user
    await payload.delete({
      collection: 'users',
      id: dbUser.id,
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
