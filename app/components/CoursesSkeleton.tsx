'use client';

import { motion } from 'framer-motion';

/**
 * A skeleton loader that mimics the Courses list layout.
 */
export default function CoursesSkeleton() {
  const shimmer = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
  };

  const shimmerTransition = {
    repeat: Infinity,
    duration: 1.5,
    ease: 'linear' as const,
  };

  const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-white/5 ${className}`}>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={shimmerTransition}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent shadow-sm"
      />
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 md:py-20 lg:py-28 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-14 text-center flex flex-col items-center">
        <SkeletonBlock className="h-6 w-32 rounded-full mb-4" />
        <SkeletonBlock className="h-12 w-3/4 sm:w-1/2 rounded-2xl mb-6" />
        <SkeletonBlock className="h-4 w-2/3 sm:w-1/3 rounded-lg" />
      </div>

      {/* Tab Switcher Skeleton */}
      <div className="mb-10 flex items-center justify-center">
        <SkeletonBlock className="h-14 w-64 rounded-2xl" />
      </div>

      {/* Course List Container Skeleton */}
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        {/* Table Header Skeleton (Desktop only) */}
        <div className="hidden grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.55fr_0.35fr] gap-6 border-b border-gray-100 dark:border-white/10 px-8 py-5 md:grid">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} className="h-3 w-20 rounded" />
          ))}
        </div>

        {/* Course Rows */}
        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-6 px-5 py-8 md:grid-cols-[1.2fr_1fr_0.55fr_0.55fr_0.55fr_0.35fr] md:items-center md:gap-6 md:px-8">
              {/* Name & Icon */}
              <div className="flex items-center gap-5">
                <SkeletonBlock className="h-14 w-14 shrink-0 rounded-[1.25rem]" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-5 w-3/4 rounded-lg" />
                  <SkeletonBlock className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              
              {/* Summary */}
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-full rounded" />
                <SkeletonBlock className="h-3 w-4/5 rounded" />
              </div>

              {/* Stats & Difficulty */}
              <SkeletonBlock className="h-4 w-16 rounded-md" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-12 rounded-md" />

              {/* Arrow */}
              <div className="flex md:justify-end">
                <SkeletonBlock className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
