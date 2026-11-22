'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Use a module-level variable to keep track of the global mute state across instances
let globalMuted = false;

const MUTE_EVENT = 'algorythmics-mute-change';

// Harmonious C Major Pentatonic Scale to keep all beeps perfectly in tune
const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
];

const getPentatonicFreq = (val: number, maxVal: number) => {
  if (maxVal <= 0) return PENTATONIC_SCALE[4];
  const ratio = Math.min(Math.max(val / maxVal, 0), 1);
  const index = Math.round(ratio * (PENTATONIC_SCALE.length - 1));
  return PENTATONIC_SCALE[index];
};

export function useAudioSynthesizer() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const clearAudioTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  // Sync mute state after mount (avoids SSR hydration mismatch) and clean up AudioContext/timers
  useEffect(() => {
    try {
      const saved = localStorage.getItem('algorythmics-muted') === 'true';
      globalMuted = saved;
      setIsMuted(saved);
    } catch {}

    const handleMuteChange = () => {
      setIsMuted(globalMuted);
      if (globalMuted) clearAudioTimers();
    };

    window.addEventListener(MUTE_EVENT, handleMuteChange);
    return () => {
      window.removeEventListener(MUTE_EVENT, handleMuteChange);
      clearAudioTimers();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [clearAudioTimers]);

  // Initialize AudioContext lazily on user interaction (to bypass browser autoplay restrictions)
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    if (typeof window === 'undefined') return null;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: new () => AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;
      return ctx;
    } catch (e) {
      console.error('Web Audio API not supported in this browser:', e);
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !globalMuted;
    globalMuted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) clearAudioTimers();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('algorythmics-muted', String(nextMuted));
      } catch {}
      window.dispatchEvent(new Event(MUTE_EVENT));
    }
  }, [clearAudioTimers]);

  // Helper to play a warm acoustic chime
  const playChime = useCallback(
    (frequency: number, durationMs: number, volume = 0.08, isWarm = true) => {
      if (isMuted || globalMuted) return;
      const ctx = initAudio();
      if (!ctx) return;

      // Resume context if suspended (browser security rules)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const overtoneGain = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();

        const durationSec = durationMs / 1000;

        // Base frequency oscillator (warm fundamental sine wave)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Secondary detuned octave oscillator (bell/chorus effect)
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2.004, ctx.currentTime);

        // Volume envelopes (quick fade-in, exponential decay)
        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

        // Subtly mix down the overtone octave to prevent sharpness
        overtoneGain.gain.setValueAtTime(0.35, ctx.currentTime);

        // Warm Low-pass filter node that sweep decays for acoustic feel
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(
          isWarm ? frequency * 2.8 : frequency * 4.5,
          ctx.currentTime,
        );
        filterNode.frequency.exponentialRampToValueAtTime(
          frequency * 1.2,
          ctx.currentTime + durationSec,
        );
        filterNode.Q.setValueAtTime(1, ctx.currentTime);

        // Connections
        osc1.connect(gainNode);
        osc2.connect(overtoneGain);
        overtoneGain.connect(gainNode);

        gainNode.connect(filterNode);
        filterNode.connect(ctx.destination);

        // Play
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + durationSec);
        osc2.stop(ctx.currentTime + durationSec);
      } catch (e) {
        console.error('Audio playChime error:', e);
      }
    },
    [isMuted, initAudio],
  );

  const scheduleChime = useCallback(
    (delayMs: number, frequency: number, durationMs: number, volume = 0.08, isWarm = true) => {
      const timerId = setTimeout(() => {
        timersRef.current.delete(timerId);
        playChime(frequency, durationMs, volume, isWarm);
      }, delayMs);
      timersRef.current.add(timerId);
    },
    [playChime],
  );

  // Comparison sound: plays a short synthetic pluck/beep
  // Pitch is mapped based on the bar value compared to the max value
  const playCompare = useCallback(
    (val1: number, val2: number, maxVal: number) => {
      const freq1 = getPentatonicFreq(val1, maxVal);
      const freq2 = getPentatonicFreq(val2, maxVal);

      // Play a dual warm pentatonic chime sequence
      playChime(freq1, 150, 0.08, true);
      scheduleChime(55, freq2, 150, 0.08, true);
    },
    [playChime, scheduleChime],
  );

  // Swap sound: slightly brighter double chime sequence
  const playSwap = useCallback(
    (val1: number, val2: number, maxVal: number) => {
      const freq1 = getPentatonicFreq(val1, maxVal);
      const freq2 = getPentatonicFreq(val2, maxVal);

      playChime(freq1, 200, 0.09, false);
      scheduleChime(40, freq2, 200, 0.09, false);
    },
    [playChime, scheduleChime],
  );

  // Sorted tone: pleasant rising chime
  const playSorted = useCallback(() => {
    // Beautiful rising chord sequence in pentatonic
    playChime(523.25, 250, 0.08, true); // C5
    scheduleChime(50, 659.25, 250, 0.08, true); // E5
    scheduleChime(100, 783.99, 250, 0.08, true); // G5
    scheduleChime(150, 1046.5, 350, 0.08, true); // C6
  }, [playChime, scheduleChime]);

  // Complete song: mini celebratory melody
  const playComplete = useCallback(() => {
    const notes = [
      { freq: 261.63, delay: 0 }, // C4
      { freq: 329.63, delay: 60 }, // E4
      { freq: 392.0, delay: 120 }, // G4
      { freq: 523.25, delay: 180 }, // C5
      { freq: 659.25, delay: 240 }, // E5
      { freq: 783.99, delay: 300 }, // G5
      { freq: 1046.5, delay: 360 }, // C6
    ];

    notes.forEach((note) => {
      scheduleChime(note.delay, note.freq, 500, 0.07, true);
    });
  }, [scheduleChime]);

  return {
    isMuted,
    toggleMute,
    playCompare,
    playSwap,
    playSorted,
    playComplete,
  };
}
