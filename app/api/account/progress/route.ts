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

    const courseProgressDocs = await payload.find({
      collection: 'course-progress',
      where: { user: { equals: userId } },
      pagination: false,
      depth: 0,
    });

    const algorithmProgress: Record<string, unknown> = {};
    progressDocs.docs.forEach((doc) => {
      const progressDoc = doc as unknown as AlgorithmProgress;
      algorithmProgress[progressDoc.algorithmId] = progressDoc;
    });

    const courseProgress: Record<string, unknown> = {};
    courseProgressDocs.docs.forEach((doc) => {
      const pDoc = doc as unknown as {
        courseId: string;
        activePhaseIndex: number;
        completedPhases?: string[];
        lastConfidenceRating?: string;
        phaseResults?: Record<string, string>;
        points?: number;
        isCompleted?: boolean;
        totalTimeMs?: number;
        totalMistakes?: number;
        mascotInteractionsTotal?: number;
        confidenceResults?: Record<string, string>;
        firstStartedAt?: string;
        lastActivityAt?: string;
        detailedStats?: Record<string, unknown>;
      };
      courseProgress[pDoc.courseId] = {
        activePhaseIndex: pDoc.activePhaseIndex,
        completedPhases: pDoc.completedPhases || [],
        lastConfidenceRating: pDoc.lastConfidenceRating,
        phaseResults: pDoc.phaseResults,
        points: pDoc.points || 0,
        isCompleted: !!pDoc.isCompleted,
        totalTimeMs: pDoc.totalTimeMs || 0,
        totalMistakes: pDoc.totalMistakes || 0,
        mascotInteractionsTotal: pDoc.mascotInteractionsTotal || 0,
        confidenceResults: pDoc.confidenceResults || {},
        firstStartedAt: pDoc.firstStartedAt,
        lastActivityAt: pDoc.lastActivityAt,
        detailedStats: pDoc.detailedStats || {},
      };
    });

    return NextResponse.json({
      completedIds: user.completedAlgorithms || [],
      visualizerProgress: user.visualizerProgress || {},
      algorithmProgress,
      courseProgress,
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
    const { completedIds, visualizerProgress, algorithmProgress, courseProgress } =
      await req.json();

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

    // Get completed course IDs from slugs
    let completedCourseIds: (string | number)[] = [];
    if (courseProgress && typeof courseProgress === 'object') {
      const completedSlugs = Object.entries(courseProgress)
        .filter(([, data]) => data && (data as any).isCompleted)
        .map(([slug]) => slug);

      if (completedSlugs.length > 0) {
        const { docs: courseDocs } = await payload.find({
          collection: 'courses',
          where: { slug: { in: completedSlugs } },
          depth: 0,
          limit: 100,
        });
        completedCourseIds = courseDocs.map((c) => c.id);
      }
    }

    // 1. Update User level data
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        completedAlgorithms: completedIds as User['completedAlgorithms'],
        completedCourses: completedCourseIds,
        visualizerProgress: (visualizerProgress || {}) as User['visualizerProgress'],
      } as any,
    });

    // 2. Sync Algorithm-specific Progress (Analytics)
    if (algorithmProgress && typeof algorithmProgress === 'object') {
      const now = new Date().toISOString();

      const progressEntries = Object.entries(algorithmProgress).filter(
        ([, data]) => data && typeof data === 'object',
      ) as [string, Record<string, unknown>][];

      if (progressEntries.length > 0) {
        const algorithmIds = progressEntries.map(([id]) => id);

        // Find all existing records in one batch
        const { docs: existingDocs } = await payload.find({
          collection: 'algorithm-progress',
          where: {
            and: [{ user: { equals: userId } }, { algorithmId: { in: algorithmIds } }],
          },
          limit: algorithmIds.length,
          depth: 0,
        });

        const existingByAlgoId = new Map(existingDocs.map((doc) => [String(doc.algorithmId), doc]));

        for (const [id, data] of progressEntries) {
          const existingDoc = existingByAlgoId.get(id);

          // We don't want to overwrite identity fields if they come from the frontend
          const updates = { ...(data as Record<string, unknown>) };
          delete updates.user;
          delete updates.algorithmId;
          delete updates.id;
          delete updates.createdAt;
          delete updates.updatedAt;

          if (existingDoc) {
            await payload.update({
              collection: 'algorithm-progress',
              id: existingDoc.id,
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
    }

    // 3. Sync Course-specific Progress
    if (courseProgress && typeof courseProgress === 'object') {
      const now = new Date().toISOString();
      const courseEntries = Object.entries(courseProgress).filter(
        ([, data]) => data && typeof data === 'object',
      ) as [string, Record<string, unknown>][];

      for (const [slug, data] of courseEntries) {
        const { docs: existingCourseDocs } = await payload.find({
          collection: 'course-progress',
          where: {
            and: [{ user: { equals: userId } }, { courseId: { equals: slug } }],
          },
          limit: 1,
          depth: 0,
        });

        const updates = { ...data };
        delete updates.user;
        delete updates.courseId;
        delete updates.id;
        delete updates.createdAt;
        delete updates.updatedAt;

        if (existingCourseDocs.length > 0) {
          await payload.update({
            collection: 'course-progress',
            id: existingCourseDocs[0].id,
            data: { ...updates, updatedAt: now },
          });
        } else {
          await payload.create({
            collection: 'course-progress',
            data: { ...updates, user: userId, courseId: slug, createdAt: now, updatedAt: now },
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
