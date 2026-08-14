'use client';

import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  evaluateConfidence,
  type ConfidenceLevel,
  type ConfidenceEvaluationResult,
} from '../../../lib/courses/confidenceEngine';
import ConfidenceSelector from './ConfidenceSelector';
import AdaptiveFeedbackCard from './AdaptiveFeedbackCard';

interface OrderingComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

export default function OrderingComponent({ phase, courseId, onMistake }: OrderingComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const { trackEvent } = useAnalytics(undefined, 'order', courseId);

  const initialItems =
    phase.ordering?.map((o, i) => ({ id: `O-${i}`, text: o.text, originalIndex: i })) || [];

  // Shuffle for the challenge
  const [items, setItems] = useState(() => [...initialItems].sort(() => Math.random() - 0.5));

  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);

  const { setCourseConfidenceRating } = useAlgorithmStore();

  const checkOrder = () => {
    // Correct if current text order matches initial order (which was 0, 1, 2...)
    const correctCount = items.filter((item, idx) => item.originalIndex === idx).length;
    const totalCount = items.length;
    const matchesOriginal = correctCount === totalCount;

    if (!matchesOriginal) onMistake?.();

    const maxPoints = phase.maxPoints ?? 10;
    const evalResult = evaluateConfidence({
      isCorrect: matchesOriginal,
      confidence,
      basePoints: maxPoints,
      hintCopy: phase.hintCopy,
      summary: phase.summary,
    });
    setEvaluation(evalResult);

    trackEvent('ordering_checked', {
      phaseId: phase.phaseId,
      allCorrect: matchesOriginal,
      correctCount,
      totalCount,
      confidence,
      currentOrder: items.map((item) => item.text),
    });

    const baseEarned = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * maxPoints);
    const earnedPoints = matchesOriginal
      ? Math.min(
          maxPoints + evalResult.bonusPoints,
          Math.round(baseEarned * evalResult.scoreMultiplier) + evalResult.bonusPoints,
        )
      : Math.round(baseEarned * evalResult.scoreMultiplier);

    // Set points immediately
    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: earnedPoints,
      max: maxPoints,
      helpUsed: false,
      partial: correctCount > 0 && correctCount < totalCount,
    });

    setShowFeedback(true);
    setCoursePhaseResult(courseId, phase.phaseId, matchesOriginal ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);

    if (matchesOriginal || !evalResult.canRetry) {
      markCoursePhaseComplete(courseId, phase.phaseId);
    }

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setEvaluation(null);
  };

  const isConfidenceEnabled = phase.askConfidence !== false;

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="w-full max-w-xl">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center">
          {t('course.quiz.ordering_title') || 'Állítsd helyes sorrendbe a lépéseket!'}
        </h4>

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={(newOrder) => {
            if (isDone || showFeedback || evaluation) return;
            setItems(newOrder);
            trackEvent('ordering_reorder', { currentOrder: newOrder.map((i) => i.text) });
          }}
          className="space-y-3"
        >
          {items.map((item, idx) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-grab active:cursor-grabbing transition-all ${
                showFeedback
                  ? evaluation?.category === 'mastery' || evaluation?.category === 'lucky'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#269984]/40 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {idx + 1}
              </div>
              <GripVertical className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100 flex-1">
                {item.text}
              </span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
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
            onClick={checkOrder}
            className="w-full sm:w-auto px-10 py-4 bg-[#269984] hover:bg-[#208270] text-white rounded-2xl font-montserrat font-black uppercase tracking-widest shadow-xl shadow-[#269984]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {t('course.quiz.check') || 'Sorrend ellenőrzése'}
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
