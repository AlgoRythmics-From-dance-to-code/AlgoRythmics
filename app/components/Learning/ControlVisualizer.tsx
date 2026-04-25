'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import SortingVisualizer from './SortingVisualizer';
import QueensControl from './QueensControl';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useLocale } from '../../i18n/LocaleProvider';
import { getAlgorithm } from '../../../lib/algorithms/registry';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

interface ControlVisualizerProps {
  algorithmId: string;
  onMistake?: () => void;
}

export default function ControlVisualizer({ algorithmId, onMistake }: ControlVisualizerProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'control');

  const algo = getAlgorithm(algorithmId);
  // For N-Queens we use a dedicated step type where every interactive step is a "Try" step (swapping: false)
  // immediately followed by the outcome (safe: swapping: false with sortedIndices including row,
  // or conflict: swapping: true).
  const steps = useMemo(() => (algo ? algo.generateSteps(algo.defaultArray) : []), [algo]);

  const isSorting = algo?.category === 'sorting' || algo?.category === 'fun';
  const isBacktracking = algo?.category === 'backtracking';
  const selectionLimit = isSorting ? 2 : 1;

  const [expectedStepIndex, setExpectedStepIndex] = useState(() => {
    // Find the first step that actually requires an interaction (has active indices)
    const firstInteractive = steps.findIndex((s, i) => i > 0 && s.activeIndices.length > 0);
    return firstInteractive !== -1 ? firstInteractive : 1;
  });

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const progress = useAlgorithmStore((state) => state.algorithmProgress[algorithmId]);
  const progressRef = useRef(progress);
  React.useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const [isHinting, setIsHinting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [attemptedWrong, setAttemptedWrong] = useState(false);
  // For sorting: select → decide. For N-Queens: always 'select' (decision tied to cell click)
  const [interactionMode, setInteractionMode] = useState<'select' | 'decide'>('select');
  const { setInteractionLocked, resetAlgorithmProgressTab } = useAlgorithmStore();

  React.useEffect(() => {
    setInteractionLocked(interactionMode === 'decide');
  }, [interactionMode, setInteractionLocked]);

  React.useEffect(() => {
    return () => setInteractionLocked(false);
  }, [setInteractionLocked]);

  const startTime = useRef(Date.now());

  const currentExpected = steps[expectedStepIndex];
  const isFinished = expectedStepIndex >= steps.length - 1;

  React.useEffect(() => {
    return () => {
      const spentMs = Date.now() - startTime.current;
      const currentTotal = progressRef.current?.controlTotalTimeMs || 0;
      updateProgress({
        // Only track time on unmount — controlAttempts is incremented in finishControl()
        controlTotalTimeMs: currentTotal + spentMs,
      });
    };
  }, [algorithmId, updateProgress]);

  const finishControl = useCallback(() => {
    setIsComplete(true);
    const elapsed = Date.now() - startTime.current;
    const score = totalCorrect > 0 ? Math.round((correctFirstTry / totalCorrect) * 100) : 100;

    trackEvent('control_complete', { score, mistakes, timeMs: elapsed });

    // Determine if this is a new best time
    const existingBestTime = progressRef.current?.controlBestTimeMs || 0;
    const isNewBestTime = elapsed > 0 && (existingBestTime === 0 || elapsed < existingBestTime);

    updateProgress(
      {
        controlCompleted: true,
        controlBestScore: score,
        controlMistakes: mistakes,
        controlBestTimeMs: isNewBestTime ? elapsed : existingBestTime,
        controlCompletedAt: new Date().toISOString(),
      },
      true,
    );

    // Force immediate sync on finish
    const store = useAlgorithmStore.getState();
    fetch('/api/account/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedIds: store.completedIds,
        visualizerProgress: store.visualizerProgress,
        algorithmProgress: {
          [algorithmId]: store.algorithmProgress[algorithmId],
        },
      }),
    }).catch((err) => console.error('[ControlVisualizer] Failed to sync finish:', err));
  }, [correctFirstTry, totalCorrect, mistakes, trackEvent, updateProgress, algorithmId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBarClick = useCallback(
    (index: number) => {
      if (isComplete || isFinished || interactionMode === 'decide') return;
      trackEvent('control_select', { index });
      setSelectedIndices((prev) => {
        if (prev.includes(index)) return prev.filter((i) => i !== index);
        if (prev.length >= selectionLimit) return [index];
        return [...prev, index].sort((a, b) => a - b);
      });
      setFeedback(null);
    },
    [isComplete, isFinished, trackEvent, interactionMode, selectionLimit],
  );

  // Sorting: Check the pair selection
  const handleCheck = useCallback(() => {
    if (!currentExpected || !isSorting) return;

    // If fewer than selectionLimit are selected, it's a mistake in logic/understanding
    if (selectedIndices.length < selectionLimit) {
      setFeedback('incorrect');
      setMistakes((m) => m + 1);
      updateProgress({ controlMistakes: mistakes + 1 });
      onMistake?.();
      setAttemptedWrong(true);
      trackEvent('control_selection_incomplete', {
        selected: selectedIndices.length,
        required: selectionLimit,
      });
      setTimeout(() => setFeedback(null), 600);
      return;
    }

    if (selectedIndices.length > selectionLimit) return;

    const expectedActive = currentExpected.activeIndices;
    const isCorrect =
      selectedIndices.length === expectedActive.length &&
      expectedActive.every((idx) => selectedIndices.includes(idx));

    if (isCorrect) {
      setFeedback('correct');
      trackEvent('control_check', {
        selected: selectedIndices,
        isCorrect: true,
        step: expectedStepIndex,
      });
      setInteractionMode('decide');
    } else {
      setFeedback('incorrect');
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      updateProgress({ controlMistakes: nextMistakes });
      onMistake?.();
      setAttemptedWrong(true);
      trackEvent('control_mistake', {
        expected: expectedActive,
        actual: selectedIndices,
        step: expectedStepIndex,
      });
      setTimeout(() => setFeedback(null), 600);
    }
  }, [
    selectedIndices,
    currentExpected,
    trackEvent,
    expectedStepIndex,
    isSorting,
    selectionLimit,
    onMistake,
    mistakes,
    updateProgress,
  ]);

  // Sorting: Handle swap/stay decision
  const handleSortingDecision = useCallback(
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

        setTimeout(() => {
          let advanceIdx = nextIdx;
          if (stepAfter?.swapping) advanceIdx++;
          while (advanceIdx < steps.length && steps[advanceIdx].activeIndices.length === 0) {
            advanceIdx++;
          }

          if (advanceIdx >= steps.length) {
            finishControl();
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
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        updateProgress({ controlMistakes: nextMistakes });
        onMistake?.();
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
      finishControl,
      mistakes,
      updateProgress,
      onMistake,
    ],
  );

  // Search: Combined selection + decision
  const handleSearchDecision = useCallback(
    (action: 'found' | 'next') => {
      if (!currentExpected) return;

      // First validate the selection
      const selectionIsCorrect =
        selectedIndices.length === 1 && currentExpected.activeIndices.includes(selectedIndices[0]);
      if (!selectionIsCorrect) {
        setFeedback('incorrect');
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        updateProgress({ controlMistakes: nextMistakes });
        onMistake?.();
        setAttemptedWrong(true);
        trackEvent('control_selection_mistake', { step: expectedStepIndex });
        setTimeout(() => setFeedback(null), 600);
        return;
      }

      // Then validate the decision
      const nextIdx = expectedStepIndex + 1;
      const stepAfter = steps[nextIdx];
      const nextStepIsFound =
        stepAfter?.sortedIndices.length > currentExpected.sortedIndices.length;
      const isCorrectDecision =
        (action === 'found' && nextStepIsFound) || (action === 'next' && !nextStepIsFound);

      if (isCorrectDecision) {
        setFeedback('correct');
        if (!attemptedWrong) setCorrectFirstTry((c) => c + 1);
        setTotalCorrect((c) => c + 1);
        trackEvent('control_decision', { action, isCorrect: true, step: expectedStepIndex });

        setTimeout(() => {
          let advanceIdx = nextIdx;
          while (
            advanceIdx < steps.length &&
            (steps[advanceIdx].activeIndices.length === 0 ||
              steps[advanceIdx].activeIndices[0] === currentExpected.activeIndices[0])
          ) {
            advanceIdx++;
          }

          if (advanceIdx >= steps.length) {
            finishControl();
          } else {
            setExpectedStepIndex(advanceIdx);
          }
          setSelectedIndices([]);
          setFeedback(null);
          setAttemptedWrong(false);
        }, 150);
      } else {
        setFeedback('incorrect');
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        updateProgress({ controlMistakes: nextMistakes });
        onMistake?.();
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
      selectedIndices,
      finishControl,
      mistakes,
      updateProgress,
      onMistake,
    ],
  );

  const handleHint = useCallback(() => {
    if (!currentExpected) return;
    setIsHinting(true);
    trackEvent('control_hint', { step: expectedStepIndex });
    const currentHintCount = progress?.controlHintsUsed || 0;
    updateProgress({ controlHintsUsed: currentHintCount + 1 });
    setTimeout(() => setIsHinting(false), 3000);
  }, [currentExpected, expectedStepIndex, trackEvent, updateProgress, progress]);

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

    // 1. Accumulate time before reset
    const spentMs = Date.now() - startTime.current;
    const currentTotal = progress?.controlTotalTimeMs || 0;

    resetAlgorithmProgressTab(algorithmId, 'control');
    updateProgress(
      {
        controlCompleted: false,
        controlBestScore: 0,
        controlMistakes: 0,
        controlTotalTimeMs: currentTotal + spentMs,
        controlCompletedAt: null,
      },
      true,
    );

    // 2. Force manual sync on reset
    const store = useAlgorithmStore.getState();
    fetch('/api/account/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedIds: store.completedIds,
        visualizerProgress: store.visualizerProgress,
        algorithmProgress: {
          [algorithmId]: store.algorithmProgress[algorithmId],
        },
      }),
    }).catch((err) => console.error('[ControlVisualizer] Failed to sync reset:', err));

    startTime.current = Date.now();
  }, [
    algorithmId,
    resetAlgorithmProgressTab,
    trackEvent,
    updateProgress,
    progress?.controlTotalTimeMs,
  ]);

  // ── Display state ──────────────────────────────────────────────────────────

  const displaySteps = useMemo(() => {
    if (!steps.length) return [];
    const step = steps[expectedStepIndex] || steps[steps.length - 1];
    return [
      {
        ...step,
        activeIndices: interactionMode === 'decide' ? step.activeIndices : [],
        sortedIndices: isComplete
          ? step.array.map((_: unknown, i: number) => i)
          : step.sortedIndices,
        swapping: interactionMode === 'decide' ? step.swapping : false,
        description: isComplete
          ? t('visualizer.sorted_complete')
          : interactionMode === 'decide'
            ? step.description
            : '',
      },
    ];
  }, [steps, expectedStepIndex, interactionMode, isComplete, t]);

  // ── Hint content ───────────────────────────────────────────────────────────

  const hintText = useMemo(() => {
    if (!currentExpected) return '';
    return currentExpected.activeIndices
      .map((idx: number) => steps[expectedStepIndex]?.array[idx]?.val)
      .join(' & ');
  }, [currentExpected, steps, expectedStepIndex]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!algo || steps.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">{t('algorithms.detail.coming_soon')}</div>
    );
  }

  // N-Queens: use dedicated puzzle UI
  if (isBacktracking) {
    const boardSize = algo.defaultArray?.[0] ?? 8;
    return <QueensControl n={boardSize} algorithmId={algorithmId} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
      {/* Search target badge */}
      {currentExpected?.target !== undefined && !isBacktracking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 shadow-sm"
        >
          <span className="font-montserrat text-xs font-bold text-amber-600 uppercase tracking-wider">
            {t('visualizer.searching_for')}:
          </span>
          <span className="font-montserrat font-bold text-lg text-amber-700 dark:text-amber-400">
            {currentExpected.target}
          </span>
        </motion.div>
      )}

      {/* Instruction */}
      <div className="w-full text-center">
        <p className="font-montserrat font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
          {isComplete
            ? isSorting
              ? t('control.well_done')
              : t('control.found_it')
            : isSorting
              ? t('control.select_pair')
              : t('control.select_next')}
        </p>
      </div>

      {/* Visualizer */}
      {displaySteps.length > 0 && (
        <SortingVisualizer
          steps={displaySteps}
          currentStep={0}
          speed={2.5}
          onBarClick={handleBarClick}
          selectedIndices={selectedIndices}
          disabled={interactionMode === 'decide'}
          legend={algo.legend}
        />
      )}

      {/* Hint */}
      {isHinting && currentExpected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <p className="font-montserrat text-sm text-[#269984] animate-pulse">
            💡 {t('control.hint')}: {hintText}
          </p>
        </motion.div>
      )}

      {/* Feedback */}
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
        {isSorting ? (
          interactionMode === 'select' ? (
            <button
              onClick={handleCheck}
              disabled={selectedIndices.length !== selectionLimit || isComplete}
              className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-[#269984] text-white shadow-lg shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('control.compare')}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSortingDecision('swap')}
                className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95"
              >
                {t('control.swap')}
              </button>
              <button
                onClick={() => handleSortingDecision('stay')}
                className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
              >
                {t('control.stay')}
              </button>
            </>
          )
        ) : (
          <>
            <button
              onClick={() => handleSearchDecision('found')}
              disabled={selectedIndices.length === 0 || isComplete}
              className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('control.found')}
            </button>
            <button
              onClick={() => handleSearchDecision('next')}
              disabled={selectedIndices.length === 0 || isComplete}
              className="px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('control.not_found')}
            </button>
          </>
        )}
        <button
          onClick={handleHint}
          disabled={isComplete}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-amber-500 transition-all active:scale-90 disabled:opacity-20"
          title={t('control.hint')}
        >
          <Lightbulb className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-all active:scale-90"
          title={t('visualizer.controls.reset')}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
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

      {/* Completion */}
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
