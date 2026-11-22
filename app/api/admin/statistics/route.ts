import { NextResponse } from 'next/server';
import { headers as getHeaders } from 'next/headers';
import type { Where } from 'payload';
import { auth } from '../../../../auth';
import { getPayloadInstance } from '../../../../lib/payload';
import { ROLES } from '../../../../lib/constants';

interface RawEvent {
  id: string | number;
  user: number | { id: number };
  algorithmId?: string | null;
  courseId?: string | null;
  tab?: string | null;
  eventType: string;
  eventData?: Record<string, unknown>;
  sessionId: string;
  durationMs?: number | null;
  createdAt: string;
}

interface RawProgress {
  id: string | number;
  user: number | { id: number };
  algorithmId: string;
  videoWatched?: boolean;
  videoWatchTimeMs?: number;
  animationCompleted?: boolean;
  animationTotalTimeMs?: number;
  controlCompleted?: boolean;
  controlBestScore?: number;
  controlMistakes?: number;
  controlHintsUsed?: number;
  controlAttempts?: number;
  controlTotalTimeMs?: number;
  createCompleted?: boolean;
  createHelpUsed?: boolean;
  createAttempts?: number;
  createMistakes?: number;
  createTotalTimeMs?: number;
  aliveCompleted?: boolean;
  aliveHelpUsed?: boolean;
  aliveCodeSubmissions?: number;
  aliveBestScore?: number;
  aliveTotalTimeMs?: number;
  overallProgress?: number;
  totalTimeSpentMs?: number;
  updatedAt?: string;
}

interface RawCourseProgress {
  id: string | number;
  user: number | { id: number };
  courseId: string;
  activePhaseIndex?: number;
  completedPhases?: string[];
  points?: number;
  isCompleted?: boolean;
  totalTimeMs?: number;
  totalMistakes?: number;
  mascotInteractionsTotal?: number;
  confidenceResults?: Record<string, string>;
  phaseResults?: Record<string, string>;
  detailedStats?: Record<string, unknown>;
  updatedAt?: string;
}

interface RawCourseDoc {
  id?: string | number;
  slug?: string;
  title?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  phases?: Array<{
    phaseId: string;
    title: string;
    sourceView?: string;
    maxPoints?: number;
  }>;
}

