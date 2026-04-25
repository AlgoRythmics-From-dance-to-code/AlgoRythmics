'use client';

import { motion } from 'framer-motion';

export default function LeaderboardSkeleton() {
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
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent"
      />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header section Skeleton */}
        <div className="flex flex-col items-center text-center mb-12">
          <SkeletonBlock className="w-20 h-20 rounded-3xl mb-6 shadow-xl" />
          <SkeletonBlock className="h-12 w-64 rounded-2xl mb-4" />
          <SkeletonBlock className="h-6 w-96 rounded-lg" />
        </div>

        {/* Leaderboard Table Skeleton */}
        <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-5 w-24">
                    <SkeletonBlock className="h-4 w-12 mx-auto rounded" />
                  </th>
                  <th className="px-6 py-5">
                    <SkeletonBlock className="h-4 w-24 rounded" />
                  </th>
                  <th className="px-6 py-5">
                    <SkeletonBlock className="h-4 w-24 rounded" />
                  </th>
                  <th className="px-6 py-5 text-right">
                    <SkeletonBlock className="h-4 w-12 ml-auto rounded" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {/* Rank */}
                    <td className="px-6 py-5">
                      <SkeletonBlock className="w-10 h-10 rounded-2xl mx-auto" />
                    </td>
                    {/* User */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <SkeletonBlock className="w-12 h-12 rounded-2xl shrink-0" />
                        <div className="flex flex-col gap-2">
                          <SkeletonBlock className="h-5 w-32 rounded-lg" />
                          <SkeletonBlock className="h-3 w-20 rounded-md" />
                        </div>
                      </div>
                    </td>
                    {/* Badges */}
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {[...Array(3)].map((_, j) => (
                          <SkeletonBlock key={j} className="w-8 h-8 rounded-full" />
                        ))}
                      </div>
                    </td>
                    {/* XP */}
                    <td className="px-6 py-5 text-right">
                      <SkeletonBlock className="h-10 w-24 ml-auto rounded-xl" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
