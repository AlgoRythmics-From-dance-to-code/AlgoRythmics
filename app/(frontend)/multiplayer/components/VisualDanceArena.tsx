'use client';

import React, { useState } from 'react';
import type { MultiplayerRoomState } from '../../../../types/multiplayer';
import { useLocale } from '../../../i18n/LocaleProvider';
import {
  ArrowLeftRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Info,
  Clock,
  Award,
} from 'lucide-react';

interface VisualDanceArenaProps {
  room: MultiplayerRoomState;
  localPlayerId: string;
  elapsedSeconds?: number;
  choreographyScore?: number;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onSwap: (idxA: number, idxB: number) => void;
  onCompare: (idxA: number, idxB: number) => void;
}

export default function VisualDanceArena({
  room,
  localPlayerId,
  elapsedSeconds = 0,
  choreographyScore = 100,
  audioEnabled = true,
  onToggleAudio,
  onSwap,
  onCompare,
}: VisualDanceArenaProps) {
  const { t } = useLocale();
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const activeIdxA = room.activeIndices[0];
  const activeIdxB = room.activeIndices[1];
  const valA = activeIdxA !== undefined ? room.array[activeIdxA] : null;
  const valB = activeIdxB !== undefined ? room.array[activeIdxB] : null;

  const isSwapNeeded = valA !== null && valB !== null && valA > valB;

  const playerA = room.players.find((p) => p.currentSlot === activeIdxA);
  const playerB = room.players.find((p) => p.currentSlot === activeIdxB);

  const localPlayer = room.players.find((p) => p.id === localPlayerId) || room.players[0];
  const isLocalInvolved =
    !playerA ||
    !playerB ||
    localPlayer?.isHost ||
    localPlayer?.currentSlot === activeIdxA ||
    localPlayer?.currentSlot === activeIdxB ||
    playerA.isBot ||
    playerB.isBot;

  const totalSlots = room.array.length || room.players.length || 4;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSwapClick = React.useCallback(() => {
    if (activeIdxA === undefined || activeIdxB === undefined) return;
    if (isSwapNeeded) {
      setLastActionFeedback(
        t('multiplayer.dance_arena.feedback_swap_correct') ||
          '🎉 Helyes döntés! A nagyobb szám jobbra lépett.',
      );
    } else {
      setLastActionFeedback(
        t('multiplayer.dance_arena.feedback_swap_incorrect') ||
          '⚠️ Figyelem: ezek a számok már jó sorrendben álltak.',
      );
    }
    onSwap(activeIdxA, activeIdxB);
  }, [activeIdxA, activeIdxB, isSwapNeeded, onSwap, t]);

  const handleKeepClick = React.useCallback(() => {
    if (activeIdxA === undefined || activeIdxB === undefined) return;
    if (!isSwapNeeded) {
      setLastActionFeedback(
        t('multiplayer.dance_arena.feedback_keep_correct') ||
          '✨ Nagyszerű! Nem volt szükség cserére, mehet a következő lépés.',
      );
    } else {
      setLastActionFeedback(
        t('multiplayer.dance_arena.feedback_keep_incorrect') ||
          '⚠️ Figyelem: a bal oldali szám nagyobb volt, helycsere kellett volna!',
      );
    }
    onCompare(activeIdxA, activeIdxB);
  }, [activeIdxA, activeIdxB, isSwapNeeded, onCompare, t]);

  // Keyboard shortcut listener (Space = Swap, Enter/ArrowRight = Keep)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!isLocalInvolved || activeIdxA === undefined || activeIdxB === undefined) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleSwapClick();
      } else if (e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleKeepClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocalInvolved, activeIdxA, activeIdxB, handleSwapClick, handleKeepClick]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* ── 1. Top HUD Bar (Score, Time, Audio) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-lg">
        {/* Left: Mode Badge & Time */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#269984]/10 text-[#269984] font-montserrat font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-[#269984]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {room.mode === 'bubble_sort'
                ? t('multiplayer.dance_arena.bubble_sort_dance') || 'Buborékrendezés Tánc'
                : room.mode === 'selection_sort'
                  ? t('multiplayer.dance_arena.selection_sort_dance') || 'Kiválasztó Rendezés'
                  : room.mode === 'quick_sort'
                    ? t('multiplayer.dance_arena.quick_sort_dance') || 'Gyorsrendezés Tánc'
                    : t('multiplayer.dance_arena.sorting_dance') || 'Rendezés Tánc'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Center: Message from Room */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-md truncate">
          <span className="w-2 h-2 rounded-full bg-[#269984] animate-ping" />
          <span className="truncate">
            {room.lastActionMessage || 'Kövesd az algoritmus ritmusát!'}
          </span>
        </div>

        {/* Right: Choreography Score & Audio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-montserrat font-bold text-xs">
            <Award className="w-4 h-4" />
            <span>
              {choreographyScore}% {t('multiplayer.dance_arena.rhythm') || 'Ritmus'}
            </span>
          </div>

          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              title={
                audioEnabled
                  ? t('multiplayer.dance_arena.mute_audio') || 'Hang némítása'
                  : t('multiplayer.dance_arena.unmute_audio') || 'Hang bekapcsolása'
              }
            >
              {audioEnabled ? (
                <Volume2 className="w-4 h-4 text-[#269984]" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── 2. The Interactive Dance Stage ── */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-white to-slate-50 dark:from-[#111817] dark:to-[#0a0f0e] border-2 border-[#269984]/20 shadow-2xl p-6 sm:p-10 flex flex-col items-center gap-8 overflow-hidden">
        {/* Stage background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#269984]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Stage Header / Prompt */}
        <div className="text-center space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#269984]/15 text-[#269984] font-montserrat font-bold text-xs uppercase tracking-widest border border-[#269984]/30 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>
              {t('multiplayer.dance_arena.current_comparison') ||
                'Aktuális összehasonlítás a táncparketten'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-montserrat">
            {valA !== null && valB !== null ? (
              <span>
                {t('multiplayer.dance_arena.compare_prompt', { valA, valB }) || (
                  <>
                    Hasonlítsd össze: <span className="text-[#269984] font-mono">[{valA}]</span> és{' '}
                    <span className="text-amber-500 font-mono">[{valB}]</span>
                  </>
                )}
              </span>
            ) : (
              t('multiplayer.dance_arena.dancers_ready') || 'A táncosok készen állnak a rendezésre!'
            )}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {valA !== null && valB !== null ? (
              isSwapNeeded ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {t('multiplayer.dance_arena.swap_needed_desc', { valA, valB }) ||
                    `🔄 Mivel a bal oldali érték (${valA}) nagyobb, mint a jobb oldali (${valB}), cseréljenek helyet!`}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t('multiplayer.dance_arena.in_order_desc', { valA, valB }) ||
                    `✅ Mivel ${valA} ≤ ${valB}, már jó sorrendben állnak. Mehet a következő pár!`}
                </span>
              )
            ) : (
              t('multiplayer.dance_arena.click_instruction') ||
              'Kattints az alábbi gombokra a tánclépések végrehajtásához.'
            )}
          </p>
        </div>

        {/* ── 3. Dancers / Array Cards Row ── */}
        <div className="w-full flex flex-wrap items-end justify-center gap-3 sm:gap-6 py-6 z-10">
          {Array.from({ length: totalSlots }).map((_, slotIndex) => {
            const val = room.array[slotIndex] ?? 0;
            const player = room.players.find((p) => p.currentSlot === slotIndex);
            const isActive = room.activeIndices.includes(slotIndex);
            const isFirstActive = slotIndex === activeIdxA;
            const isLocal = player?.id === localPlayerId;
            const color = player?.color || '#269984';

            return (
              <div
                key={`slot-${slotIndex}`}
                className={`relative flex flex-col items-center transition-all duration-300 ${
                  isActive ? '-translate-y-3 scale-105' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Comparison Indicator Spotlight */}
                {isActive && (
                  <div
                    className={`absolute -top-7 px-2.5 py-0.5 rounded-full text-[10px] font-black font-montserrat tracking-wider shadow-md animate-bounce ${
                      isFirstActive ? 'bg-[#269984] text-white' : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isFirstActive
                      ? t('multiplayer.dance_arena.left') || 'BAL'
                      : t('multiplayer.dance_arena.right') || 'JOBB'}
                  </div>
                )}

                {/* Dancer Avatar Head */}
                <div
                  style={{ borderColor: color }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg mb-2 shadow-md border-2 bg-white dark:bg-[#1a1a1a] transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {player?.isBot ? '🤖' : isLocal ? '🌟' : '💃'}
                </div>

                {/* Card Block */}
                <div
                  style={{
                    boxShadow: isActive ? `0 0 30px ${color}50` : '0 4px 15px rgba(0,0,0,0.06)',
                    borderColor: isActive ? color : 'rgba(150, 150, 150, 0.2)',
                  }}
                  className={`w-20 h-28 sm:w-28 sm:h-36 rounded-2xl p-3 flex flex-col items-center justify-between border-2 bg-white dark:bg-[#151515] transition-all ${
                    isActive ? 'ring-4 ring-[#269984]/30' : ''
                  }`}
                >
                  {/* Dancer Name */}
                  <div className="w-full flex items-center justify-between text-[10px] font-bold font-montserrat">
                    <span style={{ color }} className="truncate max-w-[65px]">
                      {player?.name || `Táncos ${slotIndex + 1}`}
                    </span>
                    <span style={{ backgroundColor: color }} className="w-2 h-2 rounded-full" />
                  </div>

                  {/* Big Number */}
                  <div
                    style={{ color: isActive ? color : undefined }}
                    className="text-3xl sm:text-4xl font-black font-montserrat text-slate-900 dark:text-white my-auto tracking-tight"
                  >
                    {val}
                  </div>

                  {/* Slot / Index badge */}
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                    {isLocal ? t('multiplayer.dance_arena.you') || 'TE' : `#${slotIndex + 1}`}
                  </div>
                </div>

                {/* Floor Shadow Marker */}
                <div
                  style={{ backgroundColor: isActive ? color : '#94a3b8' }}
                  className={`w-14 h-2 rounded-full mt-3 transition-opacity ${
                    isActive ? 'opacity-70 scale-125 blur-[1px]' : 'opacity-20'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* ── 4. Dual Handshake Synchronization Banner ── */}
        {room.pendingHandshake && (
          <div className="w-full max-w-xl px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-montserrat font-bold flex items-center justify-between gap-3 shadow-md animate-pulse z-10">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🤝</span>
              <span>
                {room.pendingHandshake.readyPlayerIds.includes(localPlayerId)
                  ? t('multiplayer.dance_arena.waiting_for_partner') ||
                    'Megerősítve! Várakozás a táncpartner jóváhagyására a szinkron lépéshez...'
                  : isLocalInvolved
                    ? t('multiplayer.dance_arena.partner_requested_action') ||
                      'A partnered lépést kér! Nyomd meg a gombot a közös jóváhagyáshoz!'
                    : t('multiplayer.dance_arena.synchronizing_pair') ||
                      'A pár szinkronizációja folyamatban...'}
              </span>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 font-mono text-xs uppercase tracking-wider">
              {room.pendingHandshake.action === 'swap' ? 'CSERE' : 'JÓVÁHAGYÁS'}
            </span>
          </div>
        )}

        {/* ── 5. Main Action Buttons (Swap vs Keep) ── */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 z-10">
          {/* Swap Button */}
          <button
            onClick={handleSwapClick}
            disabled={!isLocalInvolved || activeIdxA === undefined || activeIdxB === undefined}
            className={`w-full sm:w-1/2 py-4 px-6 rounded-2xl font-montserrat font-black text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl active:scale-95 ${
              isSwapNeeded
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ring-4 ring-amber-500/30 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>{t('multiplayer.dance_arena.swap_btn') || '🔄 CSERE (Helycsere)'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-2 py-0.5 text-[10px] font-mono rounded bg-black/20 text-white/90 border border-white/20">
              Space
            </kbd>
          </button>

          {/* Keep / Next Button */}
          <button
            onClick={handleKeepClick}
            disabled={!isLocalInvolved || activeIdxA === undefined || activeIdxB === undefined}
            className={`w-full sm:w-1/2 py-4 px-6 rounded-2xl font-montserrat font-black text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl active:scale-95 ${
              !isSwapNeeded
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white ring-4 ring-teal-500/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{t('multiplayer.dance_arena.keep_btn') || '⏭️ MARAD (Jó sorrend)'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-2 py-0.5 text-[10px] font-mono rounded bg-black/20 text-white/90 border border-white/20">
              Enter
            </kbd>
          </button>
        </div>

        {/* ── 6. Feedback Box ── */}
        {lastActionFeedback && (
          <div className="px-5 py-2.5 rounded-2xl bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-montserrat font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-2 animate-in fade-in zoom-in-95 z-10">
            <Info className="w-4 h-4 text-[#269984] shrink-0" />
            <span>{lastActionFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