export async function GET(req: Request) {
  let isAuthorized = false;

  let currentUserRole = '';
  let currentUserId = '';

  // 1. Check NextAuth session
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (user && (user.role === ROLES.ADMIN || user.role === ROLES.EDITOR)) {
      isAuthorized = true;
      currentUserRole = user.role;
      currentUserId = user.id ? String(user.id) : '';
    }
  } catch {
    // Continue to check Payload CMS token
  }

  // 2. Check Payload CMS cookie session if not yet authorized
  const payload = await getPayloadInstance();
  if (!isAuthorized) {
    try {
      const headers = await getHeaders();
      const { user: payloadUser } = await payload.auth({ headers });
      if (payloadUser && (payloadUser.role === ROLES.ADMIN || payloadUser.role === ROLES.EDITOR)) {
        isAuthorized = true;
        currentUserRole = payloadUser.role;
        currentUserId = String(payloadUser.id);
      }
    } catch {
      // Payload auth check failed
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const algorithmFilter = searchParams.get('algorithmId') || 'all';
  const courseFilter = searchParams.get('courseId') || 'all';
  const difficultyFilter = searchParams.get('difficulty') || 'all';
  const phaseTypeFilter = searchParams.get('phaseType') || 'all';
  const timeRangeFilter = searchParams.get('timeRange') || '30d';
  const requestedInstructor = searchParams.get('instructorId');
  const _scopeMode = searchParams.get('scope') || 'auto'; // 'my' | 'global' | 'auto'

  let activeInstructorFilter: string | null = null;
  if (currentUserRole === ROLES.EDITOR) {
    // Teachers are strictly scoped to their own courses and enrolled students
    activeInstructorFilter = currentUserId;
  } else if (currentUserRole === ROLES.ADMIN) {
    if (requestedInstructor && requestedInstructor !== 'all') {
      activeInstructorFilter = requestedInstructor;
    }
  }

  try {
    // Time filter cutoff
    let cutoffDate: Date | null = null;
    const now = new Date();
    if (timeRangeFilter === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRangeFilter === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRangeFilter === '90d') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch Users (Safeguarded)
    let users: Array<Record<string, unknown>> = [];
    try {
      const res = await payload.find({
        collection: 'users',
        limit: 1000,
        depth: 0,
      });
      users = (res?.docs || []) as unknown as Array<Record<string, unknown>>;
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch users:', err);
    }

    // 2. Fetch Algorithm Progress (Safeguarded)
    let progressDocs: RawProgress[] = [];
    try {
      const progressQuery: Where = {};
      if (algorithmFilter !== 'all') {
        progressQuery.algorithmId = { equals: algorithmFilter };
      }
      if (cutoffDate) {
        progressQuery.updatedAt = { greater_than_equal: cutoffDate.toISOString() };
      }

      const res = await payload.find({
        collection: 'algorithm-progress',
        where: Object.keys(progressQuery).length > 0 ? progressQuery : undefined,
        limit: 2000,
        depth: 0,
      });
      progressDocs = (res?.docs || []) as unknown as RawProgress[];
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch algorithm-progress:', err);
    }

    // 3. Fetch Learning Events (Safeguarded)
    let eventsDocs: RawEvent[] = [];
    try {
      const eventsQuery: Where = {};
      if (algorithmFilter !== 'all') {
        eventsQuery.algorithmId = { equals: algorithmFilter };
      }
      if (cutoffDate) {
        eventsQuery.createdAt = { greater_than_equal: cutoffDate.toISOString() };
      }

      const res = await payload.find({
        collection: 'learning-events',
        where: Object.keys(eventsQuery).length > 0 ? eventsQuery : undefined,
        limit: 5000,
        sort: '-createdAt',
        depth: 0,
      });
      eventsDocs = ((res?.docs || []) as unknown as RawEvent[]).reverse();
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch learning-events:', err);
    }

    // 4. Fetch Course Progress (Safeguarded)
    let courseProgressDocs: RawCourseProgress[] = [];
    try {
      const cpQuery: Where | undefined = cutoffDate
        ? { updatedAt: { greater_than_equal: cutoffDate.toISOString() } }
        : undefined;
      const res = await payload.find({
        collection: 'course-progress',
        where: cpQuery,
        limit: 1000,
        depth: 1,
      });
      courseProgressDocs = (res?.docs || []) as unknown as RawCourseProgress[];
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch course-progress:', err);
    }

    // 5. Fetch Courses (Safeguarded)
    let coursesDocs: Array<RawCourseDoc & { instructor?: unknown }> = [];
    try {
      const res = await payload.find({
        collection: 'courses',
        limit: 100,
        depth: 1,
      });
      coursesDocs = (res?.docs || []) as unknown as Array<RawCourseDoc & { instructor?: unknown }>;
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch courses:', err);
    }

    if (activeInstructorFilter) {
      // Filter strictly to courses authored by the active instructor
      coursesDocs = coursesDocs.filter((c) => {
        const ins = c.instructor as { id?: string | number } | string | number | null | undefined;
        const insId =
          typeof ins === 'object' && ins !== null && ins.id !== undefined
            ? String(ins.id)
            : ins !== null && ins !== undefined
              ? String(ins)
              : '';
        return insId === activeInstructorFilter;
      });
    }

    // Set of slugs and IDs belonging to the active instructor's courses
    const teacherCourseSlugs = new Set<string>();
    const teacherCourseIds = new Set<string>();
    coursesDocs.forEach((c) => {
      if (c.slug) teacherCourseSlugs.add(c.slug);
      if (c.id) teacherCourseIds.add(String(c.id));
    });

    // Filter course-progress to only records belonging to the instructor's courses
    const filteredCourseProgress = activeInstructorFilter
      ? courseProgressDocs.filter(
          (cp) => teacherCourseSlugs.has(cp.courseId) || teacherCourseIds.has(cp.courseId),
        )
      : courseProgressDocs;

    // Set of student user IDs enrolled in these courses
    const enrolledStudentUserIds = new Set<string>();
    filteredCourseProgress.forEach((cp) => {
      const uid =
        typeof cp.user === 'object' && cp.user !== null ? String(cp.user.id) : String(cp.user);
      if (uid && uid !== 'undefined' && uid !== 'null') {
        enrolledStudentUserIds.add(uid);
      }
    });

    // Scope algorithm progress and learning events to enrolled students when teacher scope is active
    const scopedProgressDocs = activeInstructorFilter
      ? progressDocs.filter((p) => {
          const uid =
            typeof p.user === 'object' && p.user !== null ? String(p.user.id) : String(p.user);
          return enrolledStudentUserIds.has(uid);
        })
      : progressDocs;

    const scopedEventsDocs = activeInstructorFilter
      ? eventsDocs.filter((e) => {
          const uid =
            typeof e.user === 'object' && e.user !== null ? String(e.user.id) : String(e.user);
          return enrolledStudentUserIds.has(uid);
        })
      : eventsDocs;

    // Fetch instructors list for admin dropdown (Safeguarded)
    let rawInstructors: Array<Record<string, unknown>> = [];
    try {
      const res = await payload.find({
        collection: 'users',
        where: {
          or: [{ role: { equals: ROLES.ADMIN } }, { role: { equals: ROLES.EDITOR } }],
        },
        limit: 100,
        depth: 0,
      });
      rawInstructors = (res?.docs || []) as unknown as Array<Record<string, unknown>>;
    } catch (err) {
      console.warn('[AdminStatistics] Failed to fetch instructors list:', err);
    }

    const instructorsList = [
      { id: 'all', name: 'Teljes platform (Minden oktató & diák)' },
      ...rawInstructors.map((ins) => ({
        id: String(ins.id),
        name: (ins as { firstName?: string; lastName?: string; email?: string }).firstName
          ? `${(ins as { firstName?: string; lastName?: string }).firstName} ${(ins as { lastName?: string }).lastName || ''}`.trim()
          : (ins as { email?: string }).email || 'Tanár',
        role: (ins as { role?: string }).role,
      })),
    ];

    // 6. Fetch Search Analytics (Safeguarded - may not exist in database yet)
    let searchDocs: Array<{
      query?: string;
      resultsCount?: number;
      language?: string;
      user?: unknown;
    }> = [];
    try {
      const searchQueryFilter: Where | undefined = cutoffDate
        ? { createdAt: { greater_than_equal: cutoffDate.toISOString() } }
        : undefined;
      const res = await payload.find({
        collection: 'search-analytics',
        where: searchQueryFilter,
        limit: 500,
        sort: '-createdAt',
        depth: 0,
      });
      const rawSearches = (res?.docs || []) as unknown as Array<{
        query?: string;
        resultsCount?: number;
        language?: string;
        user?: unknown;
      }>;
      searchDocs = activeInstructorFilter
        ? rawSearches.filter((s) => {
            const uid =
              typeof s.user === 'object' && s.user !== null && 'id' in s.user
                ? String((s.user as { id: string | number }).id)
                : s.user !== null && s.user !== undefined
                  ? String(s.user)
                  : '';
            return enrolledStudentUserIds.has(uid);
          })
        : rawSearches;
    } catch (err) {
      console.warn('[AdminStatistics] Search analytics table not available:', err);
    }

    // ─── AGGREGATIONS ───

    // A. Algorithms Completed
    const totalAlgorithmsCompleted = scopedProgressDocs.filter(
      (p) => (p.overallProgress || 0) >= 100,
    ).length;

    // B. Algorithm Mistake & Hesitation Breakdown
    const algorithmStatsMap: Record<
      string,
      {
        totalAttempts: number;
        totalMistakes: number;
        totalHints: number;
        totalTimeMs: number;
        completedCount: number;
        decisionsCorrect: number;
        decisionsWrong: number;
      }
    > = {};

    const knownAlgorithms = [
      'bubble-sort',
      'insertion-sort',
      'selection-sort',
      'merge-sort',
      'quick-sort',
      'linear-search',
      'binary-search',
      'heap-sort',
      'shell-sort',
      'n-queens',
      'bogosort',
    ];

    for (const algo of knownAlgorithms) {
      algorithmStatsMap[algo] = {
        totalAttempts: 0,
        totalMistakes: 0,
        totalHints: 0,
        totalTimeMs: 0,
        completedCount: 0,
        decisionsCorrect: 0,
        decisionsWrong: 0,
      };
    }

    for (const prog of scopedProgressDocs) {
      const algo = prog.algorithmId;
      if (!algorithmStatsMap[algo]) {
        algorithmStatsMap[algo] = {
          totalAttempts: 0,
          totalMistakes: 0,
          totalHints: 0,
          totalTimeMs: 0,
          completedCount: 0,
          decisionsCorrect: 0,
          decisionsWrong: 0,
        };
      }
      const item = algorithmStatsMap[algo];
      const mistakes = (prog.controlMistakes || 0) + (prog.createMistakes || 0);
      const attempts = (prog.controlAttempts || 0) + (prog.createAttempts || 0) || 1;
      item.totalMistakes += mistakes;
      item.totalAttempts += attempts;
      item.totalHints += prog.controlHintsUsed || 0;
      item.totalTimeMs += prog.totalTimeSpentMs || 0;
      if ((prog.overallProgress || 0) >= 100) item.completedCount++;
    }

    // Process events for step bottlenecks & decisions
    const stepBottlenecks: Record<
      string,
      {
        algorithmId: string;
        stepOrBlank: string;
        mistakeCount: number;
        tab: string;
        avgHesitationMs: number;
        sampleTotal: number;
      }
    > = {};

    for (const evt of scopedEventsDocs) {
      const algo = evt.algorithmId;
      if (evt.eventType === 'control_decision') {
        const isCorrect = evt.eventData?.isCorrect === true;
        const step = evt.eventData?.step ?? '1';
        if (isCorrect) {
          if (algo && algorithmStatsMap[algo]) algorithmStatsMap[algo].decisionsCorrect++;
        } else {
          if (algo && algorithmStatsMap[algo]) {
            algorithmStatsMap[algo].decisionsWrong++;
            algorithmStatsMap[algo].totalMistakes++;
          }
          if (algo) {
            const key = `${algo}-step-${step}`;
            if (!stepBottlenecks[key]) {
              stepBottlenecks[key] = {
                algorithmId: algo,
                stepOrBlank: `Lépés #${step}`,
                mistakeCount: 0,
                tab: 'control',
                avgHesitationMs: 0,
                sampleTotal: 0,
              };
            }
            stepBottlenecks[key].mistakeCount++;
            if (evt.durationMs && evt.durationMs > 0) {
              stepBottlenecks[key].avgHesitationMs += evt.durationMs;
              stepBottlenecks[key].sampleTotal++;
            }
          }
        }
      } else if (evt.eventType === 'create_blank_attempt') {
        const isCorrect = evt.eventData?.correct === true;
        const blankId = evt.eventData?.blankId || 'gap';
        if (!isCorrect && algo) {
          const key = `${algo}-blank-${blankId}`;
          if (!stepBottlenecks[key]) {
            stepBottlenecks[key] = {
              algorithmId: algo,
              stepOrBlank: `Kód kiegészítés (${blankId})`,
              mistakeCount: 0,
              tab: 'create',
              avgHesitationMs: 0,
              sampleTotal: 0,
            };
          }
          stepBottlenecks[key].mistakeCount++;
          if (evt.durationMs && evt.durationMs > 0) {
            stepBottlenecks[key].avgHesitationMs += evt.durationMs;
            stepBottlenecks[key].sampleTotal++;
          }
        }
      }
    }

    // C. Post-Error Slowing (PES) & Sequential Cognitive Load Recovery
    const sessionEvents: Record<string, RawEvent[]> = {};
    for (const evt of scopedEventsDocs) {
      if (!sessionEvents[evt.sessionId]) sessionEvents[evt.sessionId] = [];
      sessionEvents[evt.sessionId].push(evt);
    }

    const normalActionDurations: number[] = [];
    const postErrorDurationsStep1: number[] = [];
    const postErrorDurationsStep2: number[] = [];
    const postErrorDurationsStep3: number[] = [];
    let retryAttempt1Success = 0;
    let retryAttempt1Total = 0;

    for (const [_sessionId, evts] of Object.entries(sessionEvents)) {
      for (let i = 0; i < evts.length; i++) {
        const curr = evts[i];
        const isErrorEvent =
          curr.eventType === 'control_mistake' ||
          curr.eventType === 'control_selection_mistake' ||
          (curr.eventType === 'control_decision' && curr.eventData?.isCorrect === false) ||
          (curr.eventType === 'create_blank_attempt' && curr.eventData?.correct === false);

        if (curr.durationMs && curr.durationMs > 100 && curr.durationMs < 60000 && !isErrorEvent) {
          normalActionDurations.push(curr.durationMs);
        }

        if (isErrorEvent) {
          if (i + 1 < evts.length && evts[i + 1].durationMs && evts[i + 1].durationMs! < 120000) {
            postErrorDurationsStep1.push(evts[i + 1].durationMs!);
            const nextEvt = evts[i + 1];
            if (
              (nextEvt.eventType === 'control_decision' && nextEvt.eventData?.isCorrect === true) ||
              (nextEvt.eventType === 'create_blank_attempt' && nextEvt.eventData?.correct === true)
            ) {
              retryAttempt1Success++;
              retryAttempt1Total++;
            } else if (
              (nextEvt.eventType === 'control_decision' &&
                nextEvt.eventData?.isCorrect === false) ||
              (nextEvt.eventType === 'create_blank_attempt' && nextEvt.eventData?.correct === false)
            ) {
              retryAttempt1Total++;
            }
          }
          if (i + 2 < evts.length && evts[i + 2].durationMs && evts[i + 2].durationMs! < 120000) {
            postErrorDurationsStep2.push(evts[i + 2].durationMs!);
          }
          if (i + 3 < evts.length && evts[i + 3].durationMs && evts[i + 3].durationMs! < 120000) {
            postErrorDurationsStep3.push(evts[i + 3].durationMs!);
          }
        }
      }
    }

    const avgNormalDurationMs =
      normalActionDurations.length > 0
        ? Math.round(
            normalActionDurations.reduce((a, b) => a + b, 0) / normalActionDurations.length,
          )
        : 0;

    const avgPostErrorDurationMs =
      postErrorDurationsStep1.length > 0
        ? Math.round(
            postErrorDurationsStep1.reduce((a, b) => a + b, 0) / postErrorDurationsStep1.length,
          )
        : 0;

    const avgPostErrorStep2Ms =
      postErrorDurationsStep2.length > 0
        ? Math.round(
            postErrorDurationsStep2.reduce((a, b) => a + b, 0) / postErrorDurationsStep2.length,
          )
        : 0;

    const avgPostErrorStep3Ms =
      postErrorDurationsStep3.length > 0
        ? Math.round(
            postErrorDurationsStep3.reduce((a, b) => a + b, 0) / postErrorDurationsStep3.length,
          )
        : 0;

    const pesSlowdownPercentage =
      avgNormalDurationMs > 0 && postErrorDurationsStep1.length > 0
        ? Math.round(((avgPostErrorDurationMs - avgNormalDurationMs) / avgNormalDurationMs) * 100)
        : 0;

    const retrySuccessRate =
      retryAttempt1Total > 0 ? Math.round((retryAttempt1Success / retryAttempt1Total) * 100) : 0;

    // D. Video Impact Comparison
    const withVideoMistakes: number[] = [];
    const withoutVideoMistakes: number[] = [];
    for (const p of scopedProgressDocs) {
      const m = (p.controlMistakes || 0) + (p.createMistakes || 0);
      if (p.videoWatched || (p.videoWatchTimeMs || 0) > 15000) {
        withVideoMistakes.push(m);
      } else {
        withoutVideoMistakes.push(m);
      }
    }

    const avgMistakesWithVideo =
      withVideoMistakes.length > 0
        ? Number(
            (withVideoMistakes.reduce((a, b) => a + b, 0) / withVideoMistakes.length).toFixed(1),
          )
        : 0;
    const avgMistakesWithoutVideo =
      withoutVideoMistakes.length > 0
        ? Number(
            (withoutVideoMistakes.reduce((a, b) => a + b, 0) / withoutVideoMistakes.length).toFixed(
              1,
            ),
          )
        : 0;

    const videoErrorReductionPercent =
      withVideoMistakes.length > 0 && withoutVideoMistakes.length > 0 && avgMistakesWithoutVideo > 0
        ? Math.round(
            Math.max(
              0,
              ((avgMistakesWithoutVideo - avgMistakesWithVideo) / avgMistakesWithoutVideo) * 100,
            ),
          )
        : 0;

    // ─── 5 ADVANCED RESEARCH METRICS ───

    // 1. Help-Seeking Transfer to Autonomous Coding (Create Help -> Alive Performance)
    const helpCohort = scopedProgressDocs.filter((p) => p.createHelpUsed === true);
    const autoCohort = scopedProgressDocs.filter((p) => p.createHelpUsed === false);

    const helpAliveAvgScore =
      helpCohort.length > 0
        ? Math.round(
            helpCohort.reduce((s, p) => s + (p.aliveBestScore || 0), 0) / helpCohort.length,
          )
        : 0;
    const autoAliveAvgScore =
      autoCohort.length > 0
        ? Math.round(
            autoCohort.reduce((s, p) => s + (p.aliveBestScore || 0), 0) / autoCohort.length,
          )
        : 0;

    const helpAliveSubmissions =
      helpCohort.length > 0
        ? Number(
            (
              helpCohort.reduce((s, p) => s + (p.aliveCodeSubmissions || 0), 0) / helpCohort.length
            ).toFixed(1),
          )
        : 0;
    const autoAliveSubmissions =
      autoCohort.length > 0
        ? Number(
            (
              autoCohort.reduce((s, p) => s + (p.aliveCodeSubmissions || 0), 0) / autoCohort.length
            ).toFixed(1),
          )
        : 0;

    const helpAliveCompletionRate =
      helpCohort.length > 0
        ? Math.round((helpCohort.filter((p) => p.aliveCompleted).length / helpCohort.length) * 100)
        : 0;
    const autoAliveCompletionRate =
      autoCohort.length > 0
        ? Math.round((autoCohort.filter((p) => p.aliveCompleted).length / autoCohort.length) * 100)
        : 0;

    const helpSeekingTransfer = {
      withHelp: {
        count: helpCohort.length,
        avgScore: helpAliveAvgScore,
        avgSubmissions: helpAliveSubmissions,
        completionRate: helpAliveCompletionRate,
      },
      autonomous: {
        count: autoCohort.length,
        avgScore: autoAliveAvgScore,
        avgSubmissions: autoAliveSubmissions,
        completionRate: autoAliveCompletionRate,
      },
      scoreDifferencePercent:
        helpCohort.length > 0 && autoCohort.length > 0 && autoAliveAvgScore > 0
          ? Math.round(((autoAliveAvgScore - helpAliveAvgScore) / autoAliveAvgScore) * 100)
          : 0,
    };

    // 2. Misconceptions Analysis (derived purely from recorded step bottlenecks)
    const uniqueAlgoLearners = Math.max(
      1,
      new Set(
        scopedProgressDocs.map((p) =>
          String(typeof p.user === 'object' && p.user !== null ? p.user.id : p.user),
        ),
      ).size,
    );
    const totalBottleneckMistakes = Object.values(stepBottlenecks).reduce(
      (sum, b) => sum + b.mistakeCount,
      0,
    );
    const misconceptionsList = Object.entries(stepBottlenecks)
      .sort((a, b) => b[1].mistakeCount - a[1].mistakeCount)
      .slice(0, 6)
      .map(([key, b]) => ({
        id: key,
        algorithmId: b.algorithmId,
        title: `${b.stepOrBlank} elakadás`,
        description: `Rögzített tanulói hibák (${b.mistakeCount} db) a(z) "${b.stepOrBlank}" lépésnél (${b.tab} fázis).`,
        affectedPercentage:
          totalBottleneckMistakes > 0
            ? Math.min(
                100,
                Math.round(
                  (b.mistakeCount / Math.max(uniqueAlgoLearners, totalBottleneckMistakes)) * 100,
                ),
              )
            : 0,
        sampleExpected: '',
        sampleActual: '',
        recommendation:
          b.tab === 'create'
            ? 'Érdemes közösen áttekinteni a ciklus- és feltétel-kiegészítés szintaxisát.'
            : 'Javasolt a vizuális animáció és a lépésenkénti irányítás közös elemzése.',
      }));

    // 3. Process Mining & Learning Trajectories
    const userSessionPath: Record<string, string[]> = {};
    for (const evt of scopedEventsDocs) {
      if (evt.tab) {
        const uId = String(typeof evt.user === 'object' ? evt.user.id : evt.user);
        if (!userSessionPath[uId]) userSessionPath[uId] = [];
        if (
          userSessionPath[uId].length === 0 ||
          userSessionPath[uId][userSessionPath[uId].length - 1] !== evt.tab
        ) {
          userSessionPath[uId].push(evt.tab);
        }
      }
    }

    const linearUsers = new Set<string>();
    const codeFirstUsers = new Set<string>();
    const visualExplorerUsers = new Set<string>();

    for (const [uId, path] of Object.entries(userSessionPath)) {
      if (path.length >= 3 && path[0] === 'video' && path[1] === 'animation') {
        linearUsers.add(uId);
      } else if (path[0] === 'create' || path[0] === 'alive') {
        codeFirstUsers.add(uId);
      } else {
        visualExplorerUsers.add(uId);
      }
    }

    const computePathMetrics = (cohortUsers: Set<string>) => {
      if (cohortUsers.size === 0) {
        return { avgCompletionMinutes: 0, completionRate: 0 };
      }
      const cohortDocs = scopedProgressDocs.filter((p) => {
        const uid = String(typeof p.user === 'object' && p.user !== null ? p.user.id : p.user);
        return cohortUsers.has(uid);
      });
      if (cohortDocs.length === 0) {
        return { avgCompletionMinutes: 0, completionRate: 0 };
      }
      const completedDocs = cohortDocs.filter((p) => (p.overallProgress || 0) >= 100);
      const totalMs = cohortDocs.reduce((sum, p) => sum + (p.totalTimeSpentMs || 0), 0);
      return {
        avgCompletionMinutes: Number((totalMs / cohortDocs.length / 60000).toFixed(1)),
        completionRate: Math.round((completedDocs.length / cohortDocs.length) * 100),
      };
    };

    const linearMetrics = computePathMetrics(linearUsers);
    const codeFirstMetrics = computePathMetrics(codeFirstUsers);
    const visualMetrics = computePathMetrics(visualExplorerUsers);

    const rawPathTotal = linearUsers.size + codeFirstUsers.size + visualExplorerUsers.size;
    const strategyCandidates = [
      {
        label: 'Lineáris / Módszeres',
        count: linearUsers.size,
        rate: linearMetrics.completionRate,
      },
      { label: 'Kód-központú', count: codeFirstUsers.size, rate: codeFirstMetrics.completionRate },
      {
        label: 'Vizuális felfedező',
        count: visualExplorerUsers.size,
        rate: visualMetrics.completionRate,
      },
    ].filter((c) => c.count > 0);
    strategyCandidates.sort((a, b) => b.rate - a.rate || b.count - a.count);

    const processMining = {
      linearMethodical: {
        sharePercent: rawPathTotal > 0 ? Math.round((linearUsers.size / rawPathTotal) * 100) : 0,
        avgCompletionMinutes: linearMetrics.avgCompletionMinutes,
        completionRate: linearMetrics.completionRate,
        description:
          'Módszeres haladás: Videó → Animáció → Irányítás → Kódkiegészítés → Önálló kód',
      },
      codeFirstExpedited: {
        sharePercent: rawPathTotal > 0 ? Math.round((codeFirstUsers.size / rawPathTotal) * 100) : 0,
        avgCompletionMinutes: codeFirstMetrics.avgCompletionMinutes,
        completionRate: codeFirstMetrics.completionRate,
        description: 'Kód-központú: Azonnali ugrás a kódra, csak elakadás esetén néznek vissza',
      },
      visualExploratory: {
        sharePercent:
          rawPathTotal > 0 ? Math.round((visualExplorerUsers.size / rawPathTotal) * 100) : 0,
        avgCompletionMinutes: visualMetrics.avgCompletionMinutes,
        completionRate: visualMetrics.completionRate,
        description: 'Vizuális felfedező: Többszöri animáció és szimuláció lejátszás',
      },
      recommendedStrategy:
        strategyCandidates.length > 0
          ? `${strategyCandidates[0].label} (${strategyCandidates[0].rate}%-os teljesítési arány)`
          : 'Nincs még elegendő adat',
    };

    // 4. Static Code vs Visual Blocks (Frustration Threshold)
    let fallbackCount = 0;
    let returnToCodeCount = 0;
    const failedAttemptsList: number[] = [];

    for (const p of scopedProgressDocs) {
      if (p.aliveHelpUsed) {
        fallbackCount++;
        failedAttemptsList.push(p.aliveCodeSubmissions || 0);
        if (p.aliveCompleted) returnToCodeCount++;
      }
    }

    const rawAliveLearners = scopedProgressDocs.filter(
      (p) => (p.aliveCodeSubmissions || 0) > 0,
    ).length;
    const visualBlocksThreshold = {
      fallbackPercentage:
        rawAliveLearners > 0 ? Math.round((fallbackCount / rawAliveLearners) * 100) : 0,
      avgFailedAttemptsBeforeFallback:
        failedAttemptsList.length > 0
          ? Number(
              (failedAttemptsList.reduce((a, b) => a + b, 0) / failedAttemptsList.length).toFixed(
                1,
              ),
            )
          : 0,
      successfulReturnToCodeRate:
        fallbackCount > 0 ? Math.round((returnToCodeCount / fallbackCount) * 100) : 0,
    };

    // 5. Cognitive Load Recovery Dynamics
    const hasCognitiveData = normalActionDurations.length > 0 || retryAttempt1Total > 0;
    const cognitiveLoadDynamics = {
      baselineReactionSec: Number((avgNormalDurationMs / 1000).toFixed(1)),
      immediatePostErrorSec: Number((avgPostErrorDurationMs / 1000).toFixed(1)),
      step2RecoverySec: Number((avgPostErrorStep2Ms / 1000).toFixed(1)),
      step3RecoverySec: Number((avgPostErrorStep3Ms / 1000).toFixed(1)),
      overloadIndex: hasCognitiveData
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (Math.max(0, pesSlowdownPercentage) / 100) * 45 +
                  (retryAttempt1Total > 0 ? (100 - retrySuccessRate) * 0.55 : 0),
              ),
            ),
          )
        : 0,
    };

    // E. Algorithm Hesitation List
    const algorithmHesitationList = Object.entries(algorithmStatsMap).map(([algoId, data]) => {
      const algoEvents = scopedEventsDocs.filter((e) => e.algorithmId === algoId && e.durationMs);
      const avgDuration =
        algoEvents.length > 0
          ? Math.round(algoEvents.reduce((s, e) => s + (e.durationMs || 0), 0) / algoEvents.length)
          : 0;

      const totalMistakes = data.totalMistakes || 0;
      const totalDecisions = (data.decisionsWrong || 0) + (data.decisionsCorrect || 0);
      const errorRate =
        totalDecisions > 0
          ? Math.min(100, Math.round((data.decisionsWrong / totalDecisions) * 100))
          : data.totalAttempts > 0
            ? Math.min(100, Math.round((totalMistakes / data.totalAttempts) * 100))
            : 0;

      return {
        algorithmId: algoId,
        averageHesitationMs: avgDuration,
        averageHesitationSeconds: Number((avgDuration / 1000).toFixed(1)),
        totalMistakes,
        errorRate,
        completedCount: data.completedCount,
        hintsUsed: data.totalHints,
      };
    });

    algorithmHesitationList.sort((a, b) => b.averageHesitationMs - a.averageHesitationMs);

    // Top Bottlenecks formatted
    const formattedBottlenecks = Object.values(stepBottlenecks)
      .map((b) => ({
        ...b,
        avgHesitationSeconds:
          b.sampleTotal > 0 ? Number((b.avgHesitationMs / b.sampleTotal / 1000).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.mistakeCount - a.mistakeCount)
      .slice(0, 8);

    // F. Metacognitive Confidence Matrix
    let highConfCorrect = 0;
    let highConfIncorrect = 0;
    let lowConfCorrect = 0;
    let lowConfIncorrect = 0;

    for (const evt of scopedEventsDocs) {
      if (evt.eventData?.confidence) {
        const isHigh = evt.eventData.confidence === 'high';
        const isCorrect = evt.eventData.allCorrect === true || evt.eventData.correct === true;
        if (isHigh && isCorrect) highConfCorrect++;
        else if (isHigh && !isCorrect) highConfIncorrect++;
        else if (!isHigh && isCorrect) lowConfCorrect++;
        else if (!isHigh && !isCorrect) lowConfIncorrect++;
      }
    }

    const totalConfRatings =
      highConfCorrect + highConfIncorrect + lowConfCorrect + lowConfIncorrect;
    const confidenceMatrix = {
      mastery: totalConfRatings > 0 ? Math.round((highConfCorrect / totalConfRatings) * 100) : 0,
      overconfidence:
        totalConfRatings > 0 ? Math.round((highConfIncorrect / totalConfRatings) * 100) : 0,
      hesitant: totalConfRatings > 0 ? Math.round((lowConfCorrect / totalConfRatings) * 100) : 0,
      recognizedGap:
        totalConfRatings > 0 ? Math.round((lowConfIncorrect / totalConfRatings) * 100) : 0,
    };

    // G. Search Analytics
    const queryCounts: Record<string, { count: number; resultsCount: number; language: string }> =
      {};
    for (const s of searchDocs) {
      const q = (s.query || '').trim().toLowerCase();
      if (!q) continue;
      if (!queryCounts[q]) {
        queryCounts[q] = {
          count: 0,
          resultsCount: s.resultsCount || 0,
          language: s.language || 'hu',
        };
      }
      queryCounts[q].count++;
    }

    const topSearches = Object.entries(queryCounts)
      .map(([query, data]) => ({
        query,
        count: data.count,
        resultsCount: data.resultsCount,
        language: data.language,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const zeroResultSearches = Object.entries(queryCounts)
      .filter(([_, data]) => data.resultsCount === 0)
      .map(([query, data]) => ({ query, count: data.count, language: data.language }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ─── COURSES EVALUATION & DROPOFF FUNNEL ───
    const coursesToEvaluate = coursesDocs;

    const coursesEvaluationList = coursesToEvaluate.map((course) => {
      const courseSlug = course.slug || String(course.id);
      const enrolled = filteredCourseProgress.filter(
        (cp) => cp.courseId === courseSlug || cp.courseId === String(course.id),
      );
      const enrolledCount = enrolled.length;
      const completed = enrolled.filter((cp) => cp.isCompleted === true);
      const completedCount = completed.length;
      const completionRate =
        enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0;

      const totalTimeMs = enrolled.reduce((sum, cp) => sum + (cp.totalTimeMs || 0), 0);
      const estimatedMinutes = course.estimatedMinutes || 20;
      const actualAvgMinutes =
        enrolled.length > 0 && totalTimeMs > 0
          ? Math.round(totalTimeMs / enrolled.length / 60000)
          : 0;

      const pacingRatio =
        actualAvgMinutes > 0 && estimatedMinutes > 0
          ? Number((actualAvgMinutes / estimatedMinutes).toFixed(2))
          : 0;

      const totalPoints = enrolled.reduce((sum, cp) => sum + (cp.points || 0), 0);
      const avgScore =
        enrolled.length > 0 && totalPoints > 0 ? Math.round(totalPoints / enrolled.length) : 0;

      const totalMistakes = enrolled.reduce((sum, cp) => sum + (cp.totalMistakes || 0), 0);

      const mascotInteractions = enrolled.reduce(
        (sum, cp) => sum + (cp.mascotInteractionsTotal || 0),
        0,
      );

      const mascotCohort = enrolled.filter((cp) => (cp.mascotInteractionsTotal || 0) > 0);
      const nonMascotCohort = enrolled.filter((cp) => (cp.mascotInteractionsTotal || 0) === 0);
      const mascotCompletion =
        mascotCohort.length > 0
          ? Math.round(
              (mascotCohort.filter((cp) => cp.isCompleted).length / mascotCohort.length) * 100,
            )
          : 0;
      const nonMascotCompletion =
        nonMascotCohort.length > 0
          ? Math.round(
              (nonMascotCohort.filter((cp) => cp.isCompleted).length / nonMascotCohort.length) *
                100,
            )
          : 0;
      const mascotRetentionBoost = Math.max(0, mascotCompletion - nonMascotCompletion);

      let mascotHelpedPhasesCount = 0;
      let mascotImprovedPhasesCount = 0;

      enrolled.forEach((cp) => {
        const stats = (cp.detailedStats || {}) as Record<
          string,
          { mascotHelpCount?: number; improvedAfterMascot?: boolean }
        >;
        Object.values(stats).forEach((pStat) => {
          if ((pStat.mascotHelpCount || 0) > 0) {
            mascotHelpedPhasesCount += pStat.mascotHelpCount || 0;
            if (pStat.improvedAfterMascot) {
              mascotImprovedPhasesCount += 1;
            }
          }
        });
      });

      const mascotImprovementRate =
        mascotHelpedPhasesCount > 0
          ? Math.round((mascotImprovedPhasesCount / mascotHelpedPhasesCount) * 100)
          : 0;

      // Quality Index (1-100 score)
      const qualityIndex =
        enrolledCount > 0
          ? Math.min(
              100,
              Math.round(
                completionRate * 0.4 +
                  (avgScore / 100) * 40 +
                  Math.max(0, 20 - Math.abs(pacingRatio - 1) * 20),
              ),
            )
          : 0;

      // Phase drop-off funnel
      const phases = course.phases && course.phases.length > 0 ? course.phases : [];

      const dropoffFunnel = phases.map((phase, pIdx) => {
        const reachedCount = enrolled.filter((cp) => {
          if (cp.isCompleted) return true;
          const compCount = cp.completedPhases?.length || 0;
          return compCount >= pIdx || (cp.activePhaseIndex || 0) >= pIdx;
        }).length;

        const retentionRate =
          enrolledCount > 0 ? Math.min(100, Math.round((reachedCount / enrolledCount) * 100)) : 0;

        let phaseStatSamples = 0;
        let phaseTotalTimeMs = 0;
        let phaseTotalMistakesFromStats = 0;
        enrolled.forEach((cp) => {
          const stat = (cp.detailedStats || {})[phase.phaseId] as
            | { timeSpentMs?: number; mistakes?: number }
            | undefined;
          if (stat) {
            phaseStatSamples++;
            phaseTotalTimeMs += stat.timeSpentMs || 0;
            phaseTotalMistakesFromStats += stat.mistakes || 0;
          }
        });

        const avgTimeMinutes =
          phaseStatSamples > 0
            ? Number((phaseTotalTimeMs / phaseStatSamples / 60000).toFixed(1))
            : actualAvgMinutes > 0 && phases.length > 0
              ? Number((actualAvgMinutes / phases.length).toFixed(1))
              : 0;
        const mistakeCount =
          phaseStatSamples > 0
            ? phaseTotalMistakesFromStats
            : phases.length > 0
              ? Math.round(totalMistakes / phases.length)
              : 0;

        const phaseTitle =
          typeof phase.title === 'object' && phase.title !== null
            ? (phase.title as Record<string, string>).hu ||
              (phase.title as Record<string, string>).en ||
              (phase.title as Record<string, string>).ro ||
              `Fázis #${pIdx + 1}`
            : phase.title || `Fázis #${pIdx + 1}`;

        const isBottleneck = pIdx > 0 && retentionRate < 72 && enrolledCount > 0;
        const status =
          retentionRate >= 85 && mistakeCount <= 2
            ? ('excellent' as const)
            : isBottleneck
              ? ('bottleneck' as const)
              : mistakeCount >= 4
                ? ('high_mistakes' as const)
                : ('normal' as const);

        const recommendation =
          status === 'bottleneck'
            ? 'Javasolt a fázis felosztása vagy kabala-segítség aktiválása a lemorzsolódás csökkentése érdekében.'
            : status === 'high_mistakes'
              ? 'Érdemes megerősítő példát vagy részletesebb útmutatót adni ehhez a lépéshez.'
              : 'A diákok stabilan és magabiztosan veszik ezt az akadályt.';

        return {
          phaseId: phase.phaseId,
          title: phaseTitle,
          sourceView: phase.sourceView || 'info',
          retentionRate,
          avgTimeMinutes,
          mistakeCount,
          isBottleneck,
          status,
          recommendation,
        };
      });

      // Detailed student roster for this course
      const studentsRoster = enrolled.map((cp, sIdx) => {
        const u =
          typeof cp.user === 'object' && cp.user !== null
            ? (cp.user as Record<string, unknown>)
            : null;
        const uId = u?.id ? String(u.id) : String(cp.user);
        const matchedUser = (u || users.find((usr) => String(usr.id) === uId)) as
          | Record<string, unknown>
          | undefined;
        const firstName = typeof matchedUser?.firstName === 'string' ? matchedUser.firstName : '';
        const lastName = typeof matchedUser?.lastName === 'string' ? matchedUser.lastName : '';
        const userEmail = typeof matchedUser?.email === 'string' ? matchedUser.email : '';
        const name =
          firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : userEmail
              ? userEmail.split('@')[0]
              : `Tanuló #${sIdx + 1}`;
        const email = userEmail;
        const completedPhases = cp.completedPhases || [];
        const completedCount = completedPhases.length;
        const totalPhases = phases.length || 1;
        const progressPercent = cp.isCompleted
          ? 100
          : Math.min(100, Math.round((completedCount / totalPhases) * 100));
        const timeMinutes = Math.round((cp.totalTimeMs || 0) / 60000);
        const currentPhaseIdx = cp.activePhaseIndex || 0;
        const currentPhase = phases[currentPhaseIdx] || phases[0];
        const currentPhaseTitle = currentPhase
          ? typeof currentPhase.title === 'string'
            ? currentPhase.title
            : (currentPhase.title as Record<string, string>)?.hu || currentPhase.phaseId
          : 'Kezdő lépés';

        const isStruggling = (cp.totalMistakes || 0) >= 3 && !cp.isCompleted;
        const status =
          cp.isCompleted || progressPercent === 100
            ? ('completed' as const)
            : isStruggling
              ? ('struggling' as const)
              : ('in_progress' as const);

        const detailed = (cp.detailedStats || {}) as Record<
          string,
          { mascotHelpCount?: number; improvedAfterMascot?: boolean }
        >;
        let studentMascotHelpCount = 0;
        let studentImprovedCount = 0;
        Object.values(detailed).forEach((st) => {
          if ((st.mascotHelpCount || 0) > 0) {
            studentMascotHelpCount += st.mascotHelpCount || 0;
            if (st.improvedAfterMascot) studentImprovedCount += 1;
          }
        });

        return {
          userId: uId,
          name,
          email,
          progressPercent,
          completedPhasesCount: completedCount,
          totalPhasesCount: totalPhases,
          currentPhaseIndex: currentPhaseIdx,
          currentPhaseTitle,
          points: cp.points || 0,
          totalMistakes: cp.totalMistakes || 0,
          timeSpentMinutes: timeMinutes,
          isCompleted: cp.isCompleted === true || progressPercent === 100,
          status,
          mascotHelpCount: studentMascotHelpCount,
          improvedAfterMascotCount: studentImprovedCount,
          lastActive: cp.updatedAt || new Date().toISOString(),
        };
      });

      const courseTitle =
        typeof course.title === 'object' && course.title !== null
          ? (course.title as Record<string, string>).hu ||
            (course.title as Record<string, string>).en ||
            (course.title as Record<string, string>).ro ||
            courseSlug
          : course.title || courseSlug;

      return {
        courseId: courseSlug,
        title: courseTitle,
        difficulty: course.difficulty || 'Beginner',
        estimatedMinutes,
        actualAvgMinutes,
        pacingRatio,
        enrolledCount,
        completedCount,
        completionRate,
        avgScore,
        totalMistakes,
        mascotInteractionsTotal: mascotInteractions,
        mascotRetentionBoost,
        mascotHelpedPhasesCount,
        mascotImprovedPhasesCount,
        mascotImprovementRate,
        qualityIndex,
        dropoffFunnel,
        studentsRoster,
        strugglingCount: studentsRoster.filter((s) => s.status === 'struggling').length,
        inProgressCount: studentsRoster.filter((s) => s.status === 'in_progress').length,
        instructorName: (() => {
          const ins = (course as Record<string, unknown>).instructor as
            | { firstName?: string; lastName?: string; email?: string }
            | undefined;
          if (!ins) return 'Rendszer / Admin';
          if (typeof ins === 'object' && ins !== null) {
            const name = `${ins.firstName || ''} ${ins.lastName || ''}`.trim();
            return name || ins.email || 'Tanár';
          }
          const matched = users.find((u) => String(u.id) === String(ins));
          if (matched) {
            const name = `${matched.firstName || ''} ${matched.lastName || ''}`.trim();
            return name || matched.email || 'Tanár';
          }
          return 'Tanár';
        })(),
      };
    });

    // ─── PHASE TYPE EFFECTIVENESS DERIVED FROM REAL EVALUATED COURSES ───
    const phaseTypeStatsMap: Record<
      string,
      { totalPhases: number; totalMistakes: number; totalScores: number[]; totalTimesSec: number[] }
    > = {};

    coursesToEvaluate.forEach((course) => {
      const courseSlug = course.slug || String(course.id);
      const enrolled = filteredCourseProgress.filter(
        (cp) => cp.courseId === courseSlug || cp.courseId === String(course.id),
      );
      const phases = course.phases || [];
      const courseTotalMistakes = enrolled.reduce((sum, cp) => sum + (cp.totalMistakes || 0), 0);
      const courseTotalTimeSec = enrolled.reduce(
        (sum, cp) => sum + Math.round((cp.totalTimeMs || 0) / 1000),
        0,
      );
      const courseAvgScore =
        enrolled.length > 0
          ? Math.round(enrolled.reduce((sum, cp) => sum + (cp.points || 0), 0) / enrolled.length)
          : 0;

      phases.forEach((p) => {
        const type = p.sourceView || 'info';
        if (!phaseTypeStatsMap[type]) {
          phaseTypeStatsMap[type] = {
            totalPhases: 0,
            totalMistakes: 0,
            totalScores: [],
            totalTimesSec: [],
          };
        }
        phaseTypeStatsMap[type].totalPhases += 1;
        const phaseMistakes =
          phases.length > 0 ? Math.round(courseTotalMistakes / phases.length) : 0;
        phaseTypeStatsMap[type].totalMistakes += phaseMistakes;
        const phaseTimeSec =
          enrolled.length > 0 && phases.length > 0 && courseTotalTimeSec > 0
            ? Math.round(courseTotalTimeSec / enrolled.length / phases.length)
            : 0;
        phaseTypeStatsMap[type].totalTimesSec.push(phaseTimeSec);
        if (enrolled.length > 0) {
          phaseTypeStatsMap[type].totalScores.push(courseAvgScore);
        }
      });
    });

    const phaseTypeEffectiveness = Object.entries(phaseTypeStatsMap).map(([type, stats]) => {
      const avgScore =
        stats.totalScores.length > 0
          ? Math.round(stats.totalScores.reduce((a, b) => a + b, 0) / stats.totalScores.length)
          : 0;
      const nonZeroTimes = stats.totalTimesSec.filter((t) => t > 0);
      const avgDuration =
        nonZeroTimes.length > 0
          ? Math.round(nonZeroTimes.reduce((a, b) => a + b, 0) / nonZeroTimes.length)
          : 0;
      return {
        type,
        sourceView: type,
        label:
          type === 'quiz'
            ? 'Kvíz & Teszt'
            : type === 'create' || type === 'gap-fill'
              ? 'Kódkiegészítés'
              : type === 'debug'
                ? 'Kód Hibakeresés'
                : type === 'control'
                  ? 'Interaktív Irányítás'
                  : type === 'video'
                    ? 'Videó Alapozás'
                    : type === 'match'
                      ? 'Párosító Feladat'
                      : type === 'order'
                        ? 'Sorrendbe Rendező'
                        : type === 'final-challenge' || type === 'simulation'
                          ? 'Záró Szimuláció'
                          : 'Elmélet & Leírás',
        avgTimeSec: avgDuration,
        avgMistakes:
          stats.totalPhases > 0 ? Number((stats.totalMistakes / stats.totalPhases).toFixed(1)) : 0,
        completionRate: avgScore,
        avgScore,
        engagementScore: avgScore,
        totalPhases: stats.totalPhases,
        totalMistakes: stats.totalMistakes,
        avgAccuracy: avgScore,
        avgDurationSec: avgDuration,
      };
    });

    // Confidence Trajectory from Course Start to Course End (computed from recorded course confidence ratings)
    const initBuckets = { hc: 0, hi: 0, lc: 0, li: 0 };
    const finalBuckets = { hc: 0, hi: 0, lc: 0, li: 0 };
    filteredCourseProgress.forEach((cp) => {
      const entries = Object.entries(cp.confidenceResults || {});
      if (entries.length === 0) return;
      const pResults = cp.phaseResults || {};
      const classify = (rating: string, phaseId: string, bucket: typeof initBuckets) => {
        const isHigh = rating === 'high' || rating === 'confident';
        const isCorrect = pResults[phaseId] === 'success' || cp.isCompleted === true;
        if (isHigh && isCorrect) bucket.hc++;
        else if (isHigh && !isCorrect) bucket.hi++;
        else if (!isHigh && isCorrect) bucket.lc++;
        else bucket.li++;
      };
      const [firstPhaseId, firstRating] = entries[0];
      classify(firstRating, firstPhaseId, initBuckets);
      const [lastPhaseId, lastRating] = entries[entries.length - 1];
      classify(lastRating, lastPhaseId, finalBuckets);
    });
    const toMatrix = (b: typeof initBuckets) => {
      const total = b.hc + b.hi + b.lc + b.li;
      if (total === 0) {
        return { mastery: 0, overconfidence: 0, hesitant: 0, recognizedGap: 0 };
      }
      return {
        mastery: Math.round((b.hc / total) * 100),
        overconfidence: Math.round((b.hi / total) * 100),
        hesitant: Math.round((b.lc / total) * 100),
        recognizedGap: Math.round((b.li / total) * 100),
      };
    };
    const initialConf = toMatrix(initBuckets);
    const finalConf = toMatrix(finalBuckets);
    const hasConfidenceTrajectory =
      initBuckets.hc + initBuckets.hi + initBuckets.lc + initBuckets.li > 0;
    const confidenceTrajectory = {
      initialPhase: initialConf,
      finalPhase: finalConf,
      masteryGrowthPercent: hasConfidenceTrajectory ? finalConf.mastery - initialConf.mastery : 0,
      overconfidenceDropPercent: hasConfidenceTrajectory
        ? finalConf.overconfidence - initialConf.overconfidence
        : 0,
    };

    // ─── REAL MISTAKE HOTSPOT & PEDAGOGICAL ANALYSIS (WHERE & WHY) ───
    // Build hotspots purely from real courses, real phases, and real events.
    // NEVER invent coding or QuickSort pivot swap bugs for unrelated courses (e.g. Git basics).
    const allMistakesAnalysis: Array<{
      id: string;
      courseId: string;
      courseTitle: string;
      phaseId: string;
      phaseTitle: string;
      sourceView: string;
      difficulty: string;
      mistakeCount: number;
      affectedLearnersPercent: number;
      avgHesitationSec: number;
      confidenceType: 'overconfident' | 'hesitant' | 'blind_guess' | 'misconception';
      title: string;
      description: string;
      sampleExpected?: string;
      sampleActual?: string;
      recommendation: string;
    }> = [];

    coursesToEvaluate.forEach((course) => {
      const courseSlug = course.slug || String(course.id);
      const courseTitle =
        typeof course.title === 'string'
          ? course.title
          : typeof course.title === 'object' && course.title !== null
            ? (course.title as Record<string, string>).hu ||
              (course.title as Record<string, string>).en ||
              courseSlug
            : courseSlug;
      const enrolled = filteredCourseProgress.filter(
        (cp) => cp.courseId === courseSlug || cp.courseId === String(course.id),
      );
      const enrolledCount = enrolled.length;
      const courseTotalMistakes = enrolled.reduce((sum, cp) => sum + (cp.totalMistakes || 0), 0);
      const phases = course.phases || [];

      // Check real events for this course
      const courseEvents = scopedEventsDocs.filter(
        (e) => e.courseId === courseSlug || e.courseId === String(course.id),
      );
      const mistakeEvents = courseEvents.filter(
        (e) =>
          e.eventType === 'mistake' ||
          e.eventType === 'quiz_failed' ||
          (e.eventType === 'answer_submitted' &&
            e.eventData &&
            (e.eventData.correct === false || e.eventData.isCorrect === false)),
      );

      if (mistakeEvents.length > 0) {
        // Process REAL mistake events logged by students
        const groupedEvents: Record<string, typeof mistakeEvents> = {};
        mistakeEvents.forEach((evt) => {
          const key = String(evt.eventData?.phaseId || evt.tab || 'phase-0');
          if (!groupedEvents[key]) groupedEvents[key] = [];
          groupedEvents[key].push(evt);
        });

        Object.entries(groupedEvents).forEach(([pId, evts], gIdx) => {
          const matchingPhase = phases.find((p) => p.phaseId === pId) || phases[gIdx] || phases[0];
          const phaseTitle = matchingPhase
            ? typeof matchingPhase.title === 'string'
              ? matchingPhase.title
              : (matchingPhase.title as Record<string, string>)?.hu ||
                (matchingPhase.title as Record<string, string>)?.en ||
                matchingPhase.phaseId
            : `Fázis #${gIdx + 1}`;
          const sourceView = matchingPhase?.sourceView || 'quiz';
          const measuredEvts = evts.filter((e) => (e.durationMs || 0) > 0);
          const avgDuration =
            measuredEvts.length > 0
              ? measuredEvts.reduce((sum, e) => sum + (e.durationMs || 0), 0) /
                measuredEvts.length /
                1000
              : 0;
          const sampleExpected = evts.find(
            (e) => e.eventData?.expectedAnswer || e.eventData?.correctAnswer,
          )?.eventData as Record<string, unknown> | undefined;
          const sampleActual = evts.find(
            (e) => e.eventData?.selectedAnswer || e.eventData?.userAnswer,
          )?.eventData as Record<string, unknown> | undefined;

          allMistakesAnalysis.push({
            id: `${courseSlug}-evt-${pId}-${gIdx}`,
            courseId: courseSlug,
            courseTitle,
            phaseId: matchingPhase?.phaseId || pId,
            phaseTitle,
            sourceView,
            difficulty: course.difficulty || 'Beginner',
            mistakeCount: evts.length,
            affectedLearnersPercent:
              enrolledCount > 0
                ? Math.min(100, Math.round((evts.length / enrolledCount) * 100))
                : 0,
            avgHesitationSec: Number(avgDuration.toFixed(1)),
            confidenceType:
              avgDuration > 0 && avgDuration < 4
                ? 'blind_guess'
                : avgDuration > 18
                  ? 'hesitant'
                  : 'misconception',
            title: `Tanulói elakadás a(z) "${phaseTitle}" feladatnál`,
            description: `A diákok több alkalommal választottak helytelen megoldást a(z) "${phaseTitle}" feladat végrehajtásakor.`,
            sampleExpected: sampleExpected
              ? String(sampleExpected.expectedAnswer || sampleExpected.correctAnswer)
              : undefined,
            sampleActual: sampleActual
              ? String(sampleActual.selectedAnswer || sampleActual.userAnswer)
              : undefined,
            recommendation:
              sourceView === 'quiz'
                ? 'Érdemes átismételni az elméleti alapokat a csoporttal, vagy kiegészítő magyarázatot fűzni a teszthez.'
                : sourceView === 'match'
                  ? 'Gyakoroltassuk a fogalmak pontos jelentését és definícióit konkrét példákon keresztül.'
                  : sourceView === 'order'
                    ? 'Vezessük végig a tanulókat a lépéssorrend logikai ok-okozati összefüggésein.'
                    : 'Gyakoroltassuk ezt a fázist közösen a következő órán.',
          });
        });
      } else if (courseTotalMistakes > 0 && phases.length > 0) {
        // Students made mistakes according to course-progress, but no specific event logs:
        // Create an honest, phase-accurate hotspot based on the actual course phase (NO FAKE CODE)
        const interactivePhases = phases.filter(
          (p) =>
            p.sourceView &&
            ['quiz', 'match', 'order', 'gap-fill', 'control', 'debug'].includes(p.sourceView),
        );
        const targetPhases = interactivePhases.length > 0 ? interactivePhases : phases;

        targetPhases.slice(0, 2).forEach((targetPhase, pIdx) => {
          const phaseTitle =
            typeof targetPhase.title === 'string'
              ? targetPhase.title
              : (targetPhase.title as Record<string, string>)?.hu ||
                (targetPhase.title as Record<string, string>)?.en ||
                targetPhase.phaseId;
          const sourceView = targetPhase.sourceView || 'quiz';
          const mistakesForPhase = Math.max(
            1,
            Math.round(courseTotalMistakes / targetPhases.length),
          );

          allMistakesAnalysis.push({
            id: `${courseSlug}-phase-${targetPhase.phaseId || pIdx}`,
            courseId: courseSlug,
            courseTitle,
            phaseId: targetPhase.phaseId,
            phaseTitle,
            sourceView,
            difficulty: course.difficulty || 'Beginner',
            mistakeCount: mistakesForPhase,
            affectedLearnersPercent:
              enrolledCount > 0
                ? Math.min(100, Math.round((mistakesForPhase / enrolledCount) * 100))
                : 0,
            avgHesitationSec: 0,
            confidenceType: 'misconception',
            title: `Bizonytalanság a(z) "${phaseTitle}" feladatnál`,
            description:
              sourceView === 'quiz'
                ? `A tanulók helytelen választ adtak meg a(z) "${phaseTitle}" tesztkérdéseire válaszolva.`
                : sourceView === 'match'
                  ? `A fogalmak vagy funkciók összekötésekor bizonytalanodtak el a diákok a(z) "${phaseTitle}" fázisban.`
                  : sourceView === 'order'
                    ? `A munkafolyamat helyes lépéssorrendjének meghatározásakor vétettek hibát a tanulók.`
                    : sourceView === 'gap-fill'
                      ? `A hiányzó szavak vagy kifejezések pontos beillesztése okozott nehézséget a diákoknak.`
                      : `A feladat végrehajtása közben rögzített tanulói elakadás a(z) "${phaseTitle}" lépésnél.`,
            sampleExpected: undefined, // NEVER FABRICATE FAKE CODE
            sampleActual: undefined, // NEVER FABRICATE FAKE CODE
            recommendation:
              sourceView === 'quiz'
                ? 'Érdemes a következő óra elején röviden átismételni a témakör kulcsfogalmait és kérdéseit.'
                : sourceView === 'match'
                  ? 'Hangsúlyozzuk a fogalompárok közötti logikai kapcsolatokat és különbségeket.'
                  : sourceView === 'order'
                    ? 'Vezessük végig a csoportot a folyamat logikai láncolatán lépésről lépésre.'
                    : 'Beszéljük át a feladat elvárásait és nyújtsunk kiegészítő magyarázatot.',
          });
        });
      }
      // If courseTotalMistakes === 0 and no mistake events: DO NOT INVENT ANY MISTAKES!
    });

    // Apply filters to mistakesAnalysis
    let filteredMistakesAnalysis = allMistakesAnalysis;
    if (courseFilter !== 'all') {
      filteredMistakesAnalysis = filteredMistakesAnalysis.filter(
        (m) => m.courseId === courseFilter || m.courseId.includes(courseFilter),
      );
    }
    if (difficultyFilter !== 'all') {
      filteredMistakesAnalysis = filteredMistakesAnalysis.filter(
        (m) => (m.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase(),
      );
    }
    if (phaseTypeFilter !== 'all') {
      filteredMistakesAnalysis = filteredMistakesAnalysis.filter(
        (m) => m.sourceView === phaseTypeFilter,
      );
    }

    // Apply filters to coursesEvaluationList
    let filteredCoursesEvaluationList = coursesEvaluationList;
    if (courseFilter !== 'all') {
      filteredCoursesEvaluationList = filteredCoursesEvaluationList.filter(
        (c) => c.courseId === courseFilter || c.courseId.includes(courseFilter),
      );
    }
    if (difficultyFilter !== 'all') {
      filteredCoursesEvaluationList = filteredCoursesEvaluationList.filter(
        (c) => (c.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase(),
      );
    }

    // ─── ACCURATE, DYNAMIC EXECUTIVE KPIS ───
    let activeLearnersCount = 0;
    let totalRecordedHours = 0;
    let formattedTotalTime = '0 perc';
    let totalCoursesCompleted = 0;
    let totalCompletedCombined = 0;
    let totalMistakesRecorded = 0;
    let avgHesitationSeconds = 0;
    let avgErrorRatePercent = 0;

    if (courseFilter !== 'all') {
      const activeCourseData = coursesEvaluationList.find(
        (c) => c.courseId === courseFilter || c.courseId.includes(courseFilter),
      );
      if (activeCourseData) {
        activeLearnersCount = activeCourseData.enrolledCount;
        const cProgress = filteredCourseProgress.filter(
          (cp) => cp.courseId === activeCourseData.courseId || cp.courseId === courseFilter,
        );
        const cTimeMs = cProgress.reduce((s, cp) => s + (cp.totalTimeMs || 0), 0);
        const cMinutes = Math.round(cTimeMs / 60000);
        totalRecordedHours = Number((cTimeMs / (1000 * 60 * 60)).toFixed(1));
        formattedTotalTime = cMinutes < 60 ? `${cMinutes} perc` : `${totalRecordedHours} óra`;
        totalCoursesCompleted = activeCourseData.completedCount;
        totalCompletedCombined = activeCourseData.completedCount;
        totalMistakesRecorded = activeCourseData.totalMistakes;
        const totalSteps =
          activeCourseData.enrolledCount * (activeCourseData.dropoffFunnel.length || 1);
        avgErrorRatePercent =
          totalSteps > 0
            ? Math.min(
                100,
                Math.round(
                  (activeCourseData.totalMistakes / (activeCourseData.totalMistakes + totalSteps)) *
                    100,
                ),
              )
            : 0;
        avgHesitationSeconds = Number(
          (
            (activeCourseData.actualAvgMinutes * 60) /
            Math.max(1, (activeCourseData.dropoffFunnel.length || 1) * 3)
          ).toFixed(1),
        );
      }
    } else {
      activeLearnersCount = new Set(
        filteredCourseProgress.map((cp) =>
          typeof cp.user === 'object' && cp.user !== null ? cp.user.id : cp.user,
        ),
      ).size;
      const allCoursesTimeMs = filteredCourseProgress.reduce(
        (s, cp) => s + (cp.totalTimeMs || 0),
        0,
      );
      const allMinutes = Math.round(allCoursesTimeMs / 60000);
      totalRecordedHours = Number((allCoursesTimeMs / (1000 * 60 * 60)).toFixed(1));
      formattedTotalTime = allMinutes < 60 ? `${allMinutes} perc` : `${totalRecordedHours} óra`;
      totalCoursesCompleted = filteredCourseProgress.filter((cp) => cp.isCompleted === true).length;
      totalCompletedCombined = totalCoursesCompleted;
      totalMistakesRecorded = filteredCourseProgress.reduce(
        (s, cp) => s + (cp.totalMistakes || 0),
        0,
      );
      const totalPhasesAttempted = coursesEvaluationList.reduce(
        (s, c) => s + c.enrolledCount * (c.dropoffFunnel?.length || 1),
        0,
      );
      avgErrorRatePercent =
        totalPhasesAttempted > 0
          ? Math.min(
              100,
              Math.round(
                (totalMistakesRecorded / (totalMistakesRecorded + totalPhasesAttempted)) * 100,
              ),
            )
          : 0;
      avgHesitationSeconds = Number((avgNormalDurationMs / 1000).toFixed(1));
    }

    const allStudentsRoster = coursesEvaluationList.flatMap((c) =>
      (c.studentsRoster || []).map((s) => ({
        ...s,
        courseTitle: c.title,
        courseId: c.courseId,
      })),
    );

    // Timeline Trends (Daily Aggregation from actual recorded learning events)
    const daysCount = timeRangeFilter === '7d' ? 7 : timeRangeFilter === '30d' ? 14 : 30;
    const dayNamesHU = ['Vas', 'Hét', 'Kedd', 'Sze', 'Csüt', 'Pén', 'Szo'];

    const eventsByDate: Record<
      string,
      { users: Set<string>; totalSteps: number; mistakeEvents: number; outcomeEvents: number }
    > = {};
    for (const evt of scopedEventsDocs) {
      if (!evt.createdAt) continue;
      const dateStr = new Date(evt.createdAt).toISOString().split('T')[0];
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = {
          users: new Set<string>(),
          totalSteps: 0,
          mistakeEvents: 0,
          outcomeEvents: 0,
        };
      }
      const bucket = eventsByDate[dateStr];
      const uId = String(
        typeof evt.user === 'object' && evt.user !== null ? evt.user.id : evt.user,
      );
      if (uId) bucket.users.add(uId);
      bucket.totalSteps++;

      const isErr =
        evt.eventType === 'control_mistake' ||
        evt.eventType === 'control_selection_mistake' ||
        evt.eventType === 'mistake' ||
        evt.eventType === 'quiz_failed' ||
        (evt.eventType === 'control_decision' && evt.eventData?.isCorrect === false) ||
        (evt.eventType === 'create_blank_attempt' && evt.eventData?.correct === false) ||
        (evt.eventType === 'answer_submitted' &&
          (evt.eventData?.correct === false || evt.eventData?.isCorrect === false));

      const isSuccessOutcome =
        (evt.eventType === 'control_decision' && evt.eventData?.isCorrect === true) ||
        (evt.eventType === 'create_blank_attempt' && evt.eventData?.correct === true) ||
        (evt.eventType === 'answer_submitted' &&
          (evt.eventData?.correct === true || evt.eventData?.isCorrect === true)) ||
        evt.eventType === 'alive_code_success';

      if (isErr) {
        bucket.mistakeEvents++;
        bucket.outcomeEvents++;
      } else if (isSuccessOutcome) {
        bucket.outcomeEvents++;
      }
    }

    const timelineTrends = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${dayNamesHU[d.getDay()]} (${d.getMonth() + 1}.${d.getDate()})`;
      const dayBucket = eventsByDate[dateStr];

      if (!dayBucket) {
        timelineTrends.push({
          date: dateStr,
          label: dayLabel,
          activeUsers: 0,
          completedSteps: 0,
          errorRate: 0,
          avgScore: 0,
        });
        continue;
      }

      const errorRate =
        dayBucket.outcomeEvents > 0
          ? Math.round((dayBucket.mistakeEvents / dayBucket.outcomeEvents) * 100)
          : 0;
      const avgScore = dayBucket.outcomeEvents > 0 ? Math.max(0, 100 - errorRate) : 0;

      timelineTrends.push({
        date: dateStr,
        label: dayLabel,
        activeUsers: dayBucket.users.size,
        completedSteps: dayBucket.totalSteps,
        errorRate,
        avgScore,
      });
    }

    // 6-Axis Pedagogical Competency Radar (Spider Matrix — purely data-driven, 0 when empty)
    const videoAnimationRate =
      scopedProgressDocs.length > 0
        ? Math.round(
            (scopedProgressDocs.filter((p) => p.videoWatched || p.animationCompleted).length /
              scopedProgressDocs.length) *
              100,
          )
        : 0;
    const totalControlDecisions = Object.values(algorithmStatsMap).reduce(
      (sum, a) => sum + a.decisionsCorrect + a.decisionsWrong,
      0,
    );
    const totalControlCorrect = Object.values(algorithmStatsMap).reduce(
      (sum, a) => sum + a.decisionsCorrect,
      0,
    );
    const invariantScore =
      totalControlDecisions > 0
        ? Math.round((totalControlCorrect / totalControlDecisions) * 100)
        : 0;
    const createActiveDocs = scopedProgressDocs.filter(
      (p) => (p.createAttempts || 0) > 0 || p.createCompleted || (p.aliveCodeSubmissions || 0) > 0,
    );
    const createScore =
      createActiveDocs.length > 0
        ? Math.round(
            (createActiveDocs.filter((p) => p.createCompleted || p.aliveCompleted).length /
              createActiveDocs.length) *
              100,
          )
        : 0;
    const reflectionScore =
      normalActionDurations.length > 0 && postErrorDurationsStep1.length > 0
        ? Math.min(100, Math.max(0, 50 + Math.round(pesSlowdownPercentage)))
        : 0;

    const competencyRadar = [
      {
        subject: 'Vizuális Felismerés',
        studentScore: videoAnimationRate,
        benchmarkScore: 80,
        fullMark: 100,
        description: 'Táncos mozdulatok, tömbelemek és struktúrák vizuális megértése',
      },
      {
        subject: 'Invariáns-követés',
        studentScore: invariantScore,
        benchmarkScore: 75,
        fullMark: 100,
        description: 'Rendezett résztömbök és ciklus-invariánsok tudatos követése',
      },
      {
        subject: 'Hiba-rekonstrukció',
        studentScore: retryAttempt1Total > 0 ? retrySuccessRate : 0,
        benchmarkScore: 70,
        fullMark: 100,
        description: 'Hibás kód- és logikai lépések önálló felismerése és korrekciója',
      },
      {
        subject: 'Kódkiegészítés (Create)',
        studentScore: createScore,
        benchmarkScore: 75,
        fullMark: 100,
        description: 'Szintaxis, ciklusfejek és hiányzó feltételek pontos kitöltése',
      },
      {
        subject: 'Magabiztosság (CBL)',
        studentScore: totalConfRatings > 0 ? confidenceMatrix.mastery : 0,
        benchmarkScore: 75,
        fullMark: 100,
        description: 'Reális önértékelés (Mester zóna, tévképzetek kiküszöbölése)',
      },
      {
        subject: 'Kognitív Reflexió',
        studentScore: reflectionScore,
        benchmarkScore: 80,
        fullMark: 100,
        description: 'Hiba utáni tudatos lelassulás és megfontolt döntéshozatal',
      },
    ];

    // Weekly Hourly Activity Heatmap (aggregated from real event timestamps)
    const heatmapDays = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const heatmapTimeSlots = [
      { id: 'morning', label: 'Délelőtt (08:00 - 12:00)' },
      { id: 'afternoon', label: 'Délután (12:00 - 16:00)' },
      { id: 'evening', label: 'Kora Este (16:00 - 20:00)' },
      { id: 'night', label: 'Késő Este (20:00 - 24:00)' },
    ];

    const heatmapBuckets: Array<Record<string, Set<string>>> = heatmapDays.map(() => ({
      morning: new Set<string>(),
      afternoon: new Set<string>(),
      evening: new Set<string>(),
      night: new Set<string>(),
    }));

    for (const evt of scopedEventsDocs) {
      if (!evt.createdAt) continue;
      const dt = new Date(evt.createdAt);
      if (Number.isNaN(dt.getTime())) continue;
      const dayIdx = (dt.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
      const hour = dt.getHours();
      const slotId =
        hour >= 8 && hour < 12
          ? 'morning'
          : hour >= 12 && hour < 16
            ? 'afternoon'
            : hour >= 16 && hour < 20
              ? 'evening'
              : 'night';
      const uId = String(
        typeof evt.user === 'object' && evt.user !== null ? evt.user.id : evt.user,
      );
      const sessionKey = `${uId}:${evt.sessionId || evt.id}`;
      heatmapBuckets[dayIdx][slotId].add(sessionKey);
    }

    let maxHeatmapSessions = 0;
    heatmapBuckets.forEach((dayBucket) => {
      heatmapTimeSlots.forEach((slot) => {
        if (dayBucket[slot.id].size > maxHeatmapSessions) {
          maxHeatmapSessions = dayBucket[slot.id].size;
        }
      });
    });

    const hourlyHeatmap = heatmapDays.map((day, dIdx) => ({
      day,
      slots: heatmapTimeSlots.map((slot) => {
        const sessionCount = heatmapBuckets[dIdx][slot.id].size;
        const intensity =
          maxHeatmapSessions > 0 ? Math.round((sessionCount / maxHeatmapSessions) * 100) : 0;
        return {
          slotId: slot.id,
          slotLabel: slot.label,
          intensity,
          sessionCount,
        };
      }),
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange: timeRangeFilter,
      algorithm: algorithmFilter,
      courseId: courseFilter,
      difficulty: difficultyFilter,
      phaseType: phaseTypeFilter,
      timelineTrends,
      competencyRadar,
      hourlyHeatmap,
      kpis: {
        activeLearnersCount,
        platformLearnersCount: new Set([
          ...filteredCourseProgress.map((cp) =>
            String(typeof cp.user === 'object' && cp.user !== null ? cp.user.id : cp.user),
          ),
          ...scopedProgressDocs.map((p) =>
            String(typeof p.user === 'object' && p.user !== null ? p.user.id : p.user),
          ),
        ]).size,
        algorithmLearnersCount: new Set(
          scopedProgressDocs.map((p) =>
            String(typeof p.user === 'object' && p.user !== null ? p.user.id : p.user),
          ),
        ).size,
        totalRecordedHours,
        formattedTotalTime,
        totalAlgorithmsCompleted,
        totalCoursesCompleted,
        totalCompletedCombined,
        avgHesitationSeconds,
        avgErrorRatePercent,
        totalMistakesRecorded,
      },
      mistakesAnalysis: filteredMistakesAnalysis,
      pedagogy: {
        pesSlowdownPercentage,
        avgNormalDurationMs,
        avgPostErrorDurationMs,
        retrySuccessRate,
        videoErrorReductionPercent,
        avgMistakesWithVideo,
        avgMistakesWithoutVideo,
        confidenceMatrix,
      },
      research: {
        helpSeekingTransfer,
        misconceptions: misconceptionsList,
        processMining,
        visualBlocksThreshold,
        cognitiveLoadDynamics,
      },
      coursesEvaluation: {
        coursesList: filteredCoursesEvaluationList,
        allCoursesList: coursesEvaluationList,
        phaseTypeEffectiveness,
        confidenceTrajectory,
        allStudentsRoster,
      },
      algorithmHesitationList,
      topBottlenecks: formattedBottlenecks,
      searchAnalytics: {
        topSearches,
        zeroResultSearches,
      },
      coursesSummary: {
        totalCourses: coursesDocs.length,
        totalEnrolled: filteredCourseProgress.length,
      },
      scope: {
        role: currentUserRole,
        isTeacher: currentUserRole === ROLES.EDITOR,
        isAdmin: currentUserRole === ROLES.ADMIN,
        activeInstructorFilter,
        instructorsList: currentUserRole === ROLES.ADMIN ? instructorsList : undefined,
      },
    });
  } catch (error) {
    console.error('[AdminStatistics] Aggregation error:', error);
    return NextResponse.json({ error: 'Failed to aggregate statistics' }, { status: 500 });
  }
}
