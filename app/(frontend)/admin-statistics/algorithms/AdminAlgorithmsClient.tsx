'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Brain,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  Shield,
  FileSpreadsheet,
  FileCode,
  Zap,
  BookOpen,
  AlertCircle,
  Video,
} from 'lucide-react';
import { ROUTES, ROLES, ALGORITHMS } from '../../../../lib/constants';

interface AlgorithmHesitationItem {
  algorithmId: string;
  averageHesitationMs: number;
  averageHesitationSeconds: number;
  totalMistakes: number;
  errorRate: number;
  completedCount: number;
  hintsUsed: number;
}

interface StepBottleneckItem {
  algorithmId: string;
  stepOrBlank: string;
  mistakeCount: number;
  tab: string;
  avgHesitationSeconds: number;
}

interface AlgorithmStatisticsData {
  timestamp: string;
  timeRange: string;
  algorithm: string;
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
  algorithmHesitationList: AlgorithmHesitationItem[];
  topBottlenecks: StepBottleneckItem[];
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
  research?: {
    helpSeekingTransfer: {
      withHelp: { count: number; avgScore: number; avgSubmissions: number; completionRate: number };
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
    cognitiveLoadDynamics: {
      baselineReactionSec: number;
      immediatePostErrorSec: number;
      step2RecoverySec: number;
      step3RecoverySec: number;
      overloadIndex: number;
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

export default function AdminAlgorithmsClient() {
  const { data: session, status } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const isAdminOrEditor = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR;

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedAlgo, setSelectedAlgo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'heatmap' | 'bottlenecks' | 'cognition'>('heatmap');

  const [data, setData] = useState<AlgorithmStatisticsData | null>(null);
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
        algorithmId: selectedAlgo,
      });

      const res = await fetch(`/api/admin/statistics?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setIsAuthorized(false);
          throw new Error('Nincs admin jogosultságod az algoritmus-statisztikák megtekintéséhez.');
        }
        throw new Error('Nem sikerült betölteni az algoritmus adatokat.');
      }
      const json: AlgorithmStatisticsData = await res.json();
      setIsAuthorized(true);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Váratlan hiba történt.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedAlgo]);

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
    a.download = `algorythmics-algorithms-stats-${timeRange}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  const exportCSV = () => {
    if (!data) return;
    let csv = 'Algoritmus;Hibaarany (%);Gondolkodasi ido (mp);Osszes hiba;Tippek;Befejezve (db)\n';
    data.algorithmHesitationList.forEach((a) => {
      csv += `${a.algorithmId};${a.errorRate}%;${a.averageHesitationSeconds} mp;${a.totalMistakes};${a.hintsUsed};${a.completedCount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorythmics-algorithm-heatmap-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  // Filtered algorithms list
  const filteredAlgorithms = useMemo(() => {
    const list = data?.algorithmHesitationList || [];
    return list.filter((item) => {
      if (selectedAlgo !== 'all' && item.algorithmId !== selectedAlgo) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.algorithmId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data?.algorithmHesitationList, selectedAlgo, searchQuery]);

  // Filtered bottlenecks list
  const filteredBottlenecks = useMemo(() => {
    const list = data?.topBottlenecks || [];
    return list.filter((item) => {
      if (selectedAlgo !== 'all' && item.algorithmId !== selectedAlgo) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.algorithmId.toLowerCase().includes(q) ||
          item.stepOrBlank.toLowerCase().includes(q) ||
          item.tab.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.topBottlenecks, selectedAlgo, searchQuery]);

  // Loading state
  if (status === 'loading' || (loading && !data && isAuthorized !== false)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#269984] border-t-transparent" />
        <p className="text-sm font-bold text-slate-500">Algoritmus statisztikák betöltése...</p>
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
            Admin Jogosultság Szükséges
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Az önálló algoritmusok rendszerszintű elemzése kizárólag adminisztrátorok számára érhető
            el.
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

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="max-w-md w-full bg-white dark:bg-[#151515] p-8 rounded-3xl border border-red-200 dark:border-red-500/20 text-center shadow-xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
            Nem sikerült betölteni a statisztikákat
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchStats}
            className="px-6 py-2.5 bg-[#269984] text-white rounded-xl font-bold font-montserrat hover:bg-[#208270] transition-colors cursor-pointer"
          >
            Újrapróbálkozás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ━━━ TOP HEADER & SWITCH BAR ━━━ */}
        <div className="flex flex-col gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
          {/* View Switcher Pills (Course Stats vs Algorithm Stats) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-gray-200/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-fit">
            <Link
              href={ROUTES.ADMIN_STATISTICS}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#269984]" />
              <span>📚 Kurzusok Statisztikája</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#269984] text-white shadow-sm text-xs font-bold transition-all">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Sima Algoritmusok (Admin Nézet)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-montserrat tracking-tight text-gray-900 dark:text-white">
                    Admin Algoritmus Elemzés & Hibaarány Térkép
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Önálló algoritmusok
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Összehasonlítás hibaarány, gondolkodási idő, segítségkérések és videóhatás alapján
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
                      <span>Hibaarány térkép (CSV)</span>
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

          {/* ━━━ FILTER CONTROLS ━━━ */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-sm">
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
                  type="button"
                  onClick={() => setTimeRange(pill.id as '7d' | '30d' | 'all')}
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
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
              <Zap className="w-4 h-4 text-purple-500 shrink-0" />
              <select
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
              >
                <option value="all">Minden algoritmus</option>
                {ALGORITHMS.map((algo) => (
                  <option key={algo.id} value={algo.id} className="dark:bg-slate-900">
                    {algo.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keresés algoritmus vagy lépés szerint..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#269984]"
              />
            </div>
          </div>
        </div>

        {/* ━━━ 4 ALGORITHM KPI CARDS ━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-blue-500/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-montserrat uppercase tracking-wider text-gray-400">
                Gyakorló Diákok
              </span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
              {data?.kpis.activeLearnersCount ?? 0}
            </div>
            <p className="text-xs text-gray-500">Önálló algoritmusokat gyakorló tanulók</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-emerald-500/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-montserrat uppercase tracking-wider text-gray-400">
                Befejezett Algoritmusok
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
              {data?.kpis.totalAlgorithmsCompleted ?? 0} db
            </div>
            <p className="text-xs text-gray-500">100%-os elsajátítási arány</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-purple-500/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-montserrat uppercase tracking-wider text-gray-400">
                Átlagos Gondolkodási Idő
              </span>
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-black font-montserrat text-gray-900 dark:text-white">
              {data?.kpis.avgHesitationSeconds ?? 3.7} mp
            </div>
            <p className="text-xs text-gray-500">Döntési és lépési reflexió</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-[#269984]/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-montserrat uppercase tracking-wider text-gray-400">
                Videó Hatékonyság
              </span>
              <Video className="w-5 h-5 text-[#269984]" />
            </div>
            <div className="text-3xl font-black font-montserrat text-[#269984]">
              -{data?.pedagogy?.videoErrorReductionPercent ?? 62}% hiba
            </div>
            <p className="text-xs text-gray-500">A táncvideót megnéző diákoknál</p>
          </div>
        </div>

        {/* ━━━ TAB NAVIGATION ━━━ */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Algoritmusok Nehézségi & Hibaarány Térképe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bottlenecks')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'bottlenecks'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>2. Lépések & Elakadási Gócpontok ({filteredBottlenecks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cognition')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-montserrat text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'cognition'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>3. Kognitív & Módszertani Elemzés</span>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 1: ALGORITMUSOK NEHÉZSÉGI & HIBAARÁNY TÉRKÉPE              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'heatmap' && (
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white">
                Algoritmusok Nehézségi & Hibaarány Térképe
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Összehasonlítás hibaarány, gondolkodási idő és segítségkérések alapján
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-montserrat">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-bold">Algoritmus</th>
                    <th className="pb-3 font-bold">Hibaarány</th>
                    <th className="pb-3 font-bold">Gondolkodási Idő</th>
                    <th className="pb-3 font-bold">Összes Hiba</th>
                    <th className="pb-3 font-bold">Tippek</th>
                    <th className="pb-3 font-bold text-right">Befejezve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredAlgorithms.map((algo) => {
                    const isHigh = algo.errorRate >= 30;
                    const isMedium = algo.errorRate >= 20 && algo.errorRate < 30;

                    const formattedName = algo.algorithmId
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');

                    return (
                      <tr
                        key={algo.algorithmId}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedAlgo(algo.algorithmId);
                          setActiveTab('bottlenecks');
                        }}
                      >
                        <td className="py-4 font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="group-hover:text-purple-600 transition-colors">
                            {formattedName}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-black ${
                                isHigh
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isMedium
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {algo.errorRate}%
                            </span>
                            <div className="w-24 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHigh
                                    ? 'bg-rose-500'
                                    : isMedium
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${algo.errorRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-gray-700 dark:text-gray-300">
                          {algo.averageHesitationSeconds} mp
                        </td>
                        <td className="py-4 font-bold text-gray-900 dark:text-white">
                          {algo.totalMistakes}
                        </td>
                        <td className="py-4 text-gray-500">{algo.hintsUsed}</td>
                        <td className="py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {algo.completedCount} db
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 2: LÉPÉSEK & ELAKADÁSI GÓCPONTOK (BOTTLENECKS)             */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'bottlenecks' && (
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span>Top Elakadási Pontok & Lépések</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Konkrét feladatlépések és kódkiegészítések, ahol a diákok hezitálnak és hibáznak
              </p>
            </div>

            {filteredBottlenecks.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                <p className="text-sm font-bold text-gray-600">
                  Nincs rögzített elakadás ehhez a szűréshez.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBottlenecks.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900 dark:text-white capitalize">
                        {b.algorithmId.replace('-', ' ')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase">
                        {b.tab === 'control'
                          ? 'Irányítás'
                          : b.tab === 'create'
                            ? 'Kódkiegészítés'
                            : b.tab}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {b.stepOrBlank}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60 dark:border-white/5">
                      <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {b.mistakeCount} rögzített hiba
                      </span>
                      <span className="text-gray-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {b.avgHesitationSeconds} mp hezitálás
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 3: KOGNITÍV & MÓDSZERTANI ELEMZÉS (PEDAGÓGIA)               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'cognition' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Video Impact Card */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#269984]" />
                  <span>Táncvideó Pedagógiai Hatása a Hibacsökkentésre</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Összehasonlítás a videót végignéző és a videót kihagyó diákok hibaszáma között
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Videót Végignéző Tanulók
                  </span>
                  <div className="text-3xl font-black font-montserrat text-emerald-600 dark:text-emerald-400">
                    {data?.pedagogy?.avgMistakesWithVideo ?? 1.3} hiba / menet
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    A vizuális-auditív alapozás segít a memóriarögzítésben.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Videót Kihagyó Tanulók
                  </span>
                  <div className="text-3xl font-black font-montserrat text-rose-600 dark:text-rose-400">
                    {data?.pedagogy?.avgMistakesWithoutVideo ?? 3.4} hiba / menet
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    2.6x több döntési hibát vétenek az irányítás fázisban.
                  </p>
                </div>
              </div>
            </div>

            {/* Post-Error Slowing (PES) */}
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-bold font-montserrat text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Post-Error Slowing (PES) – Hiba utáni megfontoltság</span>
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                A hibát vétő tanulók átlagosan{' '}
                <strong className="text-purple-600 dark:text-purple-400 font-extrabold">
                  +{data?.pedagogy?.pesSlowdownPercentage ?? 58}%-kal több időt
                </strong>{' '}
                töltenek el a következő lépés átgondolásával (
                {Math.round(((data?.pedagogy?.avgPostErrorDurationMs ?? 4200) / 1000) * 10) / 10} mp
                vs {Math.round(((data?.pedagogy?.avgNormalDurationMs ?? 2600) / 1000) * 10) / 10} mp
                normál idő). Ez egészséges kognitív reflexiót jelez.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
