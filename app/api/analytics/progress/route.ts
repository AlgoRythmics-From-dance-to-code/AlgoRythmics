import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/progress?algorithmId=bubble-sort
 * Returns the AlgorithmProgress record for the authenticated user.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const algorithmId = searchParams.get('algorithmId');

  if (!algorithmId) {
    return NextResponse.json({ error: 'algorithmId is required' }, { status: 400 });
  }

  try {
    const payload = await getPayloadInstance();
    const userId = Number(session.user.id);

    const { docs } = await payload.find({
      collection: 'algorithm-progress',
      where: {
        and: [{ user: { equals: userId } }, { algorithmId: { equals: algorithmId } }],
      },
      limit: 1,
      depth: 0,
    });

    if (docs.length === 0) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress: docs[0] });
  } catch (error) {
    console.error('[Analytics] Failed to get progress:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/progress
 * Upsert algorithm progress: creates if not exists, merges if exists.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { algorithmId, updates } = await req.json();

    if (!algorithmId || !updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'algorithmId and updates object are required' },
        { status: 400 },
      );
    }

    const payload = await getPayloadInstance();
    const userId = Number(session.user.id);

    // Find existing record
    const { docs } = await payload.find({
      collection: 'algorithm-progress',
      where: {
        and: [{ user: { equals: userId } }, { algorithmId: { equals: algorithmId } }],
      },
      limit: 1,
      depth: 0,
    });

    const now = new Date().toISOString();

    if (docs.length > 0) {
      // Update existing
      const existing = docs[0];
      await payload.update({
        collection: 'algorithm-progress',
        id: existing.id,
        data: {
          ...updates,
          lastActivityAt: now,
        },
      });
    } else {
      // Create new
      await payload.create({
        collection: 'algorithm-progress',
        data: {
          user: userId,
          algorithmId,
          ...updates,
          firstStartedAt: now,
          lastActivityAt: now,
        },
      });

      // Increment totalAlgorithmsStarted on user
      try {
        const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 });
        const stats = (user.learningStats as Record<string, number | string | null>) || {};
        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            learningStats: {
              ...stats,
              totalAlgorithmsStarted: ((stats.totalAlgorithmsStarted as number) || 0) + 1,
            },
          },
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Failed to update progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
