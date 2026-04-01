'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { CheckCircle, XCircle, HelpCircle, RotateCcw } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useLocale } from '../../i18n/LocaleProvider';
import { getCodeTemplate, type BlankSlot } from '../../../lib/algorithms/codeTemplates';

interface CodeExerciseProps {
  algorithmId: string;
}

export default function CodeExercise({ algorithmId }: CodeExerciseProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'create');

  const template = useMemo(() => getCodeTemplate(algorithmId), [algorithmId]);

  // State for each blank: { value, isCorrect, attempts }
  const [blankStates, setBlankStates] = useState<
    Record<string, { value: string; isCorrect: boolean | null; attempts: number }>
  >(() => {
    if (!template) return {};
    const initial: Record<string, { value: string; isCorrect: boolean | null; attempts: number }> =
      {};
    for (const blank of template.blanks) {
      initial[blank.id] = { value: '', isCorrect: null, attempts: 0 };
    }
    return initial;
  });

  const [helpActive, setHelpActive] = useState(false);
  const [dragCards, setDragCards] = useState<Record<string, string[]>>(() => {
    if (!template) return {};
    const cards: Record<string, string[]> = {};
    for (const blank of template.blanks) {
      // Shuffle options
      cards[blank.id] = [...blank.options].sort(() => Math.random() - 0.5);
    }
    return cards;
  });
  const [activeBlank, setActiveBlank] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const startTime = useMemo(() => Date.now(), []);

  if (!template) {
    return (
      <div className="text-center py-20 text-gray-500">
        {t('algorithms.detail.coming_soon')}
      </div>
    );
  }

  const blanksMap = useMemo(() => {
    const map: Record<string, BlankSlot> = {};
    for (const b of template.blanks) map[b.id] = b;
    return map;
  }, [template]);

  const filledCount = Object.values(blankStates).filter((b) => b.isCorrect === true).length;
  const totalBlanks = template.blanks.length;

  // Check a single blank
  const checkBlank = useCallback(
    (blankId: string) => {
      const blank = blanksMap[blankId];
      if (!blank) return;

      const state = blankStates[blankId];
      const trimmed = state.value.trim();
      const isCorrect = trimmed.toLowerCase() === blank.answer.toLowerCase();

      setBlankStates((prev) => ({
        ...prev,
        [blankId]: {
          ...prev[blankId],
          isCorrect,
          attempts: prev[blankId].attempts + 1,
        },
      }));

      trackEvent('create_blank_attempt', {
        blankId,
        typed: trimmed,
        correct: isCorrect,
        answer: blank.answer,
      });

      // Check if all correct
      const allCorrect =
        isCorrect &&
        Object.entries(blankStates).every(([id, s]) =>
          id === blankId ? true : s.isCorrect === true,
        );

      if (allCorrect) {
        setIsComplete(true);
        setActiveBlank(null);
        const elapsed = Date.now() - startTime;
        const firstTryCorrect = Object.values(blankStates).filter(
          (s) => s.isCorrect === true && s.attempts === 0,
        ).length + (blankStates[blankId].attempts === 0 ? 1 : 0);

        trackEvent('create_complete', {
          helpUsed: helpActive,
          timeMs: elapsed,
          blanksCorrectFirst: firstTryCorrect,
          totalBlanks,
        });
        updateProgress({
          createCompleted: true,
          createHelpUsed: helpActive,
          createBlanksCorrectFirst: firstTryCorrect,
          createBlanksTotal: totalBlanks,
          createTotalTimeMs: elapsed,
          createCompletedAt: new Date().toISOString(),
        });
      } else if (isCorrect) {
        // Auto-advance to next empty blank if this one is correct
        const nextEmpty = template?.blanks.find(
          (b) => b.id !== blankId && blankStates[b.id]?.isCorrect !== true
        );
        if (nextEmpty) {
          setActiveBlank(nextEmpty.id);
        } else {
          setActiveBlank(null);
        }
      }
    },
    [blanksMap, blankStates, helpActive, startTime, totalBlanks, trackEvent, updateProgress, template],
  );

  // Handle typing in a blank
  const handleBlankChange = (blankId: string, value: string) => {
    setBlankStates((prev) => ({
      ...prev,
      [blankId]: { ...prev[blankId], value, isCorrect: null },
    }));
  };

  // Handle Enter key for checking
  const handleKeyDown = (e: React.KeyboardEvent, blankId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkBlank(blankId);
    }
  };

  // Activate help
  const handleHelp = () => {
    setHelpActive(true);
    trackEvent('create_help_activated');
    
    if (!activeBlank) {
      const firstEmpty = template?.blanks.find(b => blankStates[b.id]?.isCorrect !== true);
      if (firstEmpty) {
        setActiveBlank(firstEmpty.id);
      }
    }
  };

  // Drag a card into a blank
  const handleCardClick = (blankId: string, cardValue: string) => {
    setBlankStates((prev) => ({
      ...prev,
      [blankId]: { ...prev[blankId], value: cardValue, isCorrect: null },
    }));
    trackEvent('create_card_drag', { blankId, card: cardValue });
    // Auto-check after dragging
    setTimeout(() => checkBlank(blankId), 300);
  };

  // Reset
  const handleReset = () => {
    const initial: Record<string, { value: string; isCorrect: boolean | null; attempts: number }> =
      {};
    for (const blank of template.blanks) {
      initial[blank.id] = { value: '', isCorrect: null, attempts: 0 };
    }
    setBlankStates(initial);
    setIsComplete(false);
    setHelpActive(false);
    trackEvent('create_reset');
  };

  // Render code line with blanks
  const renderLine = (lineText: string, indent: number, lineIdx: number) => {
    // Split on {{blankId}} markers
    const parts = lineText.split(/(\{\{[^}]+\}\})/g);

    return (
      <div
        key={lineIdx}
        className="flex items-center gap-0 py-1"
        style={{ paddingLeft: `${indent * 24}px` }}
      >
        {/* Line number */}
        <span className="w-8 text-right mr-4 text-xs font-mono text-gray-400 dark:text-gray-600 select-none flex-shrink-0">
          {lineIdx + 1}
        </span>

        {/* Code content */}
        <div className="flex flex-wrap items-center gap-0">
          {parts.map((part, partIdx) => {
            const blankMatch = part.match(/\{\{(.+)\}\}/);
            if (blankMatch) {
              const blankId = blankMatch[1];
              const blank = blanksMap[blankId];
              const state = blankStates[blankId];
              if (!blank || !state) return null;

              return (
                <span key={partIdx} className="inline-flex flex-col items-start mx-1">
                  <input
                    type="text"
                    value={state.value}
                    onChange={(e) => handleBlankChange(blankId, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, blankId)}
                    onFocus={() => setActiveBlank(blankId)}
                    placeholder={blank.placeholder}
                    disabled={state.isCorrect === true}
                    className={`inline-block font-mono text-sm px-2 py-0.5 rounded-lg border-2 transition-all outline-none min-w-[60px] ${
                      state.isCorrect === true
                        ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                        : state.isCorrect === false
                          ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 animate-[shake_0.3s_ease-in-out]'
                          : 'border-[#269984]/30 bg-white dark:bg-[#151515] text-black dark:text-white focus:border-[#269984]'
                    }`}
                    style={{ width: `${blank.widthCh + 2}ch` }}
                  />
                  {/* Inline feedback icon */}
                  {state.isCorrect === true && (
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 ml-1" />
                  )}
                  {state.isCorrect === false && (
                    <XCircle className="w-3 h-3 text-red-500 mt-0.5 ml-1" />
                  )}
                </span>
              );
            }

            // Regular code text — apply syntax highlighting
            return (
              <span key={partIdx} className="font-mono text-sm">
                {highlightSyntax(part)}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat font-bold text-lg text-black dark:text-white">
          {t('create.title')}
        </h3>
        <div className="flex items-center gap-3">
          {!helpActive && (
            <button
              onClick={handleHelp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-montserrat font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              {t('create.help')}
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#269984]"
            animate={{ width: `${(filledCount / totalBlanks) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="font-montserrat font-bold text-xs text-gray-500">
          {t('create.progress')
            .replace('{filled}', String(filledCount))
            .replace('{total}', String(totalBlanks))}
        </span>
      </div>

      {/* Help badge */}
      {helpActive && (
        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-montserrat text-xs font-bold">
          💡 {t('create.help_active')}
        </div>
      )}

      {/* Code Editor */}
      <div className="rounded-2xl bg-[#1e1e2e] dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#181825] dark:bg-[#080808] border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs font-mono text-gray-500">{template.language}</span>
        </div>
        <div className="p-4 sm:p-6 overflow-x-auto">
          {template.lines.map((line, idx) => renderLine(line.text, line.indent, idx))}
        </div>
      </div>

      {/* Help Cards — shown when help is active */}
      <AnimatePresence>
        {helpActive && activeBlank && dragCards[activeBlank] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap gap-2 p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <span className="w-full font-montserrat text-xs text-gray-500 mb-1">
              {t('create.help_active')}:
            </span>
            {dragCards[activeBlank].map((card) => {
              const isUsed = blankStates[activeBlank]?.value === card && blankStates[activeBlank]?.isCorrect === true;
              return (
                <motion.button
                  key={card}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(activeBlank, card)}
                  disabled={isUsed}
                  className={`px-4 py-2 rounded-xl font-mono text-sm border-2 transition-all cursor-pointer ${
                    isUsed
                      ? 'border-green-500/30 bg-green-500/10 text-green-500 opacity-50 cursor-not-allowed'
                      : 'border-[#269984]/20 bg-[#269984]/5 text-[#269984] hover:border-[#269984] hover:bg-[#269984]/10'
                  }`}
                >
                  {card}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#269984] to-[#1f7a6a] text-white text-center shadow-2xl shadow-[#269984]/20"
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-montserrat font-bold text-xl mb-2">
            {t('create.all_correct')}
          </h3>
          {helpActive && (
            <p className="font-montserrat text-sm opacity-70 mt-1">
              {t('create.used_help')}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Simple syntax highlighting for pseudocode keywords.
 * Returns React elements with color classes.
 */
function highlightSyntax(text: string): React.ReactNode[] {
  const keywords = ['function', 'for', 'if', 'return', 'to', 'swap'];
  const parts = text.split(/\b/);

  return parts.map((part, i) => {
    const lower = part.toLowerCase().trim();
    if (keywords.includes(lower)) {
      return (
        <span key={i} className="text-purple-400 font-bold">
          {part}
        </span>
      );
    }
    if (/^(arr|i|j|n)$/.test(lower)) {
      return (
        <span key={i} className="text-cyan-400">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={i} className="text-amber-400">
          {part}
        </span>
      );
    }
    if (/^[+\-*/><=!]+$/.test(part)) {
      return (
        <span key={i} className="text-pink-400">
          {part}
        </span>
      );
    }
    return (
      <span key={i} className="text-gray-300">
        {part}
      </span>
    );
  });
}
