'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Check } from 'lucide-react';
import { useLocale } from '../i18n/LocaleProvider';
import { Algorithm } from '../../lib/constants';
import { useAlgorithmStore } from '../store/useAlgorithmStore';

interface AlgorithmCardProps {
  algorithm: Algorithm;
  index: number;
}

export default function AlgorithmCard({ algorithm, index }: AlgorithmCardProps) {
  const { t } = useLocale();

  const { isCompleted } = useAlgorithmStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const completed = mounted ? isCompleted(algorithm.id) : false;

  const name = t(`algorithms.list.${algorithm.id}.name`);
  const description = t(`algorithms.list.${algorithm.id}.description`);

  // Complexity and difficulty colors
  const difficultyColor =
    algorithm.difficulty === 'Easy'
      ? 'text-emerald-500 bg-emerald-500/10'
      : algorithm.difficulty === 'Medium'
        ? 'text-amber-500 bg-amber-500/10'
        : 'text-rose-500 bg-rose-500/10';

  return (
    <Link
      href={`/algorithms/${algorithm.id}`}
      className="group relative flex flex-col bg-white dark:bg-[#151515] rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-[#269984]/10 transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-10 fill-mode-both"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top Banner / Illustration */}
      <div className="relative aspect-[16/10] w-full bg-[#f8fdfc] dark:bg-[#0d0d0d] flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#269984]/5 to-transparent pointer-events-none" />

        {/* Animated background shape */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#269984]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

        <Image
          src={`/assets/${algorithm.illAsset}`}
          alt={name}
          width={200}
          height={200}
          className="w-auto h-32 sm:h-40 object-contain dark:invert dark:hue-rotate-180 drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
        />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span
            className={`text-[10px] font-montserrat font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md ${difficultyColor}`}
          >
            {t(`algorithm_card.difficulty.${algorithm.difficulty.toLowerCase()}`)}
          </span>
          <div className="capitalize font-montserrat font-bold text-[10px] text-[#269984] bg-white/80 dark:bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm border border-[#269984]/10 w-fit">
            {t(`algorithms.categories.${algorithm.category}`).split(' ')[0]}
          </div>
        </div>

        {completed && (
          <div className="absolute top-4 right-4 bg-green-500 text-white p-1.5 rounded-full shadow-lg shadow-green-500/20 z-10 animate-in zoom-in-50 duration-500">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 sm:p-7 flex flex-col">
        <h3 className="font-montserrat font-bold text-xl text-black dark:text-white mb-2 group-hover:text-[#269984] transition-colors line-clamp-1">
          {name}
        </h3>

        <p className="font-montserrat text-sm text-[#666] dark:text-gray-400 leading-relaxed mb-6 line-clamp-3">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-[#999] dark:text-gray-500">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-montserrat font-bold">{algorithm.complexity}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto text-[#269984] font-montserrat font-bold text-sm">
            <span>{t('algorithm_card.read_more')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
