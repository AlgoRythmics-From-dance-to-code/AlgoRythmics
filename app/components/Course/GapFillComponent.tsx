'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';

interface GapFillComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

export default function GapFillComponent({
  phase,
  courseId,
  onMistake: _onMistake,
}: GapFillComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const content = phase.gapFillContent || '';
  const options = phase.gapFillOptions || [];
  const solutions = phase.gapFillSolutions || [];

  // Find all [blank] markers
  const parts = content.split(/(\[blank\])/);
  const blankCount = parts.filter((p) => p === '[blank]').length;

  const [choices, setChoices] = useState<string[]>(new Array(blankCount).fill(''));
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const handleSelect = (blankIdx: number, val: string) => {
    if (isDone || showFeedback) return;
    const newChoices = [...choices];
    newChoices[blankIdx] = val;
    setChoices(newChoices);
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

    setCorrectCount(correct);
    setShowFeedback(true);

    const allCorrect = correct === blankCount;

    // Scale points to phase maxPoints
    const maxPoints = phase.maxPoints ?? 10;
    const earnedPoints = blankCount === 0 ? 0 : Math.round((correct / blankCount) * maxPoints);

    // Set points immediately
    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: earnedPoints,
      max: maxPoints,
      helpUsed: false,
      partial: correct > 0 && correct < blankCount,
    });

    setCoursePhaseResult(courseId, phase.phaseId, allCorrect ? 'success' : 'fail');
    markCoursePhaseComplete(courseId, phase.phaseId);

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
  };

  let blankIdx = 0;

  return (
    <div className="flex flex-col items-center gap-10 p-4">
      <div className="w-full max-w-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-10 rounded-3xl shadow-inner">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-6 text-xl leading-relaxed text-gray-700 dark:text-gray-200">
          {parts.map((part, i) => {
            if (part === '[blank]') {
              const currentBlank = blankIdx++;
              return (
                <div key={i} className="relative inline-block min-w-[120px]">
                  <select
                    disabled={isDone || showFeedback}
                    value={choices[currentBlank]}
                    onChange={(e) => handleSelect(currentBlank, e.target.value)}
                    className={`w-full appearance-none px-4 py-2 rounded-xl border-2 font-bold text-sm bg-white cursor-pointer transition-all ${
                      choices[currentBlank]
                        ? 'border-[#269984] text-[#269984]'
                        : 'border-gray-200 text-gray-400'
                    } focus:ring-2 focus:ring-[#269984]/20 outline-none`}
                  >
                    <option value="">...</option>
                    {options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
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
        <button
          disabled={choices.some((c) => c === '')}
          onClick={checkGaps}
          className="px-10 py-4 bg-[#269984] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#269984]/30 hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
        >
          {t('course.quiz.check')}
        </button>
      )}

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-3xl border-2 text-center flex flex-col items-center gap-3 w-full max-w-md ${
            correctCount === blankCount
              ? 'border-green-500 bg-green-500/5'
              : 'border-red-500 bg-red-500/5'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              correctCount === blankCount ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {correctCount === blankCount ? <Check /> : <X />}
          </div>
          <h5
            className={`font-black uppercase tracking-[0.2em] text-xs ${
              correctCount === blankCount ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {correctCount === blankCount
              ? t('course.quiz.gapfill_success')
              : t('course.quiz.gapfill_fail')}
          </h5>
          <p className="text-sm font-medium text-gray-500">
            {correctCount === blankCount
              ? t('course.quiz.gapfill_success_desc')
              : t('course.quiz.gapfill_fail_desc')}
          </p>
          {correctCount < blankCount && (
            <p className="text-xs font-bold text-gray-400">
              {correctCount} / {blankCount} {t('courses.summary.earned')}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
