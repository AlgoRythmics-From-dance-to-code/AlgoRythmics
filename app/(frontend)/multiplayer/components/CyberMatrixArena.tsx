'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MultiplayerRoomState, TacticalPing } from '../../../../types/multiplayer';
import {
  Flame,
  Zap,
  Radio,
  Crosshair,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowLeftRight,
  Terminal,
  Activity,
  Smile,
  AlertTriangle,
  Cpu,
  Wifi,
} from 'lucide-react';

interface CyberMatrixArenaProps {
  room: MultiplayerRoomState;
  localPlayerId: string;
  onSwap: (idxA: number, idxB: number) => void;
  onCompare: (idxA: number, idxB: number) => void;
  onSetScannerLock?: (indices: [number, number], isLocked: boolean) => void;
  onExecuteOperatorAction?: (action: 'swap' | 'confirm_ok') => void;
  onSendTacticalPing?: (
    type: TacticalPing['type'],
    message: string,
    targetIndices?: number[],
  ) => void;
  onSendReaction?: (emoji: string) => void;
  onMove?: (x: number, y: number) => void;
}

const REACTION_EMOJIS = ['🔥', '⚡', '🎯', '🚀', '🧠', '❤️'];

export default function CyberMatrixArena({
  room,
  localPlayerId,
  onSwap,
  onCompare,
  onSetScannerLock,
  onExecuteOperatorAction,
  onSendTacticalPing,
  onSendReaction,
}: CyberMatrixArenaProps) {
  const [selectedCoreIdx, setSelectedCoreIdx] = useState<number | null>(null);

  const localPlayer = room.players.find((p) => p.id === localPlayerId) || room.players[0];
  const humanPlayers = room.players.filter((p) => !p.isBot);
  const isSoloOrBot = humanPlayers.length <= 1;

  // Determine local player's cyber role
  const myRole = localPlayer?.cyberRole || (localPlayer?.isHost ? 'scanner' : 'operator');
  const isScanner = myRole === 'scanner' || isSoloOrBot;
  const isOperator = myRole === 'operator' || isSoloOrBot;

  const activeIdxA = room.activeIndices[0] ?? 0;
  const activeIdxB = room.activeIndices[1] ?? 1;
  const totalCores = room.array.length || 4;

  const scannerLock = room.scannerLock;
  const isLocked = Boolean(scannerLock?.isLocked);
  const lockedA = isLocked ? scannerLock!.lockedIndices[0] : activeIdxA;
  const lockedB = isLocked ? scannerLock!.lockedIndices[1] : activeIdxB;
  const valA = room.array[lockedA] ?? 0;
  const valB = room.array[lockedB] ?? 0;
  const isSwapNeeded = valA > valB;

  const firewallHeat = room.firewallHeat || 12;
  const teamSynergy = room.teamSynergy || 65;

  // Sound oscillator
  const playBeep = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.1) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context may be restricted
    }
  }, []);

  // Handle Scanner Lock Toggle
  const handleToggleScannerLock = useCallback(
    (idxA = activeIdxA, idxB = activeIdxB) => {
      if (!isScanner) return;
      playBeep(750, 'sawtooth', 0.15);
      if (onSetScannerLock) {
        onSetScannerLock([idxA, idxB], !isLocked);
      } else {
        // Fallback
        onCompare(idxA, idxB);
      }
    },
    [activeIdxA, activeIdxB, isLocked, isScanner, onCompare, onSetScannerLock, playBeep],
  );

  // Handle Operator Action
  const handleOperatorAction = useCallback(
    (action: 'swap' | 'confirm_ok') => {
      if (!isOperator) return;
      playBeep(action === 'swap' ? 320 : 540, 'triangle', 0.2);
      if (onExecuteOperatorAction) {
        onExecuteOperatorAction(action);
      } else {
        // Fallback
        if (action === 'swap') {
          onSwap(lockedA, lockedB);
        } else {
          onCompare(lockedA, lockedB);
        }
      }
    },
    [isOperator, lockedA, lockedB, onCompare, onExecuteOperatorAction, onSwap, playBeep],
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (room.status !== 'playing') return;

      if (isScanner) {
        if (e.code === 'KeyL' || e.code === 'KeyT' || e.code === 'Space') {
          if (!isLocked) {
            e.preventDefault();
            handleToggleScannerLock(activeIdxA, activeIdxB);
          }
        }
      }

      if (isOperator) {
        if (e.code === 'Space' || e.code === 'KeyS') {
          e.preventDefault();
          handleOperatorAction('swap');
        } else if (e.code === 'Enter' || e.code === 'KeyC') {
          e.preventDefault();
          handleOperatorAction('confirm_ok');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeIdxA,
    activeIdxB,
    handleOperatorAction,
    handleToggleScannerLock,
    isLocked,
    isOperator,
    isScanner,
    room.status,
  ]);

  // Click on a core card
  const handleCoreClick = (idx: number) => {
    if (isScanner) {
      if (selectedCoreIdx === null) {
        setSelectedCoreIdx(idx);
        playBeep(520, 'sine', 0.08);
      } else if (selectedCoreIdx !== idx) {
        const minI = Math.min(selectedCoreIdx, idx);
        const maxI = Math.max(selectedCoreIdx, idx);
        setSelectedCoreIdx(null);
        handleToggleScannerLock(minI, maxI);
      } else {
        setSelectedCoreIdx(null);
      }
    }
  };

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-cyan-500/20 shadow-2xl p-4 sm:p-7 flex flex-col items-center space-y-6 select-none overflow-hidden relative text-slate-100 font-sans">
      {/* Background Cyber Ambient Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP CYBER TERMINAL HUD */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {/* 1. Firewall Heat & Core Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                firewallHeat > 70
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Firewall Hőmérséklet
              </div>
              <div className="text-sm font-black font-mono flex items-center gap-1.5">
                <span className={firewallHeat > 70 ? 'text-rose-400' : 'text-amber-400'}>
                  {firewallHeat}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {firewallHeat < 40
                    ? '● Stabil'
                    : firewallHeat < 75
                      ? '▲ Melegszik'
                      : '🔥 VESZÉLY'}
                </span>
              </div>
            </div>
          </div>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${firewallHeat}%` }}
              className={`h-full transition-all duration-300 ${
                firewallHeat > 70
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-400 to-amber-400'
              }`}
            />
          </div>
        </div>

        {/* 2. My Asymmetric Cyber Role HUD Card */}
        <div
          className={`border rounded-2xl p-3.5 flex items-center justify-between shadow-lg relative overflow-hidden ${
            myRole === 'scanner'
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : myRole === 'operator'
                ? 'bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              {myRole === 'scanner' ? (
                <Crosshair className="w-5 h-5 animate-spin" />
              ) : myRole === 'operator' ? (
                <Zap className="w-5 h-5 animate-pulse" />
              ) : (
                <Cpu className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest opacity-80">
                A Te Szerepköröd
              </div>
              <div className="text-sm font-black font-montserrat tracking-tight flex items-center gap-1.5">
                {myRole === 'scanner'
                  ? '🛰️ SZKENNER (ORACLE)'
                  : myRole === 'operator'
                    ? '⚡ REAKTOR OPERÁTOR'
                    : '🛡️ KRIPTO TÁMOGATÓ'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 font-bold border border-white/20">
            {isSoloOrBot ? 'Solo Mester' : 'Co-Op'}
          </span>
        </div>

        {/* 3. Team Synergy & Relay Multiplier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#269984]/15 border border-[#269984]/30 text-[#269984]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Kvantum Szinergia
              </div>
              <div className="text-sm font-black font-mono text-[#269984] flex items-center gap-1.5">
                <span>{teamSynergy}%</span>
                <span className="text-[10px] text-cyan-400 font-bold">1.5x Szorzó</span>
              </div>
            </div>
          </div>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${teamSynergy}%` }}
              className="h-full bg-gradient-to-r from-[#269984] to-cyan-400 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* CO-OP ASYMMETRIC MISSION INSTRUCTION BAR */}
      <div className="w-full px-5 py-3.5 bg-slate-900/95 border border-cyan-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="text-xs">
            {isScanner && !isLocked && (
              <span className="text-cyan-300 font-bold">
                🎯 <strong>Szkennelő:</strong> Keresd az anomáliát! Kattints a{' '}
                <strong>[{activeIdxA}]</strong> és <strong>[{activeIdxB}]</strong> magokra, vagy
                nyomj <strong>Célzás Rögzítést (Space)</strong>!
              </span>
            )}
            {isScanner && isLocked && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Cél rögzítve! Várakozás az <strong>Operátorra</strong>, hogy meghúzza a Csere /
                Fixálás kart...
              </span>
            )}
            {isOperator && !isLocked && (
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />A Reaktor zárolva van. Várj, amíg a{' '}
                <strong>Szkennelő</strong> célba veszi a magokat!
              </span>
            )}
            {isOperator && isLocked && (
              <span className="text-fuchsia-300 font-black animate-pulse flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                🔥 CÉL BEMÉRVE! [{valA}] és [{valB}]. Mivel {valA} &gt; {valB} ?{' '}
                <strong className="text-white bg-fuchsia-600 px-2 py-0.5 rounded-lg">
                  {isSwapNeeded ? 'NYOMJ CSERÉT (Space)!' : 'NYOMJ FIXÁLÁST (Enter)!'}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Tactical Quick Pings */}
        {onSendTacticalPing && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onSendTacticalPing('scan_request', '🎯 Szkenneld be a magokat!')}
              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[10px] font-mono font-bold text-cyan-300 transition-all active:scale-95"
            >
              📢 Célzást kérek!
            </button>
            <button
              onClick={() => onSendTacticalPing('swap_request', '⚡ Cseréld a reaktort!')}
              className="px-2.5 py-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg text-[10px] font-mono font-bold text-fuchsia-300 transition-all active:scale-95"
            >
              📢 Cserélj!
            </button>
            <button
              onClick={() => onSendTacticalPing('hurry', '🔥 Forrósodik a rendszer!')}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-[10px] font-mono font-bold text-rose-300 transition-all active:scale-95"
            >
              📢 Siess!
            </button>
          </div>
        )}
      </div>

      {/* MATRIX DATA CORES HOLO-STAGE */}
      <div className="w-full relative py-8 px-4 bg-gradient-to-b from-[#020b14] via-[#041220] to-[#010810] rounded-3xl border border-cyan-900/60 shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-between">
        {/* Top Scanner Reticle Line */}
        <div className="w-full flex items-center justify-between px-6 text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            Hacker Matrix Relay • {room.mode.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-slate-400">{totalCores} Kvantum Adatmag</span>
        </div>

        {/* Data Cores Grid */}
        <div className="w-full py-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 relative z-10">
          {Array.from({ length: totalCores }).map((_, coreIdx) => {
            const val = room.array[coreIdx] ?? 0;
            const player = room.players.find((p) => p.currentSlot === coreIdx);
            const isTargetA = lockedA === coreIdx;
            const isTargetB = lockedB === coreIdx;
            const isTargeted = isTargetA || isTargetB;
            const isSelected = selectedCoreIdx === coreIdx;
            const playerColor = player?.color || '#06b6d4';

            return (
              <div
                key={`core-node-${coreIdx}`}
                onClick={() => handleCoreClick(coreIdx)}
                className="flex flex-col items-center relative cursor-pointer"
              >
                {/* Core Slot Index */}
                <div
                  className={`text-[10px] font-mono font-bold mb-2 px-2 py-0.5 rounded-full transition-all ${
                    isTargeted
                      ? isLocked
                        ? 'bg-fuchsia-500 text-slate-950 shadow-lg shadow-fuchsia-500/50'
                        : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  CORE [{coreIdx}]
                </div>

                {/* Laser Crosshair Badge on Target */}
                {isTargeted && (
                  <div className="absolute -top-3 px-2 py-0.5 bg-cyan-400 text-slate-950 text-[9px] font-mono font-black rounded-full shadow-lg z-20 flex items-center gap-1 animate-bounce">
                    <Crosshair className="w-3 h-3" />
                    {isLocked ? 'LOCK' : 'SCAN'}
                  </div>
                )}

                {/* Quantum Shard Node */}
                <div
                  style={{
                    borderColor: isSelected
                      ? '#eab308'
                      : isTargeted
                        ? isLocked
                          ? '#d946ef'
                          : '#06b6d4'
                        : 'rgba(255,255,255,0.12)',
                    boxShadow: isTargeted
                      ? isLocked
                        ? '0 0 30px rgba(217,70,239,0.5), inset 0 0 15px rgba(217,70,239,0.3)'
                        : '0 0 30px rgba(6,182,212,0.5), inset 0 0 15px rgba(6,182,212,0.3)'
                      : '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                  className={`relative w-24 sm:w-28 h-36 sm:h-40 rounded-2xl p-3 flex flex-col items-center justify-between transition-all duration-300 bg-slate-900/90 border-2 backdrop-blur-md ${
                    isTargeted
                      ? 'scale-108 ring-2 ring-white/20'
                      : 'opacity-85 hover:opacity-100 hover:scale-102'
                  } ${isSelected ? 'ring-4 ring-amber-400 scale-110' : ''}`}
                >
                  {/* Top Owner Tag */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono">
                    <span
                      style={{ color: playerColor }}
                      className="font-bold truncate max-w-[65px]"
                    >
                      {player?.name || `Slot ${coreIdx}`}
                    </span>
                    <span
                      style={{ backgroundColor: playerColor }}
                      className={`w-2 h-2 rounded-full ${isTargeted ? 'animate-ping' : ''}`}
                    />
                  </div>

                  {/* Core Energy Hologram Circle */}
                  <div
                    style={{
                      background: isLocked
                        ? 'radial-gradient(circle, #d946ef 0%, #701a75 100%)'
                        : isTargeted
                          ? 'radial-gradient(circle, #06b6d4 0%, #0e7490 100%)'
                          : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-black shadow-lg relative my-1"
                  >
                    <Cpu className="w-6 h-6 sm:w-7 sm:h-7 opacity-90" />
                  </div>

                  {/* Value Display */}
                  <div className="w-full text-center">
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                      {val}
                    </div>
                  </div>

                  {/* Node Status Tag */}
                  <div className="w-full text-center">
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block truncate">
                      {isTargeted
                        ? isLocked
                          ? '⚡ REAKTOR BEKAPCSOLVA'
                          : '🎯 CÉL MEGHATÁROZVA'
                        : 'ENERGIA CELLA'}
                    </span>
                  </div>
                </div>

                {/* Floor Power Conduit */}
                <div
                  style={{
                    backgroundColor: isTargeted
                      ? isLocked
                        ? '#d946ef'
                        : '#06b6d4'
                      : 'rgba(255,255,255,0.06)',
                  }}
                  className="w-16 h-1.5 rounded-full mt-2 transition-all opacity-80"
                />
              </div>
            );
          })}
        </div>

        {/* Equal Contribution Live Bar & Emotes */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-slate-950/80 border-t border-slate-800/80 rounded-2xl text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              Csapat Hack Részvétel:
            </span>
            {room.players.map((p) => (
              <span
                key={p.id}
                style={{ color: p.color }}
                className="px-2 py-0.5 bg-white/5 rounded-lg font-bold"
              >
                {p.name} ({p.cyberRole || 'Mester'}): {p.swapsCount + p.comparisonsCount} lépés (
                {p.score} pt)
              </span>
            ))}
          </div>

          {/* Quick Floating Emote Reaction Bar */}
          {onSendReaction && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Smile className="w-3 h-3" /> Reakció:
              </span>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSendReaction(emoji)}
                  className="p-1 hover:scale-125 transition-transform active:scale-95 text-sm"
                  title="Reakció küldése"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ASYMMETRIC DUAL-ACTION CONTROL PANELS */}
      <div className="w-full max-w-2xl space-y-4">
        {/* PANEL 1: SCANNER'S LASER LOCK PANEL */}
        {isScanner && (
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" />
              <div>
                <div className="text-xs font-bold font-montserrat text-cyan-300">
                  🛰️ Szkennelő Irányítópult
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {isLocked
                    ? `Cél rögzítve: Core [${lockedA}] (${valA}) ⇄ Core [${lockedB}] (${valB})`
                    : `Célzás: Core [${activeIdxA}] és Core [${activeIdxB}]`}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggleScannerLock(activeIdxA, activeIdxB)}
              className={`py-3 px-6 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                isLocked
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30 animate-pulse'
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Célzás Feloldása</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4" />
                  <span>🎯 Cél Rögzítése a Reaktorhoz (Space)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* PANEL 2: OPERATOR'S REACTOR THROTTLE CONTROLS */}
        {isOperator && (
          <div className="p-4 bg-fuchsia-950/40 border border-fuchsia-500/40 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold font-montserrat text-fuchsia-300">
                    ⚡ Reaktor Operátor Irányítópult
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {isLocked
                      ? `Készen áll az átkapcsolásra: Core [${lockedA}] ⇄ Core [${lockedB}]`
                      : 'Zárolva: Várakozás a Szkennelő bemérésére...'}
                  </div>
                </div>
              </div>

              {!isLocked && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Zárolva
                </span>
              )}
            </div>

            {/* Reactor Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Confirm OK Button */}
              <button
                disabled={!isLocked}
                onClick={() => handleOperatorAction('confirm_ok')}
                className={`w-full sm:w-1/2 py-4 px-6 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                  isLocked
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-md cursor-pointer'
                    : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1. Core Lock: Stabil Rendben (Enter)</span>
              </button>

              {/* Flux Swap Button */}
              <button
                disabled={!isLocked}
                onClick={() => handleOperatorAction('swap')}
                className={`w-full sm:w-1/2 py-4 px-6 rounded-xl font-black font-mono text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                  isLocked
                    ? isSwapNeeded
                      ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 shadow-fuchsia-500/30 ring-4 ring-fuchsia-500/40 animate-pulse cursor-pointer'
                      : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
                    : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>2. ⚡ FLUX SWAP: Kvantum Csere (Space)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Algorithmic Code Terminal Footer */}
      <div className="w-full bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span className="text-cyan-400 font-bold">&gt;</span>
          <span className="text-cyan-300 font-bold">
            {room.currentCodeLine || 'Matrix stream aktív...'}
          </span>
        </div>
        <div className="text-amber-400 hidden sm:block truncate ml-4 font-sans font-medium text-[11px]">
          {room.lastActionMessage}
        </div>
      </div>
    </div>
  );
}
