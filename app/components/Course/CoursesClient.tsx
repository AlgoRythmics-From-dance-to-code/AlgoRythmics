'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CourseBlueprint } from '../../../lib/courses/courseCatalog';
import { Search, ChevronDown, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import RestartCourseModal from './RestartCourseModal';
import { useRef } from 'react';

interface CoursesClientProps {
  courses: CourseBlueprint[];
  title: string;
  description: string;
}

const ITEMS_PER_PAGE = 20;

export default function CoursesClient({ courses, title, description }: CoursesClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { courseProgress, resetCourseProgress, resetAlgorithmProgressTab, syncProgress } =
    useAlgorithmStore();

  const [activeTab, setActiveTab] = useState<'available' | 'completed'>(() => {
    if (typeof window !== 'undefined') {
      return (
        (sessionStorage.getItem('courses_activeTab') as 'available' | 'completed') || 'available'
      );
    }
    return 'available';
  });
  const [selectedCourse, setSelectedCourse] = useState<CourseBlueprint | null>(null);
  const [showRestartModal, setShowRestartModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('courses_searchQuery') || '';
    }
    return '';
  });
  const [difficultyFilter, setDifficultyFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('courses_difficultyFilter') || 'all';
    }
    return 'all';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('courses_currentPage');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('courses_activeTab', activeTab);
    sessionStorage.setItem('courses_searchQuery', searchQuery);
    sessionStorage.setItem('courses_difficultyFilter', difficultyFilter);
    sessionStorage.setItem('courses_currentPage', currentPage.toString());
  }, [activeTab, searchQuery, difficultyFilter, currentPage]);

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

  const isMounted = useRef(false);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const stats = useMemo(() => {
    const completed = courses.filter((c) => !!courseProgress[c.slug]?.isCompleted).length;
    const totalPoints = Object.values(courseProgress).reduce((acc, p) => acc + (p.points || 0), 0);
    const totalCheckpoints = Object.values(courseProgress).reduce(
      (acc, p) => acc + (p.completedPhases?.length || 0),
      0,
    );
    return {
      completed,
      available: courses.length - completed,
      totalPoints,
      totalCheckpoints,
    };
  }, [courses, courseProgress]);

  // Reset page when filters change or clamp when list shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (isMounted.current) {
      setCurrentPage(1);
    } else {
      isMounted.current = true;
    }
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
      {/* Integrated Header & Controls */}
      <div className="mb-14 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        {/* Title Section */}
        <div className="relative shrink-0 pr-8">
          <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-gradient-to-b from-[#269984] to-transparent opacity-50" />
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#269984]">
            <div className="h-1 w-5 rounded-full bg-[#269984]" />
            {t('courses.learning_paths')}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-black dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        {/* Controls Section: Slim but Wide */}
        <div className="flex flex-1 flex-col items-end gap-3">
          {/* Row 1: Slim Tab Switcher */}
          <div className="relative flex w-full max-w-lg rounded-xl bg-gray-100 p-1 dark:bg-white/5">
            <button
              onClick={() => setActiveTab('available')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'available'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {activeTab === 'available' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 z-[-1] rounded-lg bg-[#269984] shadow-lg shadow-[#269984]/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span>{t('common.available')}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  activeTab === 'available'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-white/10'
                }`}
              >
                {stats.available}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'completed'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {activeTab === 'completed' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 z-[-1] rounded-lg bg-[#269984] shadow-lg shadow-[#269984]/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span>{t('common.completed')}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  activeTab === 'completed'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-white/10'
                }`}
              >
                {stats.completed}
              </span>
            </button>
          </div>

          {/* Row 2: Slim & Wider Search Bar */}
          <div className="flex w-full max-w-2xl gap-3 items-center bg-white dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm focus-within:shadow-md focus-within:border-[#269984]/30 transition-all">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#269984] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-11 pr-10 py-2.5 bg-transparent border-none outline-none font-montserrat text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="h-6 w-px bg-gray-100 dark:bg-white/10" />
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none pl-3 pr-9 py-2 bg-gray-50 dark:bg-white/5 border-none rounded-xl outline-none font-montserrat text-[10px] font-black uppercase tracking-widest text-[#269984] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <option value="all">{t('common.all_difficulties')}</option>
                <option value="Beginner">{t('courses.levels.beginner').toUpperCase()}</option>
                <option value="Intermediate">
                  {t('courses.levels.intermediate').toUpperCase()}
                </option>
                <option value="Advanced">{t('courses.levels.advanced').toUpperCase()}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#269984] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${searchQuery}-${difficultyFilter}-${currentPage}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-[400px]"
        >
          {paginatedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
              <div className="mb-6 w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-300">
                <Filter size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">
                {t('courses.no_matches')}
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                {t('courses.try_adjusting_filters')}
              </p>
              {(searchQuery || difficultyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDifficultyFilter('all');
                  }}
                  className="mt-8 px-8 py-3 rounded-2xl bg-[#269984] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#269984]/20 hover:scale-105 transition-transform"
                >
                  {t('common.clear_all')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {paginatedCourses.map((course, idx) => {
                  const current = courseProgress[course.slug] || {
                    activePhaseIndex: 0,
                    completedPhases: [],
                    points: 0,
                  };
                  const totalCourseMax = course.phases.reduce(
                    (acc, p) => acc + (p.maxPoints ?? 10),
                    0,
                  );
                  const progressPercent = Math.round(
                    (current.completedPhases.length / course.phases.length) * 100,
                  );

                  return (
                    <motion.div
                      key={course.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleCourseClick(course)}
                      className="group relative cursor-pointer"
                    >
                      <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/[0.08]">
                        {/* Course Accent Glow */}
                        <div
                          className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.05] blur-2xl transition-all group-hover:opacity-[0.1] group-hover:scale-150"
                          style={{ backgroundColor: course.accentColor }}
                        />

                        {/* Top Info */}
                        <div className="mb-8 flex items-start justify-between">
                          <div
                            className="flex h-16 w-16 items-center justify-center rounded-3xl text-4xl shadow-inner transition-transform group-hover:scale-110"
                            style={{
                              backgroundColor: `${course.accentColor}15`,
                              color: course.accentColor,
                            }}
                          >
                            {course.icon}
                          </div>
                          <span className="inline-flex rounded-full border border-[#269984]/20 bg-[#269984]/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#269984]">
                            {course.difficulty === 'Beginner'
                              ? t('courses.levels.beginner')
                              : course.difficulty === 'Intermediate'
                                ? t('courses.levels.intermediate')
                                : t('courses.levels.advanced')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="mb-8">
                          <h3 className="text-2xl font-black tracking-tight text-black dark:text-white">
                            {course.title}
                          </h3>
                          <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                            {course.summary}
                          </p>
                        </div>

                        {/* Meta Grid */}
                        <div className="mb-8 grid grid-cols-2 gap-4 rounded-3xl bg-gray-50 p-5 dark:bg-black/20">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                              {t('courses.table.duration')}
                            </span>
                            <span className="text-sm font-bold text-black dark:text-white">
                              ~{course.estimatedMinutes} {t('common.min')}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                              {t('courses.checkpoints')}
                            </span>
                            <span className="text-sm font-bold text-black dark:text-white">
                              {course.phases.length}
                            </span>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="mt-auto">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#269984]">
                                {current.points || 0}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                / {totalCourseMax} {t('courses.table.points')}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-[#269984]">
                              {progressPercent}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-[#269984] to-[#269984]/60 shadow-[0_0_10px_rgba(38,153,132,0.3)]"
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                        </div>

                        {/* Hover Action */}
                        <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm dark:border-[#0a0a0a]">
                              {/* Mascot placeholder or icon */}
                              <div className="flex h-full w-full items-center justify-center text-xs">
                                {'🦖'}
                              </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {course.mascot.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#269984] group-hover:translate-x-1 transition-transform">
                            {t('courses.open')}
                            <ChevronRight size={14} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl border border-gray-100 dark:border-white/10 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-12 h-12 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                          currentPage === i + 1
                            ? 'bg-[#269984] text-white shadow-xl shadow-[#269984]/20'
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
                    className="p-3 rounded-2xl border border-gray-100 dark:border-white/10 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
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
