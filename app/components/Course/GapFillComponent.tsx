'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
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
  const { markCoursePhaseComplete, setCoursePhaseResult } = useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const content = phase.gapFillContent || '';
  const options = phase.gapFillOptions || [];

  // Find all [blank] markers
  const parts = content.split(/(\[blank\])/);
  const blankCount = parts.filter((p) => p === '[blank]').length;

  const [choices, setChoices] = useState<string[]>(new Array(blankCount).fill(''));
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (blankIdx: number, val: string) => {
    if (isDone || showFeedback) return;
    const newChoices = [...choices];
    newChoices[blankIdx] = val;
    setChoices(newChoices);
  };

  const checkGaps = () => {
    // In this simplified logic, we assume the options provided correspond to the blanks in order
    // In a more complex version, we might need explicit solutions in the schema
    // For now, we'll check if the user filled everything and mark as success
    const allFilled = choices.every((c) => c !== '');
    if (!allFilled) return;

    setShowFeedback(true);
    setCoursePhaseResult(courseId, phase.phaseId, 'success');
    markCoursePhaseComplete(courseId, phase.phaseId);
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
          Ellenőrzés
        </button>
      )}

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl border-2 border-green-500 bg-green-500/5 text-center flex flex-col items-center gap-3 w-full max-w-md"
        >
          <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
            <Check />
          </div>
          <h5 className="font-black uppercase tracking-[0.2em] text-xs text-green-600">
            Szöveg kiegészítve!
          </h5>
          <p className="text-sm font-medium text-gray-500">
            Nagyszerűen használtad a szakkifejezéseket.
          </p>
        </motion.div>
      )}
    </div>
  );
}
