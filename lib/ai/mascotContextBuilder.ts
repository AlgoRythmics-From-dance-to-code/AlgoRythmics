import { getPayloadInstance } from '@/lib/payload';
import { getUserBadges, type Badge } from '@/lib/badges';
import type { AlgorithmProgress, User } from '@/payload-types';

export interface UserLearningDossier {
  identity: {
    id: string | number;
    name: string;
    firstName: string;
    bio: string;
    role: string;
  };
  globalStats: {
    totalPoints: number;
    totalTimeMinutes: number;
    averageScore: number;
    currentStreak: number;
    longestStreak: number;
    totalMistakes: number;
    totalHintsUsed: number;
    preferredSpeed: number;
    completedAlgorithmsCount: number;
    completedCoursesCount: number;
    badges: Array<{ id: string; nameKey: string; icon: string }>;
  };
  currentCourseState: {
    slug: string;
    activePhaseIndex: number;
    completedPhases: string[];
    earnedPoints: number;
    totalMistakes: number;
    mascotHelpsUsed: number;
    confidenceSummary?: {
      masteryCount: number;
      luckyCount: number;
      misconceptionCount: number;
      doubtCount: number;
    };
    phaseSpecificStat?: Record<string, unknown>;
  };
  currentAlgorithmState?: {
    algorithmId: string;
    videoWatched: boolean;
    animationCompleted: boolean;
    controlCompleted: boolean;
    controlBestScore: number;
    controlMistakes: number;
    createCompleted: boolean;
    createBlanksCorrectFirst: number;
    aliveCompleted: boolean;
    aliveBestScore: number;
    aliveLastCode?: string;
  };
  recentActions: Array<{
    eventType: string;
    timestamp: string;
    details?: string;
  }>;
  recentSearches: string[];
}

interface CacheEntry {
  data: UserLearningDossier;
  expiresAt: number;
}

const dossierCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 40_000; // 40 seconds cache

/**
 * Builds a comprehensive 360-degree dossier of the learner's profile, history,
 * habits, CBL confidence metrics, and algorithm skills.
 */
