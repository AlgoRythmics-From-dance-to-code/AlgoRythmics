'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2 } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { AlgorithmCodeDefinition } from '../../../lib/algorithms/codeDefinitions';

interface CodeTracingPanelProps {
  codeDef?: AlgorithmCodeDefinition;
  highlightLine?: number;
  className?: string;
}

export default function CodeTracingPanel({
  codeDef,
  highlightLine,
  className = '',
}: CodeTracingPanelProps) {
  const { t } = useLocale();
  const [lang, setLang] = useState<'pseudocode' | 'javascript'>('pseudocode');
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;

      if (
        elementTop < containerTop + 40 ||
        elementTop + elementHeight > containerTop + containerHeight - 40
      ) {
        container.scrollTo({
          top: Math.max(0, elementTop - containerHeight / 2 + elementHeight / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [highlightLine]);

  if (!codeDef) return null;

  const lines =
    lang === 'javascript' && codeDef.javascript ? codeDef.javascript : codeDef.pseudocode;
  const hasJs = !!codeDef.javascript;

  return (
    <div
      className={`w-full rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#269984]/10 text-[#269984]">
            <Code2 className="w-4 h-4" />
          </div>
          <span className="font-montserrat font-bold text-xs sm:text-sm text-black dark:text-white">
            {t('visualizer.code_trace') || 'Code Tracing'}
          </span>
        </div>

        {/* Language Tabs */}
        {hasJs && (
          <div className="flex items-center gap-1 p-0.5 bg-gray-200/60 dark:bg-white/10 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setLang('pseudocode')}
              className={`px-2.5 py-1 rounded-md font-montserrat font-bold transition-all ${
                lang === 'pseudocode'
                  ? 'bg-white dark:bg-[#222] text-[#269984] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t('visualizer.pseudocode') || 'Pseudocode'}
            </button>
            <button
              type="button"
              onClick={() => setLang('javascript')}
              className={`px-2.5 py-1 rounded-md font-montserrat font-bold transition-all ${
                lang === 'javascript'
                  ? 'bg-white dark:bg-[#222] text-[#269984] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t('visualizer.js_code') || 'JavaScript'}
            </button>
          </div>
        )}
      </div>

      {/* Code Viewer Container */}
      <div
        ref={containerRef}
        className="p-3 sm:p-4 max-h-[300px] overflow-y-auto font-mono text-xs sm:text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 relative bg-[#0f172a]/95 text-slate-200"
      >
        <div className="flex flex-col gap-0.5">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLine === lineNum;

            return (
              <motion.div
                key={idx}
                ref={isHighlighted ? activeLineRef : null}
                animate={{
                  backgroundColor: isHighlighted ? 'rgba(38, 153, 132, 0.25)' : 'transparent',
                }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 px-2.5 py-1 rounded-lg transition-all relative ${
                  isHighlighted
                    ? 'border-l-4 border-[#269984] shadow-[0_0_12px_rgba(38,153,132,0.3)]'
                    : 'border-l-4 border-transparent hover:bg-white/5'
                }`}
              >
                {/* Active arrow indicator */}
                <div className="w-3 flex-shrink-0 flex items-center justify-center">
                  <AnimatePresence>
                    {isHighlighted && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        className="text-[#3dd9b8] font-bold text-xs"
                      >
                        ▶
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Line number */}
                <span
                  className={`w-6 text-right select-none text-[11px] font-mono flex-shrink-0 ${
                    isHighlighted ? 'text-[#3dd9b8] font-bold' : 'text-slate-500'
                  }`}
                >
                  {lineNum}
                </span>

                {/* Code Text with indent */}
                <span
                  className={`whitespace-pre font-mono transition-colors ${
                    isHighlighted ? 'text-white font-bold' : 'text-slate-300 hover:text-slate-100'
                  }`}
                  style={{ paddingLeft: `${line.indent * 16}px` }}
                >
                  {line.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
