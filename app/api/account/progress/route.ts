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
          const existingDoc = existingByAlgoId.get(id) as AlgorithmProgress | undefined;

          // Merge incoming data with existing record to ensure accurate aggregate calculation
          const merged = {
            ...(existingDoc || {}),
            ...(data as Record<string, unknown>),
          };

          // We don't want to overwrite identity fields if they come from the frontend
          const updates = { ...(data as Record<string, unknown>) };
          delete updates.user;
          delete updates.algorithmId;
          delete updates.id;
          delete updates.createdAt;
          delete updates.updatedAt;

          // For counts and scores, ensure we take the maximum to protect against stale client data
          if (existingDoc) {
            // Protect boolean completion flags from regression
            const completionFlags = [
              'videoWatched',
              'animationCompleted',
              'controlCompleted',
              'createCompleted',
              'aliveCompleted',
            ] as const;
            for (const flag of completionFlags) {
              if (
                (existingDoc as unknown as Record<string, unknown>)[flag] === true &&
                updates[flag] === false
              ) {
                delete updates[flag];
              }
            }

            if (updates.controlBestScore !== undefined)
              updates.controlBestScore = Math.max(
                existingDoc.controlBestScore || 0,
                updates.controlBestScore as number,
              );
            if (updates.controlAttempts !== undefined)
              updates.controlAttempts = Math.max(
                existingDoc.controlAttempts || 0,
                updates.controlAttempts as number,
              );
            if (updates.createAttempts !== undefined)
              updates.createAttempts = Math.max(
                existingDoc.createAttempts || 0,
                updates.createAttempts as number,
              );
            if (updates.createBlanksCorrectFirst !== undefined)
              updates.createBlanksCorrectFirst = Math.max(
                existingDoc.createBlanksCorrectFirst || 0,
                updates.createBlanksCorrectFirst as number,
              );
            if (updates.aliveBestScore !== undefined)
              updates.aliveBestScore = Math.max(
                existingDoc.aliveBestScore || 0,
                updates.aliveBestScore as number,
              );
            if (updates.aliveCodeSubmissions !== undefined)
              updates.aliveCodeSubmissions = Math.max(
                existingDoc.aliveCodeSubmissions || 0,
                updates.aliveCodeSubmissions as number,
              );
            if (updates.animationTotalTimeMs !== undefined)
              updates.animationTotalTimeMs = Math.max(
                existingDoc.animationTotalTimeMs || 0,
                updates.animationTotalTimeMs as number,
              );
            if (updates.videoWatchTimeMs !== undefined)
              updates.videoWatchTimeMs = Math.max(
                existingDoc.videoWatchTimeMs || 0,
                updates.videoWatchTimeMs as number,
              );
            if (updates.controlTotalTimeMs !== undefined)
              updates.controlTotalTimeMs = Math.max(
                existingDoc.controlTotalTimeMs || 0,
                updates.controlTotalTimeMs as number,
              );
            if (updates.createTotalTimeMs !== undefined)
              updates.createTotalTimeMs = Math.max(
                existingDoc.createTotalTimeMs || 0,
                updates.createTotalTimeMs as number,
              );
            if (updates.aliveTotalTimeMs !== undefined)
              updates.aliveTotalTimeMs = Math.max(
                existingDoc.aliveTotalTimeMs || 0,
                updates.aliveTotalTimeMs as number,
              );
            // Best time should be MINIMUM (faster = better)
            if (updates.controlBestTimeMs !== undefined && existingDoc.controlBestTimeMs) {
              updates.controlBestTimeMs = Math.min(
                existingDoc.controlBestTimeMs,
                updates.controlBestTimeMs as number,
              );
            }
          }

          // Compute algorithm-specific aggregates based on FULL merged state
          const totalTime =
            ((merged.videoWatchTimeMs as number) || 0) +
            ((merged.animationTotalTimeMs as number) || 0) +
            ((merged.controlTotalTimeMs as number) || 0) +
            ((merged.createTotalTimeMs as number) || 0) +
            ((merged.aliveTotalTimeMs as number) || 0);

          // Compute overallProgress from post-protection merged state
          const protectedMerged = {
            ...(existingDoc || {}),
            ...updates,
          };

          let overall = 0;
          if (protectedMerged.videoWatched) overall += 20;
          if (protectedMerged.animationCompleted) overall += 20;
          if (protectedMerged.controlCompleted) overall += 20;
          if (protectedMerged.createCompleted) overall += 20;
          if (protectedMerged.aliveCompleted) overall += 20;

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

      if (courseEntries.length > 0) {
        const courseSlugs = courseEntries.map(([slug]) => slug);

        // Batch find all existing course-progress docs instead of N+1 queries
        const { docs: existingCourseDocs } = await payload.find({
          collection: 'course-progress',
          where: {
            and: [{ user: { equals: userId } }, { courseId: { in: courseSlugs } }],
          },
          limit: courseSlugs.length,
          depth: 0,
        });

        const existingBySlug = new Map(
          existingCourseDocs.map((doc) => [
            String((doc as unknown as { courseId: string }).courseId),
            doc as unknown as {
              id: string | number;
              points?: number;
              totalTimeMs?: number;
              totalMistakes?: number;
              mascotInteractionsTotal?: number;
              completedPhases?: string[];
              isCompleted?: boolean;
            },
          ]),
        );

        for (const [slug, data] of courseEntries) {
          const updates = { ...data } as Record<string, unknown>;
          delete updates.user;
          delete updates.courseId;
          delete updates.id;
          delete updates.createdAt;
          delete updates.updatedAt;

          const existing = existingBySlug.get(slug);

          if (existing) {
            // Merge completedPhases as a union set to prevent stale clients from erasing progress
            if (Array.isArray(updates.completedPhases) && Array.isArray(existing.completedPhases)) {
              const merged = new Set([
                ...existing.completedPhases,
                ...(updates.completedPhases as string[]),
              ]);
              updates.completedPhases = [...merged];
            }

            // Allow points to decrease (e.g. on reset)
            if (updates.points !== undefined) {
              updates.points = (updates.points as number) || 0;
            }
            
            updates.totalTimeMs = Math.max(
              existing.totalTimeMs || 0,
              (updates.totalTimeMs as number) || 0,
            );
            updates.totalMistakes = Math.max(
              existing.totalMistakes || 0,
              (updates.totalMistakes as number) || 0,
            );
            updates.mascotInteractionsTotal = Math.max(
              existing.mascotInteractionsTotal || 0,
              (updates.mascotInteractionsTotal as number) || 0,
            );

            // Allow isCompleted to be reset
            // (Removed regression protection to support course resets)

            await payload.update({
              collection: 'course-progress',
              id: existing.id,
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

    // --- Streak Calculation ---
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let currentStreak = (existingStats.currentStreak as number) || 0;
    let longestStreak = (existingStats.longestStreak as number) || 0;

    if (existingStats.lastActiveDate) {
      const lastActive = new Date(existingStats.lastActiveDate as string);
      lastActive.setUTCHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
        if (longestStreak === 0) longestStreak = 1;
      } else if (diffDays === 0 && currentStreak === 0) {
        currentStreak = 1;
        if (longestStreak === 0) longestStreak = 1;
      }
    } else {
      currentStreak = 1;
      longestStreak = 1;
    }

    // --- Average Score Calculation ---
    let totalScoreSum = 0;
    let scoreCount = 0;
    allAlgoDocs.docs.forEach((doc) => {
      const aDoc = doc as unknown as AlgorithmProgress;
      if (
        aDoc.controlBestScore !== undefined &&
        aDoc.controlBestScore !== null &&
        aDoc.controlBestScore > 0
      ) {
        totalScoreSum += aDoc.controlBestScore;
        scoreCount++;
      }
      if (
        aDoc.aliveBestScore !== undefined &&
        aDoc.aliveBestScore !== null &&
        aDoc.aliveBestScore > 0
      ) {
        totalScoreSum += aDoc.aliveBestScore;
        scoreCount++;
      }
    });
    const averageScore = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0;

    // --- Preferred Speed Calculation ---
    let preferredSpeed = 1;
    if (visualizerProgress && typeof visualizerProgress === 'object') {
      const speeds = Object.values(visualizerProgress)
        .map((v) => (v as { speed?: number })?.speed)
        .filter((s): s is number => typeof s === 'number');
      if (speeds.length > 0) {
        preferredSpeed = Number((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2));
      }
    }

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
          currentStreak,
          longestStreak,
          averageScore,
          preferredSpeed,
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