export async function buildUserLearningDossier(
  userId: string | number,
  courseSlug: string,
  phaseId?: string,
  algorithmId?: string,
): Promise<UserLearningDossier> {
  const cacheKey = `${userId}:${courseSlug}:${phaseId || 'general'}`;
  const now = Date.now();
  const cached = dossierCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const payload = await getPayloadInstance();
    const numericUserId = Number(userId);

    // Parallel fetch across collections for maximum speed
    const [userDoc, courseProgressDocs, algoProgressDocs, learningEventDocs, searchDocs] =
      await Promise.all([
        payload
          .findByID({
            collection: 'users',
            id: numericUserId,
            depth: 0,
          })
          .catch(() => null),
        payload
          .find({
            collection: 'course-progress',
            where: {
              and: [{ user: { equals: numericUserId } }, { courseId: { equals: courseSlug } }],
            },
            depth: 0,
            limit: 1,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'algorithm-progress',
            where: { user: { equals: numericUserId } },
            depth: 0,
            limit: 50,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'learning-events',
            where: { user: { equals: numericUserId } },
            sort: '-createdAt',
            depth: 0,
            limit: 10,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'search-analytics',
            where: { user: { equals: numericUserId } },
            sort: '-createdAt',
            depth: 0,
            limit: 5,
          })
          .catch(() => ({ docs: [] })),
      ]);

    const user = userDoc as User | null;
    const stats = (user?.learningStats || {}) as Record<string, unknown>;

    // Badges
    const userBadges: Badge[] = getUserBadges({
      totalTimeSpentMs: Number(stats.totalTimeSpentMs || 0),
      totalPoints: Number(stats.totalPoints || 0),
      totalAlgorithmsStarted: Number(stats.totalAlgorithmsStarted || 0),
      totalAlgorithmsCompleted: (user?.completedAlgorithms || []).length,
      totalCoursesStarted: Number(stats.totalCoursesStarted || 0),
      totalCoursesCompleted: (user?.completedCourses || []).length,
      totalMistakes: Number(stats.totalMistakes || 0),
      totalHintsUsed: Number(stats.totalHintsUsed || 0),
      averageScore: Number(stats.averageScore || 0),
      currentStreak: Number(stats.currentStreak || 0),
      longestStreak: Number(stats.longestStreak || 0),
    });

    // Course Progress
    const cpDoc = (courseProgressDocs.docs?.[0] || {}) as unknown as Record<string, unknown>;
    const confidenceResults = (cpDoc.confidenceResults || {}) as Record<string, string>;
    const phaseResults = (cpDoc.phaseResults || {}) as Record<string, string>;

    let masteryCount = 0;
    let luckyCount = 0;
    let misconceptionCount = 0;
    let doubtCount = 0;

    Object.entries(confidenceResults).forEach(([pId, rating]) => {
      const isCorrect = phaseResults[pId] === 'success';
      const isHigh = rating === 'high' || rating === 'very-sure';
      if (isCorrect && isHigh) masteryCount++;
      else if (isCorrect && !isHigh) luckyCount++;
      else if (!isCorrect && isHigh) misconceptionCount++;
      else doubtCount++;
    });

    const detailedStats = (cpDoc.detailedStats || {}) as Record<string, Record<string, unknown>>;
    const currentPhaseStat = phaseId && detailedStats[phaseId] ? detailedStats[phaseId] : undefined;

    // Algorithm Progress (specific for this phase or generally)
    const targetAlgoId = algorithmId || 'bubble-sort';
    const targetAlgoDoc = (algoProgressDocs.docs || []).find(
      (doc) => (doc as unknown as AlgorithmProgress).algorithmId === targetAlgoId,
    ) as unknown as AlgorithmProgress | undefined;

    const dossier: UserLearningDossier = {
      identity: {
        id: userId,
        name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Tanuló',
        firstName: user?.firstName || 'Tanuló',
        bio: user?.bio || '',
        role: user?.role || 'user',
      },
      globalStats: {
        totalPoints: Number(stats.totalPoints || 0),
        totalTimeMinutes: Math.round(Number(stats.totalTimeSpentMs || 0) / 60000),
        averageScore: Number(stats.averageScore || 0),
        currentStreak: Number(stats.currentStreak || 0),
        longestStreak: Number(stats.longestStreak || 0),
        totalMistakes: Number(stats.totalMistakes || 0),
        totalHintsUsed: Number(stats.totalHintsUsed || 0),
        preferredSpeed: Number(stats.preferredSpeed || 1),
        completedAlgorithmsCount: (user?.completedAlgorithms || []).length,
        completedCoursesCount: (user?.completedCourses || []).length,
        badges: userBadges.map((b) => ({ id: b.id, nameKey: b.translationKey, icon: b.icon })),
      },
      currentCourseState: {
        slug: courseSlug,
        activePhaseIndex: Number(cpDoc.activePhaseIndex || 0),
        completedPhases: Array.isArray(cpDoc.completedPhases)
          ? (cpDoc.completedPhases as string[])
          : [],
        earnedPoints: Number(cpDoc.points || 0),
        totalMistakes: Number(cpDoc.totalMistakes || 0),
        mascotHelpsUsed: Number(cpDoc.mascotInteractionsTotal || 0),
        confidenceSummary: {
          masteryCount,
          luckyCount,
          misconceptionCount,
          doubtCount,
        },
        phaseSpecificStat: currentPhaseStat,
      },
      currentAlgorithmState: targetAlgoDoc
        ? {
            algorithmId: targetAlgoId,
            videoWatched: Boolean(targetAlgoDoc.videoWatched),
            animationCompleted: Boolean(targetAlgoDoc.animationCompleted),
            controlCompleted: Boolean(targetAlgoDoc.controlCompleted),
            controlBestScore: Number(targetAlgoDoc.controlBestScore || 0),
            controlMistakes: Number(targetAlgoDoc.controlMistakes || 0),
            createCompleted: Boolean(targetAlgoDoc.createCompleted),
            createBlanksCorrectFirst: Number(targetAlgoDoc.createBlanksCorrectFirst || 0),
            aliveCompleted: Boolean(targetAlgoDoc.aliveCompleted),
            aliveBestScore: Number(targetAlgoDoc.aliveBestScore || 0),
            aliveLastCode: targetAlgoDoc.aliveLastCode || undefined,
          }
        : undefined,
      recentActions: (learningEventDocs.docs || []).map((e) => {
        const ev = e as unknown as Record<string, unknown>;
        return {
          eventType: String(ev.eventType || ''),
          timestamp: String(ev.createdAt || ''),
          details: ev.eventData ? JSON.stringify(ev.eventData).slice(0, 100) : undefined,
        };
      }),
      recentSearches: (searchDocs.docs || []).map((s) =>
        String((s as unknown as Record<string, unknown>).query || ''),
      ),
    };

    dossierCache.set(cacheKey, {
      data: dossier,
      expiresAt: now + CACHE_TTL_MS,
    });

    return dossier;
  } catch (err) {
    console.error('[mascotContextBuilder] Failed to build full dossier:', err);
    // Minimal resilient fallback
    return {
      identity: {
        id: userId,
        name: 'Tanuló',
        firstName: 'Tanuló',
        bio: '',
        role: 'user',
      },
      globalStats: {
        totalPoints: 0,
        totalTimeMinutes: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMistakes: 0,
        totalHintsUsed: 0,
        preferredSpeed: 1,
        completedAlgorithmsCount: 0,
        completedCoursesCount: 0,
        badges: [],
      },
      currentCourseState: {
        slug: courseSlug,
        activePhaseIndex: 0,
        completedPhases: [],
        earnedPoints: 0,
        totalMistakes: 0,
        mascotHelpsUsed: 0,
      },
      recentActions: [],
      recentSearches: [],
    };
  }
}
