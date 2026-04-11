'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Bug } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';

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

  const debugLines = phase.debugCode?.split('\n') || [];
  const expectedLines = phase.expectedCode?.split('\n') || [];

  // Find which line is different (the bug)
  const bugLineIndex = debugLines.findIndex((line, i) => line.trim() !== expectedLines[i]?.trim());

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleLineClick = (idx: number) => {
    if (isDone || showFeedback) return;
    setSelectedIndex(idx);
  };

  const checkBug = () => {
    if (selectedIndex === null) return;

    const correct = selectedIndex === bugLineIndex;
    setIsCorrect(correct);
    if (!correct) onMistake?.();

    // Set points immediately (100% or 0%)
    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: correct ? (phase.maxPoints ?? 10) : 0,
      max: phase.maxPoints ?? 10,
      helpUsed: false,
      partial: false,
    });

    setShowFeedback(true);

    setCoursePhaseResult(courseId, phase.phaseId, correct ? 'success' : 'fail');
    markCoursePhaseComplete(courseId, phase.phaseId);

    // Sync to backend immediately
    setTimeout(() => syncProgress(), 0);
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
        <button
          disabled={selectedIndex === null}
          onClick={checkBug}
          className="px-10 py-4 bg-[#269984] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#269984]/30 hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
        >
          {t('course.quiz.debug_title')}
        </button>
      )}

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-3xl border-2 text-center flex flex-col items-center gap-3 w-full max-w-md ${
            isCorrect ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isCorrect ? <Check /> : <X />}
          </div>
          <h5
            className={`font-black uppercase tracking-[0.2em] text-xs ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isCorrect ? t('course.quiz.debug_success') : t('course.quiz.debug_fail')}
          </h5>
          <p className="text-sm font-medium text-gray-500">
            {isCorrect ? t('course.quiz.debug_success_desc') : t('course.quiz.debug_fail_desc')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
