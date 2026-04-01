'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import SortingVisualizer from './SortingVisualizer';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useLocale } from '../../i18n/LocaleProvider';
import { getAlgorithm } from '../../../lib/algorithms/registry';

interface ControlVisualizerProps {
  algorithmId: string;
}

export default function ControlVisualizer({ algorithmId }: ControlVisualizerProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'control');

  const algo = getAlgorithm(algorithmId);
  const steps = useMemo(
    () => (algo ? algo.generateSteps(algo.defaultArray) : []),
    [algo],
  );

  // We track which "expected step" the user is on
  // The expected step alternates between: compare (pick two adjacent), then swap-or-skip
  const [expectedStepIndex, setExpectedStepIndex] = useState(1); // Start at step 1 (first compare)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [isHinting, setIsHinting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [attemptedWrong, setAttemptedWrong] = useState(false);
  const startTime = useMemo(() => Date.now(), []);

  const currentExpected = steps[expectedStepIndex];
  const isFinished = expectedStepIndex >= steps.length - 1;

  // Handle bar click — select elements
  const handleBarClick = useCallback(
    (index: number) => {
      if (isComplete || isFinished) return;

      trackEvent('control_select', { index });

      setSelectedIndices((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        if (prev.length >= 2) {
          return [index];
        }
        return [...prev, index].sort((a, b) => a - b);
      });
      setFeedback(null);
    },
    [isComplete, isFinished, trackEvent],
  );

  // Check the user's selection against the expected step
  const handleCompare = useCallback(() => {
    if (selectedIndices.length !== 2 || !currentExpected) return;

    const expectedActive = currentExpected.activeIndices;
    const isCorrect =
      selectedIndices.length === expectedActive.length &&
      selectedIndices[0] === expectedActive[0] &&
      selectedIndices[1] === expectedActive[1];

    if (isCorrect) {
      setFeedback('correct');
      if (!attemptedWrong) setCorrectFirstTry((c) => c + 1);
      setTotalCorrect((c) => c + 1);
      trackEvent('control_compare', {
        pair: selectedIndices,
        isCorrect: true,
        step: expectedStepIndex,
      });

      // Advance: if next step is a swap at same indices, auto-advance through it
      setTimeout(() => {
        let nextIdx = expectedStepIndex + 1;
        // If this compare leads to a swap, skip through the swap step too
        if (nextIdx < steps.length && steps[nextIdx].swapping) {
          nextIdx++;
        }
        // If next step has no active indices (sorted marker), skip too
        while (
          nextIdx < steps.length &&
          steps[nextIdx].activeIndices.length === 0
        ) {
          nextIdx++;
        }

        if (nextIdx >= steps.length) {
          setIsComplete(true);
          const elapsed = Date.now() - startTime;
          trackEvent('control_complete', {
            score: Math.round((correctFirstTry / totalCorrect) * 100) || 100,
            mistakes,
            timeMs: elapsed,
          });
          updateProgress({
            controlCompleted: true,
            controlBestScore: Math.round(
              ((correctFirstTry + 1) / (totalCorrect + 1)) * 100,
            ),
            controlMistakes: mistakes,
            controlCompletedAt: new Date().toISOString(),
          });
        } else {
          setExpectedStepIndex(nextIdx);
        }
        setSelectedIndices([]);
        setFeedback(null);
        setAttemptedWrong(false);
      }, 600);
    } else {
      setFeedback('incorrect');
      setMistakes((m) => m + 1);
      setAttemptedWrong(true);
      trackEvent('control_mistake', {
        expected: expectedActive,
        actual: selectedIndices,
        step: expectedStepIndex,
      });

      setTimeout(() => {
        setFeedback(null);
      }, 1200);
    }
  }, [
    selectedIndices,
    currentExpected,
    expectedStepIndex,
    steps,
    mistakes,
    correctFirstTry,
    totalCorrect,
    attemptedWrong,
    startTime,
    trackEvent,
    updateProgress,
  ]);

  // Show hint
  const handleHint = useCallback(() => {
    if (!currentExpected) return;
    setIsHinting(true);
    trackEvent('control_hint', { step: expectedStepIndex });
    updateProgress({ controlHintsUsed: 1 });
    setTimeout(() => setIsHinting(false), 3000);
  }, [currentExpected, expectedStepIndex, trackEvent, updateProgress]);

  // Reset
  const handleReset = useCallback(() => {
    setExpectedStepIndex(1);
    setSelectedIndices([]);
    setFeedback(null);
    setMistakes(0);
    setCorrectFirstTry(0);
    setTotalCorrect(0);
    setIsComplete(false);
    setAttemptedWrong(false);
    trackEvent('control_reset');
  }, [trackEvent]);

  // Build the visual state to show — show the array at the current expected step
  // but without the active highlighting (user needs to figure that out)
  const displaySteps = useMemo(() => {
    if (!steps.length) return [];
    const step = steps[expectedStepIndex] || steps[steps.length - 1];
    return [
      {
        ...step,
        activeIndices: [], // Hide the expected active indices
        swapping: false,
        description: undefined,
      },
    ];
  }, [steps, expectedStepIndex]);

  if (!algo || steps.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        {t('algorithms.detail.coming_soon')}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
      {/* Instruction */}
      <div className="w-full text-center">
        <p className="font-montserrat font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {isComplete
            ? t('control.well_done')
            : t('control.select_pair')}
        </p>
      </div>

      {/* Visualizer with clickable bars */}
      {displaySteps.length > 0 && (
        <SortingVisualizer
          steps={displaySteps}
          currentStep={0}
          speed={1}
          onBarClick={handleBarClick}
          selectedIndices={selectedIndices}
        />
      )}

      {/* Hint highlight overlay */}
      {isHinting && currentExpected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <p className="font-montserrat text-sm text-[#269984] animate-pulse">
            💡 {t('control.hint')}: {t('control.select_pair')} —{' '}
            {currentExpected.activeIndices.map((i) => steps[expectedStepIndex].array[i]?.val).join(' & ')}
          </p>
        </motion.div>
      )}

      {/* Feedback Animation */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-montserrat font-bold text-sm shadow-lg ${
              feedback === 'correct'
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-red-500 text-white shadow-red-500/20 animate-[shake_0.5s_ease-in-out]'
            }`}
          >
            {feedback === 'correct' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                {t('control.correct')}
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                {t('control.incorrect')}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCompare}
          disabled={selectedIndices.length !== 2 || isComplete}
          className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-[#269984] text-white shadow-lg shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Compare
        </button>
        <button
          onClick={handleHint}
          disabled={isComplete}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-amber-500 transition-all active:scale-90"
          title={t('control.hint')}
        >
          <Lightbulb className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-all active:scale-90"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="text-center">
          <div className="font-montserrat font-bold text-lg text-green-500">{totalCorrect}</div>
          <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
            {t('control.correct')}
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
        <div className="text-center">
          <div className="font-montserrat font-bold text-lg text-red-500">{mistakes}</div>
          <div className="font-montserrat text-[10px] uppercase tracking-widest text-gray-400">
            {t('control.mistakes')}
          </div>
        </div>
      </div>

      {/* Completion Summary */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-[#269984] to-[#1f7a6a] text-white text-center shadow-2xl shadow-[#269984]/20"
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-montserrat font-bold text-xl mb-2">
            {t('control.well_done')}
          </h3>
          <p className="font-montserrat text-sm opacity-80">
            {t('control.summary')
              .replace('{correct}', String(correctFirstTry))
              .replace('{total}', String(totalCorrect))}
          </p>
        </motion.div>
      )}
    </div>
  );
}
