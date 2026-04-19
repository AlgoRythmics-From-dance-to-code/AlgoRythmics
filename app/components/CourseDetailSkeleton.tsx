'use client';

import { motion } from 'framer-motion';

/**
 * A skeleton loader for the individual Course Detail page.
 * Mimics the CoursePlayer structure.
 */
export default function CourseDetailSkeleton() {
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
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen">
      {/* Top Navigation Skeleton */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <SkeletonBlock className="h-10 w-40 rounded-full" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-14 sm:px-6 md:pb-16">
        <div className="w-full">
          {/* Phase Bubbles Skeleton */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-12 rounded-full" />
            ))}
          </div>

          {/* Legend Skeleton */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-8 dark:border-white/5">
            <div className="flex gap-4">
              <SkeletonBlock className="h-4 w-24 rounded-full" />
              <SkeletonBlock className="h-4 w-24 rounded-full" />
              <SkeletonBlock className="h-4 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="h-6 w-32 rounded-full" />
          </div>

          {/* Main Content Box Skeleton */}
          <div className="mt-6 space-y-6">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-4">
                  <SkeletonBlock className="h-3 w-32 rounded-full" />
                  <SkeletonBlock className="h-10 w-64 rounded-xl" />
                  <SkeletonBlock className="h-4 w-full rounded-lg" />
                  <SkeletonBlock className="h-4 w-5/6 rounded-lg" />
                </div>
                <div className="shrink-0">
                  <SkeletonBlock className="h-24 w-48 rounded-2xl" />
                </div>
              </div>

              {/* Visualizer Area Skeleton */}
              <div className="mt-10">
                <SkeletonBlock className="h-[450px] w-full rounded-[2rem]" />
              </div>
            </div>

            {/* Footer Actions Skeleton */}
            <div className="flex justify-end rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <SkeletonBlock className="h-12 w-48 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
