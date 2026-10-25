'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from '../../i18n/LocaleProvider';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Brain,
  TrendingDown,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  Award,
  Sparkles,
  Shield,
  Layers,
  FileSpreadsheet,
  FileCode,
  GraduationCap,
  Zap,
  BookOpen,
  Bot,
  Flame,
  Filter,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Check,
  X,
  Target,
  ArrowRight,
} from 'lucide-react';
import { ROUTES, ROLES, ALGORITHMS } from '../../../lib/constants';

export interface MistakeHotspot {
  id: string;
  courseId: string;
  courseTitle: string;
  phaseId: string;
  phaseTitle: string;
  sourceView: string; // 'debug' | 'quiz' | 'gap-fill' | 'match' | 'order' | 'control' | 'alive'
  difficulty: string; // 'Beginner' | 'Intermediate' | 'Advanced'
  mistakeCount: number;
  affectedLearnersPercent: number;
  avgHesitationSec: number;
  confidenceType: 'overconfident' | 'hesitant' | 'blind_guess' | 'misconception';
  title: string;
  description: string;
  sampleExpected?: string;
  sampleActual?: string;
  recommendation: string;
}

export interface StudentRosterItem {
  userId: string;
  name: string;
  email: string;
  courseTitle?: string;
  courseId?: string;
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
  lastActive: string;
}

export interface CourseEvaluationItem {
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
  qualityIndex: number;
  studentsRoster?: StudentRosterItem[];
  dropoffFunnel: Array<{
    phaseId: string;
    title: string;
    sourceView: string;
    retentionRate: number;
    avgTimeMinutes: number;
    mistakeCount: number;
    isBottleneck: boolean;
    status?: 'excellent' | 'normal' | 'bottleneck' | 'high_mistakes';
    recommendation?: string;
  }>;
}

