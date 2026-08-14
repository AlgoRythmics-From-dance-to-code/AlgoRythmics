'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SortingVisualizer from './SortingVisualizer';
import QueensVisualizer from './QueensVisualizer';
import VisualizerControls from './VisualizerControls';
import CustomInputBar from './CustomInputBar';
import CodeTracingPanel from './CodeTracingPanel';
import VariableWatchPanel from './VariableWatchPanel';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getAlgorithm } from '../../../lib/algorithms/registry';

interface AlgorithmVisualizerProps {
  id: string;
}

/**
 * Enhanced Animation visualizer with:
 * - Code Tracing (active execution line highlight)
 * - Variable Watch (real-time variable inspector)
 * - Custom Input & Presets (sorted, reverse, nearly sorted, duplicates, random, target selector)
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
  const algoDef = useMemo(() => getAlgorithm(id), [id]);

  // Array and target state for custom inputs
  const [arrayValues, setArrayValues] = useState<number[]>(
    algoDef?.defaultArray || [45, 12, 89, 34, 67, 23, 56, 10, 78],
  );
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);

  // Sync array when algorithm ID changes
  useEffect(() => {
    if (algoDef) {
      setArrayValues(algoDef.defaultArray);
      setTargetValue(undefined);
    }
  }, [algoDef]);

  const [currentStep, setCurrentStep] = useState(initialProgress.step);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialProgress.speed);
  const progressRef = useRef(algorithmProgress[id]);
  useEffect(() => {
    progressRef.current = algorithmProgress[id];
  }, [algorithmProgress, id]);
  const startTime = useRef(Date.now());

  // Pre-calculate all steps for the current array & target
  const steps = useMemo(() => {
    if (!algoDef) return [];
    return algoDef.generateSteps(arrayValues, targetValue);
  }, [algoDef, arrayValues, targetValue]);

  // Ensure current step stays in bounds if array size changed
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(0);
    }
  }, [steps.length, currentStep]);

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

  // Custom Input Apply Handler
  const handleApplyArray = useCallback(
    (newArr: number[], newTarget?: number) => {
      setArrayValues(newArr);
      setTargetValue(newTarget);
      setCurrentStep(0);
      setIsPlaying(false);
      trackEvent('animation_custom_input', {
        length: newArr.length,
        target: newTarget,
      });
    },
    [trackEvent],
  );

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

  const currentStepData = steps[currentStep] || steps[0];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Custom Input & Preset Bar */}
      <CustomInputBar
        algorithmId={id}
        category={algoDef.category}
        defaultArray={algoDef.defaultArray}
        currentArray={arrayValues}
        currentTarget={currentStepData?.target ?? targetValue}
        onApplyArray={handleApplyArray}
      />

      {/* 2. Main Workspace Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visualizer Arena & Playback Controls */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="w-full">
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
          </div>

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

        {/* Right Column: Variable Watch & Code Tracing Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Variable Watch Panel */}
          <VariableWatchPanel variables={currentStepData?.variables} />

          {/* Code Tracing Panel */}
          {algoDef.codeDefinition && (
            <CodeTracingPanel
              codeDef={algoDef.codeDefinition}
              highlightLine={currentStepData?.highlightLine}
            />
          )}
        </div>
      </div>
    </div>
  );
}
