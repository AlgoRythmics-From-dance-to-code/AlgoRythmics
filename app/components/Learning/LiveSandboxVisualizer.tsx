'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { SimulationResult } from '../../../lib/algorithms/liveSimulator';

interface LiveSandboxVisualizerProps {
  simulation: SimulationResult;
  className?: string;
}

export default function LiveSandboxVisualizer({
  simulation,
  className = '',
}: LiveSandboxVisualizerProps) {
  const { t } = useLocale();

  const maxVal = Math.max(...simulation.resultArray, ...simulation.initialArray, 1);

  // Helper for message interpolation
  const getFeedbackMessage = (): string => {
    let msg = t(simulation.feedbackKey) || '';
    if (simulation.feedbackParams) {
      for (const [k, v] of Object.entries(simulation.feedbackParams)) {
        msg = msg.split(`{${k}}`).join(String(v));
      }
    }
    return msg;
  };

  const getStatusBadge = () => {
    switch (simulation.status) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          bg: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
          title: t('sandbox.status_success') || 'Sorted (Ascending)',
        };
      case 'reversed':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
          bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
          title: t('sandbox.status_reversed') || 'Reversed (Descending)',
        };
      case 'partial':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          title: t('sandbox.status_wrong') || 'Incorrect value',
        };
      case 'incomplete':
        return {
          icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          title: (t('sandbox.status_incomplete') || 'Awaiting completion ({filled}/{total})')
            .replace('{filled}', String(simulation.filledCount))
            .replace('{total}', String(simulation.totalBlanks)),
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          title: t('sandbox.status_error') || 'Error',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className={`w-full rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col p-4 sm:p-5 gap-4 ${className}`}
    >
      {/* Header: Title + Real-time Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#269984]/10 text-[#269984]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-montserrat font-bold text-xs sm:text-sm text-black dark:text-white leading-tight">
              {t('sandbox.title') || 'Your Code Result (Live Preview)'}
            </h4>
            <span className="text-[10px] text-gray-400 font-montserrat">
              {t('sandbox.subtitle') || 'Instant simulation on the test array'}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-montserrat font-bold transition-all ${badge.bg}`}
        >
          {badge.icon}
          <span>{badge.title}</span>
        </div>
      </div>

      {/* Comparison: Animated Bar Chart for Outcome Array */}
      <div className="flex flex-col gap-3">
        <div className="w-full h-44 flex items-end justify-center gap-2 sm:gap-3 p-4 bg-gray-50/70 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            {simulation.resultArray.map((val, idx) => {
              const isSuccess = simulation.status === 'success';
              const isReversed = simulation.status === 'reversed';
              const isFound = simulation.target !== undefined && val === simulation.target;

              let bgColor = '#cbd5e1'; // neutral slate
              let textColor = 'text-gray-500';

              if (isSuccess) {
                bgColor = '#4ade80'; // vibrant green
                textColor = 'text-green-600 dark:text-green-400 font-bold';
              } else if (isReversed) {
                bgColor = '#fb923c'; // vibrant orange
                textColor = 'text-orange-600 dark:text-orange-400 font-bold';
              } else if (simulation.status === 'partial') {
                bgColor = '#f87171'; // red for error
                textColor = 'text-red-600 dark:text-red-400 font-bold';
              } else if (simulation.status === 'incomplete') {
                bgColor = '#94a3b8'; // subtle slate
                textColor = 'text-gray-500 dark:text-gray-400';
              }

              if (isFound) {
                bgColor = '#a855f7'; // purple
                textColor = 'text-purple-600 dark:text-purple-400 font-bold';
              }

              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    backgroundColor: bgColor,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 25,
                  }}
                  className="flex-1 max-w-[56px] min-h-[24px] rounded-t-xl relative shadow-sm"
                  style={{ height: `${(val / maxVal) * 82}%` }}
                >
                  {/* Number Badge above bar */}
                  <motion.span
                    layout
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 font-montserrat text-xs sm:text-sm ${textColor}`}
                  >
                    {val}
                  </motion.span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Small array values summary row */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 py-2 px-3 rounded-xl">
          <span className="text-[11px] font-montserrat font-bold text-gray-400">
            {t('sandbox.original') || 'Initial:'}
          </span>
          <span>[{simulation.initialArray.join(', ')}]</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-montserrat font-bold text-gray-400">
            {t('sandbox.output') || 'Output:'}
          </span>
          <span
            className={`font-bold ${
              simulation.status === 'success'
                ? 'text-green-600 dark:text-green-400'
                : simulation.status === 'reversed'
                  ? 'text-orange-500'
                  : simulation.status === 'partial'
                    ? 'text-red-500'
                    : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            [{simulation.resultArray.join(', ')}]
          </span>
        </div>
      </div>

      {/* Diagnostic Explanation Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all ${
          simulation.status === 'success'
            ? 'bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300'
            : simulation.status === 'reversed'
              ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30 text-orange-800 dark:text-orange-300'
              : simulation.status === 'partial'
                ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300'
                : 'bg-gray-50/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {simulation.status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : simulation.status === 'reversed' ? (
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          ) : simulation.status === 'partial' ? (
            <XCircle className="w-4 h-4 text-red-500" />
          ) : (
            <HelpCircle className="w-4 h-4 text-amber-500" />
          )}
        </div>
        <p className="text-xs sm:text-[13px] font-montserrat font-medium leading-relaxed">
          {getFeedbackMessage()}
        </p>
      </div>
    </div>
  );
}
