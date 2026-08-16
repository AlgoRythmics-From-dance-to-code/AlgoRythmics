'use client';

import React, { useState, useEffect } from 'react';
import type { MatchStatistics } from '../../../../types/multiplayer';
import {
  getMultiplayerHistory,
  getMultiplayerAggregateStats,
} from '../../../../lib/multiplayerAnalytics';
import { useLocale } from '../../../i18n/LocaleProvider';
import { X, Trophy, Clock, CheckCircle2, Activity, Calendar } from 'lucide-react';

interface MultiplayerHistoryModalProps {
  onClose: () => void;
}

export default function MultiplayerHistoryModal({ onClose }: MultiplayerHistoryModalProps) {
  const { t, locale } = useLocale();
  const [history, setHistory] = useState<MatchStatistics[]>([]);
  const [aggregates, setAggregates] = useState<ReturnType<
    typeof getMultiplayerAggregateStats
  > | null>(null);

  useEffect(() => {
    setHistory(getMultiplayerHistory());
    setAggregates(getMultiplayerAggregateStats());
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#269984]/10 border border-[#269984]/20 text-[#269984] rounded-2xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-montserrat">
                {t('multiplayer.history.title') || 'Multiplayer Mérkőzés Előzmények'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('multiplayer.history.subtitle') || 'Rögzített lépések, idők és statisztikák'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aggregates Banner */}
        {aggregates && aggregates.totalGames > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 pb-2">
            <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('multiplayer.history.total_games') || 'Összes Meccs'}
              </div>
              <div className="text-xl font-bold font-mono text-[#269984]">
                {aggregates.totalGames}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('multiplayer.history.avg_accuracy') || 'Átlagos Pontosság'}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {aggregates.averageAccuracy}%
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('multiplayer.history.avg_choreography') || 'Átlag Koreográfia'}
              </div>
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-300">
                {aggregates.averageChoreography}%
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('multiplayer.history.total_swaps') || 'Összes Csere'}
              </div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-300">
                {aggregates.totalSwaps}
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              {t('multiplayer.history.no_history') ||
                'Még nincsenek rögzített többjátékos meccseid. Indíts el egyet a lobbyból!'}
            </div>
          ) : (
            history.map((m) => {
              const dateStr = new Date(m.startTime).toLocaleDateString(
                locale === 'hu' ? 'hu-HU' : locale === 'ro' ? 'ro-RO' : 'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              );
              const durSec = Math.round(m.durationMs / 1000);
              const modeName = t(`multiplayer.modes.${m.mode}.name`) || m.mode;

              return (
                <div
                  key={m.matchId}
                  className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#269984]/40 transition-colors shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {modeName}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-[#269984]/10 text-[#269984] px-2 py-0.5 rounded">
                        {m.controlStyle === 'spatial'
                          ? t('multiplayer.controls.spatial.title')
                          : m.controlStyle === 'physical'
                            ? t('multiplayer.controls.physical.title')
                            : t('multiplayer.controls.discrete.title')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {t('multiplayer.players_count', { count: m.teamSize }) ||
                          `${m.teamSize} játékos`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {durSec}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {m.accuracyPercentage}%
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {m.totalSwaps} {t('multiplayer.hud.swaps') || 'csere'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-600 dark:text-purple-300 font-bold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> {m.choreographyScore}%
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {m.theoreticalComplexity}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-[#0a0a0a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors font-montserrat"
          >
            {t('multiplayer.history.close') || 'Bezárás'}
          </button>
        </div>
      </div>
    </div>
  );
}
