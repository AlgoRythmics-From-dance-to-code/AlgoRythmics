import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import type { AlgorithmProgress } from '../../../../payload-types';

function normalizeMonotonicTimeFields(
  existing: AlgorithmProgress | null | undefined,
  updates: Partial<AlgorithmProgress>,
) {
  if (!existing) return;
  const existingRecord = existing as unknown as Record<string, unknown>;
  const updateRecord = updates as unknown as Record<string, unknown>;

  for (const [key, value] of Object.entries(updateRecord)) {
    if (key === 'totalTimeSpentMs' || !key.endsWith('TimeMs') || typeof value !== 'number') {
      continue;
    }
    const existingValue = existingRecord[key];
    updateRecord[key] = Math.max(typeof existingValue === 'number' ? existingValue : 0, value);
  }
}

function computeTotalTimeSpentMs(
  existing: AlgorithmProgress | null | undefined,
  updates: Partial<AlgorithmProgress>,
) {
  const mergedRecord = {
    ...((existing as unknown as Record<string, unknown> | null | undefined) || {}),
    ...(updates as unknown as Record<string, unknown>),
  };

  let total = 0;
  for (const [key, value] of Object.entries(mergedRecord)) {
    if (key === 'totalTimeSpentMs' || !key.endsWith('TimeMs') || typeof value !== 'number') {
      continue;
    }
    total += value;
  }
  return total;
}

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
    const existing = docs.length > 0 ? (docs[0] as AlgorithmProgress) : undefined;

    // Protect boolean completion flags from regression (stale client sending false when server has true)
    const completionFlags = [
      'videoWatched',
      'animationCompleted',
      'controlCompleted',
      'createCompleted',
      'aliveCompleted',
    ] as const;
    if (existing) {
      const existingRecord = existing as unknown as Record<string, unknown>;
      for (const flag of completionFlags) {
        if (existingRecord[flag] === true && updates[flag] === false) {
          delete updates[flag];
        }
      }
    }

    const merged = { ...(existing || {}), ...updates };

    let overall = 0;
    if (merged.videoWatched) overall += 20;
    if (merged.animationCompleted) overall += 20;
    if (merged.controlCompleted) overall += 20;
    if (merged.createCompleted) overall += 20;
    if (merged.aliveCompleted) overall += 20;

    // Use Math.max for counts, scores, and cumulative time fields to protect against stale client data
    if (existing) {
      normalizeMonotonicTimeFields(existing, updates);
      if (updates.controlBestScore !== undefined)
        updates.controlBestScore = Math.max(
          existing.controlBestScore || 0,
          updates.controlBestScore,
        );
      if (updates.controlAttempts !== undefined)
        updates.controlAttempts = Math.max(existing.controlAttempts || 0, updates.controlAttempts);
      if (updates.createAttempts !== undefined)
        updates.createAttempts = Math.max(existing.createAttempts || 0, updates.createAttempts);
      if (updates.createBlanksCorrectFirst !== undefined)
        updates.createBlanksCorrectFirst = Math.max(
          existing.createBlanksCorrectFirst || 0,
          updates.createBlanksCorrectFirst,
        );
      if (updates.aliveBestScore !== undefined)
        updates.aliveBestScore = Math.max(existing.aliveBestScore || 0, updates.aliveBestScore);
      if (updates.aliveCodeSubmissions !== undefined)
        updates.aliveCodeSubmissions = Math.max(
          existing.aliveCodeSubmissions || 0,
          updates.aliveCodeSubmissions,
        );
      // Best time should be MINIMUM (faster = better), not maximum
      if (updates.controlBestTimeMs !== undefined && existing.controlBestTimeMs) {
        updates.controlBestTimeMs = Math.min(existing.controlBestTimeMs, updates.controlBestTimeMs);
      }
    }

    updates.totalTimeSpentMs = computeTotalTimeSpentMs(existing, updates);
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
