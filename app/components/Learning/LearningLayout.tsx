'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from '../../i18n/LocaleProvider';

interface LearningLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  categoryName?: string;
  categoryIcon?: string;
}

export default function LearningLayout({
  children,
  title,
  subtitle,
  backHref,
  backLabel,
  categoryName,
  categoryIcon,
}: LearningLayoutProps) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col pt-[110px]">
      {/* Upper Navigation / Header */}
      <div className="w-full bg-[#F0FBF9] dark:bg-[#112220] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 font-montserrat font-bold text-sm mb-6 text-[#269984] hover:underline transition-all"
          >
            ← {backLabel}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {categoryName && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{categoryIcon || '📚'}</span>
                  <span className="font-montserrat font-bold text-xs uppercase tracking-widest text-[#269984]">
                    {categoryName}
                  </span>
                </div>
              )}
              <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">
                {title}
              </h1>
              {subtitle && (
                <p className="font-montserrat text-base sm:text-lg text-[#666] dark:text-gray-400 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Action buttons could go here */}
            <div className="flex gap-4">
              {/* Future "Mark as completed" etc. */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* Sidebar (Optional - e.g. for Related Videos or Course Progress) */}
          <aside className="lg:w-80 flex-shrink-0 animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="sticky top-[130px] space-y-8">
              {/* This can be extended via props if needed, for now just a simple placeholder */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-montserrat font-bold text-lg text-black dark:text-white mb-4">
                  {t('about.how_it_works')}
                </h3>
                <p className="font-montserrat text-sm text-[#666] dark:text-gray-400 leading-relaxed">
                  {t('about.subtitle')}
                </p>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                   <Link 
                     href="/algorithms"
                     className="block w-full text-center py-3 rounded-xl bg-[#269984] text-white font-montserrat font-bold text-sm hover:bg-[#1f7a6a] transition-all"
                   >
                     {t('nav.algorithms')}
                   </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
