'use client';

import { motion } from 'framer-motion';
import { AlertOctagon, Flame, CheckCircle2, Layers } from 'lucide-react';

interface BottleneckItem {
  algorithmId: string;
  stepOrBlank: string;
  mistakeCount: number;
  tab: string;
  avgHesitationSeconds?: number;
}

interface AlgorithmMistakeItem {
  algorithmId: string;
  totalMistakes: number;
  errorRate: number;
}

interface MistakeAnalyticsProps {
  data: {
    tabDistribution: {
      control: number;
      create: number;
      alive: number;
      course: number;
    };
    algorithmMistakes: AlgorithmMistakeItem[];
    topBottlenecks: BottleneckItem[];
  };
}

const ALGO_NAMES: Record<string, string> = {
  'bubble-sort': 'Bubble Sort (Buborékrendezés)',
  'insertion-sort': 'Insertion Sort (Beszúró rendezés)',
  'selection-sort': 'Selection Sort (Kiválasztó rendezés)',
  'merge-sort': 'Merge Sort (Összefésülő rendezés)',
  'quick-sort': 'Quick Sort (Gyorsrendezés)',
  'linear-search': 'Linear Search (Lineáris keresés)',
  'binary-search': 'Binary Search (Bináris keresés)',
  'heap-sort': 'Heap Sort (Kupacrendezés)',
  'shell-sort': 'Shell Sort (Shell rendezés)',
  'n-queens': 'N-Queens (N-Királynő visszalépéses)',
  bogosort: 'Bogosort (Véletlen rendezés)',
};

export default function MistakeHotspotChart({ data }: MistakeAnalyticsProps) {
  const totalTabMistakes =
    (data.tabDistribution.control || 0) +
      (data.tabDistribution.create || 0) +
      (data.tabDistribution.alive || 0) +
      (data.tabDistribution.course || 0) || 1;

  const tabPercentages = {
    control: Math.round(((data.tabDistribution.control || 0) / totalTabMistakes) * 100),
    create: Math.round(((data.tabDistribution.create || 0) / totalTabMistakes) * 100),
    alive: Math.round(((data.tabDistribution.alive || 0) / totalTabMistakes) * 100),
    course: Math.round(((data.tabDistribution.course || 0) / totalTabMistakes) * 100),
  };

  const sortedAlgos = [...data.algorithmMistakes].sort((a, b) => b.totalMistakes - a.totalMistakes);
  const maxMistakes = Math.max(...sortedAlgos.map((a) => a.totalMistakes), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Algoritmus Hiba-Rangsor & Hibasűrűség */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Hol hibáznak a legtöbbet? (Algoritmus Rangsor)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hibaszám és hibasűrűség algoritmusonkénti összehasonlítása
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              Nehézségi Rangsor
            </span>
          </div>

          <div className="space-y-4">
            {sortedAlgos.slice(0, 6).map((algo, idx) => {
              const name = ALGO_NAMES[algo.algorithmId] || algo.algorithmId;
              const barWidth = Math.max(8, Math.round((algo.totalMistakes / maxMistakes) * 100));

              return (
                <div key={algo.algorithmId} className="group">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-black">
                        #{idx + 1}
                      </span>
                      {name}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-rose-500 font-black">{algo.totalMistakes} hiba</span>
                      <span className="text-slate-400 text-[11px] font-semibold">
                        ({algo.errorRate}% hibaarány)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                      className={`h-full rounded-full transition-all ${
                        idx === 0
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/40 shadow-sm'
                          : idx === 1
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : idx === 2
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                              : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tanulási fül szerinti megoszlás mini sáv */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-3">
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
              <Layers className="w-4 h-4 text-indigo-500" />
              Hibaeloszlás tanulási fázisok szerint
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Összes: {totalTabMistakes} hiba
            </span>
          </div>

          <div className="w-full h-4 rounded-xl overflow-hidden flex bg-slate-200 dark:bg-slate-800 p-0.5 gap-1">
            <div
              style={{ width: `${tabPercentages.control}%` }}
              className="bg-amber-500 h-full rounded-l-lg relative group cursor-pointer transition-all hover:opacity-90"
              title={`Control: ${tabPercentages.control}%`}
            />
            <div
              style={{ width: `${tabPercentages.create}%` }}
              className="bg-purple-500 h-full relative group cursor-pointer transition-all hover:opacity-90"
              title={`Create: ${tabPercentages.create}%`}
            />
            <div
              style={{ width: `${tabPercentages.alive}%` }}
              className="bg-rose-500 h-full relative group cursor-pointer transition-all hover:opacity-90"
              title={`Alive: ${tabPercentages.alive}%`}
            />
            <div
              style={{ width: `${tabPercentages.course}%` }}
              className="bg-teal-500 h-full rounded-r-lg relative group cursor-pointer transition-all hover:opacity-90"
              title={`Kurzusok: ${tabPercentages.course}%`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Control ({tabPercentages.control}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Create ({tabPercentages.create}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Alive ({tabPercentages.alive}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Kurzusok ({tabPercentages.course}%)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Top Problémás Lépések & Kódrészletek (Bottlenecks) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Leggyakoribb Hibapontok
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Konkrét algoritmus-lépések és kódhiányok szűk keresztmetszetei
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.topBottlenecks.slice(0, 5).map((item, idx) => {
              const algoName = ALGO_NAMES[item.algorithmId] || item.algorithmId;

              return (
                <div
                  key={`${item.algorithmId}-${item.stepOrBlank}-${idx}`}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.stepOrBlank}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {algoName.split('(')[0]} •{' '}
                        <span className="uppercase font-bold text-indigo-400">{item.tab}</span>
                      </p>
                      {item.avgHesitationSeconds && (
                        <p className="text-[11px] text-sky-500 dark:text-sky-400 mt-1 flex items-center gap-1 font-semibold">
                          <span>⏱️ Átl. gondolkodási idő:</span>
                          <span className="font-black">{item.avgHesitationSeconds} mp</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 inline-block shadow-sm">
                      {item.mistakeCount} hiba
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300 font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-500" />
          <span>
            Pedagógiai Javaslat: A kiemelt lépéseknél érdemes a videós magyarázatot részletesebben
            megjeleníteni a diákoknak a feladat megkezdése előtt.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
