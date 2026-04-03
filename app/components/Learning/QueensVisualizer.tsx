'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { SortStep } from '../../../lib/algorithms/bubbleSortSteps';

interface QueensVisualizerProps {
  steps: SortStep[];
  currentStep: number;
  /** Optional: handle cell click */
  onCellClick?: (row: number, col: number) => void;
  /** Whether interaction is disabled */
  disabled?: boolean;
}

export default function QueensVisualizer({
  steps,
  currentStep,
  onCellClick,
  disabled = false,
}: QueensVisualizerProps) {
  const visualState = steps[currentStep];
  if (!visualState) return null;

  const n = visualState.target || 8;
  const board = visualState.array; // array[row].val is col

  // Create N x N grid
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      cells.push({ row: r, col: c });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* The Board */}
      <div
        className="grid gap-1 p-2 bg-gray-200 dark:bg-white/10 rounded-xl shadow-inner overflow-hidden w-full max-w-[400px] mx-auto"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
          aspectRatio: '1 / 1',
        }}
      >
        {cells.map(({ row, col }) => {
          const isDark = (row + col) % 2 === 1;
          const queenAtCol = board[row]?.val;
          const hasQueen = queenAtCol === col;

          // Current cell being tested in the algorithm
          const isActiveRow = visualState.activeIndices.includes(row);
          const isTestingCell = isActiveRow && visualState.swapCount === col;

          // Is it safe? (based on swapping/sorted logic of our generator)
          const isSorted = visualState.sortedIndices.includes(row) && hasQueen;
          const isConflict = isActiveRow && visualState.swapping && isTestingCell;

          return (
            <motion.div
              key={`${row}-${col}`}
              onClick={onCellClick && !disabled ? () => onCellClick(row, col) : undefined}
              className={`
                relative flex items-center justify-center rounded-sm transition-colors duration-200
                ${isDark ? 'bg-gray-400 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-600'}
                ${onCellClick && !disabled ? 'cursor-pointer hover:ring-2 hover:ring-purple-400' : ''}
              `}
              animate={{
                backgroundColor: isTestingCell ? (isConflict ? '#ef4444' : '#269984') : undefined,
              }}
            >
              {/* Queen Icon */}
              <AnimatePresence>
                {hasQueen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Crown
                      className={`w-4/5 h-4/5 ${isSorted ? 'text-green-500' : isConflict ? 'text-white' : 'text-amber-500'}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cell coordinates (subtle) */}
              {n <= 4 && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px] opacity-20 pointer-events-none">
                  {row},{col}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Status Description */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center italic text-gray-500 dark:text-gray-400 font-montserrat text-sm h-10"
      >
        {visualState.description}
      </motion.div>
    </div>
  );
}
