'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  MultiplayerGameMode,
  MultiplayerControlStyle,
  Player,
} from '../../../../types/multiplayer';
import { useLocale } from '../../../i18n/LocaleProvider';
import {
  Users,
  Play,
  Check,
  Sparkles,
  History,
  LogIn,
  Layers,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Bot,
  Trash2,
  Crown,
  Share2,
} from 'lucide-react';

const GAME_MODES: Array<{ id: MultiplayerGameMode; name: string; desc: string }> = [
  {
    id: 'bubble_sort',
    name: 'Buborékrendezés',
    desc: 'Egyszerű szomszédos cserék a teljes sorban',
  },
  {
    id: 'quick_sort',
    name: 'Gyorsrendezés',
    desc: 'Pivot elem választása és kétirányú particionálás',
  },
  {
    id: 'merge_sort',
    name: 'Összefésülő Rendezés',
    desc: 'Csoportokra bontás és rendezett egyesítés',
  },
  {
    id: 'binary_search',
    name: 'Bináris Keresés',
    desc: 'Felező keresés rendezett tömbben',
  },
];

export type LobbyStep = 'choose' | 'join_code' | 'waiting_room';

interface LobbyViewProps {
  roomId: string;
  players: Player[];
  selectedMode: MultiplayerGameMode;
  selectedControl: MultiplayerControlStyle;
  teamSize: number;
  playerName: string;
  playerColor: string;
  userEmail?: string;
  localPlayerId?: string;
  initialStep?: LobbyStep;
  onSelectMode: (mode: MultiplayerGameMode) => void;
  onSelectControl?: (ctrl: MultiplayerControlStyle) => void;
  onSetTeamSize: (size: number) => void;
  onJoinRoom?: (code: string) => Promise<boolean> | void;
  onAddBot?: () => void;
  onRemovePlayer?: (playerId: string) => void;
  onStart: () => void;
  onOpenHistory: () => void;
}

