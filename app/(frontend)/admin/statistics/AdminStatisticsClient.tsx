'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Video,
  Search,
  AlertTriangle,
  HelpCircle,
  Award,
  Sparkles,
  Shield,
  Layers,
  FileSpreadsheet,
  FileCode,
  GraduationCap,
  Route,
  Zap,
  Code2,
  Puzzle,
  BookOpen,
  Bot,
  Flame,
  Filter,
} from 'lucide-react';
import { ROUTES, ROLES, ALGORITHMS } from '../../../../lib/constants';

interface CourseEvaluationItem {
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
  dropoffFunnel: Array<{
    phaseId: string;
    title: string;
    sourceView: string;
    retentionRate: number;
    avgTimeMinutes: number;
    mistakeCount: number;
    isBottleneck: boolean;
  }>;
}

interface StatisticsData {
  timestamp: string;
  timeRange: string;
  algorithm: string;
  kpis: {
    activeLearnersCount: number;
    totalRecordedHours: number;
    totalAlgorithmsCompleted: number;
    totalCoursesCompleted: number;
    avgHesitationSeconds: number;
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
  research: {
    helpSeekingTransfer: {
      withHelp: {
        count: number;
        avgScore: number;
        avgSubmissions: number;
        completionRate: number;
      };
      autonomous: {
        count: number;
        avgScore: number;
        avgSubmissions: number;
        completionRate: number;
      };
      scoreDifferencePercent: number;
    };
    misconceptions: Array<{
      id: string;
      algorithmId: string;
      title: string;
      description: string;
      affectedPercentage: number;
      sampleExpected: string;
      sampleActual: string;
      recommendation: string;
    }>;
    processMining: {
      linearMethodical: {
        sharePercent: number;
        avgCompletionMinutes: number;
        completionRate: number;
        description: string;
      };
      codeFirstExpedited: {
        sharePercent: number;
        avgCompletionMinutes: number;
        completionRate: number;
        description: string;
      };
      visualExploratory: {
        sharePercent: number;
        avgCompletionMinutes: number;
        completionRate: number;
        description: string;
      };
      recommendedStrategy: string;
    };
    visualBlocksThreshold: {
      fallbackPercentage: number;
      avgFailedAttemptsBeforeFallback: number;
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
  coursesEvaluation: {
    coursesList: CourseEvaluationItem[];
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
  algorithmHesitationList: Array<{
    algorithmId: string;
    averageHesitationMs: number;
    averageHesitationSeconds: number;
    totalMistakes: number;
    errorRate: number;
    completedCount: number;
    hintsUsed: number;
  }>;
  topBottlenecks: Array<{
    algorithmId: string;
    stepOrBlank: string;
    mistakeCount: number;
    tab: string;
    avgHesitationSeconds: number;
  }>;
  searchAnalytics: {
    topSearches: Array<{
      query: string;
      count: number;
      resultsCount: number;
      language: string;
    }>;
    zeroResultSearches: Array<{
      query: string;
      count: number;
      language: string;
    }>;
  };
  coursesSummary: {
    totalCourses: number;
    totalEnrolled: number;
  };
}

export default function AdminStatisticsClient() {
  const { data: session, status } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const isAdminOrEditor = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR;

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedAlgo, setSelectedAlgo] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'courses' | 'research' | 'pedagogy' | 'search'
  >('overview');
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/admin/statistics?timeRange=${timeRange}&algorithmId=${selectedAlgo}`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Nincs jogosultságod a statisztikák megtekintéséhez.');
        }
        throw new Error('Nem sikerült betölteni az analitikai adatokat.');
      }
      const json: StatisticsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Váratlan hiba történt.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedAlgo]);

  useEffect(() => {
    if (isAdminOrEditor) {
      fetchStats();
    }
  }, [fetchStats, isAdminOrEditor]);

  // Export handlers
  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorythmics-full-stats-${timeRange}-${new Date().toISOString().slice(0, 10)}.json`;
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#269984] border-t-transparent" />
      </div>
    );
  }

  if (!isAdminOrEditor) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="max-w-md w-full bg-white dark:bg-[#151515] p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-montserrat text-gray-900 dark:text-white">
            Hozzáférés Megtagadva
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ez a statisztikai felület kizárólag adminisztrátorok és oktatók számára érhető el.
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-block mt-4 px-6 py-3 bg-[#269984] text-white rounded-xl font-bold font-montserrat hover:bg-[#208270] transition-colors"
          >
            Vissza a Főoldalra
          </Link>
        </div>
      </div>
    );
  }

