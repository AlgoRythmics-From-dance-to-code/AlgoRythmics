'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  RefreshCw,
  Calendar,
  Filter,
  Layers,
  Code2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Flame,
  Brain,
  Zap,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import './statistics.css';
import StatKpiGrid from './StatKpiGrid';
import MistakeHotspotChart from './MistakeHotspotChart';
import CoursePhaseAnalyticsCard, { type CourseAnalyticsData } from './CoursePhaseAnalyticsCard';
import LearningEfficacyCard from './LearningEfficacyCard';
import CognitiveHesitationChart from './CognitiveHesitationChart';
import PostErrorSlowdownCard from './PostErrorSlowdownCard';
import ConfidenceMatrixCard from './ConfidenceMatrixCard';
import SearchAndMultiplayerStats from './SearchAndMultiplayerStats';
import ActivityTimelineChart, { type TimelineDataPoint } from './ActivityTimelineChart';
import SkillRadarChart, { type CompetencyItem } from './SkillRadarChart';
import HourlyActivityHeatmap, { type HeatmapDayData } from './HourlyActivityHeatmap';
import PedagogicalGuideCard from './PedagogicalGuideCard';

const ALGORITHM_OPTIONS = [
  { value: 'all', label: 'Összes Algoritmus' },
  { value: 'bubble-sort', label: 'Bubble Sort (Buborékrendezés)' },
  { value: 'insertion-sort', label: 'Insertion Sort (Beszúró rendezés)' },
  { value: 'selection-sort', label: 'Selection Sort (Kiválasztó rendezés)' },
  { value: 'merge-sort', label: 'Merge Sort (Összefésülő rendezés)' },
  { value: 'quick-sort', label: 'Quick Sort (Gyorsrendezés)' },
  { value: 'linear-search', label: 'Linear Search (Lineáris keresés)' },
  { value: 'binary-search', label: 'Binary Search (Bináris keresés)' },
  { value: 'heap-sort', label: 'Heap Sort (Kupacrendezés)' },
  { value: 'shell-sort', label: 'Shell Sort (Shell rendezés)' },
  { value: 'n-queens', label: 'N-Queens (N-Királynő visszalépéses)' },
  { value: 'bogosort', label: 'Bogosort' },
];

const TIME_RANGES = [
  { value: '7d', label: 'Utolsó 7 nap' },
  { value: '30d', label: 'Utolsó 30 nap' },
  { value: '90d', label: 'Utolsó 90 nap' },
  { value: 'all', label: 'Összes időszak' },
];

const TAB_OPTIONS = [
  { value: 'all', label: 'Minden Tanulási Fázis' },
  { value: 'control', label: 'Control (Interaktív lépkedés)' },
  { value: 'create', label: 'Create (Kódkiegészítés)' },
  { value: 'alive', label: 'Alive (Kódírás / Blokk futtatás)' },
  { value: 'animation', label: 'Animation (Vizuális lejátszó)' },
  { value: 'video', label: 'Video (Táncos videó)' },
  { value: 'course', label: 'Kurzusok & Mini-játékok' },
];

const NAV_TABS = [
  { id: 'overview', label: 'Fő Áttekintés & KPIs', icon: BarChart3, badge: 'Összegzés' },
  { id: 'courses', label: 'Kurzusok & Fázisok', icon: GraduationCap, badge: 'Pipeline' },
  { id: 'mistakes', label: 'Hiba-Hotspotok', icon: Flame, badge: 'Nehézségek' },
  { id: 'cognition', label: 'Kognitív Idők & Hatások', icon: Brain, badge: 'Hezitálás' },
  { id: 'behavior', label: 'Hiba Utáni Dinamika', icon: Zap, badge: 'PES Index' },
  { id: 'search', label: 'Keresések & Multiplayer', icon: Search, badge: 'Napló' },
];

