'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';

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
  const { markCoursePhaseComplete, setCoursePhaseResult } = useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const initialLeft = phase.matching?.map((m, i) => ({ id: `L-${i}`, text: m.left })) || [];
  const initialRight = phase.matching?.map((m, i) => ({ id: `R-${i}`, text: m.right })) || [];

  // Shuffle right side for the challenge
  const [shuffledRight, setShuffledRight] = useState(() =>
    [...initialRight].sort(() => Math.random() - 0.5),
  );

  const [matches, setMatches] = useState<MatchPair[]>(() =>
    initialLeft.map((l) => ({ leftId: l.id, rightId: null })),
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleLeftSelect = (id: string) => {
    if (isDone || showFeedback) return;
    setSelectedLeft(id);
  };

  const handleRightSelect = (id: string) => {
    if (isDone || showFeedback || !selectedLeft) return;

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

    const allCorrect = results.every((r) => r.isCorrect);
    if (!allCorrect) onMistake?.();
    setCoursePhaseResult(courseId, phase.phaseId, allCorrect ? 'success' : 'fail');
    markCoursePhaseComplete(courseId, phase.phaseId);
  };

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        {/* Left Side (Labels) */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            Kategóriák
          </h4>
          {initialLeft.map((item) => {
            const match = matches.find((m) => m.leftId === item.id);
            const isSelected = selectedLeft === item.id;
            const rightItem = shuffledRight.find((r) => r.id === match?.rightId);

            return (
              <button
                key={item.id}
                onClick={() => handleLeftSelect(item.id)}
                className={`w-full group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#269984] bg-[#269984]/5 shadow-md'
                    : 'border-gray-100 bg-white/50 hover:border-[#269984]/30'
                }`}
              >
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200">
                  {item.text}
                </span>
                <AnimatePresence>
                  {rightItem && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-black ${
                        showFeedback
                          ? match?.isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-[#269984]/10 text-[#269984]'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                      {rightItem.text}
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
            Válaszlehetőségek
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {shuffledRight.map((item) => {
              const isUsed = matches.some((m) => m.rightId === item.id);
              return (
                <button
                  key={item.id}
                  disabled={isDone || showFeedback || isUsed}
                  onClick={() => handleRightSelect(item.id)}
                  className={`p-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                    isUsed
                      ? 'border-transparent bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 bg-white hover:border-[#269984] hover:shadow-lg'
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
        <button
          disabled={matches.some((m) => m.rightId === null)}
          onClick={checkMatches}
          className="self-center mt-8 px-10 py-4 bg-[#269984] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#269984]/30 hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
        >
          Ellenőrzés
        </button>
      )}

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border-2 text-center flex flex-col items-center gap-3 ${
            matches.every((m) => m.isCorrect)
              ? 'border-green-500 bg-green-500/5'
              : 'border-red-500 bg-red-500/5'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              matches.every((m) => m.isCorrect)
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {matches.every((m) => m.isCorrect) ? <Check /> : <X />}
          </div>
          <h5
            className={`font-black uppercase tracking-[0.2em] text-xs ${
              matches.every((m) => m.isCorrect) ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {matches.every((m) => m.isCorrect) ? 'Szuper munka!' : 'Valami nem stimmel...'}
          </h5>
          <p className="text-sm font-medium text-gray-500">
            {matches.every((m) => m.isCorrect)
              ? 'Sikeresen párosítottad az összes elemet.'
              : 'Próbáld meg jobban megfigyelni az összefüggéseket legközelebb!'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
