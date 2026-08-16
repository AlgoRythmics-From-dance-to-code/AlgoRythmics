'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from '../../i18n/LocaleProvider';
import { useMultiplayerEngine, getRandomNeonColor } from '../../hooks/useMultiplayerEngine';
import type {
  MultiplayerGameMode,
  MultiplayerControlStyle,
  MultiplayerRoomState,
} from '../../../types/multiplayer';
import LobbyView from './components/LobbyView';
import PhysicalClassroomArena from './components/PhysicalClassroomArena';
import StatsDashboard from './components/StatsDashboard';
import PostMatchModal from './components/PostMatchModal';
import MultiplayerHistoryModal from './components/MultiplayerHistoryModal';
import { ArrowLeft, Lock, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '../../../lib/constants';

export default function MultiplayerClient() {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room') || undefined;

  const {
    room,
    localPlayerId,
    stepLogs,
    elapsedSeconds,
    choreographyScore,
    audioEnabled,
    setAudioEnabled,
    initializeLobby,
    joinRoomWithCode,
    startGame,
    executeSwap,
    executeCompare,
    confirmPosition,
    broadcastState,
    setRoom,
  } = useMultiplayerEngine(roomParam);

  // Extract authenticated user's name
  const user = session?.user as
    | {
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
        imageUrl?: string;
        image?: string | null;
      }
    | undefined;

  const defaultName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Diák';

  const [playerName, setPlayerName] = useState(defaultName);
  const [playerColor] = useState<string>(() => getRandomNeonColor());
  const [selectedMode, setSelectedMode] = useState<MultiplayerGameMode>('bubble_sort');
  const [selectedControl, setSelectedControl] = useState<MultiplayerControlStyle>('physical');
  const [teamSize, setTeamSize] = useState(4);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Update playerName when session is loaded
  useEffect(() => {
    if (defaultName) {
      setPlayerName(defaultName);
    }
  }, [defaultName]);

  // Initialize lobby on load once authenticated
  useEffect(() => {
    if (status === 'authenticated' && room.players.length === 0) {
      if (roomParam) {
        joinRoomWithCode(roomParam, playerName, playerColor);
      } else {
        initializeLobby(playerName, playerColor, selectedMode, selectedControl, teamSize);
      }
    }
  }, [
    initializeLobby,
    joinRoomWithCode,
    playerName,
    playerColor,
    room.players.length,
    roomParam,
    selectedControl,
    selectedMode,
    status,
    teamSize,
  ]);

  // Update room settings when selection changes in lobby
  const handleSelectMode = (mode: MultiplayerGameMode) => {
    setSelectedMode(mode);
    setRoom((prev: MultiplayerRoomState) => {
      const updated = { ...prev, mode };
      broadcastState(updated);
      return updated;
    });
  };

  const handleSelectControl = (ctrl: MultiplayerControlStyle) => {
    setSelectedControl(ctrl);
    setRoom((prev: MultiplayerRoomState) => {
      const updated = { ...prev, controlStyle: ctrl };
      broadcastState(updated);
      return updated;
    });
  };

  const handleSetTeamSize = (size: number) => {
    setTeamSize(size);
    setRoom((prev: MultiplayerRoomState) => {
      const updated = { ...prev, teamSize: size };
      broadcastState(updated);
      return updated;
    });
  };

  // 1. Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#269984] border-t-transparent mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">...</p>
      </div>
    );
  }

  // 2. Authentication Required Barrier
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-[#269984]/10 border border-[#269984]/20 rounded-2xl flex items-center justify-center mx-auto text-[#269984]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-montserrat">
              {t('multiplayer.auth_required_title') || 'Bejelentkezés Szükséges'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {t('multiplayer.auth_required_desc') ||
                'A többjátékos aréna használatához, a saját neved betöltéséhez és a mérkőzés statisztikáid rögzítéséhez kérjük, jelentkezz be a fiókodba!'}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`${ROUTES.LOGIN}?callbackUrl=/multiplayer`}
              className="w-full py-3.5 bg-[#269984] hover:bg-[#208270] text-white font-bold rounded-2xl shadow-lg shadow-[#269984]/20 transition-all flex items-center justify-center gap-2 font-montserrat active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              {t('multiplayer.login_btn') || 'Bejelentkezés'}
            </Link>

            <Link
              href={ROUTES.REGISTER}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 font-montserrat text-sm"
            >
              <UserPlus className="w-4 h-4" />
              {t('multiplayer.register_btn') || 'Új Fiók Regisztrációja'}
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href={ROUTES.ALGORITHMS}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white font-montserrat transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('multiplayer.back_to_algorithms') || 'Vissza az Algoritmusokhoz'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Authenticated Multiplayer View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.ALGORITHMS}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-montserrat transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('multiplayer.back_to_algorithms') || 'Vissza az Algoritmusokhoz'}
          </Link>

          {room.status === 'playing' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('multiplayer.live_game') || 'ÉLŐ JÁTÉK'} (
              {room.controlStyle === 'spatial'
                ? t('multiplayer.controls.spatial.title')
                : room.controlStyle === 'physical'
                  ? t('multiplayer.controls.physical.title')
                  : t('multiplayer.controls.discrete.title')}
              )
            </div>
          )}
        </div>

        {/* View Switcher: Lobby vs Playing */}
        {room.status === 'lobby' ? (
          <LobbyView
            roomId={room.roomId}
            players={room.players}
            selectedMode={selectedMode}
            selectedControl={selectedControl}
            teamSize={teamSize}
            playerName={playerName}
            playerColor={playerColor}
            userEmail={user?.email}
            localPlayerId={localPlayerId}
            initialStep={roomParam ? 'waiting_room' : 'choose'}
            onSelectMode={handleSelectMode}
            onSelectControl={handleSelectControl}
            onSetTeamSize={handleSetTeamSize}
            onJoinRoom={joinRoomWithCode}
            onStart={startGame}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {/* Real-time HUD Dashboard */}
            <StatsDashboard
              room={room}
              elapsedSeconds={elapsedSeconds}
              choreographyScore={choreographyScore}
              stepLogs={stepLogs}
              audioEnabled={audioEnabled}
              onToggleAudio={() => setAudioEnabled((prev) => !prev)}
            />

            {/* Real-time Physical Classroom Movement Arena */}
            <PhysicalClassroomArena
              room={room}
              localPlayerId={localPlayerId}
              onSwap={executeSwap}
              onCompare={executeCompare}
              onConfirmPosition={confirmPosition}
            />
          </div>
        )}
      </div>

      {/* Post-Match Big-O Statistics Modal */}
      {room.status === 'completed' && room.stats && (
        <PostMatchModal
          stats={room.stats}
          onRestart={() => {
            setRoom((prev) => ({
              ...prev,
              status: 'lobby',
              array: [],
              activeIndices: [0, 1],
              lastActionMessage: 'Új mérkőzés indítása...',
            }));
          }}
          onBackToLobby={() => {
            setRoom((prev) => ({
              ...prev,
              status: 'lobby',
              array: [],
              activeIndices: [0, 1],
              lastActionMessage: 'Visszatérés a lobbyba.',
            }));
          }}
        />
      )}

      {/* Match History Modal */}
      {isHistoryOpen && <MultiplayerHistoryModal onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
}