interface StatisticsPayload {
  kpis: {
    activeLearnersCount: number;
    totalHoursSpent: number;
    totalAlgorithmsCompleted: number;
    globalErrorRate: number;
    pesSlowdownPercentage: number;
    hintSuccessRate: number;
    avgThinkingTimeSeconds: number;
  };
  timelineTrends?: TimelineDataPoint[];
  competencyRadar?: CompetencyItem[];
  hourlyHeatmap?: HeatmapDayData[];
  mistakeAnalytics: {
    tabDistribution: {
      control: number;
      create: number;
      alive: number;
      course: number;
    };
    algorithmMistakes: {
      algorithmId: string;
      totalMistakes: number;
      errorRate: number;
    }[];
    topBottlenecks: {
      algorithmId: string;
      stepOrBlank: string;
      mistakeCount: number;
      tab: string;
      avgHesitationSeconds?: number;
    }[];
  };
  learningEfficacy: {
    hintSuccessRate: number;
    videoErrorReductionPercent: number;
    avgMistakesWithVideo: number;
    avgMistakesWithoutVideo: number;
    animationStepBenefit: {
      withStepBack: number;
      withoutStepBack: number;
    };
  };
  cognitiveHesitation: {
    algorithms: {
      algorithmId: string;
      averageHesitationMs: number;
      averageHesitationSeconds: number;
      totalMistakes: number;
      errorRate: number;
      hintsUsed: number;
    }[];
    timeBreakdown: {
      video: number;
      animation: number;
      control: number;
      codeExercise: number;
      coursePlay: number;
    };
  };
  postErrorDynamics: {
    avgNormalDurationMs: number;
    avgPostErrorDurationMs: number;
    pesSlowdownPercentage: number;
    postErrorDistribution: {
      constructiveSuccessRate: number;
      impulsiveFailRate: number;
      hintRequestRate: number;
      resetOrDropRate: number;
    };
    recoveryCurve: {
      firstRetrySuccess: number;
      secondRetrySuccess: number;
      thirdRetrySuccess: number;
    };
  };
  confidenceMatrix: {
    mastery: number;
    overconfidence: number;
    hesitant: number;
    recognizedGap: number;
  };
  searchAnalytics: {
    topSearches: { query: string; count: number; resultsCount?: number; language?: string }[];
    zeroResultSearches: { query: string; count: number; language?: string }[];
  };
  courseAnalytics?: CourseAnalyticsData;
}

