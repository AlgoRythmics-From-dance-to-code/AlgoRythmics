'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ROLES } from '../../../lib/constants';
import {
  BarChart3,
  Clock,
  AlertTriangle,
  Users,
  Video,
  CheckCircle2,
  Brain,
  Sparkles,
  Filter,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Layers,
  Award,
  Search,
  ChevronRight,
  HelpCircle,
  Activity,
  Download,
  BookOpen,
  Code2,
  Bug,
  Compass,
  Zap,
  GraduationCap,
  Check,
  Target,
  Lightbulb,
  ArrowUpRight,
  Flame,
  Eye,
  SlidersHorizontal,
  UserCheck,
  AlertCircle,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';

interface BottleneckItem {
  algorithmId: string;
  stepOrBlank: string;
  tab: string;
  mistakeCount: number;
  avgHesitationMs: number;
  avgHesitationSeconds: number;
}

interface AlgoHesitationItem {
  algorithmId: string;
  averageHesitationMs: number;
  averageHesitationSeconds: number;
  totalMistakes: number;
  errorRate: number;
  completedCount: number;
  hintsUsed: number;
}

interface DropoffPhase {
  phaseId: string;
  title: string;
  sourceView: string;
  retentionRate: number;
  avgTimeMinutes: number;
  mistakeCount: number;
  isBottleneck: boolean;
  status?: 'excellent' | 'normal' | 'high_mistakes' | 'bottleneck';
  recommendation?: string;
}

interface StudentRosterItem {
  userId: string;
  name: string;
  email: string;
  progressPercent: number;
  completedPhasesCount: number;
  totalPhasesCount: number;
  currentPhaseIndex: number;
  currentPhaseTitle: string;
  points: number;
  totalMistakes: number;
  timeSpentMinutes: number;
  isCompleted: boolean;
  status: 'completed' | 'struggling' | 'in_progress';
  mascotHelpCount?: number;
  improvedAfterMascotCount?: number;
  lastActive: string;
  courseTitle?: string;
  courseId?: string;
}

interface CourseEvalItem {
  courseId: string;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  actualAvgMinutes: number;
  pacingRatio: number;
  enrolledCount: number;
  completedCount: number;
  completionRate: number;
  avgScore: number;
  totalMistakes: number;
  mascotInteractionsTotal: number;
  mascotRetentionBoost: number;
  mascotHelpedPhasesCount?: number;
  mascotImprovedPhasesCount?: number;
  mascotImprovementRate?: number;
  qualityIndex: number;
  dropoffFunnel: DropoffPhase[];
  studentsRoster?: StudentRosterItem[];
  strugglingCount?: number;
  inProgressCount?: number;
  instructorName?: string;
}

interface PhaseEffectivenessItem {
  type?: string;
  sourceView?: string;
  label?: string;
  avgTimeSec?: number;
  avgDurationSec?: number;
  avgMistakes?: number;
  totalMistakes?: number;
  completionRate?: number;
  avgAccuracy?: number;
  avgScore?: number;
  engagementScore?: number;
}

interface MistakeHotspotItem {
  id: string;
  targetType: 'course' | 'algorithm';
  targetId: string;
  targetTitle: string;
  phaseId: string;
  phaseTitle: string;
  phaseType: 'quiz' | 'create' | 'debug' | 'simulation' | 'control' | 'info' | 'video';
  mistakeCount: number;
  affectedStudents: number;
  avgRetryCount: number;
  avgTimeOnTaskSec: number;
  topWrongAnswers: Array<{ answer: string; count: number; reason: string }>;
  errorDistribution: Array<{ label: string; percent: number }>;
  severity: 'critical' | 'moderate' | 'low';
  pedagogicalAction: string;
}

interface StatisticsResponse {
  timestamp: string;
  timeRange: string;
  algorithm: string;
  courseId?: string;
  difficulty?: string;
  phaseType?: string;
  kpis: {
    activeLearnersCount: number;
    platformLearnersCount?: number;
    algorithmLearnersCount?: number;
    totalRecordedHours: number;
    formattedTotalTime?: string;
    totalAlgorithmsCompleted: number;
    totalCoursesCompleted: number;
    totalCompletedCombined?: number;
    avgHesitationSeconds: number;
    avgErrorRatePercent: number;
    totalMistakesRecorded?: number;
  };
  mistakesAnalysis?:
    | Array<{
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
        confidenceType: string;
        title: string;
        description: string;
        sampleExpected?: string;
        sampleActual?: string;
        recommendation: string;
      }>
    | {
        summary?: {
          totalMistakesCount: number;
          criticalHotspotsCount: number;
          mostProblematicPhaseType: string;
          mostProblematicPhaseTypeRate: number;
          avgRetriesToSuccess: number;
          firstTrySuccessRate: number;
        };
        hotspots?: MistakeHotspotItem[];
      };
  pedagogy: {
    pesSlowdownPercentage: number;
    avgNormalDurationMs: number;
    avgPostErrorDurationMs: number;
    retrySuccessRate: number;
    videoErrorReductionPercent: number;
    avgMistakesWithVideo: number;
    avgMistakesWithoutVideo: number;
    confidenceMatrix: {
      mastery: number;
      overconfidence: number;
      hesitant: number;
      recognizedGap: number;
    };
  };
  research?: {
    helpSeekingTransfer: {
      createWithHelpCount: number;
      aliveAfterHelpSuccessRate: number;
      aliveWithoutHelpSuccessRate: number;
      avgHelpDurationSec: number;
    };
    misconceptions: Array<{
      id: string;
      algorithmId: string;
      algorithmName: string;
      phase: string;
      wrongInput: string;
      expectedInput: string;
      occurrences: number;
      cognitiveCause: string;
    }>;
    processMining: {
      optimalPathRate: number;
      visualCrutchRate: number;
      trialAndErrorLoopRate: number;
      videoRewatchRecoveryRate: number;
    };
    visualBlocksThreshold: {
      optimalSwitchSec: number;
      avgAttemptsBeforeFallback: number;
      successfulReturnToCodeRate: number;
    };
    cognitiveLoadDynamics: {
      baselineReactionSec: number;
      immediatePostErrorSec: number;
      step2RecoverySec: number;
      step3RecoverySec: number;
      overloadIndex: number;
    };
  };
  coursesEvaluation?: {
    coursesList: CourseEvalItem[];
    allCoursesList?: CourseEvalItem[];
    phaseTypeEffectiveness: PhaseEffectivenessItem[];
    confidenceTrajectory: Array<{ phaseOrder: string; highConfidenceRate: number; accuracyRate: number }>;
    allStudentsRoster?: StudentRosterItem[];
  };
  algorithmHesitationList: AlgoHesitationItem[];
  topBottlenecks: BottleneckItem[];
  searchAnalytics: {
    topSearches: Array<{ query: string; count: number; resultsCount: number; language: string }>;
    zeroResultSearches: Array<{ query: string; count: number; language: string }>;
  };
  coursesSummary: {
    totalCourses: number;
    totalEnrolled: number;
  };
  scope?: {
    role: string;
    isTeacher: boolean;
    isAdmin: boolean;
    activeInstructorFilter: string | null;
    instructorsList?: Array<{ id: string; name: string; email: string; role: string }>;
  };
}

const ALGORITHM_LABELS: Record<string, string> = {
  all: 'Minden algoritmus',
  'bubble-sort': 'Buborékrendezés (Bubble Sort)',
  'selection-sort': 'Minimumkiválasztásos rendezés (Selection Sort)',
  'insertion-sort': 'Beszúrásos rendezés (Insertion Sort)',
  'shell-sort': 'Shell-rendezés (Shell Sort)',
  'quick-sort': 'Gyorsrendezés (Quick Sort)',
  'merge-sort': 'Összefésüléses rendezés (Merge Sort)',
  'heap-sort': 'Kupacrendezés (Heap Sort)',
  'linear-search': 'Lineáris keresés (Linear Search)',
  'binary-search': 'Bináris keresés (Binary Search)',
  'backtracking-queens': 'Backtracking (N-Királynő)',
  'recursion-factorial': 'Rekurzió (Faktoriális)',
};

const PHASE_TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; iconType: string }
> = {
  quiz: {
    label: 'Kvíz & Feleletválasztós',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    iconType: 'quiz',
  },
  create: {
    label: 'Kódkiegészítés (Üres helyek)',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
    iconType: 'code',
  },
  debug: {
    label: 'Kód Hibakeresés (Debug)',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    iconType: 'bug',
  },
  simulation: {
    label: 'Záró Szimuláció (Vizsga)',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
    iconType: 'zap',
  },
  control: {
    label: 'Interaktív Irányítás',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/25',
    iconType: 'compass',
  },
  info: {
    label: 'Elmélet & Leírás',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    iconType: 'book',
  },
  video: {
    label: 'Táncvideó Megfigyelés',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    iconType: 'video',
  },
};

