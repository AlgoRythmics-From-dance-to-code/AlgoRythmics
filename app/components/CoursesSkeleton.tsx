'use client';

import { motion } from 'framer-motion';

/**
 * A skeleton loader that mimics the Courses list layout.
 * Synchronized with the latest compact header design.
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
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-white/5 ${className}`}>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={shimmerTransition}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6">
      {/* Integrated Header Skeleton */}
      <div className="mb-14 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        {/* Title Section Skeleton */}
        <div className="relative shrink-0 pr-8">
          <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-gray-100 dark:bg-white/5" />
          <SkeletonBlock className="mb-3 h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-12 w-64 rounded-2xl sm:h-14" />
          <SkeletonBlock className="mt-3 h-4 w-48 rounded-lg" />
        </div>

        {/* Controls Section Skeleton */}
        <div className="flex flex-1 flex-col items-end gap-3 w-full">
          <SkeletonBlock className="h-10 w-full max-w-lg rounded-xl" />
          <SkeletonBlock className="h-12 w-full max-w-xl rounded-2xl" />
        </div>
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-[2.5rem] border border-gray-100 bg-white p-8 dark:border-white/5 dark:bg-white/5 shadow-sm"
          >
            {/* Icon & Label */}
            <div className="mb-8 flex items-start justify-between">
              <SkeletonBlock className="h-16 w-16 rounded-3xl" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>

            {/* Content */}
            <div className="mb-8 space-y-3">
              <SkeletonBlock className="h-7 w-3/4 rounded-xl" />
              <SkeletonBlock className="h-4 w-full rounded-lg" />
              <SkeletonBlock className="h-4 w-2/3 rounded-lg" />
            </div>

            {/* Progress */}
            <div className="mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="mb-3 flex justify-between items-center">
                <SkeletonBlock className="h-4 w-16 rounded" />
                <SkeletonBlock className="h-4 w-10 rounded" />
              </div>
              <SkeletonBlock className="h-2 w-full rounded-full" />
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-8 w-8 rounded-full" />
                <SkeletonBlock className="h-3 w-16 rounded" />
              </div>
              <SkeletonBlock className="h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
