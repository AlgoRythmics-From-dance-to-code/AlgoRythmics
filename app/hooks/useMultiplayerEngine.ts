'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  MultiplayerRoomState,
  MultiplayerGameMode,
  MultiplayerControlStyle,
  Player,
  StepActionLog,
  CyberRole,
  TacticalPing,
  ScannerLock,
  ReactionEvent,
  PositionVerification,
} from '../../types/multiplayer';
import { trackAndSaveMultiplayerMatch, trackMultiplayerStep } from '../../lib/multiplayerAnalytics';

export const NEON_COLORS = [
  '#269984', // AlgoRythmics Teal
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#ec4899', // Pink
];

export const getRandomNeonColor = (existingColors: string[] = []): string => {
  const available = NEON_COLORS.filter((c) => !existingColors.includes(c));
  const pool = available.length > 0 ? available : NEON_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const BOT_NAMES = [
  '🤖 Bot Zsófi',
  '🤖 Bot Bence',
  '🤖 Bot Lili',
  '🤖 Bot Dániel',
  '🤖 Bot Emma',
  '🤖 Bot Ádám',
  '🤖 Bot Laura',
  '🤖 Bot Máté',
];

export function useMultiplayerEngine(initialRoomId?: string): {
  room: MultiplayerRoomState;
  localPlayerId: string;
  isHost: boolean;
  stepLogs: StepActionLog[];
  elapsedSeconds: number;
  choreographyScore: number;
  audioEnabled: boolean;
  setAudioEnabled: Dispatch<SetStateAction<boolean>>;
  initializeLobby: (
    hostName?: string,
    hostColor?: string,
    mode?: MultiplayerGameMode,
    controlStyle?: MultiplayerControlStyle,
    teamSize?: number,
  ) => MultiplayerRoomState;
  joinRoomWithCode: (
    targetRoomId: string,
    guestName?: string,
    guestColor?: string,
  ) => Promise<boolean>;
  startGame: () => void;
  executeSwap: (idxA: number, idxB: number, actorId?: string) => void;
  executeCompare: (idxA: number, idxB: number, actorId?: string) => void;
  confirmPosition: (targetPlayerId?: string) => void;
  setScannerLock: (indices: [number, number], isLocked: boolean) => void;
  executeOperatorAction: (action: 'swap' | 'confirm_ok') => void;
  sendTacticalPing: (type: TacticalPing['type'], message: string, targetIndices?: number[]) => void;
  sendReaction: (emoji: string) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  addBot: () => void;
  removePlayer: (playerId: string) => void;
  broadcastState: (updatedRoom: MultiplayerRoomState) => void;
  setRoom: Dispatch<SetStateAction<MultiplayerRoomState>>;
} {
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(!initialRoomId);
  const [room, setRoom] = useState<MultiplayerRoomState>({
    roomId: initialRoomId || '',
    status: 'lobby',
    mode: 'bubble_sort',
    controlStyle: 'physical',
    teamSize: 4,
    players: [],
    array: [],
    activeIndices: [],
    lastActionMessage: 'Üdvözlünk a szobában!',
    version: 1,
  });

  const [stepLogs, setStepLogs] = useState<StepActionLog[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [choreographyScore, setChoreographyScore] = useState(100);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const versionRef = useRef<number>(room.version || 1);
  versionRef.current = room.version || 1;

  const localPlayerIdRef = useRef<string>(localPlayerId);
  localPlayerIdRef.current = localPlayerId;

  // Sound generator
  const playTone = useCallback(
    (freq: number, type: OscillatorType = 'sine', duration = 0.15) => {
      if (!audioEnabled || typeof window === 'undefined') return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: new () => AudioContext })
              .webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // audio context blocked
      }
    },
    [audioEnabled],
  );

  const playSuccessChord = useCallback(() => {
    playTone(523.25, 'triangle', 0.2); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.2), 60); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.3), 120); // G5
    setTimeout(() => playTone(1046.5, 'triangle', 0.4), 180); // C6
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    playTone(180, 'sawtooth', 0.25);
    setTimeout(() => playTone(140, 'sawtooth', 0.3), 100);
  }, [playTone]);

  // Authoritative state broadcast over BroadcastChannel & Server API
  const broadcastState = useCallback((updatedRoom: MultiplayerRoomState) => {
    const nextVersion = (updatedRoom.version || versionRef.current || 1) + 1;
    const roomWithVersion: MultiplayerRoomState = {
      ...updatedRoom,
      version: nextVersion,
    };
    versionRef.current = nextVersion;

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SYNC_ROOM', room: roomWithVersion });
    }

    if (roomWithVersion.roomId) {
      fetch('/api/multiplayer/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_ROOM',
          roomId: roomWithVersion.roomId,
          roomState: roomWithVersion,
        }),
      }).catch((err) => console.warn('Room sync error:', err));
    }
  }, []);

  // Setup BroadcastChannel for 0ms local tab sync
  useEffect(() => {
    if (typeof window === 'undefined' || !room.roomId) return;
    const channelName = `algorythmics_mp_${room.roomId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (!event.data) return;

      if (event.data.type === 'SYNC_ROOM' && event.data.room) {
        const incomingRoom: MultiplayerRoomState = event.data.room;
        if ((incomingRoom.version || 0) >= (versionRef.current || 0)) {
          versionRef.current = incomingRoom.version || versionRef.current;
          setRoom(incomingRoom);
        }
      } else if (event.data.type === 'PLAYER_JOIN' && event.data.player) {
        const newPlayer = event.data.player as Player;
        setRoom((prev: MultiplayerRoomState) => {
          if (prev.players.some((p: Player) => p.id === newPlayer.id)) return prev;
          const nextVer = (prev.version || 1) + 1;
          const updated: MultiplayerRoomState = {
            ...prev,
            players: [
              ...prev.players,
              { ...newPlayer, isHost: false, currentSlot: prev.players.length },
            ],
            lastActionMessage: `${newPlayer.name} csatlakozott!`,
            version: nextVer,
          };
          versionRef.current = nextVer;
          if (channelRef.current) {
            channelRef.current.postMessage({ type: 'SYNC_ROOM', room: updated });
          }
          return updated;
        });
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [room.roomId]);

  // Single Persistent EventSource (SSE) Stream — Zero polling requests, real-time push!
  useEffect(() => {
    if (typeof window === 'undefined' || !room.roomId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      try {
        const streamUrl = `/api/multiplayer/stream?roomId=${encodeURIComponent(room.roomId)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          if (!event.data) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ROOM_UPDATE' && data.room) {
              const incomingRoom: MultiplayerRoomState = data.room;
              if ((incomingRoom.version || 0) >= (versionRef.current || 0)) {
                versionRef.current = incomingRoom.version || versionRef.current;
                setRoom(incomingRoom);
              }
            }
          } catch {
            // ignore keepalive lines
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect automatically if connection drops
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        console.warn('SSE connection failed:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [room.roomId]);

  // Match timer
  useEffect(() => {
    if (room.status === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room.status]);

  // Initialize Host Room
  const initializeLobby = useCallback(
    (
      hostName = 'Player 1',
      hostColor?: string,
      mode: MultiplayerGameMode = 'bubble_sort',
      controlStyle: MultiplayerControlStyle = 'physical',
      teamSize = 4,
    ) => {
      const pId =
        localPlayerIdRef.current ||
        `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setLocalPlayerId(pId);
      setIsHost(true);

      const finalHostColor = hostColor || getRandomNeonColor();

      const hostPlayer: Player = {
        id: pId,
        name: hostName,
        color: finalHostColor,
        value: 42,
        currentSlot: 0,
        isHost: true,
        isBot: false,
        x: 150,
        y: 250,
        vx: 0,
        vy: 0,
        radius: 36,
        trail: [],
        swapsCount: 0,
        comparisonsCount: 0,
        errorsCount: 0,
        score: 0,
      };

      const finalRoomId = initialRoomId || room.roomId || generateRoomId();

      const newRoom: MultiplayerRoomState = {
        roomId: finalRoomId,
        status: 'lobby',
        mode,
        controlStyle,
        teamSize,
        players: [hostPlayer],
        array: [],
        activeIndices: [0, 1],
        lastActionMessage: 'Szoba készen áll! Oszd meg a kódot a társaiddal a csatlakozáshoz.',
        version: 1,
      };

      versionRef.current = 1;
      setRoom(newRoom);

      fetch('/api/multiplayer/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ROOM',
          roomId: finalRoomId,
          player: hostPlayer,
          roomState: newRoom,
        }),
      }).catch((err) => console.warn('Create room error:', err));

      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SYNC_ROOM', room: newRoom });
      }

      return newRoom;
    },
    [initialRoomId, room.roomId],
  );

  // Join Existing Room as Guest
  const joinRoomWithCode = useCallback(
    async (targetRoomId: string, guestName = 'Diák', guestColor?: string) => {
      const cleanRoomId = targetRoomId.toUpperCase().trim();
      const pId =
        localPlayerIdRef.current ||
        `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setLocalPlayerId(pId);
      setIsHost(false);

      const finalGuestColor = guestColor || getRandomNeonColor();

      const guestPlayer: Player = {
        id: pId,
        name: guestName,
        color: finalGuestColor,
        value: 50,
        currentSlot: 1,
        isHost: false,
        isBot: false,
        x: 280,
        y: 250,
        vx: 0,
        vy: 0,
        radius: 36,
        trail: [],
        swapsCount: 0,
        comparisonsCount: 0,
        errorsCount: 0,
        score: 0,
      };

      try {
        const res = await fetch('/api/multiplayer/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'JOIN_ROOM',
            roomId: cleanRoomId,
            player: guestPlayer,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            versionRef.current = data.room.version || 1;
            setRoom(data.room);
            if (channelRef.current) {
              channelRef.current.postMessage({ type: 'PLAYER_JOIN', player: guestPlayer });
              channelRef.current.postMessage({ type: 'SYNC_ROOM', room: data.room });
            }
            return true;
          }
        }
      } catch (err) {
        console.error('Join room failed:', err);
      }
      return false;
    },
    [],
  );

  // Start the Game
  const startGame = useCallback(() => {
    setRoom((prev: MultiplayerRoomState) => {
      const targetCount = Math.max(4, prev.teamSize || 4, prev.players.length);
      const arr = generateRandomArray(targetCount);

      const allPlayers: Player[] = [...prev.players];
      const usedColors = allPlayers.map((p) => p.color);

      // If fewer players than targetCount (e.g. 2 players with teamSize 4), fill with Bot dancers
      while (allPlayers.length < targetCount) {
        const botIdx = allPlayers.length;
        const botColor = getRandomNeonColor(usedColors);
        usedColors.push(botColor);
        const botName = BOT_NAMES[(botIdx - prev.players.length) % BOT_NAMES.length];

        allPlayers.push({
          id: `bot-${botIdx}-${Math.random().toString(36).slice(2, 6)}`,
          name: botName,
          color: botColor,
          value: 0,
          currentSlot: botIdx,
          isHost: false,
          isBot: true,
          x: 120 + botIdx * 150,
          y: 250,
          vx: 0,
          vy: 0,
          radius: 36,
          trail: [],
          swapsCount: 0,
          comparisonsCount: 0,
          errorsCount: 0,
          score: 0,
        });
      }

      const CYBER_ROLES: CyberRole[] = ['scanner', 'operator', 'overclocker', 'conductor'];

      const playersWithValues = allPlayers.map((p: Player, idx: number) => ({
        ...p,
        value: arr[idx],
        currentSlot: idx,
        cyberRole: CYBER_ROLES[idx % CYBER_ROLES.length],
        x: 120 + idx * 150,
        y: 250,
        trail: [],
      }));

      const initialActive = computeInitialActiveIndices(prev.mode, playersWithValues.length);
      const nextVer = (prev.version || 1) + 1;

      const updated: MultiplayerRoomState = {
        ...prev,
        status: 'playing',
        array: arr,
        players: playersWithValues,
        teamSize: targetCount,
        activeIndices: initialActive,
        scannerLock: null,
        tacticalPings: [],
        firewallHeat: 10,
        firewallTimeRemaining: 90,
        pendingHandshake: null,
        reactions: [],
        teamSynergy: 60,
        lastActionMessage:
          '🚀 HACK INDÍTVA: A Szkennelőnek (Scanner) be kell céloznia az első anomáliát!',
        currentCodeLine: 'int i = 0, j = 1; // Kvantum magok szkennelése',
        version: nextVer,
      };

      versionRef.current = nextVer;
      setElapsedSeconds(0);
      setChoreographyScore(100);
      setStepLogs([]);

      playSuccessChord();
      broadcastState(updated);
      return updated;
    });
  }, [broadcastState, playSuccessChord]);

  // Log Step Action and Stream to Analytics
  const logStep = useCallback(
    (log: Omit<StepActionLog, 'id' | 'timestamp'>) => {
      const newLog: StepActionLog = {
        ...log,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: elapsedSeconds * 1000,
      };

      setStepLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      trackMultiplayerStep(newLog, room.roomId || 'room-mp');
    },
    [elapsedSeconds, room.roomId],
  );

  // Complete the Game
  const completeGame = useCallback(
    (finalRoomState: MultiplayerRoomState) => {
      const durationMs = elapsedSeconds * 1000 || 10000;
      const totalSwaps = finalRoomState.players.reduce(
        (acc: number, p: Player) => acc + p.swapsCount,
        0,
      );
      const totalComparisons = finalRoomState.players.reduce(
        (acc: number, p: Player) => acc + p.comparisonsCount,
        0,
      );
      const totalErrors = finalRoomState.players.reduce(
        (acc: number, p: Player) => acc + p.errorsCount,
        0,
      );
      const totalActions = totalSwaps + totalComparisons + totalErrors || 1;
      const accuracyPercentage = Math.round(((totalActions - totalErrors) / totalActions) * 100);

      const playerSummaries = finalRoomState.players.map((p: Player) => {
        const pActions = p.swapsCount + p.comparisonsCount + p.errorsCount || 1;
        return {
          playerId: p.id,
          playerName: p.name,
          color: p.color,
          isBot: p.isBot,
          swapsCount: p.swapsCount,
          comparisonsCount: p.comparisonsCount,
          errorsCount: p.errorsCount,
          contributionScore: p.score,
          accuracy: Math.round(((pActions - p.errorsCount) / pActions) * 100),
        };
      });

      const stats = {
        matchId: `match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roomId: finalRoomState.roomId,
        mode: finalRoomState.mode,
        controlStyle: finalRoomState.controlStyle,
        teamSize: finalRoomState.players.length,
        startTime: Date.now() - durationMs,
        endTime: Date.now(),
        durationMs,
        totalComparisons,
        totalSwaps,
        totalErrors,
        accuracyPercentage,
        choreographyScore,
        initialArray: finalRoomState.array,
        finalArray: [...finalRoomState.array].sort((a, b) => a - b),
        isSortedCorrectly: true,
        theoreticalComplexity: getTheoreticalComplexity(
          finalRoomState.mode,
          finalRoomState.players.length,
        ),
        actualSteps: totalSwaps + totalComparisons,
        playerStats: playerSummaries,
        stepLogs,
      };

      trackAndSaveMultiplayerMatch(stats);
      playSuccessChord();

      const nextVer = (finalRoomState.version || 1) + 1;
      const updated: MultiplayerRoomState = {
        ...finalRoomState,
        status: 'completed' as const,
        stats,
        lastActionMessage: '🏆 Gratulálunk! Az algoritmus sikeresen rendezte a sorozatot!',
        version: nextVer,
      };

      versionRef.current = nextVer;
      setRoom(updated);
      broadcastState(updated);
    },
    [broadcastState, choreographyScore, elapsedSeconds, playSuccessChord, stepLogs],
  );

  // Perform Swap Action (Enforces cooperative participation)
  // Perform Swap Action (Enforces Dual-Handshake synchronization for active pairs)
  const executeSwap = useCallback(
    (idxA: number, idxB: number, actorId?: string) => {
      setRoom((prev: MultiplayerRoomState) => {
        if (prev.status !== 'playing') return prev;
        if (idxA < 0 || idxB < 0 || idxA >= prev.array.length || idxB >= prev.array.length)
          return prev;

        const actingPlayerId = actorId || localPlayerId;
        const actingPlayer =
          prev.players.find((p: Player) => p.id === actingPlayerId) || prev.players[0];

        const playerAtA = prev.players.find((p) => p.currentSlot === idxA);
        const playerAtB = prev.players.find((p) => p.currentSlot === idxB);

        if (!playerAtA || !playerAtB) return prev;

        // Cooperative Check: If multiplayer (>1 human players), involved players, hosts or bots' partners can swap
        const humanPlayers = prev.players.filter((p) => !p.isBot);
        const isInvolved =
          humanPlayers.length <= 1 ||
          actingPlayer.currentSlot === idxA ||
          actingPlayer.currentSlot === idxB ||
          playerAtA?.isBot ||
          playerAtB?.isBot ||
          actingPlayer.isHost;

        if (!isInvolved) {
          playErrorSound();
          return {
            ...prev,
            lastActionMessage: `⚠️ Csak az érintett kártyák tulajdonosai cserélhetnek!`,
          };
        }

        const valA = prev.array[idxA];
        const valB = prev.array[idxB];

        // Dual-Handshake Check: If both dancers in the pair are human players, both must confirm!
        const isDualHumanPair = Boolean(
          playerAtA &&
          playerAtB &&
          !playerAtA.isBot &&
          !playerAtB.isBot &&
          playerAtA.id !== playerAtB.id,
        );

        if (isDualHumanPair && playerAtA && playerAtB) {
          const handshake = prev.pendingHandshake;
          const isMatchingHandshake =
            handshake &&
            handshake.action === 'swap' &&
            handshake.indices[0] === idxA &&
            handshake.indices[1] === idxB;

          if (!isMatchingHandshake) {
            // First human player initiates swap handshake
            const partner = actingPlayer.id === playerAtA.id ? playerAtB : playerAtA;
            playTone(440, 'triangle', 0.12);
            const nextVer = (prev.version || 1) + 1;
            const updated: MultiplayerRoomState = {
              ...prev,
              pendingHandshake: {
                action: 'swap',
                indices: [idxA, idxB],
                readyPlayerIds: [actingPlayer.id],
                timestamp: Date.now(),
              },
              lastActionMessage: `🤝 ${actingPlayer.name} cserét kér! Várakozás ${partner.name} megerősítésére...`,
              version: nextVer,
            };
            versionRef.current = nextVer;
            broadcastState(updated);
            return updated;
          }

          if (handshake.readyPlayerIds.includes(actingPlayer.id)) {
            // Already confirmed by this player
            return {
              ...prev,
              lastActionMessage: `⏳ Már jóváhagytad a cserét! Várakozás a partnerek szinkronjára...`,
            };
          }
          // Second human player confirmed! Dual handshake complete!
        }

        // Validate algorithmic swap condition
        if (prev.mode === 'bubble_sort' && valA <= valB) {
          playErrorSound();
          setChoreographyScore((s) => Math.max(10, s - 5));

          const updatedPlayers = prev.players.map((p: Player) =>
            p.id === actingPlayer.id ? { ...p, errorsCount: p.errorsCount + 1 } : p,
          );

          logStep({
            playerId: actingPlayer.id,
            playerName: actingPlayer.name,
            actionType: 'invalid_swap',
            indices: [idxA, idxB],
            values: [valA, valB],
            isSuccess: false,
            message: `⚠️ Hibás csere: [${valA}] ≤ [${valB}] már jó sorrendben van!`,
            codeSnippet: `// arr[${idxA}] (${valA}) <= arr[${idxB}] (${valB}) -> Nincs csere`,
          });

          const nextVer = (prev.version || 1) + 1;
          const updated: MultiplayerRoomState = {
            ...prev,
            players: updatedPlayers,
            pendingHandshake: null,
            lastActionMessage: `⚠️ Figyelem: ${valA} és ${valB} már jó sorrendben van, nincs szükség cserére!`,
            version: nextVer,
          };
          versionRef.current = nextVer;
          broadcastState(updated);
          return updated;
        }

        // Execute swap in array
        const newArr = [...prev.array];
        newArr[idxA] = valB;
        newArr[idxB] = valA;

        // Reward players
        const updatedPlayers = prev.players.map((p: Player) => {
          if (p.currentSlot === idxA || p.currentSlot === idxB) {
            return {
              ...p,
              swapsCount: p.swapsCount + 1,
              score: p.score + 100,
            };
          }
          return p;
        });

        playTone(320 + valB * 4, 'triangle', 0.18);

        logStep({
          playerId: actingPlayer.id,
          playerName: actingPlayer.name,
          actionType: 'swap',
          indices: [idxA, idxB],
          values: [valA, valB],
          isSuccess: true,
          message: `⚡ Koccintás / Helycsere: [${valA}] ⇄ [${valB}]`,
          codeSnippet: `swap(arr[${idxA}], arr[${idxB}]); // ${valA} <-> ${valB}`,
        });

        const nextVer = (prev.version || 1) + 1;
        const newSynergy = Math.min(100, (prev.teamSynergy || 60) + 8);

        // Initiate Physical Position Verification for classroom line
        const newVerification: PositionVerification = {
          swappedPair: {
            playerA: {
              id: playerAtA.id,
              name: playerAtA.name,
              oldSlot: idxA,
              targetSlot: idxB,
              confirmed: Boolean(playerAtA.isBot),
            },
            playerB: {
              id: playerAtB.id,
              name: playerAtB.name,
              oldSlot: idxB,
              targetSlot: idxA,
              confirmed: Boolean(playerAtB.isBot),
            },
          },
          indices: [idxA, idxB],
          timestamp: Date.now(),
        };

        const updatedRoom: MultiplayerRoomState = {
          ...prev,
          array: newArr,
          players: updatedPlayers,
          pendingHandshake: null,
          positionVerification: newVerification,
          teamSynergy: newSynergy,
          lastActionMessage: `📍 Koccintás rögzítve! ${playerAtA.name} sétál a(z) ${idxB + 1}. helyre, ${playerAtB.name} a(z) ${idxA + 1}. helyre! Igazoljátok a helyeteket!`,
          currentCodeLine: `swap(arr[${idxA}], arr[${idxB}]); // Helyzet igazolása folyamatban...`,
          version: nextVer,
        };

        versionRef.current = nextVer;
        broadcastState(updatedRoom);
        return updatedRoom;
      });
    },
    [broadcastState, localPlayerId, logStep, playErrorSound, playTone],
  );

  // Perform Comparison Action (Enforces Dual-Handshake synchronization)
  const executeCompare = useCallback(
    (idxA: number, idxB: number, actorId?: string) => {
      setRoom((prev: MultiplayerRoomState) => {
        if (prev.status !== 'playing') return prev;
        const valA = prev.array[idxA];
        const valB = prev.array[idxB];

        const actingPlayerId = actorId || localPlayerId;
        const actingPlayer =
          prev.players.find((p: Player) => p.id === actingPlayerId) || prev.players[0];

        const playerAtA = prev.players.find((p) => p.currentSlot === idxA);
        const playerAtB = prev.players.find((p) => p.currentSlot === idxB);

        const humanPlayers = prev.players.filter((p) => !p.isBot);
        const isInvolved =
          humanPlayers.length <= 1 ||
          actingPlayer.currentSlot === idxA ||
          actingPlayer.currentSlot === idxB ||
          playerAtA?.isBot ||
          playerAtB?.isBot ||
          actingPlayer.isHost;

        if (!isInvolved) {
          playErrorSound();
          return {
            ...prev,
            lastActionMessage: `⚠️ Csak a soron lévő játékosok hagyhatják jóvá az összehasonlítást!`,
          };
        }

        // Dual-Handshake Check for comparisons between two human dancers
        const isDualHumanPair = Boolean(
          playerAtA &&
          playerAtB &&
          !playerAtA.isBot &&
          !playerAtB.isBot &&
          playerAtA.id !== playerAtB.id,
        );

        if (isDualHumanPair && playerAtA && playerAtB) {
          const handshake = prev.pendingHandshake;
          const isMatchingHandshake =
            handshake &&
            handshake.action === 'compare' &&
            handshake.indices[0] === idxA &&
            handshake.indices[1] === idxB;

          if (!isMatchingHandshake) {
            const partner = actingPlayer.id === playerAtA.id ? playerAtB : playerAtA;
            playTone(520, 'sine', 0.12);
            const nextVer = (prev.version || 1) + 1;
            const updated: MultiplayerRoomState = {
              ...prev,
              pendingHandshake: {
                action: 'compare',
                indices: [idxA, idxB],
                readyPlayerIds: [actingPlayer.id],
                timestamp: Date.now(),
              },
              lastActionMessage: `🤝 ${actingPlayer.name} jóváhagyást kezdeményezett! Várakozás ${partner.name}-ra...`,
              version: nextVer,
            };
            versionRef.current = nextVer;
            broadcastState(updated);
            return updated;
          }

          if (handshake.readyPlayerIds.includes(actingPlayer.id)) {
            return {
              ...prev,
              lastActionMessage: `⏳ Már megerősítetted! Várakozás a partnerek szinkronjára...`,
            };
          }
        }

        playTone(280 + valA * 3, 'sine', 0.12);

        const isOrderCorrect = valA <= valB;

        // Equal contribution: reward both active players
        const updatedPlayers = prev.players.map((p: Player) =>
          p.currentSlot === idxA || p.currentSlot === idxB
            ? { ...p, comparisonsCount: p.comparisonsCount + 1, score: p.score + 35 }
            : p,
        );

        logStep({
          playerId: actingPlayer.id,
          playerName: actingPlayer.name,
          actionType: 'compare',
          indices: [idxA, idxB],
          values: [valA, valB],
          isSuccess: true,
          message: `Összehasonlítás: [${valA}] és [${valB}] -> ${isOrderCorrect ? 'Rendben van' : 'Csere szükséges!'}`,
          codeSnippet: `if (arr[${idxA}] > arr[${idxB}]) // ${valA} > ${valB} is ${!isOrderCorrect}`,
        });

        let nextActive = [idxA, idxB];
        if (isOrderCorrect) {
          nextActive = computeNextActiveIndices(prev.mode, idxA, idxB, prev.array.length);
        }

        const nextVer = (prev.version || 1) + 1;
        const newSynergy = Math.min(100, (prev.teamSynergy || 60) + 5);

        const updatedRoom: MultiplayerRoomState = {
          ...prev,
          players: updatedPlayers,
          activeIndices: nextActive,
          pendingHandshake: null,
          teamSynergy: newSynergy,
          lastActionMessage: isOrderCorrect
            ? `✅ ${valA} ≤ ${valB}: Szinkronban jóváhagyva, mehetünk tovább!`
            : `⚠️ ${valA} > ${valB}: Csere szükséges!`,
          currentCodeLine: `if (arr[${idxA}] > arr[${idxB}]) // ${valA} > ${valB} is ${!isOrderCorrect}`,
          version: nextVer,
        };

        versionRef.current = nextVer;

        if (checkIsSorted(prev.array)) {
          setTimeout(() => completeGame(updatedRoom), 400);
        }

        broadcastState(updatedRoom);
        return updatedRoom;
      });
    },
    [broadcastState, completeGame, localPlayerId, logStep, playErrorSound, playTone],
  );

  // Send interactive live floating reaction emote
  const sendReaction = useCallback(
    (emoji: string) => {
      setRoom((prev: MultiplayerRoomState) => {
        const actingPlayer = prev.players.find((p) => p.id === localPlayerId) || prev.players[0];
        const newReaction: ReactionEvent = {
          id: `react-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          playerId: actingPlayer?.id || 'anon',
          playerName: actingPlayer?.name || 'Játékos',
          emoji,
          timestamp: Date.now(),
        };

        const existing = prev.reactions || [];
        const nextReactions = [...existing.slice(-7), newReaction];
        const nextVer = (prev.version || 1) + 1;

        const updated: MultiplayerRoomState = {
          ...prev,
          reactions: nextReactions,
          version: nextVer,
        };

        versionRef.current = nextVer;
        broadcastState(updated);
        return updated;
      });
    },
    [broadcastState, localPlayerId],
  );

  // Smooth local player position update
  const updatePlayerPosition = useCallback(
    (x: number, y: number) => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'PLAYER_MOVE',
          playerId: localPlayerId,
          x,
          y,
        });
      }
    },
    [localPlayerId],
  );

  // 🛰️ Scanner Role Action: Aim and lock laser beam onto two candidate cores
  const setScannerLock = useCallback(
    (indices: [number, number], isLocked: boolean) => {
      setRoom((prev: MultiplayerRoomState) => {
        if (prev.status !== 'playing') return prev;
        const actingPlayer = prev.players.find((p) => p.id === localPlayerId) || prev.players[0];

        // Scanner check
        const isScanner =
          actingPlayer?.cyberRole === 'scanner' ||
          prev.players.filter((p) => !p.isBot).length <= 1 ||
          actingPlayer?.isHost;

        if (!isScanner) {
          playErrorSound();
          return {
            ...prev,
            lastActionMessage: '⚠️ Csak a Szkennelő (Scanner) tudja rögzíteni a célzást!',
          };
        }

        const [idxA, idxB] = indices;
        if (idxA < 0 || idxB < 0 || idxA >= prev.array.length || idxB >= prev.array.length)
          return prev;

        const valA = prev.array[idxA];
        const valB = prev.array[idxB];
        const conditionMet = valA > valB;

        playTone(650, 'sawtooth', 0.15); // Laser lock sound

        const newLock: ScannerLock | null = isLocked
          ? {
              lockedIndices: [idxA, idxB],
              isLocked: true,
              scannerPlayerId: actingPlayer.id,
              scannerPlayerName: actingPlayer.name,
              conditionMet,
              timestamp: Date.now(),
            }
          : null;

        const nextVer = (prev.version || 1) + 1;
        const updated: MultiplayerRoomState = {
          ...prev,
          activeIndices: indices,
          scannerLock: newLock,
          lastActionMessage: isLocked
            ? `🎯 SZKENNER RÖGZÍTVE: Core [${idxA}] (${valA}) ⇄ Core [${idxB}] (${valB})! Operátor, végezd el az átkapcsolást!`
            : 'Szkennelés feloldva.',
          version: nextVer,
        };

        versionRef.current = nextVer;
        broadcastState(updated);
        return updated;
      });
    },
    [broadcastState, localPlayerId, playErrorSound, playTone],
  );

  // ⚡ Operator Role Action: Execute physical core swap or approve stable order
  const executeOperatorAction = useCallback(
    (action: 'swap' | 'confirm_ok') => {
      setRoom((prev: MultiplayerRoomState) => {
        if (prev.status !== 'playing') return prev;
        const actingPlayer = prev.players.find((p) => p.id === localPlayerId) || prev.players[0];

        // Check if scanner is locked
        const lock = prev.scannerLock;
        if (!lock || !lock.isLocked) {
          playErrorSound();
          return {
            ...prev,
            lastActionMessage:
              '⚠️ A Reaktor zárolva van! A Szkennelőnek először be kell céloznia az anomáliát!',
          };
        }

        const [idxA, idxB] = lock.lockedIndices;
        const valA = prev.array[idxA];
        const valB = prev.array[idxB];
        const isSwapNeeded = valA > valB;

        if (action === 'swap') {
          if (!isSwapNeeded) {
            // Error! Left was already <= Right
            playErrorSound();
            const nextHeat = Math.min(100, (prev.firewallHeat || 10) + 12);
            const nextVer = (prev.version || 1) + 1;
            const updated: MultiplayerRoomState = {
              ...prev,
              firewallHeat: nextHeat,
              lastActionMessage: `⚠️ Hiba! Core [${idxA}] (${valA}) ≤ Core [${idxB}] (${valB}) már stabil! Hőmérséklet: +12%!`,
              version: nextVer,
            };
            versionRef.current = nextVer;
            broadcastState(updated);
            return updated;
          }

          // SUCCESSFUL SWAP!
          const newArr = [...prev.array];
          newArr[idxA] = valB;
          newArr[idxB] = valA;

          playTone(280, 'square', 0.25); // Reactor heavy power swap sound
          setTimeout(() => playTone(540, 'triangle', 0.2), 80);

          // Reward players
          const updatedPlayers = prev.players.map((p) => {
            if (
              p.cyberRole === 'scanner' ||
              p.cyberRole === 'operator' ||
              p.id === actingPlayer.id
            ) {
              return {
                ...p,
                swapsCount: p.swapsCount + 1,
                score: p.score + 150,
              };
            }
            return p;
          });

          logStep({
            playerId: actingPlayer.id,
            playerName: actingPlayer.name,
            actionType: 'swap',
            indices: [idxA, idxB],
            values: [valA, valB],
            isSuccess: true,
            message: `⚡ REAKTOR CSAPAT-ÁTKAPCSOLÁS: [${valA}] ⇄ [${valB}]`,
            codeSnippet: `swap(core[${idxA}], core[${idxB}]); // ${valA} <-> ${valB}`,
          });

          const nextActive = computeNextActiveIndices(prev.mode, idxA, idxB, newArr.length);
          const nextHeat = Math.max(0, (prev.firewallHeat || 10) - 15);
          const nextSynergy = Math.min(100, (prev.teamSynergy || 60) + 10);
          const nextVer = (prev.version || 1) + 1;

          const updatedRoom: MultiplayerRoomState = {
            ...prev,
            array: newArr,
            players: updatedPlayers,
            activeIndices: nextActive,
            scannerLock: null, // Clear lock so Scanner must target next pair
            firewallHeat: nextHeat,
            teamSynergy: nextSynergy,
            lastActionMessage: `⚡ Kvantum Csere Sikeres! Core [${idxA}] ⇄ [${idxB}]. Hőmérséklet: -15%!`,
            currentCodeLine: `swap(core[${idxA}], core[${idxB}]);`,
            version: nextVer,
          };

          versionRef.current = nextVer;
          if (checkIsSorted(newArr)) {
            setTimeout(() => completeGame(updatedRoom), 400);
          }
          broadcastState(updatedRoom);
          return updatedRoom;
        }

        if (action === 'confirm_ok') {
          if (isSwapNeeded) {
            // Error! Left was > Right, so swap was required
            playErrorSound();
            const nextHeat = Math.min(100, (prev.firewallHeat || 10) + 10);
            const nextVer = (prev.version || 1) + 1;
            const updated: MultiplayerRoomState = {
              ...prev,
              firewallHeat: nextHeat,
              lastActionMessage: `⚠️ Hiba! Core [${idxA}] (${valA}) > Core [${idxB}] (${valB}), átkapcsolás szükséges!`,
              version: nextVer,
            };
            versionRef.current = nextVer;
            broadcastState(updated);
            return updated;
          }

          // SUCCESSFUL CONFIRMATION
          playTone(520, 'sine', 0.15);
          const nextActive = computeNextActiveIndices(prev.mode, idxA, idxB, prev.array.length);
          const nextHeat = Math.max(0, (prev.firewallHeat || 10) - 10);
          const nextSynergy = Math.min(100, (prev.teamSynergy || 60) + 5);
          const nextVer = (prev.version || 1) + 1;

          const updatedPlayers = prev.players.map((p) => {
            if (
              p.cyberRole === 'scanner' ||
              p.cyberRole === 'operator' ||
              p.id === actingPlayer.id
            ) {
              return {
                ...p,
                comparisonsCount: p.comparisonsCount + 1,
                score: p.score + 50,
              };
            }
            return p;
          });

          const updatedRoom: MultiplayerRoomState = {
            ...prev,
            players: updatedPlayers,
            activeIndices: nextActive,
            scannerLock: null,
            firewallHeat: nextHeat,
            teamSynergy: nextSynergy,
            lastActionMessage: `✅ Core [${idxA}] ≤ Core [${idxB}] stabil! Továbblépés a következő magokra!`,
            currentCodeLine: `if (core[${idxA}] <= core[${idxB}]) // OK`,
            version: nextVer,
          };

          versionRef.current = nextVer;
          if (checkIsSorted(prev.array)) {
            setTimeout(() => completeGame(updatedRoom), 400);
          }
          broadcastState(updatedRoom);
          return updatedRoom;
        }

        return prev;
      });
    },
    [broadcastState, completeGame, localPlayerId, logStep, playErrorSound, playTone],
  );

  // 📡 Co-Op Tactical Callout Pings
  const sendTacticalPing = useCallback(
    (type: TacticalPing['type'], message: string, targetIndices?: number[]) => {
      setRoom((prev: MultiplayerRoomState) => {
        const actingPlayer = prev.players.find((p) => p.id === localPlayerId) || prev.players[0];
        const newPing: TacticalPing = {
          id: `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: actingPlayer.id,
          senderName: actingPlayer.name,
          type,
          message,
          targetIndices,
          timestamp: Date.now(),
        };

        playTone(700, 'triangle', 0.08);

        const existing = prev.tacticalPings || [];
        const nextPings = [...existing.slice(-4), newPing];
        const nextVer = (prev.version || 1) + 1;

        const updated: MultiplayerRoomState = {
          ...prev,
          tacticalPings: nextPings,
          version: nextVer,
        };

        versionRef.current = nextVer;
        broadcastState(updated);
        return updated;
      });
    },
    [broadcastState, localPlayerId, playTone],
  );

  // Auto-step when both active dancers are AI bots
  useEffect(() => {
    if (room.status !== 'playing' || !isHost) return;
    const idxA = room.activeIndices[0];
    const idxB = room.activeIndices[1];
    if (idxA === undefined || idxB === undefined) return;

    const pA = room.players.find((p) => p.currentSlot === idxA);
    const pB = room.players.find((p) => p.currentSlot === idxB);

    if (pA?.isBot && pB?.isBot) {
      const timer = setTimeout(() => {
        const valA = room.array[idxA];
        const valB = room.array[idxB];
        if (valA !== undefined && valB !== undefined) {
          if (valA > valB) {
            executeSwap(idxA, idxB, pA.id);
          } else {
            executeCompare(idxA, idxB, pA.id);
          }
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    executeCompare,
    executeSwap,
    isHost,
    room.activeIndices,
    room.array,
    room.players,
    room.status,
  ]);

  // 📍 Confirm Arrival at Physical Position in Classroom Line
  const confirmPosition = useCallback(
    (targetPlayerId?: string) => {
      setRoom((prev: MultiplayerRoomState) => {
        if (prev.status !== 'playing' || !prev.positionVerification) return prev;

        const actingPlayerId = targetPlayerId || localPlayerId;
        const verification = prev.positionVerification;
        const { playerA, playerB } = verification.swappedPair;

        let confirmedA = playerA.confirmed;
        let confirmedB = playerB.confirmed;

        if (actingPlayerId === playerA.id) {
          confirmedA = true;
          playTone(580, 'sine', 0.15);
        } else if (actingPlayerId === playerB.id) {
          confirmedB = true;
          playTone(580, 'sine', 0.15);
        } else {
          // Host or bot override
          confirmedA = true;
          confirmedB = true;
        }

        const isBothConfirmed = confirmedA && confirmedB;

        if (isBothConfirmed) {
          // Finalize physical swap in room state
          const [idxA, idxB] = verification.indices;
          const updatedPlayers = prev.players.map((p) => {
            if (p.id === playerA.id) {
              return {
                ...p,
                currentSlot: playerA.targetSlot,
                value: prev.array[playerA.targetSlot],
              };
            }
            if (p.id === playerB.id) {
              return {
                ...p,
                currentSlot: playerB.targetSlot,
                value: prev.array[playerB.targetSlot],
              };
            }
            return p;
          });

          playSuccessChord();

          const nextActive = computeNextActiveIndices(prev.mode, idxA, idxB, prev.array.length);
          const nextVer = (prev.version || 1) + 1;

          const finalizedRoom: MultiplayerRoomState = {
            ...prev,
            players: updatedPlayers,
            activeIndices: nextActive,
            positionVerification: null,
            lastActionMessage: `✅ Helyzet igazolva! ${playerA.name} és ${playerB.name} sikeresen átállt az új helyére!`,
            currentCodeLine: `// ${playerA.name} -> ${playerA.targetSlot + 1}. hely, ${playerB.name} -> ${playerB.targetSlot + 1}. hely (OK)`,
            version: nextVer,
          };

          versionRef.current = nextVer;
          if (checkIsSorted(prev.array)) {
            setTimeout(() => completeGame(finalizedRoom), 400);
          }
          broadcastState(finalizedRoom);
          return finalizedRoom;
        }

        // Only one player confirmed so far
        const nextVer = (prev.version || 1) + 1;
        const updatedVerification: PositionVerification = {
          ...verification,
          swappedPair: {
            playerA: { ...playerA, confirmed: confirmedA },
            playerB: { ...playerB, confirmed: confirmedB },
          },
        };

        const waitingFor = !confirmedA ? playerA.name : playerB.name;
        const updatedRoom: MultiplayerRoomState = {
          ...prev,
          positionVerification: updatedVerification,
          lastActionMessage: `📍 Helyzet részben igazolva! Még várakozás ${waitingFor} beállására a sorban...`,
          version: nextVer,
        };

        versionRef.current = nextVer;
        broadcastState(updatedRoom);
        return updatedRoom;
      });
    },
    [broadcastState, completeGame, localPlayerId, playSuccessChord, playTone],
  );

  const addBot = useCallback(() => {
    setRoom((prev: MultiplayerRoomState) => {
      if (prev.players.length >= 8) return prev;
      const botIdx = prev.players.length;
      const usedColors = prev.players.map((p) => p.color);
      const botColor = getRandomNeonColor(usedColors);
      const botName = BOT_NAMES[botIdx % BOT_NAMES.length];

      const newBot: Player = {
        id: `bot-${botIdx}-${Math.random().toString(36).slice(2, 6)}`,
        name: botName,
        color: botColor,
        value: 0,
        currentSlot: botIdx,
        isHost: false,
        isBot: true,
        x: 120 + botIdx * 150,
        y: 250,
        vx: 0,
        vy: 0,
        radius: 36,
        trail: [],
        swapsCount: 0,
        comparisonsCount: 0,
        errorsCount: 0,
        score: 0,
      };

      const updated: MultiplayerRoomState = {
        ...prev,
        players: [...prev.players, newBot],
        teamSize: Math.max(prev.teamSize, prev.players.length + 1),
        lastActionMessage: `${newBot.name} csatlakozott a csapathoz!`,
      };
      broadcastState(updated);
      return updated;
    });
  }, [broadcastState]);

  const removePlayer = useCallback(
    (playerId: string) => {
      setRoom((prev: MultiplayerRoomState) => {
        const remaining = prev.players.filter((p) => p.id !== playerId);
        if (remaining.length === 0) return prev;
        const updated: MultiplayerRoomState = {
          ...prev,
          players: remaining.map((p, idx) => ({ ...p, currentSlot: idx })),
          teamSize: Math.max(2, remaining.length),
        };
        broadcastState(updated);
        return updated;
      });
    },
    [broadcastState],
  );

  return {
    room,
    localPlayerId,
    isHost,
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
    setScannerLock,
    executeOperatorAction,
    sendTacticalPing,
    sendReaction,
    updatePlayerPosition,
    addBot,
    removePlayer,
    broadcastState,
    setRoom,
  };
}

