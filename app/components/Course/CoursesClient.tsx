'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CourseBlueprint } from '../../../lib/courses/courseCatalog';
import { Search, ChevronDown, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import RestartCourseModal from './RestartCourseModal';

interface CoursesClientProps {
  courses: CourseBlueprint[];
}

const ITEMS_PER_PAGE = 10;

export default function CoursesClient({ courses }: CoursesClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { courseProgress, resetCourseProgress, resetAlgorithmProgressTab, syncProgress } =
    useAlgorithmStore();

  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [selectedCourse, setSelectedCourse] = useState<CourseBlueprint | null>(null);
  const [showRestartModal, setShowRestartModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Tab filter
      const isCompleted = !!courseProgress[course.slug]?.isCompleted;
      if (activeTab === 'completed' && !isCompleted) return false;
      if (activeTab === 'available' && isCompleted) return false;

      // Search filter
      if (
        searchQuery &&
        !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.summary.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && course.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    });
  }, [courses, courseProgress, activeTab, searchQuery, difficultyFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const completedCount = useMemo(() => {
    return courses.filter((c) => !!courseProgress[c.slug]?.isCompleted).length;
  }, [courses, courseProgress]);

  const availableCount = courses.length - completedCount;

  // Reset page when filters change or clamp when list shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, difficultyFilter, activeTab]);

  const handleCourseClick = (course: CourseBlueprint) => {
    const isCompleted = !!courseProgress[course.slug]?.isCompleted;
    if (isCompleted) {
      setSelectedCourse(course);
      setShowRestartModal(true);
    } else {
      router.push(`/courses/${course.slug}`);
    }
  };

  const handleConfirmRestart = () => {
    if (!selectedCourse) return;

    resetCourseProgress(selectedCourse.slug);
    const allowedTabs = ['video', 'animation', 'control', 'create', 'alive'];
    selectedCourse.phases.forEach((p) => {
      let tabToReset = p.sourceView;
      if (tabToReset === 'video-custom') tabToReset = 'video';

      if (allowedTabs.includes(tabToReset)) {
        resetAlgorithmProgressTab(p.sourceAlgorithmId || selectedCourse.algorithmId, tabToReset);
      }
    });

    syncProgress();

    setShowRestartModal(false);
    router.push(`/courses/${selectedCourse.slug}`);
  };

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="mb-10 flex flex-col items-center justify-center gap-8">
        <div className="relative flex rounded-2xl bg-gray-100 p-1.5 dark:bg-white/5">
          <button
            onClick={() => setActiveTab('available')}
            className={`relative z-10 flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
              activeTab === 'available'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {activeTab === 'available' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 z-[-1] rounded-xl bg-[#269984] shadow-lg shadow-[#269984]/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span>{t('common.available')}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === 'available' ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'
              }`}
            >
              {availableCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`relative z-10 flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
              activeTab === 'completed'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {activeTab === 'completed' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 z-[-1] rounded-xl bg-[#269984] shadow-lg shadow-[#269984]/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span>{t('common.completed')}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#269984] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-[#269984]/30 rounded-2xl outline-none font-montserrat text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex gap-4">
            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-[#269984]/30 rounded-2xl outline-none font-montserrat text-xs font-black uppercase tracking-widest text-[#269984] cursor-pointer"
              >
                <option value="all">{t('common.all_difficulties')}</option>
                <option value="Beginner">{t('courses.levels.beginner').toUpperCase()}</option>
                <option value="Intermediate">
                  {t('courses.levels.intermediate').toUpperCase()}
                </option>
                <option value="Advanced">{t('courses.levels.advanced').toUpperCase()}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#269984] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${searchQuery}-${difficultyFilter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/5"
        >
          {paginatedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                <Filter className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] leading-6">
                {t('courses.no_matches')}
              </p>
              {(searchQuery || difficultyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDifficultyFilter('all');
                  }}
                  className="mt-6 text-[#269984] font-bold text-sm hover:underline"
                >
                  {t('common.clear_all')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.55fr_0.35fr] gap-4 border-b border-gray-100 px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:border-white/10 md:grid">
                <div>{t('courses.table.name')}</div>
                <div>{t('courses.table.summary')}</div>
                <div>{t('courses.table.duration')}</div>
                <div>{t('courses.table.level')}</div>
                <div>{t('courses.table.points')}</div>
                <div className="text-right">{t('courses.open')}</div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/10">
                {paginatedCourses.map((course) => {
                  const current = courseProgress[course.slug] || {
                    activePhaseIndex: 0,
                    completedPhases: [],
                    points: 0,
                  };
                  const totalCourseMax = course.phases.reduce(
                    (acc, p) => acc + (p.maxPoints ?? 10),
                    0,
                  );

                  return (
                    <button
                      key={course.slug}
                      onClick={() => handleCourseClick(course)}
                      className="w-full text-left grid grid-cols-1 gap-4 px-5 py-6 transition-all hover:bg-gray-50/80 dark:hover:bg-white/[0.03] md:grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.55fr_0.35fr] md:items-center md:gap-6 md:px-8 md:py-8 group cursor-pointer"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] text-3xl shadow-lg transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: `${course.accentColor}15`,
                            color: course.accentColor,
                          }}
                        >
                          {course.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xl font-bold text-black dark:text-white tracking-tight">
                            {course.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="truncate text-[10px] font-black uppercase tracking-widest text-[#269984]">
                              {course.mascot.name}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {course.phases.length} {t('courses.checkpoints')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                        {course.summary}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-sm font-bold text-black dark:text-white">
                        <span className="opacity-30">~</span>
                        {course.estimatedMinutes} {t('common.min')}
                      </div>

                      <div className="flex">
                        <span className="inline-flex rounded-full border border-[#269984]/20 bg-[#269984]/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#269984] shadow-sm">
                          {course.difficulty === 'Beginner'
                            ? t('courses.levels.beginner')
                            : course.difficulty === 'Intermediate'
                              ? t('courses.levels.intermediate')
                              : t('courses.levels.advanced')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-[#269984]">
                          {current.points || 0}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300">
                          / {totalCourseMax}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#269984] md:justify-end">
                        <span className="hidden lg:inline">{t('courses.open')}</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-100 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          currentPage === i + 1
                            ? 'bg-[#269984] text-white shadow-lg shadow-[#269984]/20'
                            : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-100 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <RestartCourseModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleConfirmRestart}
        title={t('course.restart_title')}
        message={t('course.restart_completed_message')}
        confirmLabel={t('course.restart_confirm')}
        cancelLabel={t('course.cancel_back')}
      />
    </div>
  );
}
