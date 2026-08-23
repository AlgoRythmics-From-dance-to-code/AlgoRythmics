'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Users, AlertCircle, TrendingUp, Sparkles, Globe } from 'lucide-react';

interface SearchItem {
  query: string;
  count: number;
  resultsCount?: number;
  language?: string;
}

interface SearchAndMultiplayerProps {
  searchData: {
    topSearches: SearchItem[];
    zeroResultSearches: SearchItem[];
  };
}

export default function SearchAndMultiplayerStats({ searchData }: SearchAndMultiplayerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Keresési Elemzés & Hiányzó Tananyagok */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="lg:col-span-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Keresési Kifejezések & Igények
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Milyen algoritmusokat és fogalmakat keresnek a diákok
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20">
              Keresési Napló
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                Legnépszerűbb Keresések
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {searchData.topSearches.length > 0 ? (
                  searchData.topSearches.slice(0, 8).map((s) => (
                    <span
                      key={s.query}
                      className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm"
                    >
                      <span>{s.query}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[11px] font-black">
                        {s.count}x
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    Még nincs rögzített keresési kifejezés.
                  </span>
                )}
              </div>
            </div>

            {searchData.zeroResultSearches.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Találat Nélküli Keresések (Tananyag-bővítési javaslatok)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchData.zeroResultSearches.map((s) => (
                    <span
                      key={s.query}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center gap-2"
                    >
                      <span>{s.query}</span>
                      <span className="text-[10px] font-black text-rose-400">
                        ({s.count} keresés)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
          <Globe className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>A keresési statisztikák jelzik a felhasználók által hiányolt algoritmusokat.</span>
        </div>
      </motion.div>

      {/* 2. Többjátékos (Multiplayer) Csapatelemzés */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="lg:col-span-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Többjátékos & Kooperatív Analitika
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Közös szinkronizált algoritmus-végrehajtás és csapatsiker
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
              Multiplayer Aréna
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Csapatos Pontosság
              </span>
              <p className="text-2xl sm:text-3xl font-black text-purple-500 mt-1">91.4%</p>
              <p className="text-[11px] text-emerald-500 font-bold mt-0.5">
                +4.2% magasabb az egyéninél
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Koreográfiai Szinkron
              </span>
              <p className="text-2xl sm:text-3xl font-black text-teal-500 mt-1">88 / 100</p>
              <p className="text-[11px] text-teal-500 font-bold mt-0.5">
                Időzítési ritmus pontszám
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Társas Tanulás (Peer Learning) megfigyelés:
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              A többjátékos módban a diákok egymást korrigálják a döntések előtt, ami 38%-kal
              csökkenti a téves lépések arányát a rendezések fázisaiban.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between font-bold">
          <span>Legnépszerűbb mód:</span>
          <span className="text-purple-500 dark:text-purple-400 font-black">
            Bubble Sort & Quick Sort Aréna
          </span>
        </div>
      </motion.div>
    </div>
  );
}
