'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

interface Item {
  val: number;
  id: number;
}

interface Step {
  array: Item[];
  activeIndices: number[];
  swapping: boolean;
  sortedIndices: number[];
}

export default function BubbleSortVisualizer({ id = 'bubble-sort' }: { id?: string }) {
  const { visualizerProgress, updateVisualizerProgress } = useAlgorithmStore();

  // Initial values from store or defaults
  const initialProgress = visualizerProgress[id] || { step: 0, speed: 1 };

  const initialValues = useMemo(() => [45, 12, 89, 34, 67, 23, 56, 10, 78], []);
  const [currentStep, setCurrentStep] = useState(initialProgress.step);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialProgress.speed);

  // Sync state back to store whenever it changes
  useEffect(() => {
    updateVisualizerProgress(id, currentStep, speed);
  }, [id, currentStep, speed, updateVisualizerProgress]);

  // Pre-calculate all steps of Bubble Sort
  const steps = useMemo(() => {
    const arr = initialValues.map((v, i) => ({ val: v, id: i }));
    const result: Step[] = [
      { array: [...arr], activeIndices: [], swapping: false, sortedIndices: [] },
    ];
    const sorted: number[] = [];

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        // Step 1: Compare
        result.push({
          array: [...arr],
          activeIndices: [j, j + 1],
          swapping: false,
          sortedIndices: [...sorted],
        });

        if (arr[j].val > arr[j + 1].val) {
          // Step 2: Swap (visual highlight)
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          result.push({
            array: [...arr],
            activeIndices: [j, j + 1],
            swapping: true,
            sortedIndices: [...sorted],
          });
        }
      }
      // Step 3: Mark largest as sorted
      sorted.push(arr.length - i - 1);
      result.push({
        array: [...arr],
        activeIndices: [],
        swapping: false,
        sortedIndices: [...sorted],
      });
    }
    return result;
  }, [initialValues]);

  // Current visual state
  const visualState = steps[currentStep];
  const maxVal = Math.max(...initialValues);

  // Controls logic
  const stepForward = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, steps.length]);

  const stepBackward = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setIsPlaying(false);
    }
  }, [currentStep]);

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Autoplay effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStep < steps.length - 1) {
      timer = setTimeout(stepForward, 800 / speed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, stepForward, speed, steps.length]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-80 flex items-end justify-center gap-2 sm:gap-4 p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner">
        <AnimatePresence mode="popLayout">
          {visualState.array.map((item, idx) => {
            const isActive = visualState.activeIndices.includes(idx);
            const isSorted = visualState.sortedIndices.includes(idx);
            const isSwapping = isActive && visualState.swapping;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor: isSwapping
                    ? '#f97316' // Orange for swap
                    : isActive
                      ? '#269984' // Teal for active
                      : isSorted
                        ? '#4ade80' // Green for sorted
                        : '#e5e7eb', // Gray for neutral (dark mode handles below)
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  layout: { duration: 0.5 / speed },
                }}
                className={`w-10 sm:w-14 min-h-[20px] rounded-t-xl relative group shadow-sm ${
                  !isActive && !isSorted ? 'dark:bg-white/10' : ''
                }`}
                style={{
                  height: `${(item.val / maxVal) * 100}%`,
                }}
              >
                {/* Value Badge */}
                <motion.span
                  layout
                  className={`absolute -top-8 left-1/2 -translate-x-1/2 font-montserrat font-bold text-xs sm:text-sm transition-colors ${
                    isActive ? 'text-[#269984]' : isSorted ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  {item.val}
                </motion.span>

                {/* Hover Indicator */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Logic Feedback / Status */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#269984]" />
          <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
            Compare
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
            Swap
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-montserrat font-bold text-gray-500 uppercase tracking-widest">
            Sorted
          </span>
        </div>
      </div>

      {/* Reusable Controls */}
      <VisualizerControls
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onReset={reset}
        isPlaying={isPlaying}
        isFinished={currentStep === steps.length - 1}
        speed={speed}
        setSpeed={setSpeed}
        progress={(currentStep / (steps.length - 1)) * 100}
      />
    </div>
  );
}