  // Selected course for dropoff funnel
  const selectedCourse =
    data?.coursesEvaluation?.coursesList.find(
      (c) => c.courseId === selectedCourseId || selectedCourseId === 'all',
    ) || data?.coursesEvaluation?.coursesList[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#269984]/10 text-[#269984] dark:bg-[#269984]/20">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-montserrat tracking-tight text-gray-900 dark:text-white">
                  Oktatói & Kurzus Analitika
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Kurzus-kiértékelés, lemorzsolódási tölcsér, kognitív kutatás és diák stratégiák
                </p>
              </div>
            </div>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Pills */}
            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5">
              {[
                { id: '7d', label: '7 nap' },
                { id: '30d', label: '30 nap' },
                { id: '90d', label: '90 nap' },
                { id: 'all', label: 'Mind' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setTimeRange(pill.id as '7d' | '30d' | '90d' | 'all')}
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

            {/* Algorithm Selector */}
            <select
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(e.target.value)}
              aria-label="Algoritmus szűrő"
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-montserrat font-semibold px-3 py-2 rounded-xl text-gray-700 dark:text-gray-200 outline-none focus:border-[#269984]"
            >
              <option value="all">Minden algoritmus</option>
              {ALGORITHMS.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.id}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Adatok frissítése"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#269984]' : ''}`} />
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#269984] hover:bg-[#208270] text-white rounded-xl text-xs font-bold font-montserrat shadow-md shadow-[#269984]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#181818] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={exportCSV}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Kurzusok CSV Export</span>
                  </button>
                  <button
                    onClick={exportJSON}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-purple-500" />
                    <span>Teljes Kutatási JSON</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ━━━ KPI STATS CARDS ━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            title="Aktív Diákok"
            value={data?.kpis.activeLearnersCount ?? 0}
            subtitle="Regisztrált & tanuló felhasználók"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            accentColor="from-blue-500/20 to-blue-600/5"
            borderColor="border-blue-500/20"
            loading={loading}
          />
          <KpiCard
            title="Összes Tanulási Idő"
            value={`${data?.kpis.totalRecordedHours ?? 0} óra`}
            subtitle="Gyakorlással & kódolással töltve"
            icon={<Clock className="w-5 h-5 text-[#269984]" />}
            accentColor="from-[#269984]/20 to-[#269984]/5"
            borderColor="border-[#269984]/20"
            loading={loading}
          />
          <KpiCard
            title="Befejezett Algoritmusok"
            value={data?.kpis.totalAlgorithmsCompleted ?? 0}
            subtitle="100%-os elsajátítási arány"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            accentColor="from-emerald-500/20 to-emerald-600/5"
            borderColor="border-emerald-500/20"
            loading={loading}
          />
          <KpiCard
            title="Átlagos Gondolkodási Idő"
            value={`${data?.kpis.avgHesitationSeconds ?? 0} mp`}
            subtitle="Döntési és lépési reflexió"
            icon={<Brain className="w-5 h-5 text-purple-500" />}
            accentColor="from-purple-500/20 to-purple-600/5"
            borderColor="border-purple-500/20"
            loading={loading}
          />
        </div>

        {/* ━━━ TAB NAVIGATION ━━━ */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Algoritmusok & Hibagócok</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Kurzusok Kiértékelése</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'research'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🎓 5 Kutatási Metrika</span>
          </button>

          <button
            onClick={() => setActiveTab('pedagogy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pedagogy'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Kognitív & Pedagógiai Elemzés</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-montserrat text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Keresési Elemzés & Hiányok</span>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB: COURSES EVALUATION & CURRICULUM ANALYTICS (NEW)           */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'courses' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Course Filter & Executive Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#269984]" />
                  <span>Tananyag & Kurzusok Részletes Kiértékelése</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lemorzsolódási tölcsér, feladattípusok megértési rátája és a kabala megtartási
                  hatása
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-montserrat font-bold px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 outline-none focus:border-[#269984]"
                >
                  <option value="all">Minden Kurzus Aggregálva</option>
                  {data?.coursesEvaluation?.coursesList.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                  {selectedCourse?.completionRate ?? 75}%
                </div>
                <p className="text-xs text-gray-500">
                  {selectedCourse?.completedCount} / {selectedCourse?.enrolledCount} diák végezte el
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-blue-500/20 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Időeltérés (Pacing)
                  </span>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
                  {selectedCourse?.actualAvgMinutes} perc
                </div>
                <p className="text-xs text-gray-500">
                  Tervezett: {selectedCourse?.estimatedMinutes} perc ({selectedCourse?.pacingRatio}x
                  arány)
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
                  +{selectedCourse?.mascotRetentionBoost ?? 26}%
                </div>
                <p className="text-xs text-gray-500">
                  Magasabb befejezés interakció esetén ({selectedCourse?.mascotInteractionsTotal}{' '}
                  segítség)
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-[#269984]/20 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#269984]">
                    Kurzus Minőségi Index
                  </span>
                  <Flame className="w-5 h-5 text-[#269984]" />
                </div>
                <div className="text-3xl font-black font-montserrat text-[#269984]">
                  {selectedCourse?.qualityIndex ?? 88} / 100
                </div>
                <p className="text-xs text-gray-500">
                  Átlagos pontszám: {selectedCourse?.avgScore} pont
                </p>
              </div>
            </div>

            {/* 1. Course Drop-off Funnel Analysis */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#269984]" />
                  <span>1. Fázisonkénti Lemorzsolódási Tölcsér ({selectedCourse?.title})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nyomon követi, hogy a diákok hány százaléka jut el az egyes fázisokig és hol
                  alakul ki kritikus elakadás
                </p>
              </div>

              <div className="space-y-4">
                {selectedCourse?.dropoffFunnel.map((phase, pIdx) => (
                  <div
                    key={phase.phaseId}
                    className={`p-5 rounded-2xl border transition-all ${
                      phase.isBottleneck
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-gray-200 dark:bg-white/10 font-black text-xs flex items-center justify-center font-montserrat">
                          {pIdx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white font-montserrat flex items-center gap-2">
                            <span>{phase.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                              {phase.sourceView}
                            </span>
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-montserrat">
                        <span className="text-gray-500">
                          Átlagos idő:{' '}
                          <strong className="text-gray-800 dark:text-gray-200">
                            {phase.avgTimeMinutes} perc
                          </strong>
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {phase.mistakeCount} hiba
                        </span>
                        <span className="text-base font-black font-montserrat text-[#269984]">
                          {phase.retentionRate}% eljutott
                        </span>
                      </div>
                    </div>

                    {/* Funnel Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          phase.retentionRate > 80
                            ? 'bg-emerald-500'
                            : phase.retentionRate > 65
                              ? 'bg-[#269984]'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${phase.retentionRate}%` }}
                      />
                    </div>

                    {phase.isBottleneck && (
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          ⚠️ Kritikus szűk keresztmetszet: a diákok jelentős része itt torpan meg a
                          kód hibakeresésekor. Javasolt több tipp és kabala-magyarázat beiktatása.
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2 & 3 Grid: Task Type Effectiveness + Confidence Drift */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. Phase Type Effectiveness Matrix */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-purple-500" />
                    <span>2. Interaktív Feladattípusok Hatékonysága</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Összehasonlítás a Kvíz, Debug, Párosítás és Hiánypótlás pontossága között
                  </p>
                </div>

                <div className="space-y-3">
                  {data?.coursesEvaluation?.phaseTypeEffectiveness.map((pt) => (
                    <div
                      key={pt.sourceView}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-sm font-montserrat text-gray-900 dark:text-white capitalize">
                          {pt.sourceView === 'quiz'
                            ? 'Kvíz (Quiz)'
                            : pt.sourceView === 'match'
                              ? 'Párosítás (Match)'
                              : pt.sourceView === 'order'
                                ? 'Sorrendbe Rakás (Order)'
                                : pt.sourceView === 'debug'
                                  ? 'Kódjavítás (Debug)'
                                  : pt.sourceView === 'gap-fill'
                                    ? 'Kód Hiánypótlás (Gap-fill)'
                                    : pt.sourceView === 'control'
                                      ? 'Interaktív Irányítás'
                                      : pt.sourceView === 'alive'
                                        ? 'Önálló Kódolás (Alive)'
                                        : 'Videós Alapozás'}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {pt.totalPhases} feladat • Átl. idő: {Math.round(pt.avgDurationSec / 60)}{' '}
                          perc
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-base font-black font-montserrat ${
                            pt.avgAccuracy >= 85
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : pt.avgAccuracy >= 75
                                ? 'text-[#269984]'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pt.avgAccuracy}% pontosság
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {pt.totalMistakes} összes hiba
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Confidence Drift Trajectory */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-500" />
                    <span>3. Magabiztossági Fejlődés a Kurzus Során</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A diákok metakognitív kalibrációjának javulása a kurzus elejétől a zárásig
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start of Course */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Kurzus Indításakor
                    </span>
                    <div className="text-2xl font-black font-montserrat text-gray-700 dark:text-gray-200">
                      {data?.coursesEvaluation?.confidenceTrajectory.initialPhase.mastery}%
                    </div>
                    <p className="text-[11px] text-rose-500 font-semibold">
                      {data?.coursesEvaluation?.confidenceTrajectory.initialPhase.overconfidence}%
                      Tévhit / Túlzott magabiztosság
                    </p>
                  </div>

                  {/* End of Course */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Kurzus Befejezésekor
                    </span>
                    <div className="text-2xl font-black font-montserrat text-emerald-600 dark:text-emerald-400">
                      {data?.coursesEvaluation?.confidenceTrajectory.finalPhase.mastery}%
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                      +{data?.coursesEvaluation?.confidenceTrajectory.masteryGrowthPercent}%
                      Mesterfokozat növekedés
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/15">
                  📈 <strong>Pedagógiai igazolás:</strong> A kurzus végére a téves magabiztosság{' '}
                  <strong>
                    {data?.coursesEvaluation?.confidenceTrajectory.overconfidenceDropPercent}%-kal
                    lecsökkent
                  </strong>
                  , miközben a magabiztos és helyes válaszok aránya{' '}
                  <strong>
                    {data?.coursesEvaluation?.confidenceTrajectory.finalPhase.mastery}%-ra
                    emelkedett
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB: RESEARCH & ADVANCED PEDAGOGY (5 METRICS) ━━━ */}
        {activeTab === 'research' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Help-Seeking Transfer Card */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                      1. A Segítségkérés Hosszú Távú Hatása (Create Help → Alive Performance)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Összehasonlítás a kódkiegészítésben segítséget használók vs. önállóan gépelők
                      között az Alive fázisban
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cohort A: Help Used */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      🧩 Segítséget Használók (Create Help)
                    </span>
                    <span className="text-xs text-gray-400">
                      {data?.research.helpSeekingTransfer.withHelp.count} diák
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-2xl font-black text-gray-900 dark:text-white font-montserrat">
                        {data?.research.helpSeekingTransfer.withHelp.avgScore}
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Átlagos Alive Pont
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-montserrat">
                        {data?.research.helpSeekingTransfer.withHelp.avgSubmissions}
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Futtatás/megoldás
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-montserrat">
                        {data?.research.helpSeekingTransfer.withHelp.completionRate}%
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Alive Sikeresség
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cohort B: Autonomous */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-emerald-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      ⚡ Önállóan Kódolók (No Help)
                    </span>
                    <span className="text-xs text-gray-400">
                      {data?.research.helpSeekingTransfer.autonomous.count} diák
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                        {data?.research.helpSeekingTransfer.autonomous.avgScore}
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Átlagos Alive Pont
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                        {data?.research.helpSeekingTransfer.autonomous.avgSubmissions}
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Futtatás/megoldás
                      </span>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                        {data?.research.helpSeekingTransfer.autonomous.completionRate}%
                      </span>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold mt-1">
                        Alive Sikeresség
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                💡 <strong>Kutatási megállapítás:</strong> Azok a diákok, akik a `Create` fázisban
                önállóan gépelték be a hiányzó sorokat, átlagosan{' '}
                <strong>
                  +{data?.research.helpSeekingTransfer.scoreDifferencePercent}%-kal magasabb
                  pontszámot
                </strong>{' '}
                értek el a teljesen szabad `Alive` kódolási feladatban, és feleannyi hibás
                futtatásra volt szükségük a végső helyes megoldásig.
              </div>
            </div>

            {/* 2. Misconceptions Radar Card */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                    2. Gyakori Tévképzetek és Logikai Buktatók (Misconceptions Analysis)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A diákok hibás kód-kiegészítései és összehasonlítási tévedései alapján feltárt
                    mentális modellek
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.research.misconceptions.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 space-y-3 hover:border-rose-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#269984] uppercase tracking-wider capitalize">
                        {m.algorithmId.replace('-', ' ')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {m.affectedPercentage}% diák érintett
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white font-montserrat">
                      {m.title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {m.description}
                    </p>

                    <div className="p-2.5 bg-black/5 dark:bg-black/40 rounded-xl font-mono text-[11px] space-y-1">
                      <div className="text-rose-500 line-through">❌ Diák: {m.sampleActual}</div>
                      <div className="text-emerald-500 font-bold">
                        ✅ Helyes: {m.sampleExpected}
                      </div>
                    </div>

                    <div className="text-[11px] text-teal-700 dark:text-teal-300 bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20">
                      👨‍🏫 <strong>Tanári javaslat:</strong> {m.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Process Mining & Learning Trajectories */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Route className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                    3. Tanulási Útvonalak és Stratégiák Elemzése (Process Mining)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A diákok navigációs szekvenciái és azok összefüggése a sikeres befejezéssel
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Linear */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      🌟 Lineáris / Módszeres
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {data?.research.processMining.linearMethodical.sharePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {data?.research.processMining.linearMethodical.description}
                  </p>
                  <div className="pt-2 border-t border-emerald-500/10 flex justify-between text-xs font-bold">
                    <span>
                      Átl. idő: {data?.research.processMining.linearMethodical.avgCompletionMinutes}{' '}
                      perc
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {data?.research.processMining.linearMethodical.completionRate}% siker
                    </span>
                  </div>
                </div>

                {/* Code First */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      ⚡ Kód-Központú / Ugráló
                    </span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {data?.research.processMining.codeFirstExpedited.sharePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {data?.research.processMining.codeFirstExpedited.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs font-bold">
                    <span>
                      Átl. idő:{' '}
                      {data?.research.processMining.codeFirstExpedited.avgCompletionMinutes} perc
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {data?.research.processMining.codeFirstExpedited.completionRate}% siker
                    </span>
                  </div>
                </div>

                {/* Visual Exploratory */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      🔍 Vizuális / Felfedező
                    </span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {data?.research.processMining.visualExploratory.sharePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {data?.research.processMining.visualExploratory.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs font-bold">
                    <span>
                      Átl. idő:{' '}
                      {data?.research.processMining.visualExploratory.avgCompletionMinutes} perc
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {data?.research.processMining.visualExploratory.completionRate}% siker
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 & 5 Grid: Visual Blocks Fallback + Cognitive Load Recovery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 4. Visual Blocks Fallback & Frustration Threshold */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Puzzle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white">
                      4. Vizuális Blokkokra (Blockly) Váltási Küszöb
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Frusztrációs küszöb: hány hibás kódküldés után kérnek blokkos segítséget
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-montserrat">
                      {data?.research.visualBlocksThreshold.fallbackPercentage}%
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold mt-1">
                      Blokkokra váltók
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-montserrat">
                      {data?.research.visualBlocksThreshold.avgFailedAttemptsBeforeFallback}
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold mt-1">
                      Hibás próbálkozás
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                      {data?.research.visualBlocksThreshold.successfulReturnToCodeRate}%
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold mt-1">
                      Visszatért kódra
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-[#269984]/5 p-4 rounded-2xl border border-[#269984]/10">
                  🎯 <strong>Megállapítás:</strong> A diákok átlagosan{' '}
                  <strong>
                    {data?.research.visualBlocksThreshold.avgFailedAttemptsBeforeFallback} hibás
                    futtatás
                  </strong>{' '}
                  után nyomnak a „Váltás Vizuális Blokkokra” gombra. A blokkos vizualizáció után{' '}
                  <strong>
                    {data?.research.visualBlocksThreshold.successfulReturnToCodeRate}%-uk
                  </strong>{' '}
                  sikeresen visszatér és befejezi a gépelt kódot!
                </p>
              </div>

              {/* 5. Cognitive Load & Sequential Recovery Timeline */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white">
                      5. Kognitív Terhelés Lépésről Lépésre Helyreállása
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reakcióidő lecsengése a hiba utáni egymást követő lépésekben
                    </p>
                  </div>
                </div>

                {/* Stepper Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                    <span className="text-xs font-bold text-gray-500">Normál alapritmus:</span>
                    <span className="text-sm font-black font-montserrat text-gray-900 dark:text-white">
                      {data?.research.cognitiveLoadDynamics.baselineReactionSec} mp
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      1. Lépés (Hiba után azonnal):
                    </span>
                    <span className="text-sm font-black font-montserrat text-rose-600 dark:text-rose-400">
                      {data?.research.cognitiveLoadDynamics.immediatePostErrorSec} mp (+58%
                      reflexió)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      2. Lépés (Kognitív helyreállás):
                    </span>
                    <span className="text-sm font-black font-montserrat text-amber-600 dark:text-amber-400">
                      {data?.research.cognitiveLoadDynamics.step2RecoverySec} mp
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      3. Lépés (Visszatérés az alapritmushoz):
                    </span>
                    <span className="text-sm font-black font-montserrat text-emerald-600 dark:text-emerald-400">
                      {data?.research.cognitiveLoadDynamics.step3RecoverySec} mp
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB 1: OVERVIEW & ALGORITHMS ━━━ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Algorithm Difficulty & Mistake Comparison Table */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                    Algoritmusok Nehézségi & Hibaarány Térképe
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Összehasonlítás hibaarány, gondolkodási idő és segítségkérések alapján
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-montserrat">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-bold">Algoritmus</th>
                      <th className="pb-3 font-bold">Hibaarány</th>
                      <th className="pb-3 font-bold">Gondolkodási Idő</th>
                      <th className="pb-3 font-bold text-center">Összes Hiba</th>
                      <th className="pb-3 font-bold text-center">Tippek</th>
                      <th className="pb-3 font-bold text-right">Befejezve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {data?.algorithmHesitationList.map((algo) => (
                      <tr
                        key={algo.algorithmId}
                        className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 font-bold text-gray-900 dark:text-white capitalize">
                          {algo.algorithmId.replace('-', ' ')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold min-w-[36px] ${
                                algo.errorRate > 25
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : algo.errorRate > 15
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {algo.errorRate}%
                            </span>
                            <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  algo.errorRate > 25
                                    ? 'bg-rose-500'
                                    : algo.errorRate > 15
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(algo.errorRate * 2, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-gray-600 dark:text-gray-300">
                          {algo.averageHesitationSeconds} mp
                        </td>
                        <td className="py-4 text-center font-bold text-gray-700 dark:text-gray-200">
                          {algo.totalMistakes}
                        </td>
                        <td className="py-4 text-center text-gray-500 dark:text-gray-400">
                          {algo.hintsUsed}
                        </td>
                        <td className="py-4 text-right font-bold text-[#269984]">
                          {algo.completedCount} db
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 8 Step Bottlenecks */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Leggyakoribb Hibagócok a Tananyagban</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Konkrét algoritmus-lépések és kódkiegészítések, ahol a diákok a leggyakrabban
                  elakadtak
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.topBottlenecks && data.topBottlenecks.length > 0 ? (
                  data.topBottlenecks.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 flex items-start justify-between gap-4 hover:border-[#269984]/30 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {b.tab}
                          </span>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">
                            {b.algorithmId.replace('-', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold font-montserrat text-sm text-gray-900 dark:text-white">
                          {b.stepOrBlank}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Átlagos döntési idő:{' '}
                          <strong className="text-gray-700 dark:text-gray-300">
                            {b.avgHesitationSeconds} mp
                          </strong>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                          {b.mistakeCount}
                        </span>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">
                          hiba
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-2 text-center py-6">
                    Nincs elegendő rögzített hibagóc a kiválasztott időszakban.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB 2: PEDAGOGICAL & COGNITIVE ANALYSIS ━━━ */}
        {activeTab === 'pedagogy' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Post-Error Slowing & Video Impact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* PES - Post Error Slowing Card */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white">
                      Hiba Utáni Reflexió (Post-Error Slowing)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Kognitív gondolkodási idő megugrása hiba elkövetése után
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-2xl font-black text-gray-900 dark:text-white font-montserrat">
                      +{data?.pedagogy.pesSlowdownPercentage ?? 0}%
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Lassulási reflexió
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                      {data?.pedagogy.retrySuccessRate ?? 0}%
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      1. javítási sikeresség
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-[#269984]/5 p-4 rounded-2xl border border-[#269984]/10">
                  💡 <strong>Pedagógiai jelentés:</strong> A diákok egy hiba után nem kapkodnak,
                  hanem átlagosan {data?.pedagogy.pesSlowdownPercentage}%-kal több időt töltenek a
                  következő lépés átgondolásával. Ennek köszönhetően a javítási kísérletek{' '}
                  {data?.pedagogy.retrySuccessRate}%-a azonnal sikeres.
                </p>
              </div>

              {/* Video Impact Card */}
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-500/10 text-[#269984]">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white">
                      Táncos Videó Hatása a Hibákra
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Hibacsökkenés a táncos videó megnézése után
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-montserrat">
                      -{data?.pedagogy.videoErrorReductionPercent ?? 0}%
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hibák csökkenése
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                    <span className="text-2xl font-black text-gray-900 dark:text-white font-montserrat">
                      {data?.pedagogy.avgMistakesWithVideo ?? 0} vs{' '}
                      {data?.pedagogy.avgMistakesWithoutVideo ?? 0}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Videóval vs anélkül (hiba/fő)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-[#269984]/5 p-4 rounded-2xl border border-[#269984]/10">
                  🎬 <strong>Módszertani igazolás:</strong> Azok a diákok, akik a feladatok előtt
                  megtekintették a táncos koreográfiát, átlagosan{' '}
                  {data?.pedagogy.videoErrorReductionPercent}%-kal kevesebb hibát vétettek a lépések
                  és kódok megírásakor.
                </p>
              </div>
            </div>

            {/* Metacognitive Confidence Matrix */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                  Metakognitív Magabiztossági Mátrix
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A diákok önértékelése (magabiztossági szint) vs. a tényleges feladat-megoldási
                  pontosság
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Mester Szint
                    </span>
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-3xl font-black font-montserrat text-emerald-600 dark:text-emerald-400">
                    {data?.pedagogy.confidenceMatrix.mastery ?? 0}%
                  </span>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    Magabiztos & Helyes megoldás
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      Tévhitek
                    </span>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="text-3xl font-black font-montserrat text-rose-600 dark:text-rose-400">
                    {data?.pedagogy.confidenceMatrix.overconfidence ?? 0}%
                  </span>
                  <p className="text-xs text-rose-800 dark:text-rose-200">
                    Magabiztos, de Hibás megoldás
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Bizonytalan
                    </span>
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-3xl font-black font-montserrat text-amber-600 dark:text-amber-400">
                    {data?.pedagogy.confidenceMatrix.hesitant ?? 0}%
                  </span>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Bizonytalan, de Helyes megoldás
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Felismert Hiány
                    </span>
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-3xl font-black font-montserrat text-blue-600 dark:text-blue-400">
                    {data?.pedagogy.confidenceMatrix.recognizedGap ?? 0}%
                  </span>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Bizonytalan & Hibás megoldás
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB 4: SEARCH ANALYTICS & CONTENT GAPS ━━━ */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
            {/* Popular Searches */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#269984]" />
                  <span>Leggyakoribb Diák Keresések</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Milyen algoritmusokra és témákra keresnek a legtöbben
                </p>
              </div>

              <div className="space-y-3">
                {data?.searchAnalytics.topSearches &&
                data.searchAnalytics.topSearches.length > 0 ? (
                  data.searchAnalytics.topSearches.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#269984]/10 text-[#269984] font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          „{s.query}”
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#269984]">{s.count} keresés</span>
                        <span className="block text-[10px] text-gray-400">
                          {s.resultsCount} találat
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    Nincs rögzített keresési adat.
                  </p>
                )}
              </div>
            </div>

            {/* Zero Result Searches (Curriculum Gaps) */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  <span>0 Találatos Keresések (Tananyagfejlesztési Javaslatok)</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Témák, amikre a diákok kerestek, de még nincs megfelelő tartalom a platformon
                </p>
              </div>

              <div className="space-y-3">
                {data?.searchAnalytics.zeroResultSearches &&
                data.searchAnalytics.zeroResultSearches.length > 0 ? (
                  data.searchAnalytics.zeroResultSearches.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center">
                          !
                        </span>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          „{s.query}”
                        </span>
                      </div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md">
                        {s.count} alkalommal
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    Nem volt 0 találatos keresés. A diákok mindenre találtak tartalmat!
                  </p>
                )}
              </div>
            </div>
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
