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

    // Ignore identity fields from updates to prevent overriding
    delete updates.user;
    delete updates.algorithmId;

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

    // Compute aggregates based on merged data
    const existing = docs.length > 0 ? docs[0] : undefined;
    const merged = { ...(existing || {}), ...updates };

    const totalTime =
      ((merged.videoWatchTimeMs as number) || 0) +
      ((merged.animationTotalTimeMs as number) || 0) +
      ((merged.controlTotalTimeMs as number) || 0) +
      ((merged.createTotalTimeMs as number) || 0) +
      ((merged.aliveTotalTimeMs as number) || 0);

    let overall = 0;
    if (merged.videoWatched) overall += 20;
    if (merged.animationCompleted) overall += 20;
    if (merged.controlCompleted) overall += 20;
    if (merged.createCompleted) overall += 20;
    if (merged.aliveCompleted) overall += 20;

    updates.totalTimeSpentMs = totalTime;
    updates.overallProgress = overall;

    if (existing) {
      // Update existing
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
