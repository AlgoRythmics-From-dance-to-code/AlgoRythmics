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
    const userId = Number(session.user.id);
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    });

    const progressDocs = await payload.find({
      collection: 'algorithm-progress',
      where: { user: { equals: userId } },
      pagination: false,
      depth: 0,
    });

    const algorithmProgress: Record<string, any> = {};
    progressDocs.docs.forEach((doc: any) => {
      algorithmProgress[doc.algorithmId] = doc;
    });

    return NextResponse.json({
      completedIds: user.completedAlgorithms || [],
      visualizerProgress: user.visualizerProgress || {},
      algorithmProgress,
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