export interface StatisticsData {
  timestamp: string;
  timeRange: string;
  algorithm: string;
  courseId?: string;
  difficulty?: string;
  phaseType?: string;
  kpis: {
    activeLearnersCount: number;
    totalRecordedHours: number;
    formattedTotalTime?: string;
    totalAlgorithmsCompleted: number;
    totalCoursesCompleted: number;
    totalCompletedCombined?: number;
    avgHesitationSeconds: number;
    avgErrorRatePercent?: number;
    totalMistakesRecorded?: number;
  };
  mistakesAnalysis?: MistakeHotspot[];
  coursesEvaluation: {
    coursesList: CourseEvaluationItem[];
    allCoursesList?: CourseEvaluationItem[];
    allStudentsRoster?: StudentRosterItem[];
    phaseTypeEffectiveness: Array<{
      sourceView: string;
      totalPhases: number;
      totalMistakes: number;
      avgAccuracy: number;
      avgDurationSec: number;
    }>;
    confidenceTrajectory: {
      initialPhase: {
        mastery: number;
        overconfidence: number;
        hesitant: number;
        recognizedGap: number;
      };
      finalPhase: {
        mastery: number;
        overconfidence: number;
        hesitant: number;
        recognizedGap: number;
      };
      masteryGrowthPercent: number;
      overconfidenceDropPercent: number;
    };
  };
  pedagogy?: {
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
  scope?: {
    role: string;
    isTeacher: boolean;
    isAdmin: boolean;
    activeInstructorFilter: string | null;
    instructorsList?: Array<{ id: string; name: string; role?: string }>;
  };
}

export default function AdminStatisticsClient() {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const isAdminOrEditor = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR;

  // Filter States
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPhaseType, setSelectedPhaseType] = useState<string>('all');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [scopeMode, setScopeMode] = useState<'my' | 'global'>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mistakeConfidenceFilter, setMistakeConfidenceFilter] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'struggling'>('all');

  // Active Tab: 3 clean, teacher-focused views
  const [activeTab, setActiveTab] = useState<'overview' | 'mistakes' | 'time_funnel'>('overview');

  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(isAdminOrEditor ? true : null);
  const [error, setError] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        timeRange,
        courseId: selectedCourseId,
        difficulty: selectedDifficulty,
        phaseType: selectedPhaseType,
        instructorId: selectedInstructor,
        scope: scopeMode,
      });

      const res = await fetch(`/api/admin/statistics?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setIsAuthorized(false);
          throw new Error(
            t('admin_stats.unauthorized_error') ||
              'Nincs jogosultságod a statisztikák megtekintéséhez.',
          );
        }
        throw new Error('Nem sikerült betölteni az analitikai adatokat.');
      }
      const json: StatisticsData = await res.json();
      setIsAuthorized(true);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Váratlan hiba történt.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedCourseId, selectedDifficulty, selectedPhaseType, selectedInstructor, scopeMode, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Export handlers
  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorythmics-stats-${timeRange}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  const exportCSV = () => {
    if (!data) return;
    let csv =
      'Kurzus;Nehezseg;Becsult ido (p);Valos ido (p);Beiratkozott;Befejezes (%);Atlag pont;Minosegi Index\n';
    data.coursesEvaluation?.coursesList.forEach((c) => {
      csv += `${c.title};${c.difficulty};${c.estimatedMinutes};${c.actualAvgMinutes};${c.enrolledCount};${c.completionRate}%;${c.avgScore};${c.qualityIndex}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorythmics-courses-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  // Available courses list for selector (either filtered or all)
  const availableCourses = useMemo(() => {
    return data?.coursesEvaluation?.allCoursesList || data?.coursesEvaluation?.coursesList || [];
  }, [data]);

  // Selected course for dropoff funnel & detailed inspection
  const activeCourse = useMemo(() => {
    if (selectedCourseId !== 'all') {
      const match = availableCourses.find((c) => c.courseId === selectedCourseId);
      if (match) return match;
    }
    return availableCourses[0] || null;
  }, [availableCourses, selectedCourseId]);

  // Filtered mistakes list based on in-tab search & confidence filter
  const filteredMistakes = useMemo(() => {
    const list = data?.mistakesAnalysis || [];
    return list.filter((item) => {
      if (mistakeConfidenceFilter !== 'all' && item.confidenceType !== mistakeConfidenceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCourse = item.courseTitle.toLowerCase().includes(q);
        const matchesRec = item.recommendation.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesCourse || matchesRec;
      }
      return true;
    });
  }, [data?.mistakesAnalysis, mistakeConfidenceFilter, searchQuery]);

  // Filtered students roster (either for selected course or global)
  const displayedStudents = useMemo(() => {
    let list: StudentRosterItem[] = [];
    if (selectedCourseId !== 'all' && activeCourse?.studentsRoster) {
      list = activeCourse.studentsRoster;
    } else {
      list = data?.coursesEvaluation?.allStudentsRoster || [];
    }

    return list.filter((s) => {
      if (studentStatusFilter !== 'all' && s.status !== studentStatusFilter) return false;
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.courseTitle && s.courseTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedCourseId, activeCourse?.studentsRoster, data?.coursesEvaluation?.allStudentsRoster, studentStatusFilter, studentSearchQuery]);

  // Loading state
  if (status === 'loading' || (loading && !data && isAuthorized !== false)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#269984] border-t-transparent" />
        <p className="text-sm font-bold text-slate-500">Statisztikák betöltése...</p>
      </div>
    );
  }

  // Access denied state
  if (isAuthorized === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="max-w-md w-full bg-white dark:bg-[#151515] p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-montserrat text-gray-900 dark:text-white">
            {t('admin_stats.access_denied_title') || 'Hozzáférés Megtagadva'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('admin_stats.access_denied_desc') ||
              'Ez a statisztikai felület kizárólag tanárok és oktatók számára érhető el.'}
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-block mt-4 px-6 py-3 bg-[#269984] text-white rounded-xl font-bold font-montserrat hover:bg-[#208270] transition-colors"
          >
            {t('admin_stats.back_to_home') || 'Vissza a Főoldalra'}
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="max-w-md w-full bg-white dark:bg-[#151515] p-8 rounded-3xl border border-red-200 dark:border-red-500/20 text-center shadow-xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
            {t('admin_stats.error_title') || 'Nem sikerült betölteni a statisztikákat'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchStats}
            className="px-6 py-2.5 bg-[#269984] text-white rounded-xl font-bold font-montserrat hover:bg-[#208270] transition-colors cursor-pointer"
          >
            {t('common.retry') || 'Újrapróbálkozás'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ━━━ TOP HEADER & GLOBAL FILTER TOOLBAR ━━━ */}
        <div className="flex flex-col gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
          
          {/* View Switcher Pills (Course Stats vs Algorithm Stats) */}
          {(isAdminOrEditor || data?.scope?.isAdmin) && (
            <div className="inline-flex items-center p-1 rounded-2xl bg-gray-200/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-fit">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#269984] text-white shadow-sm text-xs font-bold transition-all">
                <BookOpen className="w-4 h-4 text-white" />
                <span>📚 Kurzusok Statisztikája (Aktív)</span>
              </div>

              <Link
                href={ROUTES.ALGORITHM_STATISTICS}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <Zap className="w-4 h-4 text-purple-500" />
                <span>⚡ Sima Algoritmusok (Admin Nézet)</span>
              </Link>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#269984]/10 text-[#269984] dark:bg-[#269984]/20 shrink-0">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-montserrat tracking-tight text-gray-900 dark:text-white">
                    {data?.scope?.isTeacher ? 'Tanári & Kurzus Analitika' : 'Oktatói & Kurzus Analitika'}
                  </h1>
                  {data?.scope?.isTeacher && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Saját kurzusok
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Diákok teljesítménye, elakadási gócpontok, hibaelemzés és gyakorlati pedagógiai tanácsok
                </p>
              </div>
            </div>

            {/* Refresh & Export Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchStats}
                disabled={loading}
                title="Adatok frissítése"
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#269984]' : ''}`} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold text-xs hover:border-[#269984] transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#269984]" />
                  <span>Export</span>
                </button>

                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-30 py-2 space-y-1">
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>Kurzus statisztikák (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportJSON}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4 text-blue-500" />
                      <span>Teljes elemzés (JSON)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ━━━ MULTI-DIMENSIONAL FILTER ROW ━━━ */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-sm">
            
            {/* 1. Time Range Pills */}
            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5">
              {[
                { id: '7d', label: '7 nap' },
                { id: '30d', label: '30 nap' },
                { id: '90d', label: '90 nap' },
                { id: 'all', label: 'Mind' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTimeRange(pill.id as any)}
                  className={`px-3 py-1.5 text-xs font-montserrat font-bold rounded-lg transition-all ${
                    timeRange === pill.id
                      ? 'bg-white dark:bg-[#269984] text-[#269984] dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* 2. Course Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
              <BookOpen className="w-4 h-4 text-[#269984] shrink-0" />
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none max-w-[180px] sm:max-w-[220px] truncate"
              >
                <option value="all">Minden kurzus ({availableCourses.length})</option>
                {availableCourses.map((c) => (
                  <option key={c.courseId} value={c.courseId} className="dark:bg-slate-900">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Difficulty Level Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
              <Target className="w-4 h-4 text-purple-500 shrink-0" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
              >
                <option value="all">Minden nehézség</option>
                <option value="Beginner">Kezdő</option>
                <option value="Intermediate">Középhaladó</option>
                <option value="Advanced">Haladó</option>
              </select>
            </div>

            {/* 4. Task/Phase Type Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
              <Layers className="w-4 h-4 text-blue-500 shrink-0" />
              <select
                value={selectedPhaseType}
                onChange={(e) => setSelectedPhaseType(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
              >
                <option value="all">Minden feladattípus</option>
                <option value="debug">Kód Hibakeresés (Debug)</option>
                <option value="quiz">Kvíz & Teszt</option>
                <option value="gap-fill">Hiánypótlás</option>
                <option value="control">Interaktív Irányítás</option>
                <option value="match">Párosítás</option>
                <option value="order">Sorrendezés</option>
              </select>
            </div>

            {/* 5. Instructor Selector (Admin only) */}
            {data?.scope?.isAdmin && data.scope.instructorsList && (
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl ml-auto">
                <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none max-w-[180px] truncate"
                >
                  {data.scope.instructorsList.map((ins) => (
                    <option key={ins.id} value={ins.id} className="dark:bg-slate-900">
                      {ins.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ━━━ 4 ACCURATE EXECUTIVE KPI CARDS ━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            title={selectedCourseId !== 'all' ? "Beiratkozott Diákok" : "Aktív Diákok"}
            value={`${data?.kpis.activeLearnersCount ?? 0} diák`}
            subtitle={
              selectedCourseId !== 'all' && activeCourse
                ? `${activeCourse.enrolledCount} beiratkozott diák ennél a kurzusnál`
                : 'Regisztrált & beiratkozott diákok'
            }
            icon={<Users className="w-5 h-5 text-blue-500" />}
            accentColor="from-blue-500/20 to-blue-600/5"
            borderColor="border-blue-500/20"
            loading={loading}
          />
          <KpiCard
            title="Összes Tanulási Idő"
            value={data?.kpis.formattedTotalTime || `${data?.kpis.totalRecordedHours ?? 0} óra`}
            subtitle={
              selectedCourseId !== 'all' && activeCourse
                ? `Ennél a kurzusnál töltött idő (átl. ${activeCourse.actualAvgMinutes} p/diák)`
                : 'Gyakorlással & feladatokkal töltve'
            }
            icon={<Clock className="w-5 h-5 text-[#269984]" />}
            accentColor="from-[#269984]/20 to-[#269984]/5"
            borderColor="border-[#269984]/20"
            loading={loading}
          />
          <KpiCard
            title={selectedCourseId !== 'all' ? "Kurzust Befejezte" : "Befejezett Kurzusok"}
            value={`${data?.kpis.totalCoursesCompleted ?? 0} ${selectedCourseId !== 'all' ? 'diák' : 'db'}`}
            subtitle={
              selectedCourseId !== 'all' && activeCourse
                ? `${activeCourse.completedCount} / ${activeCourse.enrolledCount} diák fejezte be (${activeCourse.completionRate}%)`
                : `${data?.kpis.totalCoursesCompleted ?? 0} kurzusteljesítés összesen`
            }
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            accentColor="from-emerald-500/20 to-emerald-600/5"
            borderColor="border-emerald-500/20"
            loading={loading}
          />
          <KpiCard
            title="Átlagos Reakcióidő"
            value={`${data?.kpis.avgHesitationSeconds ?? 0} mp`}
            subtitle={
              selectedCourseId !== 'all' && activeCourse
                ? 'Döntési és lépési reflexió ennél a kurzusnál'
                : 'Döntési és lépési reflexió'
            }
            icon={<Brain className="w-5 h-5 text-purple-500" />}
            accentColor="from-purple-500/20 to-purple-600/5"
            borderColor="border-purple-500/20"
            loading={loading}
          />
        </div>

        {/* ━━━ STREAMLINED TAB NAVIGATION (3 FOCUSED TABS) ━━━ */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Kurzusok & Diák Eredmények ({availableCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mistakes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'mistakes'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-300" />
            <span>2. Hibagócok: Hol és Miért Hibáznak? ({filteredMistakes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('time_funnel')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'time_funnel'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. Lépés- & Időelemzés (Tölcsér)</span>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 1: KURZUSOK & DIÁK EREDMÉNYEK (OVERVIEW)                    */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Courses Performance Table */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#269984]" />
                    <span>Kurzusok Teljesítménytáblája</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Beiratkozások, befejezési arányok és a tanulási idő eltérése (tervezett vs valós)
                  </p>
                </div>

                <div className="text-xs font-bold text-gray-500">
                  {data?.coursesEvaluation?.coursesList.length || 0} kurzus listázva
                </div>
              </div>

              {(!data?.coursesEvaluation?.coursesList || data.coursesEvaluation.coursesList.length === 0) ? (
                <div className="p-12 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                  <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Nincs a szűrésnek megfelelő kurzus.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Válassz másik szűrőfeltételt, vagy készíts új kurzust a Stúdióban!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-montserrat">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider text-[11px]">
                        <th className="pb-3 font-bold">Kurzus Neve</th>
                        <th className="pb-3 font-bold">Nehézség</th>
                        <th className="pb-3 font-bold">Beiratkozott</th>
                        <th className="pb-3 font-bold">Befejezési Arány</th>
                        <th className="pb-3 font-bold">Valós / Tervezett Idő</th>
                        <th className="pb-3 font-bold">Átlag Pont</th>
                        <th className="pb-3 font-bold">Minőségi Index</th>
                        <th className="pb-3 font-bold text-right">Művelet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {data.coursesEvaluation.coursesList.map((c) => (
                        <tr
                          key={c.courseId}
                          className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedCourseId(c.courseId);
                            setActiveTab('time_funnel');
                          }}
                        >
                          <td className="py-4 font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="group-hover:text-[#269984] transition-colors">{c.title}</span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                c.difficulty === 'Beginner'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : c.difficulty === 'Intermediate'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                              }`}
                            >
                              {c.difficulty === 'Beginner' ? 'Kezdő' : c.difficulty === 'Intermediate' ? 'Közép' : 'Haladó'}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-gray-700 dark:text-gray-300">
                            {c.enrolledCount} diák
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${c.completionRate}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {c.completionRate}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 font-medium text-gray-600 dark:text-gray-300">
                            <span className="font-bold text-gray-900 dark:text-white">{c.actualAvgMinutes} perc</span>{' '}
                            <span className="text-gray-400 text-[11px]">({c.estimatedMinutes} p)</span>
                          </td>
                          <td className="py-4 font-bold text-gray-900 dark:text-white">
                            {c.avgScore} pont
                          </td>
                          <td className="py-4">
                            <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg">
                              <Sparkles className="w-3.5 h-3.5" />
                              {c.qualityIndex}/100
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseId(c.courseId);
                                setActiveTab('time_funnel');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#269984] hover:text-white dark:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                            >
                              <span>Részletek</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ━━━ STUDENT ROSTER & INDIVIDUAL PROGRESS REPORT ━━━ */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                    <span>Diákok Egyéni Haladási Naplója & Részletes Eredményei</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedCourseId !== 'all' && activeCourse
                      ? `A(z) "${activeCourse.title}" kurzusra beiratkozott tanulók egyéni állapota és részidői`
                      : 'Minden beiratkozott diák állapota, fázis-haladása, elért pontszáma és tanulási ideje'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {displayedStudents.length} diák listázva
                  </span>
                </div>
              </div>

              {/* Student Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Keresés diák neve vagy email címe szerint..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#269984]"
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'Mind' },
                    { id: 'completed', label: 'Befejezve' },
                    { id: 'in_progress', label: 'Folyamatban' },
                    { id: 'struggling', label: 'Elakadt' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => setStudentStatusFilter(filterTab.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        studentStatusFilter === filterTab.id
                          ? 'bg-white dark:bg-[#269984] text-[#269984] dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>
              </div>

              {displayedStudents.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Nincs a szűrésnek megfelelő diákadat.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-montserrat">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider text-[11px]">
                        <th className="pb-3 font-bold">Tanuló</th>
                        {selectedCourseId === 'all' && <th className="pb-3 font-bold">Kurzus</th>}
                        <th className="pb-3 font-bold">Előrehaladás</th>
                        <th className="pb-3 font-bold">Jelenlegi Fázis</th>
                        <th className="pb-3 font-bold">Időráfordítás</th>
                        <th className="pb-3 font-bold">Pontszám</th>
                        <th className="pb-3 font-bold">Hibák</th>
                        <th className="pb-3 font-bold">Állapot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {displayedStudents.map((s, sIdx) => (
                        <tr key={`${s.courseId || 'c'}-${s.userId || 'u'}-${sIdx}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5">
                            <div className="font-bold text-gray-900 dark:text-white">{s.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{s.email}</div>
                          </td>
                          {selectedCourseId === 'all' && (
                            <td className="py-3.5 font-medium text-gray-700 dark:text-gray-300">
                              {s.courseTitle || 'Kurzus'}
                            </td>
                          )}
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${s.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${s.progressPercent}%` }}
                                />
                              </div>
                              <span className="font-bold text-[11px] text-gray-800 dark:text-gray-200">
                                {s.progressPercent}% ({s.completedPhasesCount}/{s.totalPhasesCount})
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 font-bold text-gray-700 dark:text-gray-300">
                            {s.currentPhaseTitle}
                          </td>
                          <td className="py-3.5 font-bold text-gray-700 dark:text-gray-300">
                            {s.timeSpentMinutes} perc
                          </td>
                          <td className="py-3.5 font-black text-gray-900 dark:text-white">
                            {s.points} pont
                          </td>
                          <td className="py-3.5">
                            <span className={`font-bold ${s.totalMistakes >= 3 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-300'}`}>
                              {s.totalMistakes} hiba
                            </span>
                          </td>
                          <td className="py-3.5">
                            {s.status === 'completed' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                ✅ Befejezve
                              </span>
                            ) : s.status === 'struggling' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                ⚠️ Elakadt (Sok hiba)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                ⏳ Folyamatban
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

            {/* Exercise Types Effectiveness Cards */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  <span>Feladattípusok Sikeressége & Nehézsége</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Mely feladattípusoknál akadnak el a diákok a leggyakrabban (átlagos pontosság és feladatidő)?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data?.coursesEvaluation?.phaseTypeEffectiveness || []).map((pt) => {
                  const isHard = pt.avgAccuracy < 75;
                  const label =
                    pt.sourceView === 'quiz'
                      ? 'Kvíz & Teszt'
                      : pt.sourceView === 'debug'
                      ? 'Kód Hibakeresés (Debug)'
                      : pt.sourceView === 'gap-fill'
                      ? 'Hiánypótlás'
                      : pt.sourceView === 'control'
                      ? 'Interaktív Irányítás'
                      : pt.sourceView === 'match'
                      ? 'Párosítás'
                      : pt.sourceView === 'order'
                      ? 'Sorrendezés'
                      : pt.sourceView === 'alive'
                      ? 'Önálló Kódolás'
                      : pt.sourceView;

                  return (
                    <div
                      key={pt.sourceView}
                      className={`p-5 rounded-2xl border transition-all ${
                        isHard
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          {label}
                        </span>
                        {isHard && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Nehéz fázis
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-montserrat text-gray-900 dark:text-white">
                          {pt.avgAccuracy}%
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          Átl. {Math.round(pt.avgDurationSec / 60 * 10) / 10} perc
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isHard ? 'bg-amber-500' : 'bg-[#269984]'}`}
                          style={{ width: `${pt.avgAccuracy}%` }}
                        />
                      </div>

                      <div className="mt-3 text-[11px] text-gray-500 flex justify-between">
                        <span>{pt.totalPhases} feladat</span>
                        <span>{pt.totalMistakes} hiba</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metacognitive Confidence vs Accuracy Matrix */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <span>Diák Magabiztosság & Valós Tudás Mátrix</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tudják-e a diákok, hogy mikor tudják a helyes választ, vagy magabiztosan tévednek?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Magabiztos Tudás (Mastery)
                  </span>
                  <div className="text-3xl font-black font-montserrat text-emerald-600 dark:text-emerald-400">
                    {data?.pedagogy?.confidenceMatrix.mastery ?? 62}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Biztos volt benne és helyesen oldotta meg.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Magabiztos Tévedés (Overconfidence)
                  </span>
                  <div className="text-3xl font-black font-montserrat text-rose-600 dark:text-rose-400">
                    {data?.pedagogy?.confidenceMatrix.overconfidence ?? 14}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Biztos volt a hibás válaszában (a legveszélyesebb tévhit).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Bizonytalan Helyes (Hesitant)
                  </span>
                  <div className="text-3xl font-black font-montserrat text-blue-600 dark:text-blue-400">
                    {data?.pedagogy?.confidenceMatrix.hesitant ?? 16}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Helyesen válaszolt, de nem bízott a tudásában.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Felismert Hiányosság (Recognized Gap)
                  </span>
                  <div className="text-3xl font-black font-montserrat text-amber-600 dark:text-amber-400">
                    {data?.pedagogy?.confidenceMatrix.recognizedGap ?? 8}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tudta, hogy bizonytalan, és tévedett (nyitott a segítségre).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 2: HIBAELEMZÉS: HOL ÉS MIÉRT HIBÁZNAK?                      */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'mistakes' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header & In-tab search & filter toolbar */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <span>Diák Hibagócok & Tévhitek Elemzése (Hol és Miért?)</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pontos helyszínek, elakadás előtti gondolkodási idők, kód összehasonlítások és tanári javaslatok
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                  <span>{filteredMistakes.length} azonosított hibagóc</span>
                </div>
              </div>

              {/* Search & Confidence Filter in Mistake Tab */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Keresés hibatípus, kurzus, vagy kódkulcsszó szerint..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#269984]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={mistakeConfidenceFilter}
                    onChange={(e) => setMistakeConfidenceFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#269984]"
                  >
                    <option value="all">Minden hibajelleg</option>
                    <option value="overconfident">Magabiztos tévedések</option>
                    <option value="hesitant">Bizonytalan hezitálások</option>
                    <option value="blind_guess">Vak tippek / Elsietett válaszok</option>
                    <option value="misconception">Fogalmi tévhitek</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List of Detailed Mistake Cards */}
            {filteredMistakes.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                  Nincs megjeleníthető hibagóc
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  A megadott szűrők alapján nem található rögzített diákhiba, vagy a diákok minden feladatot sikeresen megoldottak!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredMistakes.map((hotspot, idx) => {
                  const confBadge =
                    hotspot.confidenceType === 'overconfident' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Magabiztos Tévedés
                      </span>
                    ) : hotspot.confidenceType === 'hesitant' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Bizonytalan Hezitálás
                      </span>
                    ) : hotspot.confidenceType === 'blind_guess' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Elsietett Tipp
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Fogalmi Tévhit
                      </span>
                    );

                  return (
                    <div
                      key={hotspot.id || idx}
                      className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 shadow-sm space-y-5 hover:border-teal-500/30 transition-all"
                    >
                      {/* Top Badges & Context (WHERE) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#269984]/10 text-[#269984] border border-[#269984]/20 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {hotspot.courseTitle}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                            {hotspot.sourceView === 'debug'
                              ? 'Kód Hibakeresés'
                              : hotspot.sourceView === 'quiz'
                              ? 'Kvízkérdés'
                              : hotspot.sourceView === 'match'
                              ? 'Párosítás'
                              : hotspot.sourceView === 'order'
                              ? 'Sorrendezés'
                              : hotspot.sourceView === 'gap-fill'
                              ? 'Hiánypótlás'
                              : hotspot.sourceView === 'control'
                              ? 'Irányítási lépés'
                              : hotspot.sourceView === 'alive'
                              ? 'Önálló Kódolás'
                              : hotspot.sourceView}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400">
                            {hotspot.difficulty === 'Beginner' ? 'Kezdő' : hotspot.difficulty === 'Intermediate' ? 'Közép' : 'Haladó'}
                          </span>
                        </div>

                        {confBadge}
                      </div>

                      {/* Problem Title & Explanation (WHY) */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="text-rose-500 font-black">#{idx + 1}</span>
                          <span>{hotspot.title}</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                          {hotspot.description}
                        </p>
                      </div>

                      {/* Code / Answer Comparison (if available) */}
                      {(hotspot.sampleExpected || hotspot.sampleActual) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                              ✓ Helyes / Várt Megoldás
                            </span>
                            <code>{hotspot.sampleExpected || '–'}</code>
                          </div>
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                              ✗ Gyakori Diákhiba / Kiválasztott Válasz
                            </span>
                            <code>{hotspot.sampleActual || '–'}</code>
                          </div>
                        </div>
                      )}

                      {/* Metrics Bar (Time before mistake, Frequency, Mistake Count) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                          <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-400 block">Gondolkodási idő a hiba előtt</span>
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                              {hotspot.avgHesitationSec} mp reflexió
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-400 block">Érintett diákok aránya</span>
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                              {hotspot.affectedLearnersPercent}% a tanulóknak
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                          <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-400 block">Rögzített hibák száma</span>
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                              {hotspot.mistakeCount} alkalommal
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pedagogical Recommendation (Actionable Teaching Tip) */}
                      <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-500/20 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#269984] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#269984]">
                            Pedagógiai Útmutató az Oktatónak:
                          </h5>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                            {hotspot.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 3: LÉPÉS- & IDŐELEMZÉS (TÖLCSÉR ÉS LEMORZSOLÓDÁS)            */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'time_funnel' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Course Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#269984]" />
                  <span>Lépésenkénti Idő & Lemorzsolódási Elemzés</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Válassz ki egy kurzust a lépésenkénti idő és a tanulói lemorzsolódás megtekintéséhez
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kiválasztott kurzus:</span>
                <span className="px-3.5 py-1.5 rounded-xl bg-[#269984]/10 text-[#269984] text-xs font-bold border border-[#269984]/20 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeCourse?.title || 'Összes kurzus'}
                </span>
              </div>
            </div>

            {activeCourse ? (
              <>
                {/* 4 Course Executive Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-emerald-500/20 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Befejezési Arány
                      </span>
                      <Award className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
                      {activeCourse.completionRate}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeCourse.completedCount} / {activeCourse.enrolledCount} beiratkozott diák végezte el
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-blue-500/20 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Valós vs Tervezett Idő
                      </span>
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
                      {activeCourse.actualAvgMinutes} perc
                    </div>
                    <p className="text-xs text-gray-500">
                      Tervezett: {activeCourse.estimatedMinutes} perc ({activeCourse.pacingRatio}x tempó)
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-purple-500/20 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Kabala Megtartási Hatás
                      </span>
                      <Bot className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-black font-montserrat text-purple-600 dark:text-purple-400">
                      +{activeCourse.mascotRetentionBoost}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Magasabb befejezési arány segítségkérés esetén ({activeCourse.mascotInteractionsTotal} interakció)
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-[#269984]/20 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#269984]">
                        Minőségi Index
                      </span>
                      <Flame className="w-5 h-5 text-[#269984]" />
                    </div>
                    <div className="text-3xl font-black font-montserrat text-[#269984]">
                      {activeCourse.qualityIndex} / 100
                    </div>
                    <p className="text-xs text-gray-500">
                      Átlagos pontszám: {activeCourse.avgScore} pont ({activeCourse.totalMistakes} összes hiba)
                    </p>
                  </div>
                </div>

                {/* Step Drop-off Funnel Analysis */}
                <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-[#269984]" />
                      <span>Fázisonkénti Lemorzsolódási Tölcsér ({activeCourse.title})</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Megmutatja, hogy a tanulók hány százaléka jut el az egyes lépésekig, és hol lépnek ki a kurzusból
                    </p>
                  </div>

                  {activeCourse.dropoffFunnel && activeCourse.dropoffFunnel.length > 0 ? (
                    <div className="space-y-4">
                      {activeCourse.dropoffFunnel.map((step, idx) => (
                        <div key={`${step.phaseId || 'step'}-${idx}`} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{step.title}</span>
                              <span className="text-[10px] text-gray-400 uppercase font-normal">
                                ({step.sourceView})
                              </span>
                              {step.isBottleneck && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Elakadási pont!
                                </span>
                              )}
                            </span>
                            <span className="font-extrabold text-[#269984]">{step.retentionRate}%</span>
                          </div>

                          <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                step.isBottleneck
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  : 'bg-gradient-to-r from-teal-500 to-[#269984]'
                              }`}
                              style={{ width: `${step.retentionRate}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                            <span>Átlagos idő: {step.avgTimeMinutes} perc</span>
                            <span>{step.mistakeCount} hiba rögzítve</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nincsenek elérhető fázisadatok ehhez a kurzushoz.</p>
                  )}
                </div>

                {/* Detailed Phase-by-Phase Pedagogical Report Table */}
                <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#269984]" />
                        <span>Részletes Lépéselemzés & Módszertani Diagnózis</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Fázisonkénti megtartási arány, feladattípus, időráfordítás, hibák száma és oktatói javaslat
                      </p>
                    </div>

                    <div className="text-xs font-bold text-gray-500">
                      {activeCourse.dropoffFunnel?.length || 0} fázis vizsgálva
                    </div>
                  </div>

                  {activeCourse.dropoffFunnel && activeCourse.dropoffFunnel.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-montserrat">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider text-[11px]">
                            <th className="pb-3 font-bold">Lépés / Fázis</th>
                            <th className="pb-3 font-bold">Típus</th>
                            <th className="pb-3 font-bold">Megtartás (Retention)</th>
                            <th className="pb-3 font-bold">Átl. Idő</th>
                            <th className="pb-3 font-bold">Hibák</th>
                            <th className="pb-3 font-bold">Diagnózis</th>
                            <th className="pb-3 font-bold">Pedagógiai Javaslat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {activeCourse.dropoffFunnel.map((step, idx) => {
                            const prevStep = idx > 0 ? activeCourse.dropoffFunnel[idx - 1] : null;
                            const dropDelta = prevStep ? prevStep.retentionRate - step.retentionRate : 0;
                            const typeLabel =
                              step.sourceView === 'quiz'
                                ? 'Kvíz & Teszt'
                                : step.sourceView === 'debug'
                                ? 'Debug Kód'
                                : step.sourceView === 'gap-fill'
                                ? 'Hiánypótlás'
                                : step.sourceView === 'control'
                                ? 'Irányítás'
                                : step.sourceView === 'match'
                                ? 'Párosítás'
                                : step.sourceView === 'order'
                                ? 'Sorrendezés'
                                : step.sourceView === 'alive'
                                ? 'Önálló Kódolás'
                                : step.sourceView;

                            return (
                              <tr
                                key={`${step.phaseId || 'step'}-${idx}`}
                                className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span>{step.title}</span>
                                  </div>
                                </td>
                                <td className="py-3.5">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                    {typeLabel}
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#269984]">{step.retentionRate}%</span>
                                    {dropDelta > 0 && (
                                      <span className="text-[10px] text-rose-500 font-bold">
                                        (-{dropDelta}%)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 font-bold text-gray-700 dark:text-gray-300">
                                  {step.avgTimeMinutes} perc
                                </td>
                                <td className="py-3.5">
                                  <span
                                    className={`font-bold ${
                                      step.mistakeCount > 5
                                        ? 'text-rose-500'
                                        : step.mistakeCount > 0
                                        ? 'text-amber-500'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {step.mistakeCount} db
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  {step.isBottleneck || step.status === 'bottleneck' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                      🚨 Elakadási pont
                                    </span>
                                  ) : step.status === 'high_mistakes' || step.mistakeCount >= 8 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      ⚠️ Magas hibaszám
                                    </span>
                                  ) : step.retentionRate >= 80 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      ✅ Stabil haladás
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      Normál ütem
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 text-gray-600 dark:text-gray-300 text-[11px] max-w-xs">
                                  {step.recommendation || (
                                    step.isBottleneck
                                      ? 'Érdemes ezt a lépést közösen átbeszélni a csoporttal vagy több magyarázó tippet adni.'
                                      : 'A feladat világos a diákok számára, önállóan is jól haladnak vele.'
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nincsenek elérhető fázisadatok ehhez a kurzushoz.</p>
                  )}
                </div>

                {/* Pedagogical Summary & Action Plan Card */}
                <div className="bg-gradient-to-br from-[#269984]/5 via-white to-blue-500/5 dark:from-[#269984]/10 dark:via-[#121212] dark:to-blue-500/10 border border-[#269984]/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#269984]/10 text-[#269984] flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white">
                        Oktatói Értékelő Összegzés: {activeCourse.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Gyakorlati tanulságok és javasolt teendők a diákok valós teljesítménye alapján
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Kritikus Fázis</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {activeCourse.dropoffFunnel?.find((s) => s.isBottleneck)?.title || 'Nincs kritikus lemorzsolódás'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeCourse.dropoffFunnel?.some((s) => s.isBottleneck)
                          ? 'Ennél a lépésnél tapasztalható a legnagyobb lemorzsolódás vagy a legtöbb hiba.'
                          : 'A diákok egyenletesen és stabilan haladnak végig az összes feladaton.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        <Clock className="w-4 h-4" />
                        <span>Időgazdálkodás</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {activeCourse.pacingRatio <= 0.7
                          ? 'Gyors, lendületes haladás'
                          : activeCourse.pacingRatio <= 1.3
                          ? 'Ideális tervezett tempó'
                          : 'Lassabb, elmélyült tanulás'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Valós: {activeCourse.actualAvgMinutes} perc (tervezett: {activeCourse.estimatedMinutes} perc, szorzó: {activeCourse.pacingRatio}x).
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Lightbulb className="w-4 h-4" />
                        <span>Módszertani Teendő</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {activeCourse.completionRate < 50
                          ? 'Gyakorló feladatok beiktatása'
                          : 'Témakör sikeresen elsajátítva'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeCourse.completionRate < 50
                          ? 'Javasolt az elakadási pontok közös átismétlése a következő óra elején.'
                          : 'A csoport nagy része sikeresen vette az akadályokat, jöhet a következő kurzus!'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Nincs kiválasztott kurzus.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  borderColor,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  loading: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#121212] border ${borderColor} rounded-3xl p-6 shadow-sm transition-all hover:shadow-md`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentColor} rounded-bl-full pointer-events-none`}
      />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-montserrat uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            {icon}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-3xl font-black font-montserrat tracking-tight text-gray-900 dark:text-white">
              {value}
            </h3>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
