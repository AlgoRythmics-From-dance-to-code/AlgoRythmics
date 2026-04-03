'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SortingVisualizer from './SortingVisualizer';
import VisualizerControls from './VisualizerControls';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  generateBubbleSortSteps,
  BUBBLE_SORT_DEFAULT_ARRAY,
} from '../../../lib/algorithms/bubbleSortSteps';

export default function BubbleSortVisualizer({ id = 'bubble-sort' }: { id?: string }) {
  const { visualizerProgress, updateVisualizerProgress, algorithmProgress, resetAlgorithmProgressTab } =
    useAlgorithmStore();
  const { trackEvent, updateProgress } = useAnalytics(id, 'animation');

  const initialProgress = visualizerProgress[id] || { step: 0, speed: 1 };

  const [currentStep, setCurrentStep] = useState(initialProgress.step);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialProgress.speed);
  const startTime = useRef(Date.now());

  // Sync state to store
  useEffect(() => {
    updateVisualizerProgress(id, currentStep, speed);
  }, [id, currentStep, speed, updateVisualizerProgress]);

  // Track spent time on unmount
  useEffect(() => {
    return () => {
      const spentMs = Date.now() - startTime.current;
      const currentTotal = algorithmProgress[id]?.animationTotalTimeMs || 0;
      updateProgress({
        animationTotalTimeMs: currentTotal + spentMs,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, updateProgress]);

  // Pre-calculate all steps
  const steps = useMemo(() => generateBubbleSortSteps(BUBBLE_SORT_DEFAULT_ARRAY), []);

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

    // 1. Update local store
    resetAlgorithmProgressTab(id, 'animation');

    // 2. Synchronize with analytics and flush any pending updates
    updateProgress(
      {
        animationCompleted: false,
        animationCompletedAt: null,
      },
      true, // syncNow
    );

    // 3. Immediate Sync to Backend (Redundant but ensures state integrity)
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
        animationPlayCount: (algorithmProgress[id]?.animationPlayCount || 0) + 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  // Autoplay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying && currentStep < steps.length - 1) {
      timer = setTimeout(stepForward, 800 / speed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, stepForward, speed, steps.length]);

  return (
    <div className="w-full flex flex-col items-center">
      <SortingVisualizer steps={steps} currentStep={currentStep} speed={speed} />

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
      />
    </div>
  );
}
