'use client';

import { motion } from 'framer-motion';

/**
 * A unified premium skeleton loader for the individual Course Detail page.
 * Mimics the single-surface overhauled CoursePlayer structure with integrated back button.
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
    <div className="w-full bg-[#fdfdfd] dark:bg-[#080808] min-h-screen">
      <div className="mx-auto max-w-[1500px] px-0 py-0 sm:px-4 lg:py-12">
        <div className="relative rounded-[3rem] border border-gray-100 bg-white shadow-xl dark:border-white/5 dark:bg-[#111111]/80 overflow-hidden">
          {/* Header Section Skeleton */}
          <div className="p-8 lg:p-12 border-b border-gray-50 dark:border-white/5 space-y-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-6 flex-1">
                {/* Back Button Skeleton */}
                <SkeletonBlock className="h-4 w-24 rounded-lg" />

                <div className="space-y-4">
                  <SkeletonBlock className="h-5 w-32 rounded-full" />
                  <SkeletonBlock className="h-14 w-3/4 rounded-2xl" />
                  <SkeletonBlock className="h-4 w-1/2 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-8">
                <SkeletonBlock className="h-12 w-24 rounded-xl" />
                <SkeletonBlock className="h-12 w-24 rounded-xl" />
              </div>
            </div>

            {/* Path Navigator Skeleton */}
            <div className="space-y-6">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-40 rounded-full" />
                <SkeletonBlock className="h-3 w-32 rounded-full" />
              </div>
              <div className="flex justify-between gap-4 py-4">
                {[...Array(8)].map((_, i) => (
                  <SkeletonBlock key={i} className="h-6 w-6 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Content Body Skeleton */}
          <div className="p-8 lg:p-12 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="space-y-4 flex-1">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-5 w-24 rounded-lg" />
                  <SkeletonBlock className="h-5 w-24 rounded-lg" />
                </div>
                <SkeletonBlock className="h-10 w-64 rounded-xl" />
                <SkeletonBlock className="h-4 w-full rounded-lg" />
              </div>
              <SkeletonBlock className="h-20 w-48 rounded-2xl shrink-0" />
            </div>

            <SkeletonBlock className="h-[450px] w-full rounded-[2.5rem]" />

            <div className="flex justify-between items-center pt-8 border-t border-gray-50 dark:border-white/5">
              <SkeletonBlock className="h-4 w-32 rounded-full" />
              <SkeletonBlock className="h-14 w-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
