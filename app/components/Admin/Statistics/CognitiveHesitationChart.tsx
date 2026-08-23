'use client';

import { motion } from 'framer-motion';
import { Brain, Hourglass, PieChart, Sparkles } from 'lucide-react';

interface AlgorithmHesitationItem {
  algorithmId: string;
  averageHesitationMs: number;
  averageHesitationSeconds: number;
  totalMistakes: number;
  errorRate: number;
  hintsUsed: number;
}

interface CognitiveHesitationProps {
  data: {
    algorithms: AlgorithmHesitationItem[];
    timeBreakdown: {
      video: number;
      animation: number;
      control: number;
      codeExercise: number;
      coursePlay: number;
    };
  };
}

const ALGO_NAMES: Record<string, string> = {
  'bubble-sort': 'Bubble Sort',
  'insertion-sort': 'Insertion Sort',
  'selection-sort': 'Selection Sort',
  'merge-sort': 'Merge Sort',
  'quick-sort': 'Quick Sort',
  'linear-search': 'Linear Search',
  'binary-search': 'Binary Search',
  'heap-sort': 'Heap Sort',
  'shell-sort': 'Shell Sort',
  'n-queens': 'N-Queens (Visszalépéses)',
  bogosort: 'Bogosort',
};

export default function CognitiveHesitationChart({ data }: CognitiveHesitationProps) {
  const sortedByHesitation = [...data.algorithms].sort(
    (a, b) => b.averageHesitationSeconds - a.averageHesitationSeconds,
  );
  const maxHesitation = Math.max(...sortedByHesitation.map((a) => a.averageHesitationSeconds), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Lépésenkénti Gondolkodási Idő Algoritmusonként */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Hol gondolkodnak a legtöbbet? (Kognitív Terhelés)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Átlagos lépésenkénti mérlegelési és döntési idő algoritmusonként
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              Hezitálási Index
            </span>
          </div>

          <div className="space-y-4">
            {sortedByHesitation.slice(0, 6).map((algo, idx) => {
              const name = ALGO_NAMES[algo.algorithmId] || algo.algorithmId;
              const width = Math.max(
                10,
                Math.round((algo.averageHesitationSeconds / maxHesitation) * 100),
              );
              const isHeavyLoad = algo.averageHesitationSeconds >= 10;

              return (
                <div key={algo.algorithmId} className="group">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center text-[10px] font-black">
                        #{idx + 1}
                      </span>
                      {name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black ${isHeavyLoad ? 'text-purple-500 dark:text-purple-400' : 'text-indigo-500'}`}
                      >
                        {algo.averageHesitationSeconds} mp / lépés
                      </span>
                      <span className="text-slate-400 text-[11px] font-semibold">
                        {algo.hintsUsed} hint kérve
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                      className={`h-full rounded-full transition-all ${
                        isHeavyLoad
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/30 shadow-sm'
                          : 'bg-gradient-to-r from-teal-500 to-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2.5 font-semibold">
          <Sparkles className="w-5 h-5 shrink-0 text-indigo-500" />
          <span>
            A hosszabb mérlegelési idő mélyebb kognitív feldolgozást és összetettebb logikai
            vizsgálatot jelez (pl. Backtrack és Pivot választás esetén).
          </span>
        </div>
      </motion.div>

      {/* 2. Tanulási Idő Megoszlása Modulonként */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Időráfordítás Megoszlása
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hogyan oszlik meg a tanulók ideje a modulok között
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-blue-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Irányított Gyakorlás (Control)
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {data.timeBreakdown.control}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${data.timeBreakdown.control}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-teal-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    Vezetett Animáció (Visualizer)
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {data.timeBreakdown.animation}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${data.timeBreakdown.animation}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-purple-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    Táncos Videó (Dance Intro)
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {data.timeBreakdown.video}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${data.timeBreakdown.video}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-amber-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Kódírás & Kiegészítés (Create/Alive)
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {data.timeBreakdown.codeExercise}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${data.timeBreakdown.codeExercise}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-pink-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    Strukturált Kurzusok (Courses)
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {data.timeBreakdown.coursePlay}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: `${data.timeBreakdown.coursePlay}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5">
            <Hourglass className="w-4 h-4 text-teal-500" />
            Interaktív vs Passzív arány:
          </span>
          <span className="text-emerald-500 font-black">
            {data.timeBreakdown.control +
              data.timeBreakdown.codeExercise +
              data.timeBreakdown.coursePlay}
            % aktív gyakorlás
          </span>
        </div>
      </motion.div>
    </div>
  );
}
