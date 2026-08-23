'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Award, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ConfidenceMatrixProps {
  matrix: {
    mastery: number;
    overconfidence: number;
    hesitant: number;
    recognizedGap: number;
  };
}

export default function ConfidenceMatrixCard({ matrix }: ConfidenceMatrixProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Magabiztosság & Metakognitív Kalibráció (2x2 Mátrix)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              A tanulói magabiztossági szint és a valós helyességi arány 2x2 mátrixa
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20">
          Metakogníció
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Kvadra: Magas magabiztosság + Helyes (Valódi Tudás) */}
        <div className="p-5 sm:p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Valódi Tudás (Mastery)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {matrix.mastery}%
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">
              Magas magabiztosság + Helyes válasz
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              A diák biztos a dolgában és helyesen oldotta meg. Megbízható elméleti és gyakorlati
              készség.
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${matrix.mastery}%` }}
            />
          </div>
        </div>

        {/* 2. Kvadra: Magas magabiztosság + Helytelen (Tévképzet / Dunning-Kruger) */}
        <div className="p-5 sm:p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 flex flex-col justify-between hover:border-rose-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Tévképzet (Overconfident)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {matrix.overconfidence}%
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">
              Magas magabiztosság + Helytelen válasz
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              A diák biztos volt benne, mégis hibázott. Ez a legfontosabb területe a szemléltető
              magyarázatoknak.
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${matrix.overconfidence}%` }}
            />
          </div>
        </div>

        {/* 3. Kvadra: Alacsony magabiztosság + Helyes (Bizonytalan Tudás) */}
        <div className="p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Bizonytalan Tudás (Hesitant)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {matrix.hesitant}%
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">
              Alacsony magabiztosság + Helyes válasz
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              A diák jól válaszolt, de nem bízott magában. Pozitív megerősítéssel és kabala
              dicsérettel építhető az önbizalma.
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${matrix.hesitant}%` }}
            />
          </div>
        </div>

        {/* 4. Kvadra: Alacsony magabiztosság + Helytelen (Felismert Hiányosság) */}
        <div className="p-5 sm:p-6 rounded-3xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20 flex flex-col justify-between hover:border-sky-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Felismert Hiányosság (Aware Gap)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
                {matrix.recognizedGap}%
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">
              Alacsony magabiztosság + Helytelen válasz
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              A tanuló tudta, hogy bizonytalan és hibázott is. Reális önértékelés, azonnal nyitott a
              tippekre.
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${matrix.recognizedGap}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
