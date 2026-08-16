'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { MultiplayerRoomState } from '../../../../types/multiplayer';
import {
  Users,
  ArrowLeftRight,
  CheckCircle2,
  Footprints,
  Smartphone,
  Sparkles,
  Zap,
  Handshake,
  Volume2,
  VolumeX,
  HelpCircle,
  Radio,
  Sliders,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface PhysicalClassroomArenaProps {
  room: MultiplayerRoomState;
  localPlayerId: string;
  onSwap: (idxA: number, idxB: number) => void;
  onCompare: (idxA: number, idxB: number) => void;
  onConfirmPosition?: (targetPlayerId?: string) => void;
}

export default function PhysicalClassroomArena({
  room,
  localPlayerId,
  onSwap,
  onCompare,
  onConfirmPosition,
}: PhysicalClassroomArenaProps) {
  const localPlayer = room.players.find((p) => p.id === localPlayerId) || room.players[0];

  const activeIdxA = room.activeIndices[0];
  const activeIdxB = room.activeIndices[1];
  const playerA = room.players.find((p) => p.currentSlot === activeIdxA);
  const playerB = room.players.find((p) => p.currentSlot === activeIdxB);

  const isLocalInvolved =
    localPlayer &&
    (localPlayer.currentSlot === activeIdxA || localPlayer.currentSlot === activeIdxB);

  const valA = activeIdxA !== undefined ? room.array[activeIdxA] : null;
  const valB = activeIdxB !== undefined ? room.array[activeIdxB] : null;
  const isSwapNeeded = valA !== null && valB !== null && valA > valB;

  // Position Verification state
  const verification = room.positionVerification;
  const isVerifying = Boolean(verification);
  const isSwappedPlayer =
    verification &&
    (localPlayerId === verification.swappedPair.playerA.id ||
      localPlayerId === verification.swappedPair.playerB.id);

  const myVerificationData =
    verification?.swappedPair.playerA.id === localPlayerId
      ? verification.swappedPair.playerA
      : verification?.swappedPair.playerB.id === localPlayerId
        ? verification.swappedPair.playerB
        : null;

  // Required directional vector in classroom line
  const requiredDirection: 'right' | 'left' | null = myVerificationData
    ? myVerificationData.targetSlot > myVerificationData.oldSlot
      ? 'right'
      : 'left'
    : null;

  // Sensor & Motion states
  const [sensorPermission, setSensorPermission] = useState<
    'prompt' | 'granted' | 'denied' | 'unsupported'
  >('prompt');
  const [motionJerk, setMotionJerk] = useState<number>(0);
  const [bumpDetected, setBumpDetected] = useState<boolean>(false);
  const [stepsCount, setStepsCount] = useState<number>(0);
  const [sensitivity, setSensitivity] = useState<'high' | 'normal' | 'low'>('normal');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Directional Vector Tracking States
  const [motionDirection, setMotionDirection] = useState<
    'idle' | 'moving_right' | 'moving_left' | 'wrong_direction' | 'arrived'
  >('idle');
  const [directionalProgress, setDirectionalProgress] = useState<number>(0);
  const [wrongDirectionWarning, setWrongDirectionWarning] = useState<boolean>(false);

  // Jerk threshold (m/s²) based on sensitivity
  const jerkThreshold = sensitivity === 'high' ? 6.5 : sensitivity === 'normal' ? 8.5 : 12.0;

  // Ref tracking for high-frequency physics calculation
  const lastAcc = useRef<{ x: number; y: number; z: number } | null>(null);
  const lastBumpTime = useRef<number>(0);
  const lastStepTime = useRef<number>(0);
  const correctDirectionTime = useRef<number>(0);
  const stillnessStartTime = useRef<number>(0);
  const autoConfirmedRef = useRef<boolean>(false);

  const onSwapRef = useRef(onSwap);
  onSwapRef.current = onSwap;
  const onConfirmPositionRef = useRef(onConfirmPosition);
  onConfirmPositionRef.current = onConfirmPosition;

  // Reset auto-confirmation ref on new verification
  useEffect(() => {
    autoConfirmedRef.current = false;
    setDirectionalProgress(0);
    setMotionDirection('idle');
    setWrongDirectionWarning(false);
  }, [verification?.timestamp]);

  // Polyphonic sound oscillator
  const playTone = useCallback(
    (freq: number, type: OscillatorType = 'sine', duration = 0.14) => {
      if (audioMuted || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Ignored if audio restricted
      }
    },
    [audioMuted],
  );

  // Haptic feedback trigger
  const triggerHaptic = useCallback((pattern: number[] = [120, 60, 180]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored
      }
    }
  }, []);

  // Actions
  const handleSwapClick = useCallback(() => {
    if (activeIdxA === undefined || activeIdxB === undefined) return;
    playTone(360, 'triangle', 0.22);
    triggerHaptic([100, 40, 100]);
    onSwap(activeIdxA, activeIdxB);
  }, [activeIdxA, activeIdxB, onSwap, playTone, triggerHaptic]);

  const handleCompareClick = useCallback(() => {
    if (activeIdxA === undefined || activeIdxB === undefined) return;
    playTone(560, 'sine', 0.16);
    triggerHaptic([60]);
    onCompare(activeIdxA, activeIdxB);
  }, [activeIdxA, activeIdxB, onCompare, playTone, triggerHaptic]);

  const handleConfirmPositionClick = useCallback(() => {
    if (!onConfirmPosition) return;
    playTone(640, 'triangle', 0.2);
    triggerHaptic([80, 50, 120]);
    onConfirmPosition(localPlayerId);
  }, [localPlayerId, onConfirmPosition, playTone, triggerHaptic]);

  // Request accelerometer permission (iOS 13+ requirement)
  const requestMotionPermission = useCallback(async () => {
    if (
      typeof window !== 'undefined' &&
      'DeviceMotionEvent' in window &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const response = await (
          DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (response === 'granted') {
          setSensorPermission('granted');
          triggerHaptic([80, 50, 80]);
        } else {
          setSensorPermission('denied');
        }
      } catch (err) {
        console.warn('DeviceMotion permission failed:', err);
        setSensorPermission('denied');
      }
    } else if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setSensorPermission('granted');
    } else {
      setSensorPermission('unsupported');
    }
  }, [triggerHaptic]);

  // Real-time Accelerometer & Directional Vector Filter Engine
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setSensorPermission('unsupported');
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      setSensorPermission((prev) => (prev !== 'granted' ? 'granted' : prev));

      const current = event.acceleration || event.accelerationIncludingGravity;
      if (!current) return;

      const curX = current.x || 0;
      const curY = current.y || 0;
      const curZ = current.z || 0;

      const now = Date.now();

      if (lastAcc.current) {
        const dx = curX - lastAcc.current.x;
        const dy = curY - lastAcc.current.y;
        const dz = curZ - lastAcc.current.z;
        const jerk = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const jerkPercent = Math.min(100, Math.max(0, Math.round((jerk / 18) * 100)));
        setMotionJerk(jerkPercent);

        // Step detection (rhythmic gait movement: 3.2 - 6.5 m/s²)
        if (jerk > 3.2 && jerk < 6.5 && now - lastStepTime.current > 380) {
          lastStepTime.current = now;
          setStepsCount((s) => s + 1);
        }

        // BUMP DETECTION (Pre-swap phase)
        if (jerk >= jerkThreshold && now - lastBumpTime.current > 1200) {
          lastBumpTime.current = now;
          setBumpDetected(true);

          triggerHaptic([120, 50, 200]);
          playTone(480, 'square', 0.25);

          setTimeout(() => setBumpDetected(false), 900);

          if (
            isLocalInvolved &&
            activeIdxA !== undefined &&
            activeIdxB !== undefined &&
            !isVerifying
          ) {
            onSwapRef.current(activeIdxA, activeIdxB);
          }
        }

        // 🧭 DIRECTIONAL MOTION VECTOR INTEGRATION (Post-swap verification phase)
        if (
          isVerifying &&
          isSwappedPlayer &&
          requiredDirection &&
          !myVerificationData?.confirmed &&
          !autoConfirmedRef.current
        ) {
          const lateralAcc = curX; // Lateral vector along phone's horizontal plane
          const isWalking = jerk > 2.8;

          if (isWalking) {
            // Lateral movement vector classification
            // Note: When phone is held facing front, moving to the right causes a positive lateral tilt/acceleration surge
            const movingRight = lateralAcc > 0.8 || dx > 0.6;
            const movingLeft = lateralAcc < -0.8 || dx < -0.6;

            if (requiredDirection === 'right') {
              if (movingRight) {
                setMotionDirection('moving_right');
                setWrongDirectionWarning(false);
                correctDirectionTime.current = now;
                setDirectionalProgress((prev) => Math.min(100, prev + 18));
              } else if (movingLeft) {
                setMotionDirection('wrong_direction');
                setWrongDirectionWarning(true);
                playTone(220, 'sawtooth', 0.1);
              }
            } else if (requiredDirection === 'left') {
              if (movingLeft) {
                setMotionDirection('moving_left');
                setWrongDirectionWarning(false);
                correctDirectionTime.current = now;
                setDirectionalProgress((prev) => Math.min(100, prev + 18));
              } else if (movingRight) {
                setMotionDirection('wrong_direction');
                setWrongDirectionWarning(true);
                playTone(220, 'sawtooth', 0.1);
              }
            }
            stillnessStartTime.current = 0;
          } else {
            // Stillness / Arrived detection (jerk is low after having made directional progress)
            if (directionalProgress >= 60) {
              if (!stillnessStartTime.current) {
                stillnessStartTime.current = now;
              } else if (now - stillnessStartTime.current > 700) {
                // 🛑 AUTOMATIC ARRIVAL CONFIRMED!
                setMotionDirection('arrived');
                setDirectionalProgress(100);
                autoConfirmedRef.current = true;

                triggerHaptic([100, 50, 150]);
                playTone(680, 'triangle', 0.25);

                if (onConfirmPositionRef.current) {
                  onConfirmPositionRef.current(localPlayerId);
                }
              }
            }
          }
        }
      }

      lastAcc.current = { x: curX, y: curY, z: curZ };
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [
    activeIdxA,
    activeIdxB,
    directionalProgress,
    isLocalInvolved,
    isSwappedPlayer,
    isVerifying,
    jerkThreshold,
    localPlayerId,
    myVerificationData?.confirmed,
    playTone,
    requiredDirection,
    triggerHaptic,
  ]);

  // Turn vibration notification
  useEffect(() => {
    if (isLocalInvolved && !isVerifying) {
      triggerHaptic([150, 80, 150]);
      playTone(600, 'triangle', 0.15);
    }
  }, [activeIdxA, activeIdxB, isLocalInvolved, isVerifying, playTone, triggerHaptic]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (room.status !== 'playing') return;

      if (isVerifying && isSwappedPlayer && !myVerificationData?.confirmed) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleConfirmPositionClick();
        }
        return;
      }

      if (isLocalInvolved && !isVerifying) {
        if (e.code === 'Space' || e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSwapClick();
        } else if (e.code === 'Enter' || e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCompareClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleCompareClick,
    handleConfirmPositionClick,
    handleSwapClick,
    isLocalInvolved,
    isSwappedPlayer,
    isVerifying,
    myVerificationData?.confirmed,
    room.status,
  ]);

  const totalSlots = room.array.length || room.players.length || 4;

  return (
    <div className="w-full rounded-3xl bg-slate-950 border border-teal-500/20 shadow-2xl p-4 sm:p-7 flex flex-col items-center space-y-6 select-none overflow-hidden relative text-slate-100 font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#26998415_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-20 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER STATUS & SENSOR BAR */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {/* 1. Real-time Bump & Jerk Shock Meter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                bumpDetected
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 animate-bounce'
                  : 'bg-teal-500/15 border-teal-500/30 text-teal-400'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${bumpDetected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Koccintás Érzékelő
              </div>
              <div className="text-xs font-black font-mono flex items-center gap-1.5 mt-0.5">
                {bumpDetected ? (
                  <span className="text-emerald-400 font-bold animate-pulse">💥 KOCCINTÁS!</span>
                ) : (
                  <span className="text-slate-200">
                    Lökés: <strong className="text-teal-400">{motionJerk}%</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-16 sm:w-20 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                style={{ width: `${motionJerk}%` }}
                className={`h-full rounded-full transition-all duration-100 ${
                  motionJerk > 60
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-md shadow-rose-500/50'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                }`}
              />
            </div>

            {sensorPermission === 'prompt' && (
              <button
                onClick={requestMotionPermission}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg text-[10px] font-bold font-mono transition-all animate-pulse cursor-pointer"
              >
                Engedélyezés
              </button>
            )}
          </div>
        </div>

        {/* 2. My Physical Position Badge */}
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${localPlayer?.color || '#269984'}25` }}
              className="p-2.5 rounded-xl border border-white/20"
            >
              <Footprints className="w-5 h-5 text-teal-300 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                A Te Pozíciód
              </div>
              <div className="text-sm font-black font-montserrat tracking-tight flex items-center gap-1.5">
                <span style={{ color: localPlayer?.color || '#269984' }}>
                  {localPlayer?.name || 'Diák'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  • {(localPlayer?.currentSlot ?? 0) + 1}. Hely
                </span>
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border transition-all ${
              isVerifying && isSwappedPlayer
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-400/40 animate-bounce'
                : isLocalInvolved
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {isVerifying && isSwappedPlayer
              ? '📍 IGAZOLD A HELYED!'
              : isLocalInvolved
                ? '🔥 TE LÉPSZ!'
                : 'Várakozás'}
          </span>
        </div>

        {/* 3. Sensitivity & Sound Settings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-300">Érzékenység:</span>
            <div className="flex items-center gap-1">
              {(['high', 'normal', 'low'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    sensitivity === s
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'high' ? 'Magas' : s === 'normal' ? 'Normál' : 'Alacsony'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioMuted((m) => !m)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={audioMuted ? 'Hang bekapcsolása' : 'Hang némítása'}
            >
              {audioMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-teal-400" />
              )}
            </button>
            <button
              onClick={() => setShowGuide((g) => !g)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Súgó"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK HELP GUIDE DRAWER */}
      {showGuide && (
        <div className="w-full bg-slate-900 border border-teal-500/40 rounded-2xl p-4 text-xs space-y-2 animate-fade-in shadow-xl">
          <div className="font-bold text-teal-300 font-montserrat flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            Hogyan koccintsatok a tanteremben?
          </div>
          <p className="text-slate-300 leading-relaxed">
            1. Álljatok be a sorba balról jobbra a számotok szerint.
            <br />
            2. Amikor te és a melletted álló társad vagytok soron, kérdezzétek meg egymás számát.
            <br />
            3. Ha helycsere kell, <strong>sétáljatok át egymás mellett</strong>, és finoman{' '}
            <strong>koccintsátok össze / rázzátok meg a telefonjaitokat</strong>!
            <br />
            4. A telefon{' '}
            <strong>automatikusan ellenőrzi a mozgásirányodat (Jobbra vs. Balra)</strong>, és amint
            megérkezel és megállsz az új helyeden, automatikusan jóváhagyja a beállást!
          </p>
        </div>
      )}

      {/* LIVING LINE FORMATION IN THE CLASSROOM */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-[#020d18] via-[#041624] to-[#010912] rounded-3xl border border-teal-900/60 shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Top Formation Label */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-3">
          <span className="flex items-center gap-1.5 text-teal-400 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Élő Tantermi Sorrend (Balról Jobbra)
          </span>
          <span className="text-slate-400 font-bold">{totalSlots} Tanuló a Teremben</span>
        </div>

        {/* Formation Nodes Grid */}
        <div className="w-full py-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 relative z-10">
          {Array.from({ length: totalSlots }).map((_, slotIndex) => {
            const val = room.array[slotIndex] ?? 0;
            const player = room.players.find((p) => p.currentSlot === slotIndex);
            const isActiveA = activeIdxA === slotIndex;
            const isActiveB = activeIdxB === slotIndex;
            const isActive = isActiveA || isActiveB;
            const isLocal = player?.id === localPlayerId;
            const playerColor = player?.color || '#06b6d4';

            return (
              <div key={`living-slot-${slotIndex}`} className="flex flex-col items-center relative">
                {/* Physical Slot Index Badge */}
                <div
                  className={`text-[10px] font-mono font-bold mb-2 px-2.5 py-0.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 scale-105'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {slotIndex + 1}. HELY
                </div>

                {/* Active Action Pin */}
                {isActive && (
                  <div className="absolute -top-3 px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-mono font-black rounded-full shadow-lg z-20 flex items-center gap-1 animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    SORON
                  </div>
                )}

                {/* Player Formation Card */}
                <div
                  style={{
                    borderColor: isActive ? playerColor : 'rgba(255,255,255,0.12)',
                    boxShadow: isActive
                      ? `0 0 30px ${playerColor}60, inset 0 0 15px ${playerColor}30`
                      : '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                  className={`relative w-24 sm:w-28 h-36 sm:h-40 rounded-2xl p-3 flex flex-col items-center justify-between transition-all duration-300 bg-slate-900/90 border-2 backdrop-blur-md ${
                    isActive
                      ? 'scale-108 ring-4 ring-amber-400/40'
                      : 'opacity-85 hover:opacity-100 hover:scale-102'
                  }`}
                >
                  {/* Owner Label */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono">
                    <span
                      style={{ color: playerColor }}
                      className="font-bold truncate max-w-[65px]"
                    >
                      {player?.name || `Diák ${slotIndex + 1}`}
                    </span>
                    <span
                      style={{ backgroundColor: playerColor }}
                      className={`w-2 h-2 rounded-full ${isActive ? 'animate-ping' : ''}`}
                    />
                  </div>

                  {/* Circular Avatar / Number Core */}
                  <div
                    style={{
                      background: isActive
                        ? `radial-gradient(circle, ${playerColor} 0%, #042f2c 100%)`
                        : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg relative my-1 text-2xl font-montserrat"
                  >
                    {val}
                  </div>

                  {/* Badges / Labels */}
                  <div className="w-full text-center">
                    {isLocal ? (
                      <span className="text-[9px] font-mono font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                        Te Vagy
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                        {player?.isBot ? 'Bot' : 'Diák'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Floor Position Dot */}
                <div
                  style={{
                    backgroundColor: isActive ? playerColor : 'rgba(255,255,255,0.08)',
                  }}
                  className="w-16 h-1.5 rounded-full mt-2 transition-all opacity-80"
                />
              </div>
            );
          })}
        </div>

        {/* Live Steps & Stats Bar */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 py-2.5 px-4 bg-slate-950/80 border-t border-slate-800/80 rounded-2xl text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-teal-400 font-bold flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5" />
              Lépésszámláló: {stepsCount} lépés
            </span>
          </div>
          <div className="text-slate-400">
            Mód: <strong className="text-white">{room.mode.replace('_', ' ').toUpperCase()}</strong>
          </div>
        </div>
      </div>

      {/* 🧭 AUTOMATIC DIRECTIONAL MOTION VECTOR & POSITION VERIFICATION CARD */}
      {verification && (
        <div className="w-full max-w-2xl bg-gradient-to-b from-teal-950/90 to-slate-900/95 border-2 border-teal-400 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center relative overflow-hidden animate-fade-in ring-4 ring-teal-500/20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-full text-xs font-black uppercase tracking-wider font-montserrat shadow-md animate-pulse">
            <Compass className="w-4 h-4 text-teal-400" />
            🧭 Automatikus Irány- és Helyzet-Ellenőrzés
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white font-montserrat">
              {isSwappedPlayer
                ? requiredDirection === 'right'
                  ? '➡️ Lépj át JOBBRA az új helyedre!'
                  : '⬅️ Lépj át BALRA az új helyedre!'
                : 'Átsétálás folyamatban...'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              A telefonod érzékeli a mozgásod irányát. Sétálj át a társad helyére és állj meg a
              sorban!
            </p>
          </div>

          {/* REAL-TIME DIRECTIONAL RADAR / PROGRESS GAUGE (For Active Walker) */}
          {isSwappedPlayer && !myVerificationData?.confirmed && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  Elvárt irány:{' '}
                  <strong className="text-teal-300 uppercase">
                    {requiredDirection === 'right' ? 'Jobbra ➡️' : 'Balra ⬅️'}
                  </strong>
                </span>
                <span className="text-teal-400 font-bold">{directionalProgress}% Átérve</span>
              </div>

              {/* Dynamic Vector Directional Indicator Arrow */}
              <div className="py-2 flex items-center justify-center">
                {wrongDirectionWarning ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-black text-xs font-montserrat animate-bounce">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>
                      ⚠️ ROSSZ IRÁNY! {requiredDirection === 'right' ? 'JOBBRA' : 'BALRA'} KELL
                      LÉPNED!
                    </span>
                  </div>
                ) : motionDirection === 'arrived' ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs font-montserrat animate-pulse">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>✅ MEGÁLLÁS ÉSZLELVE AZ ÚJ HELYEN!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-black font-montserrat animate-pulse text-sm">
                    {requiredDirection === 'right' ? (
                      <>
                        <span>SÉTA JOBBRA</span>
                        <ArrowRight className="w-5 h-5 animate-ping text-teal-400" />
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-5 h-5 animate-ping text-teal-400" />
                        <span>SÉTA BALRA</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Directional Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  style={{ width: `${directionalProgress}%` }}
                  className={`h-full rounded-full transition-all duration-200 ${
                    wrongDirectionWarning
                      ? 'bg-rose-500'
                      : directionalProgress >= 100
                        ? 'bg-emerald-400 shadow-md shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Dual Student Verification Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            {/* Player A Status */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-between ${
                verification.swappedPair.playerA.confirmed
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 animate-pulse'
              }`}
            >
              <div className="text-xs font-mono font-bold text-slate-400">
                {verification.swappedPair.playerA.name} új helye:
              </div>
              <div className="text-2xl font-black font-montserrat text-white my-1">
                {verification.swappedPair.playerA.targetSlot + 1}. HELY
              </div>
              <div className="text-[11px] font-mono mt-1">
                {verification.swappedPair.playerA.confirmed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Helyére állt
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    ⏳ Sétál a helyére...
                  </span>
                )}
              </div>
            </div>

            {/* Player B Status */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-between ${
                verification.swappedPair.playerB.confirmed
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 animate-pulse'
              }`}
            >
              <div className="text-xs font-mono font-bold text-slate-400">
                {verification.swappedPair.playerB.name} új helye:
              </div>
              <div className="text-2xl font-black font-montserrat text-white my-1">
                {verification.swappedPair.playerB.targetSlot + 1}. HELY
              </div>
              <div className="text-[11px] font-mono mt-1">
                {verification.swappedPair.playerB.confirmed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Helyére állt
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    ⏳ Sétál a helyére...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Manual Override Button */}
          {isSwappedPlayer ? (
            myVerificationData?.confirmed ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 font-montserrat flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Helyzeted igazolva! Várakozás a társad beállására a sorban...</span>
              </div>
            ) : (
              <button
                onClick={handleConfirmPositionClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-teal-500/30 ring-4 ring-teal-400/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-montserrat"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  📍 Megérkeztem, beálltam a(z) {(myVerificationData?.targetSlot ?? 0) + 1}. helyre!
                </span>
              </button>
            )
          ) : (
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono">
              👀 Figyeljétek a sorban a két társatok helycseréjét!
            </div>
          )}
        </div>
      )}

      {/* MAIN PHYSICAL ACTION & BUMP INTERACTIVE ARENA (When not in verification) */}
      {!verification && playerA && playerB && (
        <div
          className={`w-full max-w-2xl bg-slate-900/95 border-2 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl text-center relative overflow-hidden transition-all ${
            bumpDetected
              ? 'border-emerald-400 ring-8 ring-emerald-400/30 scale-102 bg-emerald-950/30'
              : isLocalInvolved
                ? 'border-amber-500/80 ring-4 ring-amber-500/20'
                : 'border-slate-800'
          }`}
        >
          {/* Action Header Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider font-montserrat shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Jelenlegi Tantermi Feladat
          </div>

          {/* Dual Player Face-off Display */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 my-2">
            {/* Player A */}
            <div className="text-center flex flex-col items-center">
              <div
                style={{ backgroundColor: playerA.color }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-slate-950 text-3xl font-black shadow-xl mb-2 font-montserrat"
              >
                {valA}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {playerA.name}
                {playerA.id === localPlayerId && (
                  <span className="text-[10px] text-teal-400">(Te)</span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ({activeIdxA + 1}. hely a teremben)
              </div>
            </div>

            {/* Middle Comparator Arc */}
            <div className="flex flex-col items-center">
              <ArrowLeftRight className="w-8 h-8 text-amber-400 animate-pulse my-1" />
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border shadow-md ${
                  isSwapNeeded
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isSwapNeeded
                  ? `${valA} > ${valB} (Csere kell!)`
                  : `${valA} ≤ ${valB} (Sorrend OK)`}
              </span>
            </div>

            {/* Player B */}
            <div className="text-center flex flex-col items-center">
              <div
                style={{ backgroundColor: playerB.color }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-slate-950 text-3xl font-black shadow-xl mb-2 font-montserrat"
              >
                {valB}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {playerB.name}
                {playerB.id === localPlayerId && (
                  <span className="text-[10px] text-teal-400">(Te)</span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ({activeIdxB + 1}. hely a teremben)
              </div>
            </div>
          </div>

          {/* Action Instruction text */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-inner">
            {isSwapNeeded ? (
              <p>
                👉 <strong className="text-amber-300">{playerA.name}</strong> és{' '}
                <strong className="text-amber-300">{playerB.name}</strong>: Sétáljatok át egymás
                mellett a teremben, és <strong>koccintsátok össze a telefonjaitokat</strong> (vagy
                nyomjátok meg a lenti gombot)!
              </p>
            ) : (
              <p>
                ✅ <strong className="text-emerald-300">{playerA.name}</strong> és{' '}
                <strong className="text-emerald-300">{playerB.name}</strong> már jó sorrendben áll a
                teremben! Nyomjátok meg a <strong>Megkérdeztük Egymást (OK)</strong> gombot a
                továbblépéshez.
              </p>
            )}
          </div>

          {/* Dual-Handshake Pending Status Banner */}
          {room.pendingHandshake && (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold text-amber-300 font-montserrat animate-pulse shadow-md">
              <Handshake className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                {room.pendingHandshake.readyPlayerIds.includes(localPlayerId)
                  ? '⏳ Te már megerősítetted! Várakozás a párodra a sorban...'
                  : '🤝 A párod már megnyomta / koccintott! Most te következel a megerősítéshez!'}
              </span>
            </div>
          )}

          {/* TOUCH & BUMP ACTION BUTTONS */}
          <div className="w-full pt-1">
            {isLocalInvolved ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* 1. OK Button */}
                <button
                  onClick={handleCompareClick}
                  className="py-4 px-6 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-200 rounded-2xl font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg font-montserrat cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>1. Megkérdeztük Egymást (Enter)</span>
                </button>

                {/* 2. Swap / Bump Button */}
                <button
                  onClick={handleSwapClick}
                  className={`py-4 px-6 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 font-montserrat shadow-xl cursor-pointer ${
                    isSwapNeeded
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/40 ring-4 ring-teal-500/30 animate-pulse'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Footprints className="w-5 h-5" />
                  <span>2. 📱 Koccintottunk / Helycsere (Space)</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-center space-y-1 animate-pulse">
                <div className="text-xs font-bold text-teal-300 font-montserrat flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    Most {playerA.name} és {playerB.name} lépése következik a teremben!
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tartsd a helyed a sorban! Amikor te kerülsz sorra az algoritmusban, a te képernyőd
                  fog aktiválódni.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Status Footer */}
      <div className="w-full bg-slate-900/90 border border-teal-500/20 rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-teal-300 font-bold">{room.currentCodeLine || 'Várakozás...'}</span>
        </div>
        <div className="text-amber-400 hidden sm:block truncate ml-4 font-sans font-medium text-[11px]">
          {room.lastActionMessage}
        </div>
      </div>
    </div>
  );
}
