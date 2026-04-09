'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CourseBlueprint } from '../../../lib/courses/courseCatalog';
import RestartCourseModal from './RestartCourseModal';

interface CoursesClientProps {
  courses: CourseBlueprint[];
}

export default function CoursesClient({ courses }: CoursesClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { courseProgress, resetCourseProgress, resetAlgorithmProgressTab, syncProgress } =
    useAlgorithmStore();
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [selectedCourse, setSelectedCourse] = useState<CourseBlueprint | null>(null);
  const [showRestartModal, setShowRestartModal] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const isCompleted = !!courseProgress[course.slug]?.isCompleted;
      if (activeTab === 'completed') return isCompleted;
      return !isCompleted;
    });
  }, [courses, courseProgress, activeTab]);

  const completedCount = useMemo(() => {
    return courses.filter((c) => !!courseProgress[c.slug]?.isCompleted).length;
  }, [courses, courseProgress]);

  const availableCount = courses.length - completedCount;

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
      <div className="mb-10 flex items-center justify-center">
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
            <span>Elérhető</span>
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
            <span>Teljesített</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/5"
        >
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-4xl">{activeTab === 'completed' ? '🏆' : '✨'}</div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-6">
                {activeTab === 'completed'
                  ? 'Még nincsenek teljesített kurzusaid.\nKezdj el egyet még ma!'
                  : 'Minden kurzust teljesítettél!\nGratulálunk a hatalmas tudáshoz!'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.35fr] gap-4 border-b border-gray-100 px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:border-white/10 md:grid">
                <div>{t('courses.table.name')}</div>
                <div>{t('courses.table.summary')}</div>
                <div>{t('courses.table.duration')}</div>
                <div>{t('courses.table.level')}</div>
                <div>{t('courses.open')}</div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/10">
                {filteredCourses.map((course) => (
                  <button
                    key={course.slug}
                    onClick={() => handleCourseClick(course)}
                    className="w-full text-left grid grid-cols-1 gap-6 px-8 py-8 transition-all hover:bg-gray-50/80 dark:hover:bg-white/[0.03] md:grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.35fr] md:items-center group cursor-pointer"
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
                      {course.estimatedMinutes} min
                    </div>

                    <div className="flex">
                      <span className="inline-flex rounded-full border border-[#269984]/20 bg-[#269984]/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#269984] shadow-sm">
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#269984] md:justify-end">
                      <span>{t('courses.open')}</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <RestartCourseModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleConfirmRestart}
        message="Ezt a kurzust már sikeresen teljesítetted. Ha újra elkezded, az eddigi haladásod és pontjaid törlődnek ebből a kurzusból."
        cancelLabel="Vissza a listához"
      />
    </div>
  );
}