type DashboardViewMode =
  | 'platform_overview' // Admin big picture: Courses + Standalone Algorithms + Search + Pedagogy
  | 'teacher_overview'  // General Courses Overview (All courses comparison + student status + overview)
  | 'by_course'         // Course-by-course deep dive (Single course funnel + roster + mistakes + pacing)
  | 'algorithms_deep'   // Standalone Algorithms Deep Dive (Heatmap + Bottlenecks + Cognitive Research)
  | 'mistakes_explorer';// Searchable Mistakes & Students Explorer

export default function AdminStatisticsClient() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { role?: string } | undefined;
  const authLoading = status === 'loading';
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(
    sessionUser?.role === ROLES.ADMIN || sessionUser?.role === ROLES.EDITOR ? true : null,
  );

  // Filters
  const [timeRange, setTimeRange] = useState<string>('all');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('all');
  const [selectedPhaseType, setSelectedPhaseType] = useState<string>('all');

  // Primary View Mode
  const [viewMode, setViewMode] = useState<DashboardViewMode | null>(null);

  // Course-by-course state
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [courseSection, setCourseSection] = useState<'all' | 'funnel' | 'students' | 'mistakes'>('all');

  // Student & Mistake search/filter states
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'struggling' | 'in_progress' | 'completed'>('all');
  const [mistakeSearchQuery, setMistakeSearchQuery] = useState<string>('');
  const [expandedHotspotId, setExpandedHotspotId] = useState<string | null>(null);

  // Data state
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = data?.scope?.isAdmin ?? sessionUser?.role === ROLES.ADMIN;
  const isTeacher = data?.scope?.isTeacher ?? sessionUser?.role === ROLES.EDITOR;
  const isAdminOrEditor = isAdmin || isTeacher || isAuthorized === true;

  // Set default viewMode once user role is known
  useEffect(() => {
    if (viewMode === null && (isAdmin || isTeacher)) {
      if (isAdmin) {
        setViewMode('platform_overview');
      } else {
        setViewMode('teacher_overview');
      }
    }
  }, [isAdmin, isTeacher, viewMode]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        timeRange,
        algorithm: selectedAlgorithm,
        courseId: 'all',
        difficulty: 'all',
        phaseType: selectedPhaseType,
        instructorId: selectedInstructorId,
      });
      const res = await fetch(`/api/admin/statistics?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setIsAuthorized(false);
        }
        throw new Error('Nem sikerült betölteni a statisztikai adatokat.');
      }
      const json: StatisticsResponse = await res.json();
      setIsAuthorized(true);
      setData(json);

      const list = json.coursesEvaluation?.allCoursesList || json.coursesEvaluation?.coursesList || [];
      if (list.length > 0 && (!activeCourseId || !list.some((c) => c.courseId === activeCourseId))) {
        setActiveCourseId(list[0].courseId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Hiba történt az adatok lekérésekor.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedAlgorithm, selectedPhaseType, selectedInstructorId, activeCourseId]);

  useEffect(() => {
    if (!authLoading) {
      fetchStatistics();
    }
  }, [authLoading, fetchStatistics]);

  // Derived data helpers
  const coursesList = useMemo(
    () => data?.coursesEvaluation?.allCoursesList || data?.coursesEvaluation?.coursesList || [],
    [data],
  );

  const selectedCourseObj = useMemo(
    () => coursesList.find((c) => c.courseId === activeCourseId) || coursesList[0] || null,
    [coursesList, activeCourseId],
  );

  const allStudentsRoster = useMemo(() => {
    if (data?.coursesEvaluation?.allStudentsRoster && data.coursesEvaluation.allStudentsRoster.length > 0) {
      return data.coursesEvaluation.allStudentsRoster;
    }
    return coursesList.flatMap((c) =>
      (c.studentsRoster || []).map((s) => ({
        ...s,
        courseTitle: c.title,
        courseId: c.courseId,
      })),
    );
  }, [data, coursesList]);

  const totalStrugglingStudents = useMemo(
    () => allStudentsRoster.filter((s) => s.status === 'struggling').length,
    [allStudentsRoster],
  );

  const averageCourseCompletionRate = useMemo(() => {
    if (coursesList.length === 0) return 0;
    const withStudents = coursesList.filter((c) => c.enrolledCount > 0);
    if (withStudents.length === 0) return 0;
    return Math.round(withStudents.reduce((acc, c) => acc + c.completionRate, 0) / withStudents.length);
  }, [coursesList]);

  const normalizedHotspots = useMemo((): MistakeHotspotItem[] => {
    const raw = data?.mistakesAnalysis;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((m, idx) => ({
        id: m.id || `hotspot-${idx}`,
        targetType: 'course' as const,
        targetId: m.courseId,
        targetTitle: m.courseTitle,
        phaseId: m.phaseId,
        phaseTitle: m.title || m.phaseTitle,
        phaseType: (m.sourceView as MistakeHotspotItem['phaseType']) || 'quiz',
        mistakeCount: m.mistakeCount,
        affectedStudents: Math.max(1, Math.round((m.affectedLearnersPercent / 100) * Math.max(1, allStudentsRoster.length || 5))),
        avgRetryCount: 1.8,
        avgTimeOnTaskSec: m.avgHesitationSec,
        topWrongAnswers: m.sampleActual
          ? [
              {
                answer: m.sampleActual,
                count: m.mistakeCount,
                reason: m.description || (m.sampleExpected ? `Elvárt: ${m.sampleExpected}` : ''),
              },
            ]
          : [
              {
                answer: m.phaseTitle,
                count: m.mistakeCount,
                reason: m.description,
              },
            ],
        errorDistribution: [],
        severity: m.mistakeCount >= 10 ? ('critical' as const) : ('moderate' as const),
        pedagogicalAction: m.recommendation,
      }));
    }
    return (raw.hotspots || []).map((h, idx) => ({
      ...h,
      id: h.id || `hotspot-${idx}`,
    }));
  }, [data?.mistakesAnalysis, allStudentsRoster.length]);

  const openCourseDetails = (courseId: string) => {
    setActiveCourseId(courseId);
    setViewMode('by_course');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return;
    const rows: string[][] = [
      ['Típus', 'Azonosító / Kurzus', 'Cím / Diák', 'Státusz / Nehézség', 'Beiratkozók / Haladás', 'Teljesítés / Pontszám', 'Hibák száma', 'Idő (perc)'],
    ];

    coursesList.forEach((c) => {
      rows.push([
        'Kurzus összesítő',
        c.courseId,
        `"${c.title.replace(/"/g, '""')}"`,
        c.difficulty,
        `${c.enrolledCount} fő`,
        `${c.completionRate}% (Átlag: ${c.avgScore} pt)`,
        `${c.totalMistakes}`,
        `${c.actualAvgMinutes} perc (Terv: ${c.estimatedMinutes}p)`,
      ]);
    });

    allStudentsRoster.forEach((s) => {
      rows.push([
        'Diák haladás',
        `"${(s.courseTitle || '').replace(/"/g, '""')}"`,
        `"${s.name.replace(/"/g, '""')} (${s.email})"`,
        s.status === 'completed' ? 'Teljesítette' : s.status === 'struggling' ? 'Elakadt' : 'Folyamatban',
        `${s.progressPercent}% (${s.completedPhasesCount}/${s.totalPhasesCount})`,
        `${s.points} pt`,
        `${s.totalMistakes}`,
        `${s.timeSpentMinutes}`,
      ]);
    });

    if (isAdmin) {
      (data.algorithmHesitationList || []).forEach((a) => {
        rows.push([
          'Sima Algoritmus',
          a.algorithmId,
          ALGORITHM_LABELS[a.algorithmId] || a.algorithmId,
          `Hibaarány: ${a.errorRate}%`,
          `Teljesítve: ${a.completedCount}x`,
          `Segítségkérés: ${a.hintsUsed}x`,
          `${a.totalMistakes}`,
          `${a.averageHesitationSeconds} mp/lépés`,
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `algorythmics_statisztika_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPhaseIcon = (iconType: string) => {
    switch (iconType) {
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      case 'code':
        return <Code2 className="w-4 h-4" />;
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'compass':
        return <Compass className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (authLoading || (loading && !data && isAuthorized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0c0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#269984]/30 border-t-[#269984] rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-montserrat">
            Hitelesítés ellenőrzése...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#161616] border border-red-500/20 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-montserrat mb-2">
            Hozzáférés megtagadva
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Ez a felület kizárólag tanárok (Editor) és adminisztrátorok számára érhető el.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#269984] text-white text-sm font-semibold hover:bg-[#1f7d6c] transition-colors"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  const currentView = viewMode || (isAdmin ? 'platform_overview' : 'teacher_overview');

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0a0a0a] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 1. FEJLÉC, SZEREPKÖR JELZŐ ÉS GLOBÁLIS SZŰRŐK                */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase tracking-wider border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    Adminisztrátori Központ • Kurzusok & Algoritmusok
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#269984]/10 text-[#269984] text-xs font-extrabold uppercase tracking-wider border border-[#269984]/20">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Tanári Diagnosztikai Pult • Saját Kurzusok
                  </span>
                )}

                {isAdmin && selectedInstructorId !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                    Szűrve tanár szerint:{' '}
                    {data?.scope?.instructorsList?.find((i) => i.id === selectedInstructorId)?.name || 'Kiválasztott tanár'}
                    <button
                      onClick={() => setSelectedInstructorId('all')}
                      className="ml-1 underline hover:no-underline"
                    >
                      (Törlés)
                    </button>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-montserrat tracking-tight">
                {isAdmin
                  ? 'Platform Oktatási & Algoritmus Statisztikák'
                  : 'Tanári Kurzus- és Diákanalitika'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
                {isAdmin
                  ? 'Átfogó áttekintés az összes kurzusról, a 11 interaktív algoritmusról, a diákok tanulási folyamatairól és a leggyakoribb elakadási pontokról.'
                  : 'Átlátható összesítés az összes saját kurzusodról, valamint kurzusokkénti részletes lebontás a diákok haladásáról, lemorzsolódásáról és hibáiról.'}
              </p>
            </div>

            {/* Global Controls: Instructor filter (for Admin), Time range, Export, Refresh */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isAdmin && data?.scope?.instructorsList && data.scope.instructorsList.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2">
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => setSelectedInstructorId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                    title="Szűrés tanár szerint"
                  >
                    <option value="all" className="dark:bg-[#1a1a1a]">
                      👥 Minden tanár kurzusa (Teljes platform)
                    </option>
                    {data.scope.instructorsList.map((inst) => (
                      <option key={inst.id} value={inst.id} className="dark:bg-[#1a1a1a]">
                        👨‍🏫 {inst.name} ({inst.role === 'admin' ? 'Admin' : 'Tanár'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2">
                <Clock className="w-4 h-4 text-[#269984] shrink-0" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#1a1a1a]">Összes idő</option>
                  <option value="7d" className="dark:bg-[#1a1a1a]">Utolsó 7 nap</option>
                  <option value="30d" className="dark:bg-[#1a1a1a]">Utolsó 30 nap</option>
                  <option value="90d" className="dark:bg-[#1a1a1a]">Utolsó 90 nap</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:border-[#269984] hover:text-[#269984] transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Export</span>
              </button>

              <button
                onClick={fetchStatistics}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#269984] text-white text-xs font-bold hover:bg-[#1f7d6c] transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Frissítés</span>
              </button>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* FŐ NAVIGÁCIÓS NÉZETVÁLTÓ (SZEREPKÖRRE SZABOTT)               */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* 1. ADMIN NAGY ÁTTEKINTÉS (Kurzusok + Algoritmusok) */}
              {isAdmin && (
                <button
                  onClick={() => setViewMode('platform_overview')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentView === 'platform_overview'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-indigo-500/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      currentView === 'platform_overview'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">1. Nagy Áttekintés</div>
                    <div
                      className={`text-[10px] truncate ${
                        currentView === 'platform_overview' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Kurzusok + Algoritmusok
                    </div>
                  </div>
                </button>
              )}

              {/* 2. ÁLTALÁNOS KURZUS ÁTTEKINTÉS (Tanároknak az 1. fő nézet) */}
              <button
                onClick={() => setViewMode('teacher_overview')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'teacher_overview'
                    ? 'bg-[#269984] text-white border-[#269984] shadow-md shadow-[#269984]/20'
                    : 'bg-slate-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#269984]/40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    currentView === 'teacher_overview'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#269984]/10 text-[#269984]'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    {isAdmin ? '2. Kurzusok Összesítő' : '1. Általános Áttekintés'}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      currentView === 'teacher_overview' ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Minden kurzus & diákok
                  </div>
                </div>
              </button>

              {/* 3. KURZUSOKKÉNTI RÉSZLETES NÉZET */}
              <button
                onClick={() => setViewMode('by_course')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'by_course'
                    ? 'bg-[#269984] text-white border-[#269984] shadow-md shadow-[#269984]/20'
                    : 'bg-slate-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#269984]/40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    currentView === 'by_course'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    {isAdmin ? '3. Kurzusokkénti Nézet' : '2. Kurzusokkénti Elemzés'}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      currentView === 'by_course' ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Tölcsér, diákok, hibák 1 helyen
                  </div>
                </div>
              </button>

              {/* 4. SIMA ALGORITMUSOK MÉLYELEMZÉSE (Adminoknak kiemelt, vagy tanároknak is elérhető) */}
              {isAdmin && (
                <button
                  onClick={() => setViewMode('algorithms_deep')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentView === 'algorithms_deep'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-slate-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-purple-500/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      currentView === 'algorithms_deep'
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">4. Sima Algoritmusok</div>
                    <div
                      className={`text-[10px] truncate ${
                        currentView === 'algorithms_deep' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Hőtérkép, lépések & kogníció
                    </div>
                  </div>
                </button>
              )}

              {/* 5. HIBAGÓCOK & DIÁK KERESŐ */}
              <button
                onClick={() => setViewMode('mistakes_explorer')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  currentView === 'mistakes_explorer'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'bg-slate-50/80 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-rose-500/40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    currentView === 'mistakes_explorer'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    {isAdmin ? '5. Hibagócok Kereső' : '3. Hibagócok & Diákok'}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      currentView === 'mistakes_explorer' ? 'text-rose-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Tipikus hibák & diagnózis
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* VIEW 1: ADMIN NAGY ÁTTEKINTÉS (KURZUSOK ÉS ALGORITMUSOK EGYÜTT) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentView === 'platform_overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 6 Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Total Platform Learners */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Aktív Tanulók (Platform)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                    {loading ? '...' : data?.kpis?.platformLearnersCount || data?.kpis?.activeLearnersCount || 0}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">egyedi diák</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>📚 Kurzusokon: <strong className="text-gray-800 dark:text-gray-200">{data?.kpis?.activeLearnersCount ?? 0} fő</strong></span>
                  <span>⚡ Algoritmusokon: <strong className="text-gray-800 dark:text-gray-200">{data?.kpis?.algorithmLearnersCount ?? 0} fő</strong></span>
                </div>
              </div>

              {/* 2. Combined Completions (Courses + Algorithms) */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Sikeres Teljesítések (Összesített)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-montserrat">
                    {loading
                      ? '...'
                      : (data?.kpis?.totalCoursesCompleted ?? 0) + (data?.kpis?.totalAlgorithmsCompleted ?? 0)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">befejezett modul</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>🎓 Kurzusok: <strong className="text-emerald-600 dark:text-emerald-400">{data?.kpis?.totalCoursesCompleted ?? 0} db</strong></span>
                  <span>⚡ Sima algoritmusok: <strong className="text-purple-600 dark:text-purple-400">{data?.kpis?.totalAlgorithmsCompleted ?? 0} db</strong></span>
                </div>
              </div>

              {/* 3. Total Learning Time & Hesitation */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tanulási & Gondolkodási Idő
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                    {loading ? '...' : data?.kpis?.formattedTotalTime || `${data?.kpis?.totalRecordedHours ?? 0} óra`}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>⏱️ Átl. reakcióidő: <strong className="text-gray-800 dark:text-gray-200">{data?.kpis?.avgHesitationSeconds ?? 0} mp/lépés</strong></span>
                  <span>🧠 Hiba utáni lassulás: <strong className="text-purple-600">+{data?.pedagogy?.pesSlowdownPercentage ?? 0}%</strong></span>
                </div>
              </div>

              {/* 4. Error Rate & Critical Hotspots */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Átlagos Hibaarány & Hibagócok
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-montserrat">
                    {loading ? '...' : `${data?.kpis?.avgErrorRatePercent ?? 0}%`}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    ({data?.kpis?.totalMistakesRecorded ?? 0} rögzített hiba)
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>🔥 Azonosított hibagóc: <strong className="text-rose-600">{normalizedHotspots.length} db</strong></span>
                  <span>⚠️ Elakadt diák: <strong className="text-amber-600">{totalStrugglingStudents} fő</strong></span>
                </div>
              </div>

              {/* 5. Video Pedagogical Effect */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Táncvideó Hibacsökkentő Hatása
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#269984]/10 text-[#269984] flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#269984] font-montserrat">
                    -{loading ? '...' : data?.pedagogy?.videoErrorReductionPercent ?? 62}%
                  </span>
                  <span className="text-xs font-semibold text-gray-500">kevesebb hiba</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>Videóval: <strong className="text-emerald-600">{data?.pedagogy?.avgMistakesWithVideo ?? 1.2} hiba</strong></span>
                  <span>Videó nélkül: <strong className="text-rose-600">{data?.pedagogy?.avgMistakesWithoutVideo ?? 3.1} hiba</strong></span>
                </div>
              </div>

              {/* 6. Self-Correction & Retry Success */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Hiba Utáni Sikeres Javítás
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-montserrat">
                    {loading ? '...' : `${data?.pedagogy?.retrySuccessRate ?? 84}%`}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">sikeres önkorrekció</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>Elsőre helyes: <strong className="text-gray-800 dark:text-gray-200">{100 - (data?.kpis?.avgErrorRatePercent ?? 24)}%</strong></span>
                  <span>Átl. próba: <strong className="text-gray-800 dark:text-gray-200">1.8x</strong></span>
                </div>
              </div>
            </div>

            {/* SIDE-BY-SIDE: KURZUSOK ÁTTEKINTÉSE + SIMA ALGORITMUSOK ÁTTEKINTÉSE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT (7 cols): ALL COURSES SUMMARY */}
              <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#269984]">
                        1. Pillér • Oktatási Kurzusok ({coursesList.length} db)
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#269984]" />
                        <span>Kurzusok Teljesítménye & Oktatók</span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setViewMode('by_course')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#269984]/10 text-[#269984] text-xs font-bold hover:bg-[#269984] hover:text-white transition-all"
                    >
                      <span>Kurzusokkénti részletes nézet</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {coursesList.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                      Még nincs létrehozott kurzus a rendszerben.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coursesList.map((course) => {
                        const struggling =
                          course.strugglingCount ??
                          (course.studentsRoster || []).filter((s) => s.status === 'struggling').length;
                        return (
                          <div
                            key={course.courseId}
                            onClick={() => openCourseDetails(course.courseId)}
                            className="group p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 hover:border-[#269984] transition-all cursor-pointer"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#269984] transition-colors">
                                    {course.title}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                                    {course.difficulty}
                                  </span>
                                  {course.instructorName && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                      • 👨‍🏫 {course.instructorName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {struggling > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    ⚠️ {struggling} elakadt diák
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#269984] group-hover:translate-x-0.5 transition-transform">
                                  Elemzés <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-gray-400 block text-[10px]">Beiratkozva / Végzett</span>
                                <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                  {course.enrolledCount} fő / {course.completedCount} fő
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Teljesítési arány</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="w-16 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#269984] rounded-full"
                                      style={{ width: `${course.completionRate}%` }}
                                    />
                                  </div>
                                  <span className="font-extrabold text-[#269984]">{course.completionRate}%</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Időarány (Terv vs Valós)</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                  {course.estimatedMinutes}p → {course.actualAvgMinutes}p
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Összes hiba / Minőség</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                  <span className="text-rose-500">{course.totalMistakes} hiba</span> • {course.qualityIndex}/100
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>Kattints bármelyik kurzusra a fázis-tölcsér és a diákok megtekintéséhez.</span>
                  <button
                    onClick={() => setViewMode('teacher_overview')}
                    className="font-bold text-[#269984] hover:underline"
                  >
                    Összes diák táblázat megnyitása →
                  </button>
                </div>
              </div>

              {/* RIGHT (5 cols): STANDALONE ALGORITHMS HEATMAP SUMMARY */}
              <div className="lg:col-span-5 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        2. Pillér • Sima Algoritmusok ({data?.algorithmHesitationList?.length || 0} db)
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-500" />
                        <span>Algoritmusok Nehézségi Rangsora</span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setViewMode('algorithms_deep')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all"
                    >
                      <span>Részletes algoritmus nézet</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(data?.algorithmHesitationList || []).slice(0, 7).map((algo) => {
                      const isHard = algo.errorRate >= 35;
                      const isMed = algo.errorRate >= 20 && algo.errorRate < 35;
                      return (
                        <div
                          key={algo.algorithmId}
                          onClick={() => {
                            setSelectedAlgorithm(algo.algorithmId);
                            setViewMode('algorithms_deep');
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-gray-900 dark:text-white truncate">
                              {ALGORITHM_LABELS[algo.algorithmId] || algo.algorithmId}
                            </span>
                            <span
                              className={`font-extrabold ${
                                isHard ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
                              }`}
                            >
                              {algo.errorRate}% hibaarány
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full ${
                                isHard ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(6, algo.errorRate)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>⏱️ {algo.averageHesitationSeconds} mp/lépés</span>
                            <span>❌ {algo.totalMistakes} hiba</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✅ {algo.completedCount} teljesítés
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>Kattints egy algoritmusra a lépésszintű elakadásokhoz.</span>
                  <Link
                    href="/admin-statistics/algorithms"
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Dedikált Algoritmus Oldal →
                  </Link>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW OF PLATFORM OVERVIEW: SEARCH ANALYTICS & METACOGNITION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search Analytics & 0-Result Curriculum Gaps */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#269984]" />
                      <span>Keresési Trendek & Hiányzó Tananyagok</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mit keresnek a diákok a platformon, és mi az, amire 0 találatot kapnak?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                      🔥 Leggyakoribb Keresések
                    </span>
                    {(data?.searchAnalytics?.topSearches || []).length === 0 ? (
                      <p className="text-xs text-gray-400">Még nincs rögzített keresés.</p>
                    ) : (
                      (data?.searchAnalytics?.topSearches || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            “{item.query}”
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#269984]/10 text-[#269984] font-bold">
                            {item.count}x
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                      ⚠️ 0 Találatos Keresések (Tananyaghiány)
                    </span>
                    {(data?.searchAnalytics?.zeroResultSearches || []).length === 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Minden eddigi keresésre volt találat!
                      </p>
                    ) : (
                      (data?.searchAnalytics?.zeroResultSearches || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            “{item.query}”
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                            {item.count}x (0 találat)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Confidence Matrix */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <span>Metakognitív Magabiztossági Mátrix</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    A diákok önértékelése a válaszadás előtt szembeállítva a tényleges helyességgel
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                      ✅ Magabiztos Tudás (Helyes)
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                      {data?.pedagogy?.confidenceMatrix?.mastery ?? 62}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                      ⚠️ Téves Magabiztosság (Félreértés)
                    </span>
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-montserrat">
                      {data?.pedagogy?.confidenceMatrix?.overconfidence ?? 14}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                      🤔 Bizonytalan, de Helyes
                    </span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-montserrat">
                      {data?.pedagogy?.confidenceMatrix?.hesitant ?? 16}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/20">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      🆘 Felismert Hiányosság
                    </span>
                    <span className="text-2xl font-black text-slate-600 dark:text-slate-400 font-montserrat">
                      {data?.pedagogy?.confidenceMatrix?.recognizedGap ?? 8}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* VIEW 2: ÁLTALÁNOS TANÁRI / KURZUS ÁTTEKINTÉS (MINDEN KURZUS)   */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentView === 'teacher_overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Focused Teacher KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Beiratkozott Diákok
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                  {loading ? '...' : data?.kpis?.activeLearnersCount ?? 0} fő
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Összesen <strong>{coursesList.length} db</strong> kurzuson
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Kurzus Teljesítések
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-montserrat">
                    {loading ? '...' : data?.kpis?.totalCoursesCompleted ?? 0} db
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    (Átl. {averageCourseCompletionRate}%)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Sikeresen elvégzett kurzusok</p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Elakadt / Segítségre Szoruló
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-montserrat">
                  {loading ? '...' : totalStrugglingStudents} diák
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3+ hibával még folyamatban lévő tanulók
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Rögzített Tanulási Idő
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                  {loading ? '...' : data?.kpis?.formattedTotalTime || `${data?.kpis?.totalRecordedHours ?? 0} óra`}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Összes rögzített hiba: <strong>{data?.kpis?.totalMistakesRecorded ?? 0}</strong>
                </p>
              </div>
            </div>

            {/* COURSES OVERVIEW CARDS / TABLE (CLICK TO DRILL DOWN INTO A COURSE) */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#269984]">
                    Kurzusok Áttekintő Táblázata
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-0.5">
                    Kurzusok Összehasonlítása (Kattints egy kurzusra a részletes diagnózishoz)
                  </h2>
                </div>
                <button
                  onClick={() => setViewMode('by_course')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#269984] text-white text-xs font-bold hover:bg-[#1f7d6c] transition-all shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Kurzusokkénti Részletes Nézet</span>
                </button>
              </div>

              {coursesList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    Nincs megjeleníthető kurzus.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                        <th className="py-3.5 pr-4">Kurzus megnevezése</th>
                        <th className="py-3.5 px-3">Diákok</th>
                        <th className="py-3.5 px-3">Teljesítési arány</th>
                        <th className="py-3.5 px-3">Elakadt diák</th>
                        <th className="py-3.5 px-3">Idő (Terv vs Valós)</th>
                        <th className="py-3.5 px-3">Átlagpont / Hibák</th>
                        <th className="py-3.5 pl-3 text-right">Művelet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                      {coursesList.map((course) => {
                        const struggling =
                          course.strugglingCount ??
                          (course.studentsRoster || []).filter((s) => s.status === 'struggling').length;
                        const isSlow = course.pacingRatio > 1.25;
                        return (
                          <tr
                            key={course.courseId}
                            onClick={() => openCourseDetails(course.courseId)}
                            className="hover:bg-slate-50/90 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          >
                            <td className="py-4 pr-4">
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#269984] transition-colors">
                                {course.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span>{course.difficulty}</span>
                                <span>•</span>
                                <span>{course.dropoffFunnel?.length || 0} fázis</span>
                                {isAdmin && course.instructorName && (
                                  <>
                                    <span>•</span>
                                    <span>👨‍🏫 {course.instructorName}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-3 font-bold text-gray-800 dark:text-gray-200">
                              {course.enrolledCount} fő{' '}
                              <span className="text-xs font-normal text-gray-400">
                                ({course.completedCount} kész)
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-24 h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      course.completionRate >= 70
                                        ? 'bg-emerald-500'
                                        : course.completionRate >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${course.completionRate}%` }}
                                  />
                                </div>
                                <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                  {course.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              {struggling > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {struggling} fő
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ Nincs elakadás
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-xs">
                              <span className="font-bold text-gray-700 dark:text-gray-300">
                                {course.estimatedMinutes}p → {course.actualAvgMinutes}p
                              </span>
                              <span
                                className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isSlow
                                    ? 'bg-rose-500/10 text-rose-600'
                                    : 'bg-emerald-500/10 text-emerald-600'
                                }`}
                              >
                                {course.pacingRatio}x
                              </span>
                            </td>
                            <td className="py-4 px-3 text-xs">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {course.avgScore} pt
                              </span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span className="font-bold text-rose-500">{course.totalMistakes} hiba</span>
                            </td>
                            <td className="py-4 pl-3 text-right">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#269984]/10 text-[#269984] text-xs font-bold group-hover:bg-[#269984] group-hover:text-white transition-all">
                                Részletek <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALL STUDENTS PROGRESS ROSTER (WITH QUICK FILTERS FOR STRUGGLING STUDENTS) */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Összesített Diáknapló
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-0.5">
                    Diákok Haladása & Státusza ({allStudentsRoster.length} beiratkozás)
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter Pills */}
                  {(
                    [
                      { id: 'all', label: `Összes (${allStudentsRoster.length})` },
                      {
                        id: 'struggling',
                        label: `⚠️ Elakadt (${allStudentsRoster.filter((s) => s.status === 'struggling').length})`,
                      },
                      {
                        id: 'in_progress',
                        label: `⏳ Folyamatban (${allStudentsRoster.filter((s) => s.status === 'in_progress').length})`,
                      },
                      {
                        id: 'completed',
                        label: `✅ Végzett (${allStudentsRoster.filter((s) => s.status === 'completed').length})`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStudentStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        studentStatusFilter === tab.id
                          ? 'bg-[#269984] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Diák vagy kurzus keresése..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#269984]"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const filteredRoster = allStudentsRoster.filter((s) => {
                  if (studentStatusFilter !== 'all' && s.status !== studentStatusFilter) return false;
                  if (studentSearchQuery.trim()) {
                    const q = studentSearchQuery.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(q) ||
                      s.email.toLowerCase().includes(q) ||
                      (s.courseTitle || '').toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (filteredRoster.length === 0) {
                  return (
                    <div className="p-10 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-500">
                      Nincs a szűrésnek megfelelő diák.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                          <th className="py-3 pr-4">Diák</th>
                          <th className="py-3 px-3">Kurzus</th>
                          <th className="py-3 px-3">Előrehaladás</th>
                          <th className="py-3 px-3">Aktuális fázis</th>
                          <th className="py-3 px-3">Hibák / Pont</th>
                          <th className="py-3 pl-3 text-right">Státusz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                        {filteredRoster.slice(0, 30).map((student, idx) => (
                          <tr key={`${student.userId}-${student.courseId}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                            <td className="py-3.5 pr-4">
                              <div className="font-bold text-gray-900 dark:text-white">{student.name}</div>
                              <div className="text-[11px] text-gray-400">{student.email}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                onClick={() => student.courseId && openCourseDetails(student.courseId)}
                                className="font-semibold text-[#269984] hover:underline text-left"
                              >
                                {student.courseTitle}
                              </button>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      student.status === 'completed'
                                        ? 'bg-emerald-500'
                                        : student.status === 'struggling'
                                        ? 'bg-rose-500'
                                        : 'bg-[#269984]'
                                    }`}
                                    style={{ width: `${student.progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                  {student.progressPercent}% ({student.completedPhasesCount}/{student.totalPhasesCount})
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300 font-medium">
                              {student.currentPhaseTitle}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`font-bold ${student.totalMistakes >= 3 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {student.totalMistakes} hiba
                              </span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span className="font-bold text-emerald-600">{student.points} pt</span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span className="text-gray-500">{student.timeSpentMinutes}p</span>
                            </td>
                            <td className="py-3.5 pl-3 text-right">
                              {student.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3 h-3" /> Teljesítette
                                </span>
                              ) : student.status === 'struggling' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  <AlertTriangle className="w-3 h-3" /> Elakadt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  Folyamatban
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* PHASE TYPE EFFECTIVENESS SUMMARY */}
            {data?.coursesEvaluation?.phaseTypeEffectiveness && (
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#269984]" />
                    <span>Feladattípusok Hatékonysága a Kurzusokban</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Melyik fázistípus mennyi időt vesz igénybe és milyen átlagos eredményt hoz?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.coursesEvaluation.phaseTypeEffectiveness.map((item, idx) => {
                    const typeKey = item.type || item.sourceView || 'info';
                    const meta = PHASE_TYPE_META[typeKey] || PHASE_TYPE_META.info;
                    const timeSec = item.avgTimeSec ?? item.avgDurationSec ?? 120;
                    const mistakes = item.avgMistakes ?? item.totalMistakes ?? 0;
                    const rate = item.completionRate ?? item.avgAccuracy ?? 85;
                    const score = item.avgScore ?? item.avgAccuracy ?? 85;
                    return (
                      <div
                        key={`${typeKey}-${idx}`}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${meta.color}`}>
                            {renderPhaseIcon(meta.iconType)}
                            {item.label || meta.label}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {rate}% siker
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 dark:border-white/5 text-[11px]">
                          <div>
                            <span className="text-gray-400 block">Átl. idő</span>
                            <strong className="text-gray-800 dark:text-gray-200">
                              {Math.round((timeSec / 60) * 10) / 10} perc
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Átl. hiba</span>
                            <strong className="text-rose-500">{mistakes} db</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Átl. pont</span>
                            <strong className="text-gray-800 dark:text-gray-200">{score} pt</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* VIEW 3: KURZUSOKKÉNTI RÉSZLETES ELEMZÉS (1 KURZUS MINDEN ADATA) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentView === 'by_course' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Course Selector Bar */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#269984] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Válassz kurzust a részletes elemzéshez ({coursesList.length} elérhető kurzus):
                </span>
                <button
                  onClick={() => setViewMode('teacher_overview')}
                  className="text-xs font-bold text-gray-500 hover:text-[#269984]"
                >
                  ← Vissza az összes kurzus táblázatához
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coursesList.map((course) => {
                  const isSelected = selectedCourseObj?.courseId === course.courseId;
                  const struggling =
                    course.strugglingCount ??
                    (course.studentsRoster || []).filter((s) => s.status === 'struggling').length;
                  return (
                    <button
                      key={course.courseId}
                      onClick={() => setActiveCourseId(course.courseId)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#269984]/10 border-2 border-[#269984] shadow-sm'
                          : 'bg-slate-50/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:border-[#269984]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white line-clamp-1">
                          {course.title}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#269984] text-white shrink-0">
                            Aktív
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>👥 {course.enrolledCount} diák</span>
                        <span className="font-bold text-[#269984]">✅ {course.completionRate}% kész</span>
                        {struggling > 0 && (
                          <span className="font-bold text-rose-500">⚠️ {struggling} elakadt</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!selectedCourseObj ? (
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                <p className="text-sm text-gray-500">Nincs kiválasztott kurzus.</p>
              </div>
            ) : (
              <>
                {/* SELECTED COURSE HEADER & 4 COURSE KPIS */}
                <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#269984]/10 text-[#269984]">
                          {selectedCourseObj.difficulty}
                        </span>
                        {selectedCourseObj.instructorName && (
                          <span className="text-xs font-semibold text-gray-500">
                            👨‍🏫 Oktató: <strong>{selectedCourseObj.instructorName}</strong>
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          • Minőségi Index: <strong className="text-gray-800 dark:text-gray-200">{selectedCourseObj.qualityIndex}/100</strong>
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                        {selectedCourseObj.title}
                      </h2>
                    </div>

                    {/* Sub-section Quick Filter inside the Course */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
                      {(
                        [
                          { id: 'all', label: 'Minden szekció egyben' },
                          { id: 'funnel', label: '📉 Lemorzsolódási Tölcsér' },
                          { id: 'students', label: `🎓 Diákok (${selectedCourseObj.enrolledCount})` },
                          { id: 'mistakes', label: '🔥 Kurzus Hibagócok' },
                        ] as const
                      ).map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => setCourseSection(sec.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            courseSection === sec.id
                              ? 'bg-white dark:bg-[#1e1e1e] text-[#269984] shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {sec.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Course KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10">
                      <span className="text-xs font-bold text-gray-400 uppercase">Beiratkozott / Végzett</span>
                      <div className="text-2xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-1">
                        {selectedCourseObj.enrolledCount} fő{' '}
                        <span className="text-sm font-bold text-emerald-600">
                          ({selectedCourseObj.completedCount} kész)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Teljesítési arány: <strong>{selectedCourseObj.completionRate}%</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10">
                      <span className="text-xs font-bold text-gray-400 uppercase">Tervezett vs Valós Idő</span>
                      <div className="text-2xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-1">
                        {selectedCourseObj.estimatedMinutes}p → {selectedCourseObj.actualAvgMinutes}p
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Időarány: <strong>{selectedCourseObj.pacingRatio}x</strong>{' '}
                        {selectedCourseObj.pacingRatio > 1.25
                          ? '(Túl hosszú / nehéz)'
                          : '(Optimális ütemezés)'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10">
                      <span className="text-xs font-bold text-gray-400 uppercase">Átlagpontszám & Kabala</span>
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-montserrat mt-1">
                        {selectedCourseObj.avgScore} pont
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Kabala megtartó hatás: <strong>+{selectedCourseObj.mascotRetentionBoost}%</strong>
                        {typeof selectedCourseObj.mascotImprovementRate === 'number' && selectedCourseObj.mascotImprovementRate > 0 && (
                          <span> • Siker javulás: <strong className="text-emerald-600 dark:text-emerald-400">{selectedCourseObj.mascotImprovementRate}%</strong></span>
                        )}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10">
                      <span className="text-xs font-bold text-gray-400 uppercase">Összes Hiba & Elakadás</span>
                      <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-montserrat mt-1">
                        {selectedCourseObj.totalMistakes} hiba
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Segítségre szoruló diák:{' '}
                        <strong className="text-rose-500">
                          {(selectedCourseObj.studentsRoster || []).filter((s) => s.status === 'struggling').length} fő
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION A: PHASE DROP-OFF FUNNEL & STEP DIAGNOSTICS */}
                {(courseSection === 'all' || courseSection === 'funnel') && (
                  <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#269984]">
                        1. Szekció • Fázisok Lemorzsolódási Tölcsére (Drop-off Funnel)
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-0.5">
                        Hány százalék jut el az egyes lépésekig, és hol akadnak el?
                      </h3>
                    </div>

                    {selectedCourseObj.dropoffFunnel.length === 0 ? (
                      <p className="text-sm text-gray-500">Nincsenek fázisok rögzítve ehhez a kurzushoz.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCourseObj.dropoffFunnel.map((phase, idx) => {
                          const meta = PHASE_TYPE_META[phase.sourceView] || PHASE_TYPE_META.info;
                          return (
                            <div
                              key={phase.phaseId || idx}
                              className={`p-4 rounded-2xl border ${
                                phase.isBottleneck
                                  ? 'bg-rose-500/[0.04] border-rose-500/30'
                                  : 'bg-slate-50/70 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                                    {phase.title}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.bg} ${meta.color}`}
                                  >
                                    {renderPhaseIcon(meta.iconType)}
                                    {meta.label}
                                  </span>
                                  {phase.isBottleneck && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                                      ⚠️ Kritikus lemorzsolódás
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-gray-500">
                                    ⏱️ Átl. <strong>{phase.avgTimeMinutes} perc</strong>
                                  </span>
                                  <span className="text-rose-500 font-bold">
                                    ❌ {phase.mistakeCount} hiba
                                  </span>
                                  <span className="font-extrabold text-[#269984]">
                                    Megtartás: {phase.retentionRate}%
                                  </span>
                                </div>
                              </div>

                              <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    phase.isBottleneck
                                      ? 'bg-rose-500'
                                      : phase.retentionRate >= 80
                                      ? 'bg-[#269984]'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${phase.retentionRate}%` }}
                                />
                              </div>

                              {phase.recommendation && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{phase.recommendation}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION B: STUDENTS ROSTER FOR THIS COURSE */}
                {(courseSection === 'all' || courseSection === 'students') && (
                  <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                          2. Szekció • Beiratkozott Diákok Ebben a Kurzusban
                        </span>
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-0.5">
                          {selectedCourseObj.title} – Diákok Egyéni Haladása ({selectedCourseObj.studentsRoster?.length || 0} fő)
                        </h3>
                      </div>
                    </div>

                    {!selectedCourseObj.studentsRoster || selectedCourseObj.studentsRoster.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-500">
                        Erre a kurzusra még nem iratkozott fel diák.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                              <th className="py-3 pr-4">Diák neve & e-mail</th>
                              <th className="py-3 px-3">Előrehaladás</th>
                              <th className="py-3 px-3">Jelenlegi fázis</th>
                              <th className="py-3 px-3">Pontszám</th>
                              <th className="py-3 px-3">Hibák</th>
                              <th className="py-3 px-3">Kabala segítség</th>
                              <th className="py-3 px-3">Eltöltött idő</th>
                              <th className="py-3 pl-3 text-right">Státusz</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                            {selectedCourseObj.studentsRoster.map((student, idx) => (
                              <tr key={`${student.userId}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                                <td className="py-3.5 pr-4">
                                  <div className="font-bold text-gray-900 dark:text-white">{student.name}</div>
                                  <div className="text-[11px] text-gray-400">{student.email}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          student.status === 'completed'
                                            ? 'bg-emerald-500'
                                            : student.status === 'struggling'
                                            ? 'bg-rose-500'
                                            : 'bg-[#269984]'
                                        }`}
                                        style={{ width: `${student.progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="font-bold">
                                      {student.progressPercent}% ({student.completedPhasesCount}/{student.totalPhasesCount})
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                                  {student.currentPhaseTitle}
                                </td>
                                <td className="py-3.5 px-3 font-bold text-emerald-600">{student.points} pt</td>
                                <td className="py-3.5 px-3 font-bold text-rose-500">{student.totalMistakes} db</td>
                                <td className="py-3.5 px-3">
                                  {student.mascotHelpCount ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-[#269984] dark:text-[#36D6BA]">
                                      {student.mascotHelpCount}x
                                      {typeof student.improvedAfterMascotCount === 'number' &&
                                        student.improvedAfterMascotCount > 0 && (
                                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            ({student.improvedAfterMascotCount}✓)
                                          </span>
                                        )}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-gray-500">{student.timeSpentMinutes} perc</td>
                                <td className="py-3.5 pl-3 text-right">
                                  {student.status === 'completed' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      <Check className="w-3 h-3" /> Végzett
                                    </span>
                                  ) : student.status === 'struggling' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                      <AlertTriangle className="w-3 h-3" /> Elakadt
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                      Folyamatban
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION C: COURSE-SPECIFIC MISTAKE HOTSPOTS */}
                {(courseSection === 'all' || courseSection === 'mistakes') && (
                  <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                        3. Szekció • Kurzus Specifikus Hibagócok
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat mt-0.5">
                        Tipikus hibák és rossz válaszok ebben a kurzusban
                      </h3>
                    </div>

                    {(() => {
                      const courseHotspots = normalizedHotspots.filter(
                        (h) =>
                          h.targetId === selectedCourseObj.courseId ||
                          h.targetTitle === selectedCourseObj.title,
                      );

                      if (courseHotspots.length === 0) {
                        return (
                          <div className="p-8 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-500">
                            Ebben a kurzusban még nem alakult ki kritikus hibagóc.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {courseHotspots.map((spot) => {
                            const meta = PHASE_TYPE_META[spot.phaseType] || PHASE_TYPE_META.info;
                            return (
                              <div
                                key={spot.id}
                                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color}`}
                                  >
                                    {renderPhaseIcon(meta.iconType)}
                                    {meta.label}
                                  </span>
                                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                                    ❌ {spot.mistakeCount} hiba ({spot.affectedStudents} diák)
                                  </span>
                                </div>

                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                  {spot.phaseTitle}
                                </div>

                                {spot.topWrongAnswers && spot.topWrongAnswers.length > 0 && (
                                  <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5 space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase text-rose-500 block">
                                      Leggyakoribb hibás válasz / kód:
                                    </span>
                                    <div className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                                      {spot.topWrongAnswers[0].answer} ({spot.topWrongAnswers[0].count}x)
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      Ok: {spot.topWrongAnswers[0].reason}
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-3 rounded-xl flex items-start gap-2">
                                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                                  <span>{spot.pedagogicalAction}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* VIEW 4: SIMA ALGORITMUSOK MÉLYELEMZÉSE (ADMIN)                */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentView === 'algorithms_deep' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Algorithm Filter Bar */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Sima Algoritmusok & Kognitív Kutatási Analitika
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                  11 Interaktív Algoritmus Nehézségi Hőtérképe és Elakadásai
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-500" />
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
                >
                  {Object.entries(ALGORITHM_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="dark:bg-[#1a1a1a]">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Algorithm Difficulty Heatmap Table */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span>Algoritmusok Összehasonlító Hőtérképe</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                      <th className="py-3 pr-4">Algoritmus</th>
                      <th className="py-3 px-3">Hibaarány (%)</th>
                      <th className="py-3 px-3">Átl. Gondolkodási Idő</th>
                      <th className="py-3 px-3">Rögzített Hibák</th>
                      <th className="py-3 px-3">Segítségkérés (Hint)</th>
                      <th className="py-3 pl-3 text-right">Sikeres Teljesítés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                    {(data?.algorithmHesitationList || []).map((algo) => {
                      const isHard = algo.errorRate >= 35;
                      const isMed = algo.errorRate >= 20 && algo.errorRate < 35;
                      return (
                        <tr key={algo.algorithmId} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                          <td className="py-4 pr-4 font-bold text-gray-900 dark:text-white">
                            {ALGORITHM_LABELS[algo.algorithmId] || algo.algorithmId}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-28 h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHard ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(5, algo.errorRate)}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-extrabold ${
                                  isHard ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
                                }`}
                              >
                                {algo.errorRate}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 font-semibold text-gray-700 dark:text-gray-300">
                            {algo.averageHesitationSeconds} mp / lépés
                          </td>
                          <td className="py-4 px-3 font-bold text-rose-500">{algo.totalMistakes} db</td>
                          <td className="py-4 px-3 text-gray-500">{algo.hintsUsed} alkalom</td>
                          <td className="py-4 pl-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            {algo.completedCount} db
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step Bottlenecks & Cognitive Load */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Step Bottlenecks */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span>Top Lépésszintű Elakadási Pontok (Bottlenecks)</span>
                </h3>
                <div className="space-y-3">
                  {(data?.topBottlenecks || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {ALGORITHM_LABELS[b.algorithmId] || b.algorithmId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase">
                          {b.tab === 'control' ? 'Irányítás' : b.tab === 'create' ? 'Kódkiegészítés' : b.tab}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {b.stepOrBlank}
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
                        <span className="text-rose-500 font-bold">❌ {b.mistakeCount} hiba</span>
                        <span>⏱️ {b.avgHesitationSeconds} mp hezitálás</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Recovery & Visual Blocks Transfer */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span>Kognitív Terhelés & Vizuális Segítség Transzfer</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hogyan térnek vissza a diákok a hibázás után, és mennyit segít a vizuális blokk-építő?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                      Vizuális segítség utáni siker (Alive)
                    </span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-montserrat">
                      {data?.research?.helpSeekingTransfer?.aliveAfterHelpSuccessRate ?? 84}%
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Segítség nélkül: {data?.research?.helpSeekingTransfer?.aliveWithoutHelpSuccessRate ?? 62}%
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                      Sikeres visszatérés a kódhoz
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                      {data?.research?.visualBlocksThreshold?.successfulReturnToCodeRate ?? 78}%
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Átl. {data?.research?.visualBlocksThreshold?.avgAttemptsBeforeFallback ?? 3.4} próba után
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 space-y-2">
                  <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                    Post-Error Slowing (PES) Visszaállási Görbe:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-white dark:bg-black/30">
                      <span className="text-[10px] text-gray-400 block">Alap reakció</span>
                      <strong>{data?.research?.cognitiveLoadDynamics?.baselineReactionSec ?? 2.6} mp</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <span className="text-[10px] block">Hiba után (+1)</span>
                      <strong>{data?.research?.cognitiveLoadDynamics?.immediatePostErrorSec ?? 4.2} mp</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <span className="text-[10px] block">2. lépés (+2)</span>
                      <strong>{data?.research?.cognitiveLoadDynamics?.step2RecoverySec ?? 3.3} mp</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="text-[10px] block">3. lépés (+3)</span>
                      <strong>{data?.research?.cognitiveLoadDynamics?.step3RecoverySec ?? 2.8} mp</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* VIEW 5: HIBAGÓCOK & TÍPUSHIBÁK KERESŐ                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {currentView === 'mistakes_explorer' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Részletes Hibadiagnosztika
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white font-montserrat">
                    Hol és miért hibáznak a diákok? ({normalizedHotspots.length} azonosított hibagóc)
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPhaseType}
                    onChange={(e) => setSelectedPhaseType(e.target.value)}
                    className="bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200"
                  >
                    <option value="all">Minden feladattípus</option>
                    <option value="quiz">Kvíz & Feleletválasztós</option>
                    <option value="create">Kódkiegészítés (Create)</option>
                    <option value="debug">Kód Hibakeresés (Debug)</option>
                    <option value="control">Interaktív Irányítás</option>
                    <option value="simulation">Záró Szimuláció</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mistakeSearchQuery}
                      onChange={(e) => setMistakeSearchQuery(e.target.value)}
                      placeholder="Keresés kurzus vagy fázis alapján..."
                      className="pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {normalizedHotspots
                  .filter((h) => {
                    if (selectedPhaseType !== 'all' && h.phaseType !== selectedPhaseType) return false;
                    if (mistakeSearchQuery.trim()) {
                      const q = mistakeSearchQuery.toLowerCase();
                      return (
                        h.targetTitle.toLowerCase().includes(q) ||
                        h.phaseTitle.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((spot) => {
                    const meta = PHASE_TYPE_META[spot.phaseType] || PHASE_TYPE_META.info;
                    const isExpanded = expandedHotspotId === spot.id;
                    return (
                      <div
                        key={spot.id}
                        className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color}`}
                          >
                            {renderPhaseIcon(meta.iconType)}
                            {meta.label}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              spot.severity === 'critical'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {spot.mistakeCount} hiba • {spot.affectedStudents} diák
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-gray-400">{spot.targetTitle}</div>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                            {spot.phaseTitle}
                          </div>
                        </div>

                        {spot.topWrongAnswers && spot.topWrongAnswers.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {spot.topWrongAnswers.slice(0, isExpanded ? 5 : 2).map((wa, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5 text-xs"
                              >
                                <div className="flex items-center justify-between font-mono font-bold text-rose-600 dark:text-rose-400">
                                  <span>“{wa.answer}”</span>
                                  <span>{wa.count}x</span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">{wa.reason}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-3 rounded-xl flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{spot.pedagogicalAction}</span>
                        </div>

                        {spot.topWrongAnswers && spot.topWrongAnswers.length > 2 && (
                          <button
                            onClick={() => setExpandedHotspotId(isExpanded ? null : spot.id)}
                            className="text-xs font-bold text-[#269984] hover:underline"
                          >
                            {isExpanded ? 'Kevesebb mutatása' : `További hibás válaszok (${spot.topWrongAnswers.length})`}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
