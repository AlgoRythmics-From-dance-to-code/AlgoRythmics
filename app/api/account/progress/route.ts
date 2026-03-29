import { auth } from '../../../../auth';
import { getPayload } from 'payload';
import configPromise from '../../../../payload.config';
import { NextResponse } from 'next/server';
import type { User } from '../../../../payload-types';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { completedIds, visualizerProgress } = await req.json();
    const payload = await getPayload({ config: configPromise });

    await payload.update({
      collection: 'users',
      id: session.user.id,
      data: {
        completedAlgorithms: completedIds as User['completedAlgorithms'],
        visualizerProgress: (visualizerProgress || {}) as User['visualizerProgress'],
      } as Partial<User>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
