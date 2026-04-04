'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface VisualizerControlsProps {
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isFinished: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  progress: number;
  speedOptions?: number[];
}

export default function VisualizerControls({
  onPlayPause,
  onStepForward,
  onStepBackward,
  onReset,
  isPlaying,
  isFinished,
  speed,
  setSpeed,
  progress,
  speedOptions,
}: VisualizerControlsProps) {
  const speeds = speedOptions ?? [0.5, 1, 2];
  return (
    <div className="w-full max-w-3xl mx-auto mt-6 md:mt-10 p-4 sm:p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex flex-col gap-6 sm:gap-4">
        {/* Playback Progress (Minimalist) */}
        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-[#269984] transition-all duration-300 shadow-[0_0_8px_rgba(38,153,132,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Controls */}
          <div className="flex items-center gap-2 sm:gap-4 order-2 sm:order-1">
            <button
              type="button"
              onClick={onReset}
              className="p-3 sm:p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-all active:scale-90"
              title="Reset"
              aria-label="Reset visualizer"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={onStepBackward}
              className="p-3 sm:p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-all active:scale-90"
              title="Step Backward"
              aria-label="Step backward"
            >
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={isFinished ? onReset : onPlayPause}
              className={`p-4 sm:p-5 rounded-2xl transition-all active:scale-95 shadow-xl ${
                isFinished
                  ? 'bg-[#269984] text-white shadow-[#269984]/30'
                  : isPlaying
                    ? 'bg-orange-500 text-white shadow-orange-500/30'
                    : 'bg-[#269984] text-white shadow-[#269984]/30'
              }`}
              title={isFinished ? 'Restart' : isPlaying ? 'Pause' : 'Play'}
              aria-label={isFinished ? 'Restart' : isPlaying ? 'Pause' : 'Play'}
            >
              {isFinished ? (
                <RotateCcw className="w-6 h-6" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onStepForward}
              disabled={isFinished}
              className={`p-3 sm:p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all active:scale-90 ${
                isFinished ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title="Step Forward"
              aria-label="Step forward"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-white/5 rounded-2xl order-1 sm:order-2">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`min-w-[40px] px-3 py-2 rounded-xl font-montserrat font-black text-[10px] sm:text-xs transition-all ${
                  speed === s
                    ? 'bg-white dark:bg-white/10 text-[#269984] shadow-md scale-105'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                aria-label={`Playback speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
