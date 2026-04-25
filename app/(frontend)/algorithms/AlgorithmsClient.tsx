'use client';

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { Search, Grid2X2, X, BarChart3, Activity, ArrowRight, Smile } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { ALGORITHMS } from '../../../lib/constants';
import AlgorithmCard from '../../components/AlgorithmCard';
import { useShallow } from 'zustand/react/shallow';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useGlobalAnalytics } from '../../hooks/useGlobalAnalytics';
import { useDebounce } from '../../hooks/useDebounce';

type Category = 'all' | 'sorting' | 'searching' | 'backtracking' | 'fun';

export default function AlgorithmsClient() {
  const { activeCategory, setCategory, searchQuery, setSearchQuery, completedIds } =
    useAlgorithmStore(
      useShallow((state) => ({
        activeCategory: state.activeCategory,
        setCategory: state.setCategory,
        searchQuery: state.searchQuery,
        setSearchQuery: state.setSearchQuery,
        completedIds: state.completedIds,
      })),
    );
  const { t, locale } = useLocale();
  const { trackSearch, trackGlobalEvent } = useGlobalAnalytics();
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 1000);
  const lastTrackedQuery = useRef('');

  // Categories helper
  const categories = [
    { id: 'all', label: t('algorithms.filters.all'), icon: <Grid2X2 className="w-4 h-4" /> },
    {
      id: 'sorting',
      label: t('algorithms.categories.sorting'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'searching',
      label: t('algorithms.categories.searching'),
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'backtracking',
      label: t('algorithms.categories.backtracking'),
      icon: <Activity className="w-4 h-4" />,
    },
    { id: 'fun', label: t('algorithms.categories.fun'), icon: <Smile className="w-4 h-4" /> },
  ];

  // Filter logic
  const filteredAlgorithms = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return ALGORITHMS.filter((algo) => {
      const matchesCategory = activeCategory === 'all' || algo.category === activeCategory;

      const localizedName = t(`algorithms.list.${algo.id}.name`).toLowerCase();
      const localizedDesc = t(`algorithms.list.${algo.id}.description`).toLowerCase();
      const localizedCategory = t(`algorithms.categories.${algo.category}`).toLowerCase();
      const localizedDifficulty = t(
        `algorithm_card.difficulty.${algo.difficulty.toLowerCase()}`,
      ).toLowerCase();

      const matchesSearch =
        localizedName.includes(query) ||
        localizedDesc.includes(query) ||
        localizedCategory.includes(query) ||
        localizedDifficulty.includes(query) ||
        algo.category.toLowerCase().includes(query) ||
        algo.difficulty.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, t]);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [isScrolled, setIsScrolled] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentSearchQuery = searchQuery.trim();
    if (
      !debouncedSearchQuery ||
      debouncedSearchQuery !== currentSearchQuery ||
      debouncedSearchQuery === lastTrackedQuery.current
    ) {
      return;
    }

    trackSearch(debouncedSearchQuery, filteredAlgorithms.length, locale, activeCategory);
    lastTrackedQuery.current = debouncedSearchQuery;
  }, [
    debouncedSearchQuery,
    searchQuery,
    filteredAlgorithms.length,
    locale,
    activeCategory,
    trackSearch,
  ]);

  // Track category changes
  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    trackGlobalEvent('category_changed', { category: cat });
  };

  // Accurate scroll detection for sticky "contact" moment
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setIsScrolled(window.scrollY >= heroRef.current.offsetHeight - 2);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sliding pill logic with layout stabilization
  useLayoutEffect(() => {
    const updatePill = () => {
      const activeBtn = buttonRefs.current[activeCategory];
      if (activeBtn) {
        setPillStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
          opacity: 1,
        });
      }
    };

    // Initial update
    updatePill();

    // Small delay to handle potential layout shifts/font loading
    const timer = setTimeout(updatePill, 100);

    // Add window resize listener to keep pill aligned
    window.addEventListener('resize', updatePill);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePill);
    };
  }, [activeCategory, t]);

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen pt-5">
      {/* Ultra-Minimal Localized Hero (No Title) */}
      <div ref={heroRef} className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-5 pb-3">
        <p className="font-montserrat font-bold text-xs sm:text-sm text-[#999] dark:text-gray-500 max-w-4xl leading-relaxed animate-in fade-in slide-in-from-left-4 duration-1000">
          {t('algorithms.inspiring_text')}
        </p>

        {/* Learning Progress Indicator */}
        <div className="flex items-center gap-2 mt-5 animate-in fade-in slide-in-from-left-6 duration-1000">
          <div className="h-1.5 w-32 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#269984] transition-all duration-700"
              style={{ width: `${(completedIds.length / ALGORITHMS.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-montserrat font-bold text-[#269984] uppercase tracking-wider">
            {completedIds.length} / {ALGORITHMS.length} {t('common.completed') || 'Completed'}
          </span>
        </div>
      </div>

      {/* Premium Sticky Filter Bar — Morphs on scroll */}
      <div
        className={`w-full sticky top-[var(--header-height)] z-30 transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] py-3'
            : 'bg-transparent border-transparent shadow-none py-4'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
            {/* Elegant Sliding Pilled Category Tabs */}
            <div
              className={`relative flex items-center p-1 rounded-2xl overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors duration-500 ${
                isScrolled ? 'bg-gray-100/30 dark:bg-white/5' : 'bg-transparent'
              }`}
            >
              {/* The Sliding Pill */}
              <div
                className="absolute h-[calc(100%-8px)] bg-[#269984] rounded-xl transition-all duration-300 ease-out -z-10 shadow-sm"
                style={{
                  left: pillStyle.left,
                  width: pillStyle.width,
                  opacity: pillStyle.opacity,
                }}
              />

              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => {
                      buttonRefs.current[cat.id] = el;
                    }}
                    onClick={() => handleCategoryChange(cat.id as Category)}
                    className={`relative px-4 sm:px-5 py-2 rounded-xl font-montserrat font-bold text-[11px] sm:text-xs lg:text-sm transition-colors duration-300 whitespace-nowrap cursor-pointer z-10 ${
                      isActive
                        ? 'text-white'
                        : `text-[#999] dark:text-gray-500 hover:text-[#269984] dark:hover:text-gray-300`
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Premium Focused Search Input */}
            <div className={`relative w-full lg:max-w-[340px] group transition-all duration-500`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] dark:text-gray-600 group-focus-within:text-[#269984] transition-colors" />
              <input
                type="text"
                placeholder={t('sidebar.search_placeholder') || 'Find an algorithm...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border transition-all duration-500 outline-none font-montserrat text-sm text-black dark:text-white shadow-sm focus:ring-4 focus:ring-[#269984]/5 rounded-xl py-2.5 sm:py-3 pl-11 pr-10 ${
                  isScrolled
                    ? 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 focus:border-[#269984]/40 dark:focus:border-[#269984]/50 group-hover:border-gray-300 dark:group-hover:border-white/20'
                    : 'bg-gray-50/50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#269984]/30'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-white hover:bg-[#269984] transition-all scale-75 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div
        key={`${activeCategory}-${searchQuery}`}
        className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 md:py-20"
      >
        {filteredAlgorithms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredAlgorithms.map((algo, index) => (
              <AlgorithmCard key={algo.id} algorithm={algo} index={index} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="w-full py-20 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-white/5 mb-6">
              <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="font-montserrat font-bold text-2xl text-black dark:text-white mb-2">
              {t('algorithms.empty.noAlgorithms')}
            </h3>
            <p className="font-montserrat text-[#666] dark:text-gray-500">
              {t('algorithms.empty.adjustSearchOrFilters')}
            </p>
            <button
              onClick={() => setCategory('all')}
              className="bg-[#269984] hover:bg-[#1f7a6a] text-white px-6 py-2.5 rounded-xl font-montserrat font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[#269984]/20"
            >
              {t('algorithms.empty.clearFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
        <div className="relative w-full p-10 md:p-16 rounded-[40px] bg-[#269984] overflow-hidden group shadow-2xl shadow-[#269984]/20">
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="font-montserrat font-bold text-3xl sm:text-4xl text-white mb-6 leading-tight">
                {t('algorithms.cta.title')}
                <br />
                <span className="opacity-80">{t('algorithms.cta.subtitle')}</span>
              </h2>
              <p className="font-montserrat text-white/80 mb-8 text-lg">
                {t('algorithms.cta.description')}
              </p>
            </div>

            <Link
              href="/courses"
              className="flex-shrink-0 group/btn relative inline-flex items-center justify-center font-montserrat font-bold bg-white text-[#269984] px-10 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20"
            >
              {t('algorithms.cta.button')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
