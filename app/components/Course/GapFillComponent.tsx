'use client';

import React, { useState } from 'react';
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

interface GapFillComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

export default function GapFillComponent({ phase, courseId, onMistake }: GapFillComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const { trackEvent } = useAnalytics(undefined, 'gap-fill', courseId);

  const content = phase.gapFillContent || '';
  const options = phase.gapFillOptions || [];
  const solutions = phase.gapFillSolutions || [];

  // Normalize both {{gap}} and [blank] markers to [blank] for uniform handling
  const normalizedContent = content.replace(/\{\{gap\}\}/g, '[blank]');
  const parts = normalizedContent.split(/(\[blank\])/);
  const blankCount = parts.filter((p) => p === '[blank]').length;

  const [choices, setChoices] = useState<string[]>(new Array(blankCount).fill(''));
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);

  const { setCourseConfidenceRating } = useAlgorithmStore();

  const handleSelect = (blankIdx: number, val: string) => {
    if (isDone || showFeedback || evaluation) return;
    const newChoices = [...choices];
    newChoices[blankIdx] = val;
    setChoices(newChoices);
    trackEvent('gap_fill_selected', { blankIndex: blankIdx, value: val });
  };

  const checkGaps = () => {
    const allFilled = choices.every((c) => c !== '');
    if (!allFilled) return;

    let correct = 0;
    if (solutions.length > 0) {
      choices.forEach((c, i) => {
        if (c === solutions[i]) correct++;
      });
    } else {
      // Legacy fallback: if no solutions defined, assume all filled are correct
      correct = blankCount;
    }

    setShowFeedback(true);

    const allCorrect = correct === blankCount;
    if (!allCorrect) onMistake?.();

    const maxPoints = phase.maxPoints ?? 10;
    const evalResult = evaluateConfidence({
      isCorrect: allCorrect,
      confidence,
      basePoints: maxPoints,
      hintCopy: phase.hintCopy,
      summary: phase.summary,
    });
    setEvaluation(evalResult);

    trackEvent('gap_fill_checked', {
      phaseId: phase.phaseId,
      allCorrect,
      correctCount: correct,
      totalCount: blankCount,
      confidence,
      choices: choices.map((c, i) => ({
        index: i,
        value: c,
        isCorrect: solutions.length > 0 ? c === solutions[i] : true,
      })),
    });

    const baseEarned = blankCount === 0 ? 0 : Math.round((correct / blankCount) * maxPoints);
    const earnedPoints = allCorrect
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
      partial: correct > 0 && correct < blankCount,
    });

    setCoursePhaseResult(courseId, phase.phaseId, allCorrect ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);
    markCoursePhaseComplete(courseId, phase.phaseId);

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    // Keep correct choices and reset incorrect choices for true scaffolding
    if (solutions.length > 0) {
      setChoices((prev) => prev.map((c, i) => (c === solutions[i] ? c : '')));
    }
    setShowFeedback(false);
    setEvaluation(null);
  };

  const isConfidenceEnabled = phase.askConfidence !== false;
  let blankIdx = 0;

  return (
    <div className="flex flex-col items-center gap-10 p-4">
      <div className="w-full max-w-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 p-6 sm:p-10 rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-6 text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-100">
          {parts.map((part, i) => {
            if (part === '[blank]') {
              const currentBlank = blankIdx++;
              const isFilled = !!choices[currentBlank];
              return (
                <div key={i} className="relative inline-block min-w-[130px]">
                  <select
                    disabled={isDone || showFeedback || !!evaluation}
                    value={choices[currentBlank]}
                    onChange={(e) => handleSelect(currentBlank, e.target.value)}
                    className={`w-full appearance-none px-4 py-2.5 rounded-xl border-2 font-bold text-sm bg-white dark:bg-[#181824] dark:text-gray-100 cursor-pointer transition-all ${
                      isFilled
                        ? 'border-[#269984] text-[#269984] dark:text-[#36D6BA] ring-1 ring-[#269984]/20'
                        : 'border-gray-200 dark:border-white/15 text-gray-400 dark:text-gray-500'
                    } focus:ring-2 focus:ring-[#269984]/20 outline-none`}
                  >
                    <option value="">...</option>
                    {options.map((opt, oIdx) => (
                      <option
                        key={oIdx}
                        value={opt}
                        className="bg-white dark:bg-[#181824] text-gray-800 dark:text-gray-100"
                      >
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <span key={i} className="font-medium">
                {part}
              </span>
            );
          })}
        </div>
      </div>

      {!showFeedback && !isDone && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xl">
          {isConfidenceEnabled && (
            <ConfidenceSelector
              selected={confidence}
              onChange={(lvl) => setConfidence(lvl)}
              className="w-full"
            />
          )}

          <button
            type="button"
            disabled={choices.some((c) => c === '')}
            onClick={checkGaps}
            className="w-full sm:w-auto px-10 py-4 bg-[#269984] hover:bg-[#208270] text-white rounded-2xl font-montserrat font-black uppercase tracking-widest shadow-xl shadow-[#269984]/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
          >
            {t('course.quiz.check') || 'Kitöltés ellenőrzése'}
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
