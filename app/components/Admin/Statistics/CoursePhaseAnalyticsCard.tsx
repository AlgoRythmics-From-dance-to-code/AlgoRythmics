'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Award,
  Video,
  Play,
  Gamepad2,
  Code,
  FileCode2,
  CheckSquare,
} from 'lucide-react';

export interface CoursePhaseItem {
  phaseId: string;
  phaseIndex: number;
  title: string;
  sourceView: string;
  maxPoints: number;
  completedCount: number;
  passRate: number;
  avgMistakes: number;
  avgDurationSeconds: number;
  helpUsedRate: number;
  dropOffRate: number;
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface CourseItem {
  courseId: string;
  slug: string;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  enrolledCount: number;
  completedCount: number;
  completionRate: number;
  avgScorePercent: number;
  avgTimeMinutes: number;
  avgMistakes: number;
  phases: CoursePhaseItem[];
}

export interface PhaseTypeBenchmark {
  type: string;
  label: string;
  avgPassRate: number;
  avgMistakes: number;
  avgTimeSeconds: number;
  helpUsageRate: number;
  description: string;
}

export interface CourseAnalyticsData {
  summary: {
    totalEnrollments: number;
    totalCompletions: number;
    overallCompletionRate: number;
    avgCourseScore: number;
    avgCourseDurationMinutes: number;
  };
  courses: CourseItem[];
  phaseTypeBenchmarks: PhaseTypeBenchmark[];
}

interface CoursePhaseAnalyticsCardProps {
  data?: CourseAnalyticsData;
}

const PHASE_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4 text-sky-500" />,
  animation: <Play className="w-4 h-4 text-teal-500" />,
  control: <Gamepad2 className="w-4 h-4 text-emerald-500" />,
  create: <Code className="w-4 h-4 text-indigo-500" />,
  alive: <FileCode2 className="w-4 h-4 text-purple-500" />,
  'gap-fill': <Code className="w-4 h-4 text-blue-500" />,
  debug: <AlertCircle className="w-4 h-4 text-rose-500" />,
  order: <Layers className="w-4 h-4 text-amber-500" />,
  match: <Sparkles className="w-4 h-4 text-fuchsia-500" />,
  quiz: <CheckSquare className="w-4 h-4 text-emerald-500" />,
  'final-challenge': <Award className="w-4 h-4 text-yellow-500" />,
};

const PHASE_TYPE_LABELS: Record<string, string> = {
  video: 'Táncos Videó',
  animation: 'Animáció',
  control: 'Interaktív Lépkedés',
  create: 'Kódkiegészítés',
  alive: 'Kódolás (Alive)',
  'gap-fill': 'Kódkiegészítés',
  debug: 'Hibakeresés (Debug)',
  order: 'Sorrendbe Állítás',
  match: 'Párosítás',
  quiz: 'Tudásellenőrző Kvíz',
  'final-challenge': 'Végső Kihívás',
};