// Helpers
function generateRoomId(): string {
  const code = Math.floor(100 + Math.random() * 900);
  return `ALGO-${code}`;
}

function generateRandomArray(length: number): number[] {
  const count = Math.max(4, length);
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(10 + Math.random() * 85));
  }
  const arr = Array.from(numbers);
  // Ensure array is unsorted at the start
  if (checkIsSorted(arr) && arr.length > 1) {
    const temp = arr[0];
    arr[0] = arr[arr.length - 1];
    arr[arr.length - 1] = temp;
  }
  return arr;
}

function checkIsSorted(arr: number[]): boolean {
  if (arr.length <= 1) return true;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

function computeInitialActiveIndices(mode: MultiplayerGameMode, length: number): number[] {
  if (length < 2) return [0, 0];
  if (mode === 'binary_search') {
    return [0, length - 1];
  }
  if (mode === 'quick_sort') {
    return [0, length - 1];
  }
  return [0, 1];
}

function computeNextActiveIndices(
  mode: MultiplayerGameMode,
  currentIdxA: number,
  currentIdxB: number,
  arrayLength: number,
): number[] {
  if (arrayLength < 2) return [0, 0];

  if (mode === 'bubble_sort') {
    const nextI = currentIdxB < arrayLength - 1 ? currentIdxB : 0;
    return [nextI, Math.min(nextI + 1, arrayLength - 1)];
  }

  if (mode === 'quick_sort') {
    const pivot = arrayLength - 1;
    const nextI = currentIdxA < pivot - 1 ? currentIdxA + 1 : 0;
    return [nextI, pivot];
  }

  if (mode === 'binary_search') {
    const mid = Math.floor((currentIdxA + currentIdxB) / 2);
    return [mid, Math.min(mid + 1, arrayLength - 1)];
  }

  if (mode === 'merge_sort') {
    const nextI = currentIdxB < arrayLength - 1 ? currentIdxB : 0;
    return [nextI, Math.min(nextI + 1, arrayLength - 1)];
  }

  return [0, 1];
}

function getTheoreticalComplexity(mode: MultiplayerGameMode, n: number): string {
  switch (mode) {
    case 'bubble_sort':
      return `O(N²) ≈ ${Math.round((n * (n - 1)) / 2)} lépés`;
    case 'quick_sort':
      return `O(N log N) ≈ ${Math.round(n * Math.log2(n || 1))} lépés`;
    case 'binary_search':
      return `O(log N) ≈ ${Math.ceil(Math.log2(n || 1))} lépés`;
    case 'merge_sort':
      return `O(N log N) ≈ ${Math.round(n * Math.log2(n || 1))} lépés`;
    default:
      return 'O(N²)';
  }
}
