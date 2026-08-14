'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';
import {
  evaluateConfidence,
  type ConfidenceLevel,
  type ConfidenceEvaluationResult,
} from '../../../lib/courses/confidenceEngine';
import ConfidenceSelector from './ConfidenceSelector';
import AdaptiveFeedbackCard from './AdaptiveFeedbackCard';

import { useAnalytics } from '../../hooks/useAnalytics';

interface MatchingComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

type MatchPair = {
  leftId: string;
  rightId: string | null;
  isCorrect?: boolean;
};

export default function MatchingComponent({ phase, courseId, onMistake }: MatchingComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const { trackEvent } = useAnalytics(undefined, 'match', courseId);

  const initialLeft = phase.matching?.map((m, i) => ({ id: `L-${i}`, text: m.left })) || [];
  const initialRight = phase.matching?.map((m, i) => ({ id: `R-${i}`, text: m.right })) || [];

  // Shuffle right side for the challenge
  const [shuffledRight] = useState(() => [...initialRight].sort(() => Math.random() - 0.5));

  const [matches, setMatches] = useState<MatchPair[]>(() =>
    initialLeft.map((l) => ({ leftId: l.id, rightId: null })),
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { setCourseConfidenceRating } = useAlgorithmStore();

  const handleLeftSelect = (id: string) => {
    if (isDone || showFeedback || evaluation) return;
    setSelectedLeft(id);
  };

  const handleRightSelect = (id: string) => {
    if (isDone || showFeedback || evaluation || !selectedLeft) return;

    const leftText = initialLeft.find((l) => l.id === selectedLeft)?.text;
    const rightText = shuffledRight.find((r) => r.id === id)?.text;
    trackEvent('matching_pair_selected', { left: leftText, right: rightText });

    setMatches((prev) =>
      prev.map((m) => {
        if (m.leftId === selectedLeft) {
          return { ...m, rightId: id };
        }
        // If this rightId was already used elsewhere, clear that one
        if (m.rightId === id) {
          return { ...m, rightId: null };
        }
        return m;
      }),
    );
    setSelectedLeft(null);
  };

  const checkMatches = () => {
    const results = matches.map((m) => {
      const leftIdx = parseInt(m.leftId.split('-')[1]);
      const rightIdx = m.rightId ? parseInt(m.rightId.split('-')[1]) : -1;
      return { ...m, isCorrect: leftIdx === rightIdx };
    });

    setMatches(results);
    setShowFeedback(true);

    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;
    const allCorrect = correctCount === totalCount;

    const maxPoints = phase.maxPoints ?? 10;
    const evalResult = evaluateConfidence({
      isCorrect: allCorrect,
      confidence,
      basePoints: maxPoints,
      hintCopy: phase.hintCopy,
      summary: phase.summary,
    });
    setEvaluation(evalResult);

    trackEvent('matching_checked', {
      phaseId: phase.phaseId,
      correctCount,
      totalCount,
      allCorrect,
      confidence,
      matrix: results.map((r) => ({
        left: initialLeft.find((l) => l.id === r.leftId)?.text,
        right: shuffledRight.find((right) => right.id === r.rightId)?.text,
        isCorrect: r.isCorrect,
      })),
    });

    if (!allCorrect) onMistake?.();

    const baseEarned = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * maxPoints);
    const earnedPoints = allCorrect
      ? Math.min(
          maxPoints + evalResult.bonusPoints,
          Math.round(baseEarned * evalResult.scoreMultiplier) + evalResult.bonusPoints,
        )
      : Math.round(baseEarned * evalResult.scoreMultiplier);

    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: earnedPoints,
      max: maxPoints,
      helpUsed: evalResult.category === 'doubt' || evalResult.category === 'misconception',
      partial: correctCount > 0 && correctCount < totalCount,
    });

    setCoursePhaseResult(courseId, phase.phaseId, allCorrect ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);
    markCoursePhaseComplete(courseId, phase.phaseId);

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    // Keep correct matches and reset incorrect matches for true scaffolding
    setMatches((prev) =>
      prev.map((m) => (m.isCorrect ? m : { ...m, rightId: null, isCorrect: undefined })),
    );
    setShowFeedback(false);
    setEvaluation(null);
  };

  const isConfidenceEnabled = phase.askConfidence !== false;

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 relative">
        {/* Left Side (Labels) */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            {t('course.quiz.matching_categories')}
          </h4>
          {initialLeft.map((item) => {
            const match = matches.find((m) => m.leftId === item.id);
            const isSelected = selectedLeft === item.id;
            const rightItem = shuffledRight.find((r) => r.id === match?.rightId);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLeftSelect(item.id)}
                className={`w-full group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-[#269984] bg-[#269984]/10 dark:bg-[#269984]/20 shadow-md ring-2 ring-[#269984]/20'
                    : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#269984]/40'
                }`}
              >
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                  {item.text}
                </span>
                <AnimatePresence>
                  {rightItem && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-black ${
                        showFeedback
                          ? match?.isCorrect
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-rose-500 text-white shadow-sm'
                          : 'bg-[#269984]/15 text-[#269984] dark:text-[#36D6BA]'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>{rightItem.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Right Side (Options) */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            {t('course.quiz.matching_options')}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {shuffledRight.map((item) => {
              const isUsed = matches.some((m) => m.rightId === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDone || showFeedback || isUsed}
                  onClick={() => handleRightSelect(item.id)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 font-bold text-sm transition-all text-left ${
                    isUsed
                      ? 'border-transparent bg-gray-100/50 dark:bg-white/[0.02] text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed'
                      : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-[#269984] hover:shadow-lg active:scale-[0.99]'
                  }`}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!showFeedback && !isDone && (
        <div className="flex flex-col items-center gap-6 mt-4 w-full max-w-xl mx-auto">
          {isConfidenceEnabled && (
            <ConfidenceSelector
              selected={confidence}
              onChange={(lvl) => setConfidence(lvl)}
              className="w-full"
            />
          )}

          <button
            type="button"
            disabled={matches.some((m) => m.rightId === null)}
            onClick={checkMatches}
            className="w-full sm:w-auto px-10 py-4 bg-[#269984] hover:bg-[#208270] text-white rounded-2xl font-montserrat font-black uppercase tracking-widest shadow-xl shadow-[#269984]/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
          >
            {t('course.quiz.check') || 'Párosítás ellenőrzése'}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="mt-4 max-w-xl mx-auto w-full">
          <AdaptiveFeedbackCard evaluation={evaluation} onRetry={handleRetry} />
        </div>
      )}
    </div>
  );
}
