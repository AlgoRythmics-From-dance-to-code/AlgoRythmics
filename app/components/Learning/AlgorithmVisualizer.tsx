'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SortingVisualizer from './SortingVisualizer';
import QueensVisualizer from './QueensVisualizer';
import VisualizerControls from './VisualizerControls';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getAlgorithm } from '../../../lib/algorithms/registry';

interface AlgorithmVisualizerProps {
  id: string;
}

/**
 * Generic Animation visualizer that works with any algorithm registered in the system.
 */
export default function AlgorithmVisualizer({ id }: AlgorithmVisualizerProps) {
  const {
    visualizerProgress,
    updateVisualizerProgress,
    algorithmProgress,
    resetAlgorithmProgressTab,
  } = useAlgorithmStore();

  const { trackEvent, updateProgress } = useAnalytics(id, 'animation');

  const initialProgress = visualizerProgress[id] || { step: 0, speed: 1 };

  const [currentStep, setCurrentStep] = useState(initialProgress.step);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialProgress.speed);
  const progressRef = useRef(algorithmProgress[id]);
  useEffect(() => {
    progressRef.current = algorithmProgress[id];
  }, [algorithmProgress, id]);
  const startTime = useRef(Date.now());

  const algoDef = useMemo(() => getAlgorithm(id), [id]);

  // Pre-calculate all steps
  const steps = useMemo(() => {
    if (!algoDef) return [];
    return algoDef.generateSteps(algoDef.defaultArray);
  }, [algoDef]);

  // Sync state to local store
  useEffect(() => {
    updateVisualizerProgress(id, currentStep, speed);
  }, [id, currentStep, speed, updateVisualizerProgress]);

  // Track spent time on unmount
  useEffect(() => {
    return () => {
      const spentMs = Date.now() - startTime.current;
      const currentTotal = progressRef.current?.animationTotalTimeMs || 0;
      updateProgress({
        animationTotalTimeMs: currentTotal + spentMs,
      });
    };
  }, [id, updateProgress]);

  const isFinished = currentStep === steps.length - 1;

  // Controls
  const stepForward = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      trackEvent('animation_step_forward', { step: currentStep + 1 });
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, steps.length, trackEvent]);

  const stepBackward = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setIsPlaying(false);
      trackEvent('animation_step_back', { step: currentStep - 1 });
    }
  }, [currentStep, trackEvent]);

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    trackEvent('animation_reset');

    // 1. Accumulate time before reset
    const spentMs = Date.now() - startTime.current;
    const currentTotal = algorithmProgress[id]?.animationTotalTimeMs || 0;

    resetAlgorithmProgressTab(id, 'animation');

    updateProgress(
      {
        animationCompleted: false,
        animationCompletedAt: null,
        animationTotalTimeMs: currentTotal + spentMs,
      },
      true, // syncNow
    );

    // 2. Immediate Sync to Backend
    const store = useAlgorithmStore.getState();
    fetch('/api/account/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedIds: store.completedIds,
        visualizerProgress: store.visualizerProgress,
        algorithmProgress: {
          [id]: store.algorithmProgress[id],
        },
      }),
    }).catch((err) => console.error('[Animation] Failed to sync reset:', err));

    startTime.current = Date.now();
  };

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    trackEvent(next ? 'animation_play' : 'animation_pause', { step: currentStep });
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    trackEvent('animation_speed_change', { speed: s });
  };

  // Track animation completion
  useEffect(() => {
    if (isFinished && currentStep > 0) {
      trackEvent('animation_complete', {
        totalSteps: steps.length,
        comparisons: steps[currentStep]?.comparisons,
        swaps: steps[currentStep]?.swapCount,
      });
      updateProgress({
        animationCompleted: true,
        animationCompletedAt: new Date().toISOString(),
        animationPlayCount:
          (useAlgorithmStore.getState().algorithmProgress[id]?.animationPlayCount || 0) + 1,
      });
    }
  }, [isFinished, currentStep, steps, trackEvent, updateProgress, id]);

  // Autoplay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying && currentStep < steps.length - 1) {
      timer = setTimeout(stepForward, 800 / speed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, stepForward, speed, steps.length]);

  if (!algoDef || steps.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {algoDef.category === 'backtracking' ? (
        <QueensVisualizer steps={steps} currentStep={currentStep} />
      ) : (
        <SortingVisualizer
          steps={steps}
          currentStep={currentStep}
          speed={speed}
          legend={algoDef.legend}
        />
      )}

      <VisualizerControls
        onPlayPause={handlePlayPause}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onReset={reset}
        isPlaying={isPlaying}
        isFinished={isFinished}
        speed={speed}
        setSpeed={handleSpeedChange}
        progress={(currentStep / (steps.length - 1)) * 100}
        speedOptions={algoDef.category === 'backtracking' ? [1, 2, 10, 100] : undefined}
      />
    </div>
  );
}