export default function CoursePhaseAnalyticsCard({ data }: CoursePhaseAnalyticsCardProps) {
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  if (!data || !data.courses || data.courses.length === 0) {
    return null;
  }

  const currentCourse = data.courses[selectedCourseIndex] || data.courses[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-8"
    >
      {/* ─── Fő fejléc & Összegző metrikák ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Kurzusok & Fázisok Részletes Teljesítménye
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                Phase Pipeline
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kurzusonkénti lemorzsolódás, fázis-sikerráták, hibapontok és kódolási nehézségek
            </p>
          </div>
        </div>

        {/* Global Course KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Beiratkozások
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {data.summary.totalEnrollments} fő
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Befejezési Arány
            </span>
            <span className="text-base font-black text-emerald-500">
              {data.summary.overallCompletionRate}%
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Átl. Pontszám
            </span>
            <span className="text-base font-black text-indigo-500">
              {data.summary.avgCourseScore}%
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Átl. Kurzusidő
            </span>
            <span className="text-base font-black text-teal-500">
              {data.summary.avgCourseDurationMinutes} perc
            </span>
          </div>
        </div>
      </div>

      {/* ─── Kurzus Választó Fülek (Course Selector Tabs) ────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Válassz kurzust az elemzéshez:
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {data.courses.map((course, idx) => {
            const isSelected = selectedCourseIndex === idx;
            return (
              <button
                key={course.courseId}
                onClick={() => setSelectedCourseIndex(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white border-transparent shadow-md shadow-indigo-500/20 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{course.title}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {course.phases.length} fázis
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Kijelölt Kurzus Főbb Mutatói & Lemorzsolódási Csővezeték ─────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCourse.courseId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Kurzus Kártya Információs Csík */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-teal-500/10 to-emerald-500/10 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {currentCourse.title}
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  {currentCourse.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Becsült idő: ~{currentCourse.estimatedMinutes} perc | Összesen{' '}
                {currentCourse.phases.length} tanulási lépés
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Beiratkozott:</span>
                <span className="text-slate-900 dark:text-white font-black">
                  {currentCourse.enrolledCount} diák
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Sikeresen elvégezte:</span>
                <span className="text-emerald-500 font-black">
                  {currentCourse.completedCount} ({currentCourse.completionRate}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Átl. elért pont:</span>
                <span className="text-indigo-500 font-black">{currentCourse.avgScorePercent}%</span>
              </div>
            </div>
          </div>

          {/* ─── Lemorzsolódási Folyamat (Phase Pipeline & Funnel) ────────────────── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Tanulói Haladás & Lemorzsolódási Csővezeték (Phase Retention Pipeline)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                Fázisonként továbbhaladó diákok aránya
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {currentCourse.phases.map((ph, idx) => {
                const retentionRate = Math.max(
                  10,
                  Math.round((ph.completedCount / Math.max(1, currentCourse.enrolledCount)) * 100),
                );
                return (
                  <div
                    key={ph.phaseId}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-sm group hover:border-teal-500/40 transition-all"
                  >
                    {/* Top Progress Bar */}
                    <div
                      className="absolute top-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                      style={{ width: `${retentionRate}%` }}
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-400">#{idx + 1}</span>
                      <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {PHASE_TYPE_ICONS[ph.sourceView] || <Code className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mb-2">
                      {ph.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-teal-500">{retentionRate}%</span>
                      <span className="text-slate-400 font-bold">{ph.completedCount} fő</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Részletes Fázis Teljesítmény Kártyák / Táblázat ──────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Fázisonkénti Részletes Metrikák & Hibaarányok
              </h4>
              <span className="text-[11px] text-slate-400 font-bold">
                Sikerráta • Átl. Hiba • Időtartam • Kabala segítség
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentCourse.phases.map((ph, idx) => {
                const passColor =
                  ph.passRate >= 80
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : ph.passRate >= 65
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';

                const minutes = Math.floor(ph.avgDurationSeconds / 60);
                const seconds = ph.avgDurationSeconds % 60;
                const timeFormatted = `${minutes > 0 ? `${minutes}p ` : ''}${seconds}mp`;

                return (
                  <motion.div
                    key={ph.phaseId}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Fázis címe & típusa */}
                    <div className="flex items-center gap-3.5 min-w-[260px]">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                        {PHASE_TYPE_ICONS[ph.sourceView] || (
                          <Code className="w-4 h-4 text-teal-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{ph.phaseIndex}</span>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {ph.title}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {PHASE_TYPE_LABELS[ph.sourceView] || ph.sourceView}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Max {ph.maxPoints} pont
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metrikák Oszlopai */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 shrink-0 text-xs">
                      {/* 1. Sikerráta */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Sikerráta
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-lg border ${passColor}`}
                          >
                            {ph.passRate}%
                          </span>
                        </div>
                      </div>

                      {/* 2. Átl. Hibaszám */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Átl. Hiba
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={
                              ph.avgMistakes > 2.0
                                ? 'text-rose-500 font-black'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                          >
                            {ph.avgMistakes} hiba
                          </span>
                        </div>
                      </div>

                      {/* 3. Időtartam */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Átl. Idő
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {timeFormatted}
                        </span>
                      </div>

                      {/* 4. Kabala / Hint Segítség */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Kabala Segítség
                        </span>
                        <div className="flex items-center gap-1.5">
                          <HelpCircle
                            className={`w-3.5 h-3.5 ${ph.helpUsedRate > 30 ? 'text-amber-500' : 'text-slate-400'}`}
                          />
                          <span
                            className={`font-bold ${ph.helpUsedRate > 30 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            {ph.helpUsedRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Magabiztossági Mérés sáv */}
                    <div className="min-w-[140px] shrink-0">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>Magabiztosság</span>
                        <span className="text-emerald-500 font-bold">
                          {ph.confidenceBreakdown.high}% Magas
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${ph.confidenceBreakdown.high}%` }}
                          title={`Magas: ${ph.confidenceBreakdown.high}%`}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${ph.confidenceBreakdown.medium}%` }}
                          title={`Közepes: ${ph.confidenceBreakdown.medium}%`}
                        />
                        <div
                          className="bg-rose-500 h-full"
                          style={{ width: `${ph.confidenceBreakdown.low}%` }}
                          title={`Alacsony: ${ph.confidenceBreakdown.low}%`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── Fázis-Típusok Globális Benchmark Összehasonlítása ────────────────────── */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Fázis-Típusok Globális Összehasonlító Benchmarkja
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Mely feladattípusok okozzák a legnagyobb nehézséget?
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {data.phaseTypeBenchmarks.map((bench) => (
            <div
              key={bench.type}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {PHASE_TYPE_ICONS[bench.type] || <Code className="w-4 h-4 text-indigo-500" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {bench.label}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mb-3">
                  {bench.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Átl. Sikerráta:</span>
                  <span
                    className={`font-black ${
                      bench.avgPassRate >= 80
                        ? 'text-emerald-500'
                        : bench.avgPassRate >= 70
                          ? 'text-amber-500'
                          : 'text-rose-500'
                    }`}
                  >
                    {bench.avgPassRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Átl. Hibaszám:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {bench.avgMistakes} hiba
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Segítség igény:</span>
                  <span className="font-bold text-indigo-500">{bench.helpUsageRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
