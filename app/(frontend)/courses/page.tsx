'use client';

import Link from 'next/link';
import { useLocale } from '../../i18n/LocaleProvider';

const categories = [
  {
    id: 'video',
    lessons: 12,
    color: 'var(--color-course-video)',
    icon: '🎬',
  },
  {
    id: 'animation',
    lessons: 8,
    color: 'var(--color-course-animation)',
    icon: '✨',
  },
  {
    id: 'control',
    lessons: 6,
    color: 'var(--color-course-control)',
    icon: '🎮',
  },
  {
    id: 'create',
    lessons: 5,
    color: 'var(--color-course-create)',
    icon: '🛠️',
  },
  {
    id: 'alive',
    lessons: 7,
    color: 'var(--color-course-alive)',
    icon: '💃',
  },
];

const courses = [
  { id: 'bubble_basics', categoryId: 'video', duration: '15 min', level: 'beginner' },
  { id: 'selection_dive', categoryId: 'video', duration: '22 min', level: 'beginner' },
  {
    id: 'insertion_animation',
    categoryId: 'animation',
    duration: '18 min',
    level: 'beginner',
  },
  {
    id: 'merge_visualized',
    categoryId: 'animation',
    duration: '25 min',
    level: 'intermediate',
  },
  {
    id: 'quick_step',
    categoryId: 'control',
    duration: '30 min',
    level: 'intermediate',
  },
  { id: 'heap_interactive', categoryId: 'control', duration: '28 min', level: 'advanced' },
  { id: 'shell_builder', categoryId: 'create', duration: '35 min', level: 'advanced' },
  { id: 'dance_party', categoryId: 'alive', duration: '20 min', level: 'beginner' },
  { id: 'binary_rhythm', categoryId: 'alive', duration: '15 min', level: 'beginner' },
  { id: 'n_queens_challenge', categoryId: 'create', duration: '40 min', level: 'advanced' },
];

export default function CoursesPage() {
  const { t } = useLocale();

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-20 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-5xl mb-4 text-center">
          {t('courses.hero_title')}
        </h1>
        <p className="font-montserrat text-center text-base sm:text-lg lg:text-xl max-w-2xl text-[#666] dark:text-gray-400">
          {t('courses.hero_description')}
        </p>
      </div>

      {/* Category Cards */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((cat) => {
            const title = t(`courses.categories_list.${cat.id}.title`);
            const description = t(`courses.categories_list.${cat.id}.description`);

            return (
              <Link
                key={cat.id}
                href={`/courses/${cat.id}`}
                className="flex flex-col items-center p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-white dark:bg-[#1a1a1a]"
                style={{ border: `2px solid ${cat.color}20` }}
              >
                <div
                  className="flex items-center justify-center rounded-full mb-5 text-3xl sm:text-4xl"
                  style={{ width: '72px', height: '72px', backgroundColor: `${cat.color}15` }}
                >
                  {cat.icon}
                </div>
                <h3
                  className="font-montserrat font-bold text-center mb-2 text-lg sm:text-xl"
                  style={{ color: cat.color }}
                >
                  {title}
                </h3>
                <p
                  className="font-montserrat text-center text-xs sm:text-sm mb-4 text-[#666] dark:text-gray-400"
                  style={{ lineHeight: '1.8em' }}
                >
                  {description}
                </p>
                <span className="font-montserrat font-bold text-sm" style={{ color: cat.color }}>
                  {cat.lessons} {t('courses.lessons')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Course Table */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        <h2 className="font-montserrat font-bold text-black dark:text-white mb-8 text-2xl sm:text-3xl lg:text-4xl">
          {t('courses.all_courses')}
        </h2>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[600px]"
            style={{ borderCollapse: 'separate', borderSpacing: '0' }}
          >
            <thead>
              <tr>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  {t('courses.table.name')}
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  {t('courses.table.category')}
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  {t('courses.table.duration')}
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  {t('courses.table.level')}
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => {
                const category = categories.find((c) => c.id === course.categoryId);
                const categoryTitle = t(`courses.categories_list.${course.categoryId}.title`);
                const courseName = t(`courses.list.${course.id}`);
                const levelName = t(`courses.levels.${course.level}`);

                return (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    <td className="font-montserrat font-bold text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-black dark:text-white">
                      {courseName}
                    </td>
                    <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800">
                      <span
                        className="font-bold px-3 py-1 rounded-full text-xs"
                        style={{
                          color: category?.color || '#269984',
                          backgroundColor: `${category?.color || '#269984'}15`,
                        }}
                      >
                        {categoryTitle}
                      </span>
                    </td>
                    <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-[#666] dark:text-gray-400">
                      {course.duration.replace('min', t('common.min'))}
                    </td>
                    <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-[#666] dark:text-gray-400">
                      {levelName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
