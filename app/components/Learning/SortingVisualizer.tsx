'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SortStep } from '../../../lib/algorithms/bubbleSortSteps';
import { useLocale } from '../../i18n/LocaleProvider';

interface SortingVisualizerProps {
  steps: SortStep[];
  currentStep: number;
  speed: number;
  /** Optional: allow clicking bars (used in Control mode) */
  onBarClick?: (index: number) => void;
  /** Indices the user has selected (Control mode) */
  selectedIndices?: number[];
  /** Whether interaction is disabled (e.g. frozen for decision) */
  disabled?: boolean;
  /** Extra classes for the container */
  className?: string;
  /** Custom legend items */
  legend?: { color: string; labelKey: string }[];
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
  disabled = false,
  className = '',
  legend,
}: SortingVisualizerProps) {
  const { t } = useLocale();
  const visualState = steps[currentStep];
  if (!visualState) return null;

  const maxVal = Math.max(...visualState.array.map((item) => item.val));

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Target Badge for Search */}
      {visualState.target !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 shadow-sm"
        >
          <span className="font-montserrat text-xs font-bold text-amber-600 uppercase tracking-wider">
            {t('visualizer.searching_for') || 'Searching for'}:
          </span>
          <span className="font-montserrat font-bold text-lg text-amber-700 dark:text-amber-400">
            {visualState.target}
          </span>
        </motion.div>
      )}

      {/* Bar Chart */}
      <div className="w-full h-72 sm:h-80 flex items-end justify-center gap-1.5 sm:gap-3 p-6 sm:p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner relative">
        {/* Arrow indicators above active pair */}
        {visualState.activeIndices.length === 2 && (
          <div className="absolute top-3 left-0 right-0 flex items-end justify-center gap-1.5 sm:gap-3 px-6 sm:px-8 pointer-events-none">
            {visualState.array.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-[12px] sm:min-w-[20px] max-w-[60px] flex items-center justify-center"
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
            const isDiscarded = visualState.discardedIndices?.includes(idx);
            const isPivot = visualState.pivotIndex === idx;
            const isSwapping = isActive && visualState.swapping;
            const isSelected = selectedIndices.includes(idx);

            let bgColor = '#e5e7eb';
            if (isSwapping) bgColor = '#f97316';
            else if (isPivot)
              bgColor = '#a855f7'; // Purple for pivot
            else if (isSelected) bgColor = '#8b5cf6';
            else if (isActive) bgColor = '#269984';
            else if (isSorted) bgColor = '#4ade80';
            else if (isDiscarded) bgColor = '#d1d5db';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isDiscarded ? 0.3 : 1, // Dimmed if discarded
                  scale: 1,
                  backgroundColor: bgColor,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  layout: { duration: 0.3 / speed },
                }}
                onClick={onBarClick && !disabled ? () => onBarClick(idx) : undefined}
                className={`flex-1 min-w-[12px] sm:min-w-[20px] max-w-[60px] min-h-[20px] rounded-t-xl relative group shadow-sm ${
                  onBarClick && !disabled ? 'cursor-pointer hover:brightness-110' : ''
                } ${!isActive && !isSorted && !isSelected && !isDiscarded ? 'dark:bg-white/10' : ''}`}
                style={{ height: `${(item.val / maxVal) * 80}%` }}
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
                {!disabled && (
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl pointer-events-none" />
                )}
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
            {visualState.descriptionKey
              ? t(
                  visualState.descriptionKey,
                  visualState.descriptionParams as Record<string, string | number>,
                )
              : visualState.description}
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
                {t('visualizer.comparisons')}
              </div>
            </div>
            {visualState.swapCount !== undefined && (
              <>
                <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                  <div className="font-montserrat font-bold text-lg text-black dark:text-white">
                    {visualState.swapCount}
                  </div>
                  <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
                    {t('visualizer.swaps')}
                  </div>
                </div>
              </>
            )}
            {visualState.pass !== undefined && (
              <>
                <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                  <div className="font-montserrat font-bold text-lg text-black dark:text-white">
                    {visualState.pass + 1}
                  </div>
                  <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
                    {t('visualizer.pass')}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4">
          {legend ? (
            legend.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
                  {t(item.labelKey)}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#269984]" />
                <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
                  {t('visualizer.legend_compare')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
                  {t('visualizer.legend_swap')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
                  {t('visualizer.legend_sorted')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
