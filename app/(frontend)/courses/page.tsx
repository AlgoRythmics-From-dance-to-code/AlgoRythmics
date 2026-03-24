'use client';

import Link from 'next/link';

const categories = [
  {
    id: 'video',
    title: 'Video',
    description:
      'Watch algorithm sorting dances and learn through visual demonstrations of each algorithm step by step.',
    lessons: 12,
    color: 'var(--color-course-video)',
    icon: '🎬',
  },
  {
    id: 'animation',
    title: 'Animation',
    description:
      'Interactive animations that break down complex algorithms into easy-to-understand visual sequences.',
    lessons: 8,
    color: 'var(--color-course-animation)',
    icon: '✨',
  },
  {
    id: 'control',
    title: 'Control',
    description:
      'Take control and manually step through algorithms to understand every comparison and swap operation.',
    lessons: 6,
    color: 'var(--color-course-control)',
    icon: '🎮',
  },
  {
    id: 'create',
    title: 'Create',
    description:
      'Build your own algorithms, create custom input sets, and watch how different approaches solve the same problem.',
    lessons: 5,
    color: 'var(--color-course-create)',
    icon: '🛠️',
  },
  {
    id: 'alive',
    title: 'Alive',
    description:
      'Experience algorithms come alive with real-time music and dance choreography matching each operation.',
    lessons: 7,
    color: 'var(--color-course-alive)',
    icon: '💃',
  },
];

const courses = [
  { name: 'Bubble Sort Basics', category: 'Video', duration: '15 min', level: 'Beginner' },
  { name: 'Selection Sort Deep Dive', category: 'Video', duration: '22 min', level: 'Beginner' },
  {
    name: 'Insertion Sort Animation',
    category: 'Animation',
    duration: '18 min',
    level: 'Beginner',
  },
  {
    name: 'Merge Sort Visualized',
    category: 'Animation',
    duration: '25 min',
    level: 'Intermediate',
  },
  {
    name: 'Quick Sort Step-by-Step',
    category: 'Control',
    duration: '30 min',
    level: 'Intermediate',
  },
  { name: 'Heap Sort Interactive', category: 'Control', duration: '28 min', level: 'Advanced' },
  { name: 'Shell Sort Builder', category: 'Create', duration: '35 min', level: 'Advanced' },
  { name: 'Algorithm Dance Party', category: 'Alive', duration: '20 min', level: 'Beginner' },
  { name: 'Binary Search Rhythm', category: 'Alive', duration: '15 min', level: 'Beginner' },
  { name: 'N-Queens Challenge', category: 'Create', duration: '40 min', level: 'Advanced' },
];

export default function CoursesPage() {
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-20 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-5xl mb-4 text-center">
          Courses
        </h1>
        <p className="font-montserrat text-center text-base sm:text-lg lg:text-xl max-w-2xl text-[#666] dark:text-gray-400">
          Explore our course categories and learn algorithms through different interactive methods
        </p>
      </div>

      {/* Category Cards */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((cat) => (
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
                {cat.title}
              </h3>
              <p
                className="font-montserrat text-center text-xs sm:text-sm mb-4 text-[#666] dark:text-gray-400"
                style={{ lineHeight: '1.8em' }}
              >
                {cat.description}
              </p>
              <span className="font-montserrat font-bold text-sm" style={{ color: cat.color }}>
                {cat.lessons} lessons
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Course Table */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        <h2 className="font-montserrat font-bold text-black dark:text-white mb-8 text-2xl sm:text-3xl lg:text-4xl">
          All Courses
        </h2>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[600px]"
            style={{ borderCollapse: 'separate', borderSpacing: '0' }}
          >
            <thead>
              <tr>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  Course Name
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  Category
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  Duration
                </th>
                <th className="font-montserrat font-bold text-left text-sm sm:text-base text-[#999] dark:text-gray-500 border-b-2 border-[#E0E0E0] dark:border-neutral-800 p-3 sm:p-4">
                  Level
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                >
                  <td className="font-montserrat font-bold text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-black dark:text-white">
                    {course.name}
                  </td>
                  <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800">
                    <span
                      className="font-bold px-3 py-1 rounded-full text-xs"
                      style={{
                        color:
                          categories.find((c) => c.title === course.category)?.color || '#269984',
                        backgroundColor: `${categories.find((c) => c.title === course.category)?.color || '#269984'}15`,
                      }}
                    >
                      {course.category}
                    </span>
                  </td>
                  <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-[#666] dark:text-gray-400">
                    {course.duration}
                  </td>
                  <td className="font-montserrat text-sm sm:text-base p-3 sm:p-4 border-b border-[#F0F0F0] dark:border-neutral-800 text-[#666] dark:text-gray-400">
                    {course.level}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