export default function LobbyView({
  roomId,
  players,
  selectedMode,
  teamSize,
  playerName: _playerName,
  playerColor: _playerColor,
  localPlayerId,
  initialStep = 'choose',
  onSelectMode,
  onSetTeamSize,
  onJoinRoom,
  onAddBot,
  onRemovePlayer,
  onStart,
  onOpenHistory,
}: LobbyViewProps) {
  const { t } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<LobbyStep>(initialStep);
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
    }
  }, [initialStep]);

  const copyRoomLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/multiplayer?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    const formattedCode = cleanCode.startsWith('ALGO-') ? cleanCode : `ALGO-${cleanCode}`;
    setIsJoining(true);
    try {
      if (onJoinRoom) {
        await onJoinRoom(formattedCode);
      }
      router.push(`/multiplayer?room=${encodeURIComponent(formattedCode)}`);
      setStep('waiting_room');
    } catch {
      setJoinError('Nem sikerült csatlakozni a szobához. Ellenőrizd a kódot!');
    } finally {
      setIsJoining(false);
    }
  };

  const isHost = Boolean(
    players.find((p) => p.id === localPlayerId)?.isHost ??
    (players.length > 0 && players[0]?.id === localPlayerId),
  );

  const isReadyToStart = players.length >= 2;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* STEP 1: CHOOSE ACTION (Host vs Join)                           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {step === 'choose' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Welcome Card */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#269984]/10 border border-[#269984]/20 text-[#269984] rounded-full text-xs font-semibold uppercase tracking-wider font-montserrat">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('multiplayer.badge') || 'AlgoRythmics Valós Idejű Multiplayer'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-montserrat tracking-tight">
              Többjátékos Aréna
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Táncoljatok és tanuljatok algoritmusokat együtt, valós időben a böngészőből vagy
              okostelefonról!
            </p>
          </div>

          {/* 2 Big Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Host New Room */}
            <div
              onClick={() => setStep('waiting_room')}
              className="group relative bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-white/10 hover:border-[#269984] dark:hover:border-[#269984] rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#269984]/10 rounded-full blur-2xl group-hover:bg-[#269984]/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#269984]/10 border border-[#269984]/20 flex items-center justify-center text-[#269984] group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-montserrat flex items-center gap-2">
                    👑 Új Szoba Nyitása
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                    Te vagy a gazda: válaszd ki az algoritmust, hívd meg a társaidat 1-kattintásos
                    linkkel vagy indíts tesztet botokkal!
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-sm font-bold text-[#269984] font-montserrat">
                <span>Belépés a Várakozóterembe</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Join Room With Code */}
            <div
              onClick={() => setStep('join_code')}
              className="group relative bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition-transform">
                  <LogIn className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-montserrat flex items-center gap-2">
                    🔗 Csatlakozás Kóddal
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                    Megkaptad a 6 karakteres szobakódot a tanárodtól vagy csapattársadtól?
                    Csatlakozz közvetlenül a meccshez!
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-sm font-bold text-cyan-600 dark:text-cyan-400 font-montserrat">
                <span>Szobakód Megadása</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Match History Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onOpenHistory}
              className="px-6 py-3 bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all font-montserrat shadow-xs"
            >
              <History className="w-4 h-4 text-[#269984]" />
              <span>
                {t('multiplayer.match_history') || 'Korábbi Meccsek & Statisztikák Megtekintése'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* STEP 2: JOIN CODE INPUT                                        */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {step === 'join_code' && (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('choose')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-montserrat transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vissza a Menübe</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-md space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black font-montserrat text-slate-900 dark:text-white">
                Szobakód Megadása
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add meg a kapott szobakódot (pl. ALGO-482 vagy 482)
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ALGO-..."
                autoFocus
                className="w-full text-center text-2xl font-mono font-black tracking-wider uppercase px-4 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl focus:border-[#269984] dark:focus:border-[#269984] outline-none transition-all"
              />

              {joinError && <p className="text-xs font-bold text-rose-500">{joinError}</p>}

              <button
                type="submit"
                disabled={isJoining || !joinCodeInput.trim()}
                className="w-full py-3.5 bg-[#269984] hover:bg-[#208270] disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-[#269984]/20 transition-all font-montserrat flex items-center justify-center gap-2 cursor-pointer"
              >
                {isJoining ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Csatlakozás a Szobához</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* STEP 3: WAITING ROOM & ROSTER                                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {step === 'waiting_room' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Bar with Code & Share Link */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep('choose')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                title="Vissza"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Szobakód
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
                  {roomId || 'ALGO-LOBBY'}
                </h2>
              </div>
            </div>

            <button
              onClick={copyRoomLink}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold font-montserrat transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-[#269984] hover:bg-[#208270] text-white shadow-lg shadow-[#269984]/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Meghívó Link Másolva!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Meghívó Link Másolása</span>
                </>
              )}
            </button>
          </div>

          {/* Algorithm Mode Selection */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-montserrat text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#269984]" />
                  <span>Választott Algoritmus</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A gazda bármikor átállíthatja az algoritmust az indítás előtt
                </p>
              </div>

              {/* Team Size Selector */}
              {isHost && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Létszám:
                  </span>
                  <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                    {[2, 4, 6, 8].map((size) => (
                      <button
                        key={size}
                        onClick={() => onSetTeamSize(size)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat transition-all ${
                          teamSize === size
                            ? 'bg-white dark:bg-[#269984] text-[#269984] dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GAME_MODES.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => isHost && onSelectMode(mode.id)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isHost ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    selectedMode === mode.id
                      ? 'border-[#269984] bg-[#269984]/5 dark:bg-[#269984]/10 shadow-xs'
                      : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-montserrat">
                      {mode.name}
                    </span>
                    {selectedMode === mode.id && <Check className="w-4 h-4 text-[#269984]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {mode.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Players & Bots Roster */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#269984]/10 text-[#269984]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-montserrat text-slate-900 dark:text-white">
                    Csapattagok ({players.length} / {Math.max(teamSize, players.length)})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A mérkőzés indításához legalább 2 játékos vagy bot szükséges
                  </p>
                </div>
              </div>

              {/* Add Bot Button */}
              {isHost && (
                <button
                  onClick={onAddBot}
                  disabled={players.length >= 8}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold font-montserrat transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>+ Bot Hozzáadása</span>
                </button>
              )}
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: p.color || '#269984' }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shadow-sm"
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-montserrat">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <span title="Szoba Gazda">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            BOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {p.id === localPlayerId ? 'Te' : p.isBot ? 'Gyakorló robot' : 'Csapattárs'}
                      </span>
                    </div>
                  </div>

                  {/* Remove Player / Bot Button for Host */}
                  {isHost && p.id !== localPlayerId && onRemovePlayer && (
                    <button
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors"
                      title="Eltávolítás"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Launch Match Banner */}
          <div className="pt-2">
            {isHost ? (
              <button
                onClick={onStart}
                disabled={!isReadyToStart}
                className="w-full py-4.5 bg-gradient-to-r from-[#269984] to-emerald-600 hover:from-[#208270] hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg rounded-3xl shadow-xl shadow-[#269984]/25 transition-all active:scale-98 flex items-center justify-center gap-3 font-montserrat cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>
                  {isReadyToStart
                    ? 'JÁTÉK INDÍTÁSA MOST'
                    : 'Adj hozzá még 1 játékost vagy botot az indításhoz'}
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-700 dark:text-amber-300 font-montserrat text-sm font-bold animate-pulse">
                ⏳ Várakozás a szobavezetőre a játék elindításához...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
