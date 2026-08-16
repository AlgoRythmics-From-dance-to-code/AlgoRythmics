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
  Copy,
  Check,
  Sparkles,
  History,
  ShieldCheck,
  Footprints,
  LogIn,
  Layers,
  QrCode,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Radio,
  Gamepad2,
  Lock,
  User,
} from 'lucide-react';

const GAME_MODES: MultiplayerGameMode[] = [
  'bubble_sort',
  'quick_sort',
  'binary_search',
  'merge_sort',
];

export type LobbyStep = 'choose' | 'create_setup' | 'join_code' | 'waiting_room';

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
  onStart: () => void;
  onOpenHistory: () => void;
}

export default function LobbyView({
  roomId,
  players,
  selectedMode,
  selectedControl,
  teamSize,
  playerName,
  playerColor,
  userEmail,
  localPlayerId,
  initialStep = 'choose',
  onSelectMode,
  onSelectControl: _onSelectControl,
  onSetTeamSize,
  onJoinRoom,
  onStart,
  onOpenHistory,
}: LobbyViewProps) {
  const { t } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<LobbyStep>(initialStep);
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // If initialStep changes or roomId changes from query param, sync step
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
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    const formattedCode = cleanCode.startsWith('ALGO-') ? cleanCode : `ALGO-${cleanCode}`;
    setIsJoining(true);
    if (onJoinRoom) {
      await onJoinRoom(formattedCode);
    }
    setIsJoining(false);
    router.push(`/multiplayer?room=${encodeURIComponent(formattedCode)}`);
    setStep('waiting_room');
  };

  const emptySlotsCount = Math.max(0, teamSize - players.length);
  const isReadyToStart = players.length >= 2;
  const isHost = Boolean(
    players.find((p) => p.id === localPlayerId)?.isHost ??
    (players.length > 0 && players[0]?.id === localPlayerId),
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ------------------------------------------------------------- */}
      {/* STEP 1: CHOOSE ACTION (Szoba létrehozása VAGY Csatlakozás)    */}
      {/* ------------------------------------------------------------- */}
      {step === 'choose' && (
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#269984]/10 border border-[#269984]/20 text-[#269984] rounded-full text-xs font-semibold uppercase tracking-wider font-montserrat">
              <Sparkles className="w-3.5 h-3.5" />
              {t('multiplayer.badge') || 'AlgoRythmics Valós Idejű Multiplayer'}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-montserrat tracking-tight">
              Többjátékos Aréna
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Csatlakozz egy meglévő csapathoz szobakóddal, vagy hozz létre egy új játékot
              gazdaként!
            </p>
          </div>

          {/* 2 Big Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Host New Room Card */}
            <div
              onClick={() => setStep('create_setup')}
              className="group relative bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-white/10 hover:border-[#269984] dark:hover:border-[#269984] rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#269984]/10 rounded-full blur-2xl group-hover:bg-[#269984]/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#269984]/10 border border-[#269984]/20 flex items-center justify-center text-[#269984] group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-montserrat flex items-center gap-2">
                    👑 Szoba Létrehozása
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                    Te vagy a gazda: válaszd ki az algoritmust, az irányítási módot, és oszd meg a
                    szobakódot a társaiddal!
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-sm font-bold text-[#269984] font-montserrat">
                <span>Szoba Beállítása</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Join Existing Room Card */}
            <div
              onClick={() => setStep('join_code')}
              className="group relative bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                  <LogIn className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-montserrat flex items-center gap-2">
                    🔗 Csatlakozás Kóddal
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                    Megkaptad a kódot a tanárodtól vagy csapattársadtól? Írd be ide és lépj be a
                    közös játékba!
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-sm font-bold text-cyan-600 dark:text-cyan-400 font-montserrat">
                <span>Belépés Kóddal</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick History Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onOpenHistory}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#121212] dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all font-montserrat shadow-xs"
            >
              <History className="w-4 h-4 text-[#269984]" />
              {t('multiplayer.match_history') || 'Korábbi Meccsek & Statisztikák Megtekintése'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2A: HOST ROOM CONFIGURATION WIZARD                       */}
      {/* ------------------------------------------------------------- */}
      {step === 'create_setup' && (
        <div className="space-y-6">
          {/* Header & Back */}
          <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <button
              onClick={() => setStep('choose')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-montserrat transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Vissza a Főmenübe
            </button>
            <span className="text-xs font-mono font-bold text-[#269984] bg-[#269984]/10 px-3 py-1 rounded-full border border-[#269984]/20">
              👑 Szoba Beállítása (Gazda)
            </span>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Mode & Control Style */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Classroom Physical Movement Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-50 to-[#269984]/10 dark:from-amber-500/15 dark:via-[#121212] dark:to-[#269984]/15 border-2 border-amber-500/30 dark:border-amber-500/40 rounded-3xl p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/30">
                    <Footprints className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      Valós Térbeli Mozgás
                    </span>
                    <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white font-montserrat">
                      🚶 Tantermi Élő Mozgás & Koccintás
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Álljatok be a tanteremben egy sorba a telefonjaitokkal a kezetekben! Amikor sorra
                  kerültök az algoritmusban, lépjetek át egymás mellett és koccintsátok össze a
                  telefonokat a helycseréhez!
                </p>
              </div>

              {/* 2. Algorithm Game Mode */}
              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-montserrat">
                  <Layers className="w-4 h-4 text-amber-500" />
                  2. Algoritmus Feladvány
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GAME_MODES.map((modeKey) => {
                    const name = t(`multiplayer.modes.${modeKey}.name`);
                    const desc = t(`multiplayer.modes.${modeKey}.desc`);
                    const tag = t(`multiplayer.modes.${modeKey}.tag`);

                    return (
                      <div
                        key={modeKey}
                        onClick={() => onSelectMode(modeKey)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedMode === modeKey
                            ? 'border-[#269984] bg-[#269984]/10 ring-1 ring-[#269984]/40 shadow-sm'
                            : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs font-montserrat">
                            {name}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-white/10 px-2 py-0.5 rounded-full font-bold">
                            {tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Avatar & Team Size */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-montserrat">
                  <ShieldCheck className="w-4 h-4 text-[#269984]" />
                  Gazda Profilja
                </h3>

                {/* Profile display (read-only, bound to user account) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-montserrat">
                      Játékos Profil
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Lock className="w-2.5 h-2.5" />
                      Profilból betöltve
                    </span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: playerColor }}
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs"
                      >
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-montserrat truncate">
                        {playerName}
                      </span>
                    </div>
                    {userEmail && (
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] flex-shrink-0">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Team size */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-montserrat">
                      Parkett Méret (Minimum 4 Fő)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{teamSize} kártya</span>
                  </div>
                  <div className="flex gap-2">
                    {[4, 5, 6, 8].map((size) => (
                      <button
                        key={size}
                        onClick={() => onSetTeamSize(size)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all font-montserrat ${
                          teamSize === size
                            ? 'bg-[#269984] text-white shadow-md'
                            : 'bg-slate-100 dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    💡 Minimum 4 elem szükséges az érdemi algoritmus-rendezéshez. Ha 2-3 játékos van
                    a szobában, a fennmaradó helyeket intelligens Algoritmus Botok segítik.
                  </p>
                </div>

                {/* Proceed to Waiting Room Button */}
                <button
                  onClick={() => setStep('waiting_room')}
                  className="w-full mt-4 py-3.5 bg-[#269984] hover:bg-[#208270] text-white font-bold rounded-2xl shadow-lg shadow-[#269984]/20 transition-all flex items-center justify-center gap-2 font-montserrat active:scale-98"
                >
                  <span>Megnyitás & Váróterem</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2B: JOIN EXISTING ROOM VIA CODE                          */}
      {/* ------------------------------------------------------------- */}
      {step === 'join_code' && (
        <div className="max-w-md mx-auto space-y-6">
          {/* Back Header */}
          <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <button
              onClick={() => setStep('choose')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-montserrat transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Vissza a Főmenübe
            </button>
            <span className="text-xs font-mono font-bold text-cyan-600 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              🔗 Csatlakozás
            </span>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
            <div className="text-center space-y-2">
              <div className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl inline-flex mb-1">
                <LogIn className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-montserrat">
                Csatlakozás Szobakóddal
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Írd be a szobagazda által megosztott kódot a belépéshez!
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-montserrat">
                  Szobakód (pl. ALGO-482 vagy 482)
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="ALGO-..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0a0a0a] border-2 border-slate-200 dark:border-white/10 rounded-2xl text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#269984] uppercase tracking-wider text-center"
                />
              </div>

              {/* Profile in Join Screen (read-only, bound to user account) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-montserrat">
                    Megjelenített Profil Neved
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" />
                    Profilból betöltve
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: playerColor }}
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-montserrat truncate">
                      {playerName}
                    </span>
                  </div>
                  {userEmail && (
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] flex-shrink-0">
                      {userEmail}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!joinCodeInput.trim() || isJoining}
                className="w-full py-3.5 bg-[#269984] hover:bg-[#208270] disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-[#269984]/20 transition-all flex items-center justify-center gap-2 font-montserrat active:scale-98 text-sm"
              >
                <LogIn className="w-4 h-4" />
                {isJoining ? 'Csatlakozás folyamatban...' : 'Belépés a Váróterembe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: LIVE WAITING ROOM (Váróterem Szobakóddal & Slotokkal)  */}
      {/* ------------------------------------------------------------- */}
      {step === 'waiting_room' && (
        <div className="space-y-6">
          {/* Top Banner with Room Code & Navigation */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#269984]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <button
                  onClick={() => setStep('choose')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-montserrat mb-2 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kilépés a Főmenübe
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider font-montserrat">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Élő Váróterem
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-montserrat tracking-tight">
                  Várakozás a Játékosokra ({players.length}/{teamSize})
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm max-w-lg">
                  {selectedControl === 'spatial'
                    ? `💃 ${t('multiplayer.controls.spatial.title')}`
                    : selectedControl === 'physical'
                      ? `🏫 ${t('multiplayer.controls.physical.title')}`
                      : `🎯 ${t('multiplayer.controls.discrete.title')}`}{' '}
                  • {selectedMode.replace('_', ' ').toUpperCase()}
                </p>
              </div>

              {/* Room Code Badge & Share Link */}
              <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 min-w-[220px] shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-montserrat">
                  Szoba Kód
                </span>
                <span className="text-2xl font-black font-mono tracking-wider text-[#269984]">
                  {roomId}
                </span>
                <button
                  onClick={copyRoomLink}
                  className={`mt-1 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all w-full justify-center font-montserrat shadow-sm ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-[#269984]/10 hover:bg-[#269984]/20 text-[#269984] border border-[#269984]/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Link Másolva!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Link Másolása
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Connected Player Slots Grid */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-montserrat">
                <Users className="w-4 h-4 text-[#269984]" />
                Csatlakozott Játékosok Kártyái
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                {players.length} / {teamSize} Hely Betöltve
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Real connected players */}
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: p.color }}
                      className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-slate-950 font-black text-xs"
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-montserrat">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {p.id.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-bold">
                    {p.isHost ? '👑 Gazda' : 'Játékos'}
                  </span>
                </div>
              ))}

              {/* Waiting Empty Slots */}
              {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center justify-between p-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-slate-500 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 animate-pulse flex items-center justify-center font-mono text-xs">
                      ?
                    </span>
                    <div>
                      <div className="font-bold font-montserrat text-xs">
                        {players.length + idx + 1}. Játékos
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Csatlakozásra vár...
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Start Game or Waiting for Host Banner */}
            <div className="pt-4 space-y-3">
              {isHost ? (
                <>
                  <button
                    onClick={onStart}
                    disabled={!isReadyToStart}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all font-montserrat shadow-lg ${
                      isReadyToStart
                        ? 'bg-[#269984] hover:bg-[#208270] text-white shadow-[#269984]/25 active:scale-98 animate-pulse'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {isReadyToStart
                      ? players.length < teamSize
                        ? `Játék Indítása (${players.length} Játékos + ${teamSize - players.length} Algoritmus Bot)`
                        : `Játék Indítása (${players.length} játékossal)`
                      : 'Legalább 2 játékos szükséges az indításhoz'}
                  </button>

                  {!isReadyToStart && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 dark:text-amber-300 text-center flex items-center justify-center gap-2">
                      <QrCode className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Oszd meg a <strong>{roomId}</strong> szobakódot vagy a linket a többiekkel a
                        csatlakozáshoz!
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-[#269984]/10 border border-[#269984]/20 rounded-2xl text-center space-y-1">
                  <div className="text-xs font-bold text-[#269984] font-montserrat flex items-center justify-center gap-2">
                    <Gamepad2 className="w-4 h-4 animate-bounce" />
                    Csatlakoztál a szobához!
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Várakozás a szobagazda indítására...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
