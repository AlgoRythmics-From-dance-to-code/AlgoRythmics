import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';
import type { User, AlgorithmProgress } from '../../../../payload-types';

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

    const algorithmProgress: Record<string, unknown> = {};
    progressDocs.docs.forEach((doc) => {
      const progressDoc = doc as unknown as AlgorithmProgress;
      algorithmProgress[progressDoc.algorithmId] = progressDoc;
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
    const { completedIds, visualizerProgress, algorithmProgress } = await req.json();

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
    const userId = Number(session.user.id);

    // 1. Update User level data
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        completedAlgorithms: completedIds as User['completedAlgorithms'],
        visualizerProgress: (visualizerProgress || {}) as User['visualizerProgress'],
      } as Partial<User>,
    });

    // 2. Sync Algorithm-specific Progress (Analytics)
    if (algorithmProgress && typeof algorithmProgress === 'object') {
      const now = new Date().toISOString();

      // For each algorithm ID provided in the map, upsert a record
      for (const [id, data] of Object.entries(algorithmProgress)) {
        if (!data || typeof data !== 'object') continue;

        // Find existing record
        const { docs } = await payload.find({
          collection: 'algorithm-progress',
          where: {
            and: [{ user: { equals: userId } }, { algorithmId: { equals: id } }],
          },
          limit: 1,
          depth: 0,
        });

        // We don't want to overwrite identity fields if they come from the frontend
        const updates = { ...(data as any) };
        delete updates.user;
        delete updates.algorithmId;
        delete updates.id;
        delete updates.createdAt;
        delete updates.updatedAt;

        if (docs.length > 0) {
          await payload.update({
            collection: 'algorithm-progress',
            id: docs[0].id,
            data: {
              ...updates,
              lastActivityAt: now,
            },
          });
        } else {
          await payload.create({
            collection: 'algorithm-progress',
            data: {
              ...updates,
              user: userId,
              algorithmId: id,
              firstStartedAt: now,
              lastActivityAt: now,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
