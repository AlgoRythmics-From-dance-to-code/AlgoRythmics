'use client';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '../i18n/LocaleProvider';

interface Algorithm {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export default function AlgorithmCard({ algorithm }: { algorithm: Algorithm }) {
  const { t } = useLocale();

  return (
    <div className="group bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-[var(--brand-teal)]/30 dark:hover:border-[var(--brand-teal)]/50 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full shadow-sm hover:shadow-md dark:shadow-none">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          {algorithm.category}
        </div>
        {algorithm.difficulty && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              algorithm.difficulty === 'Easy'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : algorithm.difficulty === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {algorithm.difficulty === 'Easy'
              ? t('algorithm_card.difficulty.easy')
              : algorithm.difficulty === 'Medium'
                ? t('algorithm_card.difficulty.medium')
                : t('algorithm_card.difficulty.hard')}
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-black dark:text-white mb-3 group-hover:text-[var(--brand-teal)] transition-colors">
        {algorithm.title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1">
        {algorithm.description}
      </p>

      <button className="flex items-center gap-2 text-sm font-bold text-black dark:text-white group-hover:text-[var(--brand-teal)] transition-colors mt-auto">
        {t('algorithm_card.read_more')}{' '}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
