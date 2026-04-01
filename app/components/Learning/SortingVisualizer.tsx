'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SortStep } from '../../../lib/algorithms/bubbleSortSteps';

interface SortingVisualizerProps {
  steps: SortStep[];
  currentStep: number;
  speed: number;
  /** Optional: allow clicking bars (used in Control mode) */
  onBarClick?: (index: number) => void;
  /** Indices the user has selected (Control mode) */
  selectedIndices?: number[];
  /** Extra classes for the container */
  className?: string;
}

/**
 * Generic bar-chart visualizer for any sorting algorithm.
 * Renders the current step's array as animated bars with color coding.
 */
export default function SortingVisualizer({
  steps,
  currentStep,
  speed,
  onBarClick,
  selectedIndices = [],
  className = '',
}: SortingVisualizerProps) {
  const visualState = steps[currentStep];
  if (!visualState) return null;

  const maxVal = Math.max(...visualState.array.map((item) => item.val));

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Bar Chart */}
      <div className="w-full h-72 sm:h-80 flex items-end justify-center gap-1.5 sm:gap-3 p-6 sm:p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner relative">
        {/* Arrow indicators above active pair */}
        {visualState.activeIndices.length === 2 && (
          <div className="absolute top-3 left-0 right-0 flex items-end justify-center gap-1.5 sm:gap-3 px-6 sm:px-8 pointer-events-none">
            {visualState.array.map((_, idx) => (
              <div
                key={idx}
                className="w-8 sm:w-14 flex items-center justify-center"
              >
                {visualState.activeIndices.includes(idx) && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#269984] text-lg font-bold"
                  >
                    ▼
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {visualState.array.map((item, idx) => {
            const isActive = visualState.activeIndices.includes(idx);
            const isSorted = visualState.sortedIndices.includes(idx);
            const isSwapping = isActive && visualState.swapping;
            const isSelected = selectedIndices.includes(idx);

            let bgColor = '#e5e7eb';
            if (isSwapping) bgColor = '#f97316';
            else if (isSelected) bgColor = '#8b5cf6';
            else if (isActive) bgColor = '#269984';
            else if (isSorted) bgColor = '#4ade80';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor: bgColor,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 25,
                  layout: { duration: 0.5 / speed },
                }}
                onClick={onBarClick ? () => onBarClick(idx) : undefined}
                className={`w-8 sm:w-14 min-h-[20px] rounded-t-xl relative group shadow-sm ${
                  onBarClick ? 'cursor-pointer hover:brightness-110' : ''
                } ${!isActive && !isSorted && !isSelected ? 'dark:bg-white/10' : ''}`}
                style={{ height: `${(item.val / maxVal) * 100}%` }}
              >
                {/* Value Badge */}
                <motion.span
                  layout
                  className={`absolute -top-7 left-1/2 -translate-x-1/2 font-montserrat font-bold text-xs sm:text-sm transition-colors ${
                    isSelected
                      ? 'text-purple-500'
                      : isActive
                        ? 'text-[#269984]'
                        : isSorted
                          ? 'text-green-500'
                          : 'text-gray-400'
                  }`}
                >
                  {item.val}
                </motion.span>

                {/* Hover glow */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Step Description */}
      {visualState.description && (
        <motion.div
          key={`desc-${currentStep}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <p className="font-montserrat font-bold text-sm sm:text-base text-[#269984] dark:text-[#3dd9b8]">
            {visualState.description}
          </p>
        </motion.div>
      )}

      {/* Statistics + Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {/* Stats */}
        {visualState.comparisons !== undefined && (
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="text-center">
              <div className="font-montserrat font-bold text-lg text-black dark:text-white">
                {visualState.comparisons}
              </div>
              <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
                Comparisons
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
            <div className="text-center">
              <div className="font-montserrat font-bold text-lg text-black dark:text-white">
                {visualState.swapCount}
              </div>
              <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
                Swaps
              </div>
            </div>
            {visualState.pass !== undefined && (
              <>
                <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                  <div className="font-montserrat font-bold text-lg text-black dark:text-white">
                    {visualState.pass + 1}
                  </div>
                  <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
                    Pass
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#269984]" />
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
              Compare
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
              Swap
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
              Sorted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
