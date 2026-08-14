'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { ConfidenceEvaluationResult } from '../../../lib/courses/confidenceEngine';

interface AdaptiveFeedbackCardProps {
  evaluation: ConfidenceEvaluationResult;
  onRetry?: () => void;
  className?: string;
}

export default function AdaptiveFeedbackCard({
  evaluation,
  onRetry,
  className = '',
}: AdaptiveFeedbackCardProps) {
  const { t } = useLocale();

  const getStyle = () => {
    switch (evaluation.category) {
      case 'mastery':
        return {
          border: 'border-emerald-500/30',
          bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-950/20',
          iconBg: 'bg-emerald-500 text-white',
          icon: <Sparkles className="w-5 h-5 fill-current" />,
          titleColor: 'text-emerald-700 dark:text-emerald-300',
          tag: t('confidence.tag_mastery') || 'Mester szint',
          tagBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        };
      case 'lucky':
        return {
          border: 'border-teal-500/30',
          bg: 'bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/20 dark:via-teal-950/20',
          iconBg: 'bg-teal-500 text-white',
          icon: <BookOpen className="w-5 h-5" />,
          titleColor: 'text-teal-700 dark:text-teal-300',
          tag: t('confidence.tag_lucky') || 'Megerősítendő',
          tagBg: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
        };
      case 'misconception':
        return {
          border: 'border-rose-500/30',
          bg: 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-950/20',
          iconBg: 'bg-rose-500 text-white',
          icon: <AlertTriangle className="w-5 h-5" />,
          titleColor: 'text-rose-700 dark:text-rose-300',
          tag: t('confidence.tag_misconception') || 'Tévhit (Figyelem!)',
          tagBg: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
        };
      default: // doubt
        return {
          border: 'border-amber-500/30',
          bg: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-950/20',
          iconBg: 'bg-amber-500 text-white',
          icon: <Lightbulb className="w-5 h-5" />,
          titleColor: 'text-amber-700 dark:text-amber-300',
          tag: t('confidence.tag_doubt') || 'Rávezető tipp',
          tagBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-2xl border-2 p-5 sm:p-6 shadow-lg flex flex-col gap-4 ${style.border} ${style.bg} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-md ${style.iconBg}`}>{style.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-montserrat font-bold text-base sm:text-lg ${style.titleColor}`}>
                {t(evaluation.titleKey) || 'Kiértékelés'}
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-montserrat font-black uppercase tracking-wider ${style.tagBg}`}
              >
                {style.tag}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat mt-0.5">
              {t(evaluation.subtitleKey) || ''}
            </p>
          </div>
        </div>

        {/* Bonus XP badge for mastery */}
        {evaluation.bonusPoints > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-montserrat font-black text-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>+{evaluation.bonusPoints} Bónusz XP</span>
          </div>
        )}
      </div>

      {/* Comparison block if student chose wrong answer vs correct answer */}
      {evaluation.selectedAnswerText &&
        evaluation.correctAnswerText &&
        evaluation.selectedAnswerText !== evaluation.correctAnswerText && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-montserrat p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex flex-col gap-0.5 text-rose-600 dark:text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t('confidence.your_choice') || 'A te válaszod:'}
              </span>
              <span className="font-semibold">{evaluation.selectedAnswerText}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t('confidence.correct_choice') || 'A helyes válasz:'}
              </span>
              <span className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {evaluation.correctAnswerText}
              </span>
            </div>
          </div>
        )}

      {/* Detailed explanation body */}
      {evaluation.explanationText && (
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-200 leading-relaxed">
          {evaluation.explanationText}
        </div>
      )}

      {/* Retry Action for Doubt/Retryable cases */}
      {evaluation.canRetry && onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-montserrat font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('confidence.retry_action') || 'Újrapróbálkozom a tippel'}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
