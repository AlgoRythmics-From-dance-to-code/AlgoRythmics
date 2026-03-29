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
}: VisualizerControlsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Playback Progress (Minimalist) */}
        <div className="w-full sm:flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#269984] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-all active:scale-90"
            title="Reset"
            aria-label="Reset visualizer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onStepBackward}
            className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 transition-all active:scale-90"
            title="Step Backward"
            aria-label="Step backward"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={isFinished ? onReset : onPlayPause}
            className={`p-4 rounded-2xl transition-all active:scale-95 shadow-lg ${
              isFinished
                ? 'bg-[#269984] text-white shadow-[#269984]/20'
                : isPlaying
                  ? 'bg-orange-500 text-white shadow-orange-500/20'
                  : 'bg-[#269984] text-white shadow-[#269984]/20'
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
            className={`p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all active:scale-90 ${
              isFinished ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            title="Step Forward"
            aria-label="Step forward"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-xl">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded-lg font-montserrat font-bold text-xs transition-all ${
                speed === s
                  ? 'bg-white dark:bg-white/10 text-[#269984] shadow-sm'
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
  );
}
