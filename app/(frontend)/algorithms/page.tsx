'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../../i18n/LocaleProvider';

type Category = 'sorting' | 'searching' | 'backtracking';

interface AlgorithmCard {
  id: string;
  category: Category;
  illAsset: string;
}

const sortingAlgorithms: AlgorithmCard[] = [
  {
    id: 'bubble-sort',
    category: 'sorting',
    illAsset: 'algo_group_109.svg',
  },
  {
    id: 'insertion-sort',
    category: 'sorting',
    illAsset: 'algo_group_142.svg',
  },
  {
    id: 'selection-sort',
    category: 'sorting',
    illAsset: 'algo_group_119.svg',
  },
  {
    id: 'shell-sort',
    category: 'sorting',
    illAsset: 'algo_group_132.svg',
  },
  {
    id: 'merge-sort',
    category: 'sorting',
    illAsset: 'algo_group_166.svg',
  },
  {
    id: 'quick-sort',
    category: 'sorting',
    illAsset: 'algo_group_167.svg',
  },
  {
    id: 'heap-sort',
    category: 'sorting',
    illAsset: 'algo_group_168.svg',
  },
];

const searchingAlgorithms: AlgorithmCard[] = [
  {
    id: 'linear-search',
    category: 'searching',
    illAsset: 'algo_group_109.svg',
  },
  {
    id: 'binary-search',
    category: 'searching',
    illAsset: 'algo_group_142.svg',
  },
];

const backtrackingAlgorithms: AlgorithmCard[] = [
  {
    id: 'n-queens',
    category: 'backtracking',
    illAsset: 'algo_group_109.svg',
  },
];

const categories = [
  { key: 'sorting' as const, iconAsset: 'algo_sorting_icon.svg' },
  {
    key: 'searching' as const,
    iconAsset: 'algo_magnifying_glass.svg',
  },
  {
    key: 'backtracking' as const,
    iconAsset: 'algo_backtracking_icon.svg',
  },
];

function getCategoryAlgorithms(cat: Category): AlgorithmCard[] {
  switch (cat) {
    case 'sorting':
      return sortingAlgorithms;
    case 'searching':
      return searchingAlgorithms;
    case 'backtracking':
      return backtrackingAlgorithms;
  }
}

export default function AlgorithmsPage() {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState<Category>('sorting');
  const algorithms = getCategoryAlgorithms(activeCategory);

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* All algorithms bar + category tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-3 p-4 border border-black dark:border-white/20">
          <Image
            src="/assets/algo_list_icon.svg"
            alt=""
            width={23}
            height={19}
            className="w-5 h-4 dark:invert dark:hue-rotate-180"
            style={{ width: 'auto', height: 'auto' }}
          />
          <span className="font-montserrat font-bold text-black dark:text-white text-lg sm:text-2xl">
            {t('algorithms.title')}
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 font-montserrat font-bold transition-all duration-200 py-4 sm:py-5 text-sm sm:text-lg lg:text-xl border border-black dark:border-white/20 ${
                  isActive
                    ? 'bg-[#269984] text-white border-[#269984] dark:border-[#269984]'
                    : 'bg-transparent text-black dark:text-white hover:bg-[#269984] hover:text-white transition-colors'
                }`}
              >
                <Image
                  src={`/assets/${cat.iconAsset}`}
                  alt=""
                  width={23}
                  height={23}
                  className={`w-5 h-5 ${isActive ? 'invert brightness-0' : 'dark:invert'}`}
                  style={{ width: 'auto', height: 'auto' }}
                />
                <span className="hidden sm:inline">{t(`algorithms.categories.${cat.key}`)}</span>
                <span className="sm:hidden">
                  {t(`algorithms.categories.${cat.key}`).split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Algorithm Cards */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
        {algorithms.map((algo, index) => {
          const name = t(`algorithms.list.${algo.id}.name`);
          const description = t(`algorithms.list.${algo.id}.description`);

          return (
            <div key={algo.id}>
              {/* Card: alternating layout */}
              <div
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
              >
                {/* Illustration */}
                <div className="flex-shrink-0 w-48 sm:w-64 md:w-72 lg:w-80">
                  <Image
                    src={`/assets/${algo.illAsset}`}
                    alt={name}
                    width={330}
                    height={330}
                    className="w-full h-auto dark:invert dark:hue-rotate-180"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>

                {/* Text content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-montserrat font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 text-brand-teal-light">
                    {name}
                  </h2>
                  <p className="font-montserrat font-bold text-black dark:text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
                    {description}
                  </p>
                  <Link
                    href={`/algorithms/${algo.id}`}
                    className="inline-flex items-center justify-center font-montserrat font-bold transition-colors border-2 border-[#36D6BA] text-[#36D6BA] hover:bg-[#36D6BA] hover:text-white dark:border-white dark:text-white dark:hover:bg-[#269984] dark:hover:border-[#269984] dark:hover:text-white px-8 py-2.5 text-base sm:text-lg rounded-lg"
                  >
                    {t('algorithms.read_more')}
                  </Link>
                </div>
              </div>

              {/* Separator */}
              {index < algorithms.length - 1 && (
                <div className="border-t-2 border-black dark:border-white/20 mt-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
