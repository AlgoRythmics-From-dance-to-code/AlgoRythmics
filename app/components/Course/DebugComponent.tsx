'use client';

import React, { useState } from 'react';
import { Bug } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';
import {
  evaluateConfidence,
  type ConfidenceLevel,
  type ConfidenceEvaluationResult,
} from '../../../lib/courses/confidenceEngine';
import ConfidenceSelector from './ConfidenceSelector';
import AdaptiveFeedbackCard from './AdaptiveFeedbackCard';

interface DebugComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

export default function DebugComponent({ phase, courseId, onMistake }: DebugComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const { trackEvent } = useAnalytics(undefined, 'debug', courseId);

  const debugLines = phase.debugCode?.split('\n') || [];
  const expectedLines = phase.expectedCode?.split('\n') || [];

  // Find which line is different (the bug)
  const bugLineIndex = debugLines.findIndex((line, i) => line.trim() !== expectedLines[i]?.trim());

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);

  const { setCourseConfidenceRating } = useAlgorithmStore();

  const handleLineClick = (idx: number) => {
    if (isDone || showFeedback || evaluation) return;
    setSelectedIndex(idx);
    trackEvent('debug_line_click', { lineIndex: idx, lineText: debugLines[idx] });
  };

  const checkBug = () => {
    if (selectedIndex === null) return;

    const correct = selectedIndex === bugLineIndex;
    if (!correct) onMistake?.();

    const maxPoints = phase.maxPoints ?? 10;
    const selectedLineText = debugLines[selectedIndex]?.trim();
    const correctLineText = debugLines[bugLineIndex]?.trim();

    const evalResult = evaluateConfidence({
      isCorrect: correct,
      confidence,
      basePoints: maxPoints,
      hintCopy: phase.hintCopy,
      summary: phase.summary,
      selectedAnswerText: selectedLineText,
      correctAnswerText: correctLineText,
    });
    setEvaluation(evalResult);

    trackEvent('debug_checked', {
      phaseId: phase.phaseId,
      correct,
      selectedIndex,
      bugLineIndex,
      confidence,
      selectedLineText: debugLines[selectedIndex],
    });

    const baseEarned = correct ? maxPoints : 0;
    const earnedPoints = correct
      ? Math.min(
          maxPoints + evalResult.bonusPoints,
          Math.round(baseEarned * evalResult.scoreMultiplier) + evalResult.bonusPoints,
        )
      : Math.round(baseEarned * evalResult.scoreMultiplier);

    // Set points immediately
    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: earnedPoints,
      max: maxPoints,
      helpUsed: evalResult.category === 'doubt' || evalResult.category === 'misconception',
      partial: false,
    });

    setShowFeedback(true);
    setCoursePhaseResult(courseId, phase.phaseId, correct ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);
    markCoursePhaseComplete(courseId, phase.phaseId);

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setEvaluation(null);
    setSelectedIndex(null);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="w-full max-w-2xl bg-[#1e1e2e] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        <div className="px-6 py-4 bg-[#181825] border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
            debug_mode.js
          </span>
        </div>

        <div className="p-8 font-mono text-sm leading-relaxed overflow-x-auto">
          {debugLines.map((line, i) => {
            const isSelected = selectedIndex === i;
            const isBug = i === bugLineIndex;

            let bgClass = 'hover:bg-white/5';
            if (isSelected) bgClass = 'bg-[#269984]/20 border-[#269984]/40';
            if (showFeedback) {
              if (isSelected && isBug) bgClass = 'bg-green-500/20 border-green-500/40';
              else if (isSelected) bgClass = 'bg-red-500/20 border-red-500/40';
            }

            return (
              <div
                key={i}
                onClick={() => handleLineClick(i)}
                className={`group flex items-start gap-6 px-4 py-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${bgClass}`}
              >
                <span className="w-6 text-gray-600 text-right select-none">{i + 1}</span>
                <span className="text-gray-300 whitespace-pre">{line}</span>
                {!showFeedback && isSelected && (
                  <Bug className="w-4 h-4 text-[#269984] ml-auto animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {t('course.quiz.debug_instructions')}
        </p>
      </div>

      {!showFeedback && !isDone && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xl">
          {phase.askConfidence !== false && (
            <ConfidenceSelector
              selected={confidence}
              onChange={(lvl) => setConfidence(lvl)}
              className="w-full"
            />
          )}

          <button
            type="button"
            disabled={selectedIndex === null}
            onClick={checkBug}
            className="w-full sm:w-auto px-10 py-4 bg-[#269984] hover:bg-[#208270] text-white rounded-2xl font-montserrat font-black uppercase tracking-widest shadow-xl shadow-[#269984]/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
          >
            {t('course.quiz.debug_title') || 'Hiba megjelölése és ellenőrzése'}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="w-full max-w-xl">
          <AdaptiveFeedbackCard evaluation={evaluation} onRetry={handleRetry} />
        </div>
      )}
    </div>
  );
}
