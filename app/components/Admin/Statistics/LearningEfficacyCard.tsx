'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Video, Play, ShieldCheck } from 'lucide-react';

interface LearningEfficacyProps {
  data: {
    hintSuccessRate: number;
    videoErrorReductionPercent: number;
    avgMistakesWithVideo: number;
    avgMistakesWithoutVideo: number;
    animationStepBenefit: {
      withStepBack: number;
      withoutStepBack: number;
    };
  };
}

export default function LearningEfficacyCard({ data }: LearningEfficacyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-sm">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Mi segíti elő a tanulásukat? (Pedagógiai Hatáselemzés)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Videók, segítségek és animációs visszaléptetések hatása a sikerességre
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20">
          A/B Elemzés
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Videó Megtekintés Hatása */}
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                -{data.videoErrorReductionPercent}% Hiba
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Magyarázó Videók Hatása
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              A táncos videót megnéző tanulók sokkal kevesebb hibával oldják meg az algoritmust.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Videót megnézve:</span>
                <span className="text-emerald-500 font-black">
                  {data.avgMistakesWithVideo} átl. hiba
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (data.avgMistakesWithVideo / 6) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Videó kihagyásával:</span>
                <span className="text-rose-500 font-black">
                  {data.avgMistakesWithoutVideo} átl. hiba
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (data.avgMistakesWithoutVideo / 6) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Hint / Dinamikus Segítség Hatékonysága */}
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Lightbulb className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {data.hintSuccessRate}% Siker
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Hint & Kabala Segítség
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              A diákok {data.hintSuccessRate}%-a a segítségkérés után sikeresen elvégzi a
              rákövetkező lépést.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              <span>Sikerességi ráta</span>
              <span className="text-teal-500 font-black">{data.hintSuccessRate}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-teal-500 h-full rounded-full transition-all"
                style={{ width: `${data.hintSuccessRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              Azonnali elakadás-feloldás és motiváció
            </p>
          </div>
        </div>

        {/* 3. Visszalépkedés & Lassú Lejátszás Szerepe */}
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Play className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                +
                {data.animationStepBenefit.withStepBack - data.animationStepBenefit.withoutStepBack}
                % Pontszám
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Animáció Visszaléptetés Hatása
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Az interaktív visszaléptetés és megfigyelés növeli az önálló feladatmegoldási
              eredményt.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 space-y-2 text-xs font-bold">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Visszalépkedést használók:</span>
              <span className="text-purple-400 font-black">
                {data.animationStepBenefit.withStepBack}% átlag
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Csak sima lejátszás:</span>
              <span className="text-slate-400 font-bold">
                {data.animationStepBenefit.withoutStepBack}% átlag
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
