'use client';

import React, { useEffect, useState } from 'react';
import type { MultiplayerRoomState } from '../../../../types/multiplayer';
import { ArrowLeftRight, CheckCircle2, Zap, Sparkles, Users, Lock } from 'lucide-react';

interface DiscreteArenaProps {
  room: MultiplayerRoomState;
  localPlayerId: string;
  onSwap: (idxA: number, idxB: number) => void;
  onCompare: (idxA: number, idxB: number) => void;
}

export default function DiscreteArena({
  room,
  localPlayerId,
  onSwap,
  onCompare,
}: DiscreteArenaProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const activeIdxA = room.activeIndices[0];
  const activeIdxB = room.activeIndices[1];
  const valA = activeIdxA !== undefined ? room.array[activeIdxA] : null;
  const valB = activeIdxB !== undefined ? room.array[activeIdxB] : null;
  const isSwapNeeded = valA !== null && valB !== null && valA > valB;

  const playerA = room.players.find((p) => p.currentSlot === activeIdxA);
  const playerB = room.players.find((p) => p.currentSlot === activeIdxB);

  const localPlayer = room.players.find((p) => p.id === localPlayerId) || room.players[0];
  const isMultiplayer = room.players.filter((p) => !p.isBot).length > 1;
  const isLocalInvolved =
    !isMultiplayer ||
    (localPlayer &&
      (localPlayer.currentSlot === activeIdxA || localPlayer.currentSlot === activeIdxB)) ||
    Boolean(playerA?.isBot || playerB?.isBot);

  // Keyboard shortcut listener (Space/C = Swap, Enter/X = Compare)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (room.status !== 'playing' || !isLocalInvolved) return;
      if (
        (e.code === 'Space' || e.key.toLowerCase() === 'c') &&
        activeIdxA !== undefined &&
        activeIdxB !== undefined
      ) {
        e.preventDefault();
        onSwap(activeIdxA, activeIdxB);
      } else if (
        (e.code === 'Enter' || e.key.toLowerCase() === 'x') &&
        activeIdxA !== undefined &&
        activeIdxB !== undefined
      ) {
        e.preventDefault();
        onCompare(activeIdxA, activeIdxB);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIdxA, activeIdxB, isLocalInvolved, onCompare, onSwap, room.status]);

  const handleCardClick = (slot: number) => {
    if (!isLocalInvolved && isMultiplayer) return;
    if (selectedSlot === null) {
      setSelectedSlot(slot);
    } else if (selectedSlot !== slot) {
      onSwap(Math.min(selectedSlot, slot), Math.max(selectedSlot, slot));
      setSelectedSlot(null);
    } else {
      setSelectedSlot(null);
    }
  };

  const totalSlots = room.array.length || room.players.length || 4;

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-lg p-6 md:p-8 flex flex-col items-center transition-colors duration-300 space-y-6">
      {/* Top Banner / Algorithmic Guidance */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/10 gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#269984]/10 text-[#269984] rounded-xl border border-[#269984]/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-montserrat flex items-center gap-2">
              <span>{isSwapNeeded ? '🔄 Csere Szükséges!' : '✅ Helyes Sorrend!'}</span>
              {playerA && playerB && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  ({playerA.name} [{valA}] és {playerB.name} [{valB}])
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {isLocalInvolved
                ? isSwapNeeded
                  ? `🔥 Te vagy soron! Mivel [${valA}] > [${valB}], végezzétek el a cserét!`
                  : `🔥 Te vagy soron! Mivel [${valA}] ≤ [${valB}], a két elem jó helyen van. Hagyjátok jóvá (Enter)!`
                : `⏳ Várakozás ${playerA?.name || '1. Játékos'} és ${playerB?.name || '2. Játékos'} döntésére...`}
            </p>
          </div>
        </div>

        {/* Turn indicator badge */}
        <div className="text-xs font-montserrat font-bold flex items-center gap-2">
          {isLocalInvolved ? (
            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Te vagy soron!
            </span>
          ) : (
            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Csapatod van soron
            </span>
          )}
        </div>
      </div>

      {/* Array Cards Ordered Row */}
      <div className="w-full space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 font-montserrat flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#269984]" />
            Rendezendő Kártyasorozat (Kooperatív Résztvevők)
          </span>
          <span className="font-mono">{totalSlots} Elem</span>
        </div>

        <div className="w-full flex flex-wrap items-center justify-center gap-4 md:gap-6 py-4 min-h-[160px]">
          {Array.from({ length: totalSlots }).map((_, slotIndex) => {
            const val = room.array[slotIndex] ?? 0;
            const player = room.players.find((p) => p.currentSlot === slotIndex);
            const isActive = room.activeIndices.includes(slotIndex);
            const isLocal = player?.id === localPlayerId;
            const isCardSelected = selectedSlot === slotIndex;
            const playerColor = player?.color || '#269984';

            return (
              <div
                key={`slot-${slotIndex}`}
                onClick={() => handleCardClick(slotIndex)}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 select-none ${
                  isActive ? 'scale-105' : 'opacity-90 hover:opacity-100 hover:scale-102'
                }`}
              >
                {/* Slot Index Tag */}
                <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                  [{slotIndex}]
                </div>

                {/* Glowing Glass Card */}
                <div
                  style={{
                    boxShadow: isCardSelected
                      ? `0 0 25px #f59e0b`
                      : isActive
                        ? `0 0 25px ${playerColor}70`
                        : `0 4px 12px rgba(0,0,0,0.05)`,
                    borderColor: isCardSelected
                      ? '#f59e0b'
                      : isActive
                        ? playerColor
                        : 'rgba(255, 255, 255, 0.1)',
                  }}
                  className={`w-24 h-32 md:w-28 md:h-36 rounded-2xl flex flex-col items-center justify-between p-3 border-2 bg-slate-50 dark:bg-[#0a0a0a] transition-all shadow-md ${
                    isCardSelected
                      ? 'ring-4 ring-amber-400 scale-110'
                      : isActive
                        ? 'ring-2 ring-[#269984]/50'
                        : ''
                  }`}
                >
                  {/* Top Owner Tag */}
                  <div className="w-full flex items-center justify-between text-[10px] font-bold font-montserrat">
                    <span style={{ color: playerColor }} className="truncate max-w-[65px]">
                      {player?.name || `Slot ${slotIndex}`}
                    </span>
                    <span
                      style={{ backgroundColor: playerColor }}
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                    />
                  </div>

                  {/* Main Value Number */}
                  <div
                    style={{ color: playerColor }}
                    className="text-3xl md:text-4xl font-black font-montserrat tracking-tight my-auto"
                  >
                    {val}
                  </div>

                  {/* Bottom Role/Local Indicator */}
                  <div className="w-full text-center">
                    {isLocal ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#269984] bg-[#269984]/15 px-2 py-0.5 rounded-md font-mono">
                        TE
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-mono">#{slotIndex + 1}</span>
                    )}
                  </div>
                </div>

                {/* Active Comparison Badge */}
                {isActive && (
                  <span className="absolute -top-3 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-md font-montserrat animate-bounce">
                    VIZSGÁLAT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Control Buttons (Enabled for involved players, Locked for spectators) */}
      {activeIdxA !== undefined && activeIdxB !== undefined && (
        <div className="w-full max-w-xl pt-2">
          {isLocalInvolved ? (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onCompare(activeIdxA, activeIdxB)}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm font-montserrat text-sm border ${
                  room.pendingHandshake &&
                  localPlayer &&
                  room.pendingHandshake.readyPlayerIds.includes(localPlayer.id) &&
                  room.pendingHandshake.action === 'compare'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/40'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>
                  {room.pendingHandshake &&
                  localPlayer &&
                  room.pendingHandshake.readyPlayerIds.includes(localPlayer.id) &&
                  room.pendingHandshake.action === 'compare'
                    ? '1. Jóváhagyva ✓ (Várakozás)'
                    : '1. Összehasonlítás (Enter)'}
                </span>
              </button>

              <button
                onClick={() => onSwap(activeIdxA, activeIdxB)}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 font-montserrat text-sm ${
                  room.pendingHandshake &&
                  localPlayer &&
                  room.pendingHandshake.readyPlayerIds.includes(localPlayer.id) &&
                  room.pendingHandshake.action === 'swap'
                    ? 'bg-amber-600 ring-4 ring-amber-500/40 animate-pulse'
                    : isSwapNeeded
                      ? 'bg-[#269984] hover:bg-[#208270] shadow-[#269984]/30 ring-2 ring-[#269984]/60 animate-pulse'
                      : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span>
                  {room.pendingHandshake &&
                  localPlayer &&
                  room.pendingHandshake.readyPlayerIds.includes(localPlayer.id) &&
                  room.pendingHandshake.action === 'swap'
                    ? '2. Csere Kérve ✓ (Várakozás)'
                    : '2. Csere Végrehajtása (Space)'}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#269984]/10 border border-[#269984]/20 rounded-2xl text-center space-y-1 animate-pulse">
              <div className="text-xs font-bold text-[#269984] font-montserrat flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  Most {playerA?.name} és {playerB?.name} lépése következik!
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                A rendezés közös csapatmunka: várd meg, amíg az érintett játékosok meghozzák a
                döntést!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hint Footer */}
      <div className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[#269984] font-bold">&gt;</span>
          <span className="text-[#269984] dark:text-cyan-300 font-bold">
            {room.currentCodeLine || 'Várakozás...'}
          </span>
        </div>
        <div className="text-amber-600 dark:text-amber-400 hidden sm:block truncate ml-4 font-sans font-medium">
          {room.lastActionMessage}
        </div>
      </div>
    </div>
  );
}
