'use client';

import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Check, X, GripVertical } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';

interface OrderingComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

export default function OrderingComponent({ phase, courseId, onMistake }: OrderingComponentProps) {
  const { markCoursePhaseComplete, setCoursePhaseResult } = useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const initialItems = phase.ordering?.map((o, i) => ({ id: `O-${i}`, text: o.text, originalIndex: i })) || [];
  
  // Shuffle for the challenge
  const [items, setItems] = useState(() => 
    [...initialItems].sort(() => Math.random() - 0.5)
  );

  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const checkOrder = () => {
    // Correct if current text order matches initial order (which was 0, 1, 2...)
    const matchesOriginal = items.every((item, idx) => item.originalIndex === idx);
    
    setIsCorrect(matchesOriginal);
    if (!matchesOriginal) onMistake?.();
    setShowFeedback(true);
    
    setCoursePhaseResult(courseId, phase.phaseId, matchesOriginal ? 'success' : 'fail');
    markCoursePhaseComplete(courseId, phase.phaseId);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="w-full max-w-xl">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center">
           Húzd a helyes sorrendbe az elemeket
        </h4>

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={(newOrder) => {
            if (isDone || showFeedback) return;
            setItems(newOrder);
          }}
          className="space-y-3"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 bg-white cursor-grab active:cursor-grabbing transition-all ${
                showFeedback 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-200'
                  : 'border-gray-100 hover:border-[#269984]/30 shadow-sm hover:shadow-md'
              }`}
            >
              <GripVertical className="w-5 h-5 text-gray-300" />
              <span className="font-bold text-gray-700 dark:text-gray-900">{item.text}</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {!showFeedback && !isDone && (
        <button
          onClick={checkOrder}
          className="px-10 py-4 bg-[#269984] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#269984]/30 hover:scale-105 transition-all"
        >
          Ellenőrzés
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
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
             {isCorrect ? <Check /> : <X />}
          </div>
          <h5 className={`font-black uppercase tracking-[0.2em] text-xs ${
            isCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {isCorrect ? 'Tökéletes sorrend!' : 'Majdnem jó...'}
          </h5>
          <p className="text-sm font-medium text-gray-500">
             {isCorrect 
               ? 'Sikeresen felismerted az algoritmus lépéseit.' 
               : 'Nézd át újra a folyamatot és próbáld meg kikövetkeztetni a helyes sorrendet!'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
