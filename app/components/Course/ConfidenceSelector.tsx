'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, CheckCircle } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { ConfidenceLevel } from '../../../lib/courses/confidenceEngine';

interface ConfidenceSelectorProps {
  selected: ConfidenceLevel | null;
  onChange: (level: ConfidenceLevel) => void;
  disabled?: boolean;
  className?: string;
}

export default function ConfidenceSelector({
  selected,
  onChange,
  disabled = false,
  className = '',
}: ConfidenceSelectorProps) {
  const { t } = useLocale();

  const options: {
    level: ConfidenceLevel;
    icon: React.ReactNode;
    title: string;
    desc: string;
    reward: string;
    rewardBg: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
  }[] = [
    {
      level: 'high',
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      title: t('confidence.level_high') || 'Biztos vagyok',
      desc: t('confidence.desc_high') || '100% tudás',
      reward: t('confidence.reward_high') || '+50% XP Bónusz',
      rewardBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      activeText: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      level: 'medium',
      icon: <CheckCircle className="w-4 h-4 text-amber-500" />,
      title: t('confidence.level_medium') || 'Eléggé biztos',
      desc: t('confidence.desc_medium') || 'Nagyrészt tiszta',
      reward: t('confidence.reward_medium') || 'Normál XP',
      rewardBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      activeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      activeText: 'text-amber-700 dark:text-amber-400',
    },
    {
      level: 'low',
      icon: <HelpCircle className="w-4 h-4 text-sky-500" />,
      title: t('confidence.level_low') || 'Csak tippeltem',
      desc: t('confidence.desc_low') || 'Nem vagyok biztos',
      reward: t('confidence.reward_low') || 'Biztonságos tipp',
      rewardBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20',
      activeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
      activeText: 'text-sky-700 dark:text-sky-400',
    },
  ];

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('confidence.prompt') || 'Mennyire vagy biztos a válaszban?'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.level;
          return (
            <motion.button
              key={opt.level}
              type="button"
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => onChange(opt.level)}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? `${opt.activeBorder} ${opt.activeBg} ${opt.activeText} shadow-md`
                  : 'border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">{opt.icon}</div>
                  <span className="font-montserrat font-bold text-xs truncate leading-tight">
                    {opt.title}
                  </span>
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
              </div>

              <div className="flex items-center justify-between w-full mt-1">
                <span className="font-montserrat text-[10px] text-gray-400 dark:text-gray-400 truncate">
                  {opt.desc}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${opt.rewardBg}`}
                >
                  {opt.reward}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
