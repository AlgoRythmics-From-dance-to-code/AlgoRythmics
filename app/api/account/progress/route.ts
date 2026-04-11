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
        phasePoints?: Record<string, unknown>;
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
        phasePoints: pDoc.phasePoints || {},
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
        .filter(([, data]) => data && (data as { isCompleted?: boolean }).isCompleted)
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
        completedCourses: completedCourseIds as User['completedCourses'],
        visualizerProgress: (visualizerProgress || {}) as User['visualizerProgress'],
      },
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

          // Compute algorithm-specific aggregates
          const totalTime =
            ((updates.videoWatchTimeMs as number) || 0) +
            ((updates.animationTotalTimeMs as number) || 0) +
            ((updates.controlTotalTimeMs as number) || 0) +
            ((updates.createTotalTimeMs as number) || 0) +
            ((updates.aliveTotalTimeMs as number) || 0);

          let overall = 0;
          if (updates.videoWatched) overall += 20;
          if (updates.animationCompleted) overall += 20;
          if (updates.controlCompleted) overall += 20;
          if (updates.createCompleted) overall += 20;
          if (updates.aliveCompleted) overall += 20;

          updates.totalTimeSpentMs = totalTime;
          updates.overallProgress = overall;

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

    // 4. Update aggregated learningStats on User collection
    const allAlgoDocs = await payload.find({
      collection: 'algorithm-progress',
      where: { user: { equals: userId } },
      pagination: false,
      depth: 0,
    });
    const allCourseDocs = await payload.find({
      collection: 'course-progress',
      where: { user: { equals: userId } },
      pagination: false,
      depth: 0,
    });

    let totalTimeSpentMs = 0;
    let totalMistakes = 0;
    let totalHintsUsed = 0;
    let totalPoints = 0;
    let totalControlAttempts = 0;
    let totalCreateAttempts = 0;
    let totalAliveAttempts = 0;
    const totalAlgorithmsStarted = allAlgoDocs.docs.length;

    allAlgoDocs.docs.forEach((doc) => {
      const aDoc = doc as unknown as AlgorithmProgress;
      totalTimeSpentMs +=
        (aDoc.videoWatchTimeMs || 0) +
        (aDoc.animationTotalTimeMs || 0) +
        (aDoc.controlTotalTimeMs || 0) +
        (aDoc.createTotalTimeMs || 0) +
        (aDoc.aliveTotalTimeMs || 0);
      totalMistakes += (aDoc.controlMistakes || 0) + (aDoc.createMistakes || 0);
      totalHintsUsed +=
        (aDoc.controlHintsUsed || 0) + (aDoc.createHelpUsed ? 1 : 0) + (aDoc.aliveHelpUsed ? 1 : 0);
      totalControlAttempts += aDoc.controlAttempts || 0;
      totalCreateAttempts += aDoc.createAttempts || 0;
      totalAliveAttempts += aDoc.aliveCodeSubmissions || 0;
    });

    allCourseDocs.docs.forEach((doc) => {
      const cDoc = doc as unknown as {
        totalTimeMs?: number;
        totalMistakes?: number;
        mascotInteractionsTotal?: number;
        points?: number;
      };
      totalTimeSpentMs += cDoc.totalTimeMs || 0;
      totalMistakes += cDoc.totalMistakes || 0;
      totalHintsUsed += cDoc.mascotInteractionsTotal || 0;
      totalPoints += cDoc.points || 0;
    });

    // We do NOT completely overwrite learningStats to avoid destructive operations if only part of it was synced
    // However, since we queried ALL docs, the aggregates computed here represent the total sum from DB.
    // Fetch user to merge safely.
    const userDoc = await payload.findByID({ collection: 'users', id: userId, depth: 0 });
    const existingStats = (userDoc.learningStats || {}) as Record<string, unknown>;

    const totalAlgorithmsCompleted = completedIds?.length || 0;
    const totalCoursesCompleted = allCourseDocs.docs.filter(
      (doc) => (doc as unknown as { isCompleted?: boolean }).isCompleted,
    ).length;
    const totalCoursesStarted = allCourseDocs.docs.length;

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        learningStats: {
          ...existingStats,
          totalTimeSpentMs,
          totalMistakes,
          totalHintsUsed,
          totalPoints,
          totalControlAttempts,
          totalCreateAttempts,
          totalAliveAttempts,
          totalAlgorithmsStarted,
          totalAlgorithmsCompleted,
          totalCoursesStarted,
          totalCoursesCompleted,
          lastActiveDate: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
