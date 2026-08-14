'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Activity } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';

interface VariableWatchPanelProps {
  variables?: Record<string, string | number | boolean | null | undefined>;
  className?: string;
}

export default function VariableWatchPanel({ variables, className = '' }: VariableWatchPanelProps) {
  const { t } = useLocale();

  const entries = variables
    ? Object.entries(variables).filter(([_, val]) => val !== undefined && val !== null)
    : [];

  return (
    <div
      className={`w-full rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Eye className="w-4 h-4" />
          </div>
          <span className="font-montserrat font-bold text-xs sm:text-sm text-black dark:text-white">
            {t('visualizer.variable_watch') || 'Variable Watch'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400">
          <Activity className="w-3.5 h-3.5 text-[#269984] animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Variables Grid */}
      <div className="p-3 sm:p-4 min-h-[90px] flex items-center">
        {entries.length === 0 ? (
          <div className="w-full text-center py-3 text-xs text-gray-400 font-montserrat">
            {t('visualizer.no_active_variables') || 'No active variables at this step'}
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
            <AnimatePresence mode="popLayout">
              {entries.map(([key, val]) => {
                const isBoolean = typeof val === 'boolean';
                const isHighlight =
                  key === 'pivot' || key === 'key' || key === 'minIdx' || key === 'target';

                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                      isHighlight
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/30'
                        : 'bg-gray-50/80 dark:bg-white/5 border-gray-100 dark:border-white/5'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400 truncate mr-2">
                      {key}:
                    </span>
                    <motion.span
                      key={`${key}-${val}`}
                      initial={{ scale: 1.2, color: '#269984' }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`font-mono text-xs sm:text-sm font-bold truncate ${
                        isBoolean
                          ? val
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                          : isHighlight
                            ? 'text-purple-700 dark:text-purple-300'
                            : 'text-black dark:text-white'
                      }`}
                    >
                      {String(val)}
                    </motion.span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
