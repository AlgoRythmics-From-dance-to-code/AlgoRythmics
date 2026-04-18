import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { NextResponse } from 'next/server';

interface LearningEventInput {
  algorithmId?: string;
  courseId?: string;
  tab?: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  sessionId: string;
  durationMs?: number;
}

/**
 * POST /api/analytics/event
 * Batch-insert learning events and update user learning stats.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { events } = (await req.json()) as { events: LearningEventInput[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events must be a non-empty array' }, { status: 400 });
    }

    // Cap at 50 events per batch to prevent abuse
    const batch = events.slice(0, 50);
    const payload = await getPayloadInstance();
    const userId = Number(session.user.id);

    // Insert events
    const insertPromises = batch.map((evt) =>
      payload.create({
        collection: 'learning-events',
        data: {
          user: userId,
          algorithmId: evt.algorithmId,
          courseId: evt.courseId,
          tab: evt.tab as any, // Cast to any to allow newly added tabs before types regenerate
          eventType: evt.eventType,
          eventData: evt.eventData || {},
          sessionId: evt.sessionId,
          durationMs: evt.durationMs || 0,
        },
      }),
    );

    await Promise.allSettled(insertPromises);

    // Aggregate time spent from this batch
    const totalDurationMs = batch.reduce((sum, e) => sum + (e.durationMs || 0), 0);

    // Update user learning stats (best-effort)
    if (totalDurationMs > 0) {
      try {
        // Ideally use an atomic DB increment here, e.g. sql`UPDATE users SET ...`
        // For now using read-modify-write since it's Next Auth/Payload abstraction.
        // We aggregate per-batch to minimize writes.
        const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 });
        const stats = (user.learningStats as Record<string, number | string | null>) || {};

        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            learningStats: {
              ...stats,
              totalTimeSpentMs: ((stats.totalTimeSpentMs as number) || 0) + totalDurationMs,
              lastActiveDate: new Date().toISOString(),
            },
          },
        });
      } catch {
        // Non-critical — don't fail the request
      }
    }

    return NextResponse.json({ success: true, count: batch.length });
  } catch (error) {
    console.error('[Analytics] Failed to save events:', error);
    return NextResponse.json({ error: 'Failed to save events' }, { status: 500 });
  }
}