export default function AdminStatisticsClient() {
  const [activeTab, setActiveTab] = useState('overview');
  const [algorithmFilter, setAlgorithmFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('30d');
  const [tabFilter, setTabFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<StatisticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          algorithmId: algorithmFilter,
          timeRange: timeRangeFilter,
          tab: tabFilter,
        });

        const res = await fetch(`/api/admin/statistics?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Hiba a statisztikák betöltésekor (${res.status})`);
        }

        const data: StatisticsPayload = await res.json();
        setStatsData(data);
        if (isManualRefresh) {
          toast.success('Statisztikai adatok sikeresen frissítve!');
        }
      } catch (err: unknown) {
        console.error('[AdminStatistics] Fetch error:', err);
        const errMsg =
          (err as Error)?.message || 'Váratlan hiba történt a statisztikák lekérésekor.';
        setError(errMsg);
        toast.error('Nem sikerült betölteni a statisztikai adatokat.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [algorithmFilter, timeRangeFilter, tabFilter],
  );

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Export to CSV function
  const exportToCSV = () => {
    if (!statsData) return;

    try {
      let csvContent = 'data:text/csv;charset=utf-8,';

      // KPI section
      csvContent += 'AlgoRythmics Tanulasi Analitika Export\r\n';
      csvContent += `Idointervallum: ${timeRangeFilter}, Algoritmus: ${algorithmFilter}, Fazis: ${tabFilter}\r\n`;
      csvContent += `Export datum: ${new Date().toLocaleString('hu-HU')}\r\n\r\n`;

      csvContent += 'Fobb Metrikak (KPIs)\r\n';
      csvContent += 'Metrika,Ertek,Egyseg\r\n';
      csvContent += `Aktiv Tanulok,${statsData.kpis.activeLearnersCount},fo\r\n`;
      csvContent += `Osszesitett Tanulasi Ido,${statsData.kpis.totalHoursSpent},ora\r\n`;
      csvContent += `Befejezett Algoritmusok,${statsData.kpis.totalAlgorithmsCompleted},db\r\n`;
      csvContent += `Globalis Hibarata,${statsData.kpis.globalErrorRate},%\r\n`;
      csvContent += `Hiba Utani Lelassulas (PES),+${statsData.kpis.pesSlowdownPercentage},%\r\n`;
      csvContent += `Hint Sikerrata,${statsData.kpis.hintSuccessRate},%\r\n`;
      csvContent += `Atlagos Dontesi Ido,${statsData.kpis.avgThinkingTimeSeconds},mp\r\n\r\n`;

      // Algorithm mistakes section
      csvContent += 'Algoritmus Hibak & Kognitiv Hezitalas\r\n';
      csvContent += 'Algoritmus,Osszes Hiba,Hibarata (%),Atlagos Gondolkodasi Ido (mp)\r\n';
      for (const algo of statsData.cognitiveHesitation.algorithms || []) {
        csvContent += `${algo.algorithmId},${algo.totalMistakes},${algo.errorRate}%,${algo.averageHesitationSeconds} mp\r\n`;
      }
      csvContent += '\r\n';

      // Bottleneck steps
      csvContent += 'Leggyakoribb Hibapontok (Szuk Keresztmetszetek)\r\n';
      csvContent += 'Algoritmus,Lepes vagy Kodblank,Hibaszam,Fazis,Atlagos Hezitalas (mp)\r\n';
      for (const b of statsData.mistakeAnalytics.topBottlenecks || []) {
        csvContent += `${b.algorithmId},"${b.stepOrBlank}",${b.mistakeCount},${b.tab},${b.avgHesitationSeconds || 'N/A'}\r\n`;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `algorythmics_analytics_${timeRangeFilter}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV fájl sikeresen letöltve!');
    } catch {
      toast.error('Hiba a CSV exportálás során.');
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    if (!statsData) return;

    try {
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(statsData, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `algorythmics_analytics_${timeRangeFilter}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('JSON export sikeresen letöltve!');
    } catch {
      toast.error('Hiba a JSON exportálás során.');
    }
  };

  return (
    <div className="algo-stats-root w-full pb-12">
      <div className="w-full space-y-7">
        {/* ─── Navigációs fejléc & Vissza gomb az Adminba ──────────────────────── */}
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin"
            rel="external"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/admin';
            }}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs font-bold shadow-sm group cursor-pointer no-underline"
          >
            <ArrowLeft className="w-4 h-4 text-teal-500 group-hover:-translate-x-1 transition-transform" />
            <span>Vissza a Payload Admin Panelre</span>
          </a>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Élő Adatkapcsolat & Telemetria</span>
          </div>
        </div>

        {/* ─── Header & Cím ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                  Tanulási Elemzés & Rendszerstatisztikák
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                    Admin Analytics
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Valós idejű pedagógiai metrikák, hibapontok, hezitálási idők és
                  kurzus-teljesítmény
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchStatistics(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
              <span>Frissítés</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={!statsData || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Export</span>
            </button>

            <button
              onClick={exportToJSON}
              disabled={!statsData || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 transition-all text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>JSON Export</span>
            </button>
          </div>
        </div>

        {/* ─── Aloldal / Fül Navigációs Sáv (Tabs Sub-navigation Bar) ──────────── */}
        <div className="algo-stats-tabs-bar">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`algo-stats-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Szűrősáv (Filters Toolbar) ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
            <Filter className="w-4 h-4 text-teal-500" />
            <span>Szűrési feltételek:</span>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Code2 className="w-4 h-4 text-gray-400" />
            <select
              value={algorithmFilter}
              onChange={(e) => setAlgorithmFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all max-w-[220px] sm:max-w-[280px] cursor-pointer"
            >
              {ALGORITHM_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-gray-400" />
            <select
              value={tabFilter}
              onChange={(e) => setTabFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
            >
              {TAB_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter summary pill */}
          {(algorithmFilter !== 'all' || tabFilter !== 'all') && (
            <button
              onClick={() => {
                setAlgorithmFilter('all');
                setTabFilter('all');
              }}
              className="ml-auto text-xs font-bold text-teal-500 hover:text-teal-400 underline cursor-pointer"
            >
              Szűrők törlése
            </button>
          )}
        </motion.div>

        {/* ─── Tartalom / Loading / Error State ───────────────────────────────────── */}
        {loading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
            <p className="text-sm font-semibold">
              Statisztikák és pedagógiai metrikák számolása...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-rose-400">
              Nem sikerült betölteni az adatokat
            </h3>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button
              onClick={() => fetchStatistics()}
              className="mt-5 px-5 py-2.5 rounded-2xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors cursor-pointer"
            >
              Újrapróbálkozás
            </button>
          </div>
        ) : statsData ? (
          <AnimatePresence mode="wait">
            {/* 1. Aloldal: Fő Áttekintés & KPIs */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <StatKpiGrid kpis={statsData.kpis} />

                {/* Interactive Time-series Trends Area Chart */}
                {statsData.timelineTrends && statsData.timelineTrends.length > 0 && (
                  <ActivityTimelineChart data={statsData.timelineTrends} />
                )}

                {/* 2-Column: Skill Radar Matrix & Learning Efficacy A/B */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6">
                    {statsData.competencyRadar && (
                      <SkillRadarChart data={statsData.competencyRadar} />
                    )}
                  </div>
                  <div className="lg:col-span-6">
                    <LearningEfficacyCard data={statsData.learningEfficacy} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <MistakeHotspotChart data={statsData.mistakeAnalytics} />
                  </div>
                  <div className="lg:col-span-5 space-y-6">
                    <ConfidenceMatrixCard matrix={statsData.confidenceMatrix} />
                  </div>
                </div>

                {/* Pedagogical Methodology Guide */}
                <PedagogicalGuideCard />
              </motion.div>
            )}

            {/* 2. Aloldal: Kurzusok & Fázisok Részletes Elemzése */}
            {activeTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <CoursePhaseAnalyticsCard data={statsData.courseAnalytics} />

                {/* Hourly Activity Heatmap */}
                {statsData.hourlyHeatmap && (
                  <HourlyActivityHeatmap data={statsData.hourlyHeatmap} />
                )}

                {/* Pedagogical Methodology Guide */}
                <PedagogicalGuideCard />
              </motion.div>
            )}

            {/* 3. Aloldal: Hiba-Hotspotok & Nehézségek */}
            {activeTab === 'mistakes' && (
              <motion.div
                key="mistakes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <MistakeHotspotChart data={statsData.mistakeAnalytics} />
                <PostErrorSlowdownCard data={statsData.postErrorDynamics} />
                <PedagogicalGuideCard />
              </motion.div>
            )}

            {/* 4. Aloldal: Kognitív Idők & Intervenciós Hatások */}
            {activeTab === 'cognition' && (
              <motion.div
                key="cognition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <CognitiveHesitationChart data={statsData.cognitiveHesitation} />

                {statsData.competencyRadar && <SkillRadarChart data={statsData.competencyRadar} />}

                <LearningEfficacyCard data={statsData.learningEfficacy} />
                <PedagogicalGuideCard />
              </motion.div>
            )}

            {/* 5. Aloldal: Hiba Utáni Dinamika & Magabiztosság */}
            {activeTab === 'behavior' && (
              <motion.div
                key="behavior"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <PostErrorSlowdownCard data={statsData.postErrorDynamics} />
                <ConfidenceMatrixCard matrix={statsData.confidenceMatrix} />
                <PedagogicalGuideCard />
              </motion.div>
            )}

            {/* 6. Aloldal: Keresések & Többjátékos Analitika */}
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <SearchAndMultiplayerStats searchData={statsData.searchAnalytics} />

                {statsData.hourlyHeatmap && (
                  <HourlyActivityHeatmap data={statsData.hourlyHeatmap} />
                )}

                <PedagogicalGuideCard />
              </motion.div>
            )}
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}
