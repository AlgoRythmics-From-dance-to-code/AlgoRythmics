'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, ShieldAlert, RotateCcw, CheckCircle, HelpCircle } from 'lucide-react';

interface PostErrorSlowdownProps {
  data: {
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
}

export default function PostErrorSlowdownCard({ data }: PostErrorSlowdownProps) {
  const normalSeconds = (data.avgNormalDurationMs / 1000).toFixed(1);
  const postErrorSeconds = (data.avgPostErrorDurationMs / 1000).toFixed(1);
  const deltaSeconds = ((data.avgPostErrorDurationMs - data.avgNormalDurationMs) / 1000).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Hiba Utáni Lelassulás & Reakciódinamika (PES Index)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Post-Error Slowing (PES) megfontoltság és hibajavítási viselkedésminták
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />+{data.pesSlowdownPercentage}% Reakcióidő
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Idő összehasonlító mutató (Normal vs Post-Error) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Döntési Időkülönbség
            </span>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  <span>Normál helyes döntésnél:</span>
                  <span className="text-emerald-500 font-black">{normalSeconds} mp</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  <span>Hiba utáni rákövetkező döntésnél:</span>
                  <span className="text-amber-500 font-black">{postErrorSeconds} mp</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Megfontoltsági többletidő:</p>
              <p className="text-xl sm:text-2xl font-black text-amber-500">
                +{deltaSeconds} másodperc
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-black inline-block">
                +{data.pesSlowdownPercentage}% PES
              </span>
            </div>
          </div>
        </div>

        {/* 2. Hiba Utáni Azonnali Viselkedési Megoszlás */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Azonnali Reakció Hiba Után
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Hogyan viselkedik a tanuló a téves visszajelzés után?
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Konstruktív átgondolás & siker
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {data.postErrorDistribution.constructiveSuccessRate}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
                <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  Kapkodó ismételt hiba
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {data.postErrorDistribution.impulsiveFailRate}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs">
                <span className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                  <HelpCircle className="w-4 h-4" />
                  Kabala segítségkérés (Hint)
                </span>
                <span className="font-black text-sky-600 dark:text-sky-400">
                  {data.postErrorDistribution.hintRequestRate}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                  <RotateCcw className="w-4 h-4" />
                  Újraindítás / Kilépés
                </span>
                <span className="font-black text-slate-600 dark:text-slate-400">
                  {data.postErrorDistribution.resetOrDropRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Hibajavítási Görbe (Recovery Curve) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Javítási Sikerességi Görbe
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sikerráta egymást követő javítási kísérletekben
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">
                    1. próbálkozás (Azonnali):
                  </span>
                  <span className="text-teal-500 font-black">
                    {data.recoveryCurve.firstRetrySuccess}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all"
                    style={{ width: `${data.recoveryCurve.firstRetrySuccess}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">
                    2. próbálkozás (Korrekció):
                  </span>
                  <span className="text-cyan-500 font-black">
                    {data.recoveryCurve.secondRetrySuccess}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${data.recoveryCurve.secondRetrySuccess}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">
                    3. próbálkozás (Végső):
                  </span>
                  <span className="text-emerald-500 font-black">
                    {data.recoveryCurve.thirdRetrySuccess}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${data.recoveryCurve.thirdRetrySuccess}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/50 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>A diákok 98%-a 3 kísérleten belül sikeresen javítja a hibát.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
