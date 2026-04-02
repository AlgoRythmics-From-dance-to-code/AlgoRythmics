'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import SortingVisualizer from './SortingVisualizer';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useLocale } from '../../i18n/LocaleProvider';
import { getAlgorithm } from '../../../lib/algorithms/registry';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

interface ControlVisualizerProps {
  algorithmId: string;
}

export default function ControlVisualizer({ algorithmId }: ControlVisualizerProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'control');

  const algo = getAlgorithm(algorithmId);
  const steps = useMemo(() => (algo ? algo.generateSteps(algo.defaultArray) : []), [algo]);

  // We track which "expected step" the user is on
  // The expected step alternates between: compare (pick two adjacent), then swap-or-skip
  const [expectedStepIndex, setExpectedStepIndex] = useState(1); // Start at step 1 (first compare)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const progress = useAlgorithmStore((state) => state.algorithmProgress[algorithmId]);
  const [isHinting, setIsHinting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [attemptedWrong, setAttemptedWrong] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'select' | 'decide'>('select');
  const { setInteractionLocked } = useAlgorithmStore();

  // Sync lock with interaction mode
  React.useEffect(() => {
    setInteractionLocked(interactionMode === 'decide');
  }, [interactionMode, setInteractionLocked]);

  // Unlock on unmount
  React.useEffect(() => {
    return () => setInteractionLocked(false);
  }, [setInteractionLocked]);

  const startTime = useMemo(() => Date.now(), []);
  const currentExpected = steps[expectedStepIndex];
  const isFinished = expectedStepIndex >= steps.length - 1;

  // Handle bar click — select elements
  const handleBarClick = useCallback(
    (index: number) => {
      if (isComplete || isFinished || interactionMode === 'decide') return;

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
    [isComplete, isFinished, trackEvent, interactionMode],
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
      trackEvent('control_compare', {
        pair: selectedIndices,
        isCorrect: true,
        step: expectedStepIndex,
      });
      setInteractionMode('decide');
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
      }, 600);
    }
  }, [selectedIndices, currentExpected, trackEvent, expectedStepIndex]);

  // Handle the decision (Swap or Stay)
  const handleDecision = useCallback(
    (action: 'swap' | 'stay') => {
      if (!currentExpected) return;

      const nextIdx = expectedStepIndex + 1;
      const stepAfter = steps[nextIdx];
      const shouldSwap = stepAfter && stepAfter.swapping;

      const isCorrectDecision =
        (action === 'swap' && shouldSwap) || (action === 'stay' && !shouldSwap);

      if (isCorrectDecision) {
        setFeedback('correct');
        if (!attemptedWrong) setCorrectFirstTry((c) => c + 1);
        setTotalCorrect((c) => c + 1);
        trackEvent('control_decision', { action, isCorrect: true, step: expectedStepIndex });

        // Advance
        setTimeout(() => {
          let advanceIdx = nextIdx;
          if (shouldSwap) advanceIdx++; // Skip the swap snapshot itself for the next interaction

          // Skip non-interactive steps (like pass completion/sorted markers)
          while (advanceIdx < steps.length && steps[advanceIdx].activeIndices.length === 0) {
            advanceIdx++;
          }

          if (advanceIdx >= steps.length) {
            setIsComplete(true);
            const elapsed = Date.now() - startTime;
            const nextCorrectFirstTry = correctFirstTry + (!attemptedWrong ? 1 : 0);
            const nextTotalCorrect = totalCorrect + 1;
            trackEvent('control_complete', {
              score: Math.round((nextCorrectFirstTry / nextTotalCorrect) * 100) || 100,
              mistakes,
              timeMs: elapsed,
            });
            updateProgress({
              controlCompleted: true,
              controlBestScore: Math.round((nextCorrectFirstTry / nextTotalCorrect) * 100),
              controlMistakes: mistakes,
              controlCompletedAt: new Date().toISOString(),
            });
          } else {
            setExpectedStepIndex(advanceIdx);
          }
          setSelectedIndices([]);
          setFeedback(null);
          setAttemptedWrong(false);
          setInteractionMode('select');
        }, 150);
      } else {
        setFeedback('incorrect');
        setMistakes((m) => m + 1);
        setAttemptedWrong(true);
        trackEvent('control_decision', { action, isCorrect: false, step: expectedStepIndex });
        setTimeout(() => setFeedback(null), 600);
      }
    },
    [
      currentExpected,
      expectedStepIndex,
      steps,
      trackEvent,
      attemptedWrong,
      correctFirstTry,
      totalCorrect,
      startTime,
      mistakes,
      updateProgress,
    ],
  );

  // Show hint
  const handleHint = useCallback(() => {
    if (!currentExpected) return;
    setIsHinting(true);
    trackEvent('control_hint', { step: expectedStepIndex });

    const currentHintCount = progress?.controlHintsUsed || 0;
    updateProgress({ controlHintsUsed: currentHintCount + 1 });

    setTimeout(() => setIsHinting(false), 3000);
  }, [currentExpected, expectedStepIndex, trackEvent, updateProgress, progress]);

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
    setInteractionMode('select');
    trackEvent('control_reset');

    // Reset progress in store
    updateProgress({
      controlCompleted: false,
      controlBestScore: 0,
      controlMistakes: 0,
      controlCompletedAt: null,
    });
  }, [trackEvent, updateProgress]);

  // Build the visual state to show — show the array at the current expected step
  // but without the active highlighting (user needs to figure that out)
  const displaySteps = useMemo(() => {
    if (!steps.length) return [];
    const step = steps[expectedStepIndex] || steps[steps.length - 1];

    // If we are in decide mode, we want to show the HIGHLIGHTED pair
    // because the user already selected it correctly
    return [
      {
        ...step,
        activeIndices: interactionMode === 'decide' ? selectedIndices : [],
        sortedIndices: isComplete ? step.array.map((_, i) => i) : step.sortedIndices,
        swapping: false,
        description: isComplete ? t('visualizer.sorted_complete') : step.description,
      },
    ];
  }, [steps, expectedStepIndex, interactionMode, selectedIndices, isComplete, t]);

  if (!algo || steps.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">{t('algorithms.detail.coming_soon')}</div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
      {/* Instruction */}
      <div className="w-full text-center">
        <p className="font-montserrat font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {isComplete ? t('control.well_done') : t('control.select_pair')}
        </p>
      </div>

      {/* Visualizer with clickable bars */}
      {displaySteps.length > 0 && (
        <SortingVisualizer
          steps={displaySteps}
          currentStep={0}
          speed={2.5}
          onBarClick={handleBarClick}
          selectedIndices={selectedIndices}
          disabled={interactionMode === 'decide'}
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
            {currentExpected.activeIndices
              .map((idx: number) => steps[expectedStepIndex].array[idx]?.val)
              .join(' & ')}
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
        {interactionMode === 'select' ? (
          <button
            onClick={handleCompare}
            disabled={selectedIndices.length !== 2 || isComplete}
            className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-[#269984] text-white shadow-lg shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('control.compare') || 'Compare'}
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => handleDecision('swap')}
              className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95"
            >
              {t('control.swap') || 'Swap'}
            </button>
            <button
              onClick={() => handleDecision('stay')}
              className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
            >
              {t('control.stay') || 'Next'}
            </button>
          </div>
        )}
        <button
          onClick={handleHint}
          disabled={isComplete || interactionMode === 'decide'}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-amber-500 transition-all active:scale-90 disabled:opacity-20"
          title={t('control.hint')}
        >
          <Lightbulb className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          disabled={interactionMode === 'decide'}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
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
          <h3 className="font-montserrat font-bold text-xl mb-2">{t('control.well_done')}</h3>
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
