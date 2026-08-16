'use client';

import React from 'react';
import type { MultiplayerRoomState, StepActionLog } from '../../../../types/multiplayer';
import { useLocale } from '../../../i18n/LocaleProvider';
import { Timer, ArrowLeftRight, CheckSquare, Zap, Activity, Volume2, VolumeX } from 'lucide-react';

interface StatsDashboardProps {
  room: MultiplayerRoomState;
  elapsedSeconds: number;
  choreographyScore: number;
  stepLogs: StepActionLog[];
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export default function StatsDashboard({
  room,
  elapsedSeconds,
  choreographyScore,
  stepLogs: _stepLogs,
  audioEnabled,
  onToggleAudio,
}: StatsDashboardProps) {
  const { t } = useLocale();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const totalComparisons = room.players.reduce((acc, p) => acc + p.comparisonsCount, 0);
  const totalSwaps = room.players.reduce((acc, p) => acc + p.swapsCount, 0);
  const totalErrors = room.players.reduce((acc, p) => acc + p.errorsCount, 0);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
      {/* Timer */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors duration-300">
        <div className="p-2.5 bg-[#269984]/10 border border-[#269984]/20 text-[#269984] rounded-lg">
          <Timer className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.elapsed_time') || 'Eltelt Idő'}
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {formatTime(elapsedSeconds)}
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors duration-300">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
          <CheckSquare className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.comparisons') || 'Összehasonlítások'}
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {totalComparisons}
          </div>
        </div>
      </div>

      {/* Swaps */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors duration-300">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.swaps') || 'Cserék'}
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {totalSwaps}
          </div>
        </div>
      </div>

      {/* Choreography / Sync */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors duration-300">
        <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.choreography') || 'Koreográfia'}
          </div>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-300">
            {choreographyScore}%
          </div>
        </div>
      </div>

      {/* Penalties / Errors */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors duration-300">
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.errors') || 'Hibás Lépések'}
          </div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-300">
            {totalErrors}
          </div>
        </div>
      </div>

      {/* Audio Mute & Room ID */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center justify-between shadow-sm transition-colors duration-300">
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('multiplayer.hud.room_code') || 'Szoba Kód'}
          </div>
          <div className="text-sm font-bold font-mono text-[#269984]">{room.roomId}</div>
        </div>
        <button
          onClick={onToggleAudio}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 transition-colors"
          title={audioEnabled ? 'Hang némítása' : 'Hang bekapcsolása'}
        >
          {audioEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-500" />
          )}
        </button>
      </div>
    </div>
  );
}
