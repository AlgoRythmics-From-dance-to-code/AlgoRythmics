import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import type { User } from '../../../../payload-types';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await getPayloadInstance();
    const user = await payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
    });

    return NextResponse.json({
      completedIds: user.completedAlgorithms || [],
      visualizerProgress: user.visualizerProgress || {},
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { completedIds, visualizerProgress } = await req.json();

    // Runtime validation
    if (completedIds !== undefined && !Array.isArray(completedIds)) {
      return NextResponse.json({ error: 'completedIds must be an array' }, { status: 400 });
    }

    if (
      visualizerProgress !== undefined &&
      (typeof visualizerProgress !== 'object' || visualizerProgress === null)
    ) {
      return NextResponse.json({ error: 'visualizerProgress must be an object' }, { status: 400 });
    }

    const payload = await getPayloadInstance();

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
