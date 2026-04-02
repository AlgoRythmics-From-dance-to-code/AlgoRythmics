'use client';

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../../../i18n/LocaleProvider';

import VideoPlayer from '../../../components/Learning/VideoPlayer';
import { VIDEOS } from '../../../../lib/constants';
import { useAlgorithmStore, type AlgorithmProgress } from '../../../store/useAlgorithmStore';
import { hasFullContent } from '../../../../lib/algorithms/registry';
import { CheckCircle, Circle, Lightbulb } from 'lucide-react';
import { ConfirmationModal } from '../../../components/Learning/ConfirmationModal';

// Lazy load heavy components
const BubbleSortVisualizer = lazy(
  () => import('../../../components/Learning/BubbleSortVisualizer'),
);
const ControlVisualizer = lazy(() => import('../../../components/Learning/ControlVisualizer'));
const CodeExercise = lazy(() => import('../../../components/Learning/CodeExercise'));
const AliveVisualizer = lazy(() => import('../../../components/Learning/AliveVisualizer'));

// ─── Algorithm Detail Page Template ────────
const algorithmData: Record<
  string,
  { name: string; complexity: string; description: string; illAsset: string; steps: string[] }
> = {
  'bubble-sort': {
    name: 'Bubble Sort',
    complexity: 'O(n²)',
    description:
      'Bubble sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.',
    illAsset: 'algo_group_109.svg',
    steps: [
      'Compare adjacent elements',
      'Swap if they are in the wrong order',
      'Move to the next pair',
      'Repeat until no swaps are needed',
      'The list is now sorted',
    ],
  },
  'insertion-sort': {
    name: 'Insertion Sort',
    complexity: 'O(n²)',
    description:
      'Insertion sort builds the final sorted array one item at a time. It picks each element and inserts it into its correct position among the previously sorted elements.',
    illAsset: 'algo_group_142.svg',
    steps: [
      'Start with the second element',
      'Compare with elements to its left',
      'Shift larger elements right',
      'Insert the element in its correct position',
      'Repeat for all remaining elements',
    ],
  },
  'selection-sort': {
    name: 'Selection Sort',
    complexity: 'O(n²)',
    description:
      'Selection sort divides the input into sorted and unsorted regions. It repeatedly selects the minimum element from the unsorted region and moves it to the sorted region.',
    illAsset: 'algo_group_119.svg',
    steps: [
      'Find the minimum element in the unsorted region',
      'Swap it with the first unsorted element',
      'Expand the sorted region by one',
      'Repeat until the entire array is sorted',
    ],
  },
  'shell-sort': {
    name: 'Shell Sort',
    complexity: 'O(n log n)',
    description:
      'Shell sort is a generalization of insertion sort that allows the exchange of items that are far apart. It starts by sorting pairs of elements far apart and progressively reduces the gap.',
    illAsset: 'algo_group_132.svg',
    steps: [
      'Choose a gap sequence',
      'Sort elements separated by the gap using insertion sort',
      'Reduce the gap',
      'Repeat until the gap is 1',
      'Perform final insertion sort pass',
    ],
  },
  'merge-sort': {
    name: 'Merge Sort',
    complexity: 'O(n log n)',
    description:
      'Merge sort divides the array in half, sorts each half recursively, and merges them back together. It is a stable, divide-and-conquer sorting algorithm.',
    illAsset: 'algo_group_166.svg',
    steps: [
      'Divide the array into two halves',
      'Recursively sort each half',
      'Merge the sorted halves',
      'Compare elements from each half',
      'Place the smaller element into the result',
    ],
  },
  'quick-sort': {
    name: 'Quick Sort',
    complexity: 'O(n log n)',
    description:
      'Quick sort picks a pivot element and partitions the array around it. Elements smaller go left, elements larger go right. It then recursively sorts the sub-arrays.',
    illAsset: 'algo_group_167.svg',
    steps: [
      'Choose a pivot element',
      'Partition: elements < pivot go left, > pivot go right',
      'Recursively sort the left partition',
      'Recursively sort the right partition',
      'Combine the results',
    ],
  },
  'heap-sort': {
    name: 'Heap Sort',
    complexity: 'O(n log n)',
    description:
      'Heap sort uses a binary heap data structure. It builds a max-heap, then repeatedly extracts the maximum element and places it at the end of the sorted portion.',
    illAsset: 'algo_group_168.svg',
    steps: [
      'Build a max-heap from the array',
      'Extract the root (maximum) element',
      'Move it to the end of the array',
      'Heapify the reduced heap',
      'Repeat until all elements are sorted',
    ],
  },
  'linear-search': {
    name: 'Linear Search',
    complexity: 'O(n)',
    description:
      'Linear search checks each element of the list sequentially until it finds the target value or reaches the end of the list.',
    illAsset: 'algo_group_109.svg',
    steps: [
      'Start from the first element',
      'Compare with the target',
      'If match, return position',
      'If no match, move to the next element',
      'If end of list, target not found',
    ],
  },
  'binary-search': {
    name: 'Binary Search',
    complexity: 'O(log n)',
    description:
      'Binary search divides a sorted array in half repeatedly. It compares the middle element with the target and narrows the search to the appropriate half.',
    illAsset: 'algo_group_142.svg',
    steps: [
      'Ensure the array is sorted',
      'Find the middle element',
      'Compare with the target',
      'If target is smaller, search the left half',
      'If target is larger, search the right half',
    ],
  },
  'n-queens': {
    name: 'N-Queens Problem',
    complexity: 'O(n!)',
    description:
      'The N-Queens problem places N queens on an N×N chessboard so that no two queens threaten each other. It uses backtracking to explore all valid placements.',
    illAsset: 'algo_group_109.svg',
    steps: [
      'Place a queen in the first row',
      'Move to the next row and try each column',
      'Check if placement is safe (no conflicts)',
      'If no safe column exists, backtrack',
      'Repeat until all queens are placed',
    ],
  },
};

// Loading spinner for lazy components
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-[#269984] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const EMPTY_PROGRESS: Readonly<Partial<AlgorithmProgress>> = Object.freeze({});

export default function AlgorithmDetailClient({ id }: { id: string }) {
  const { t, getRaw } = useLocale();
  const [activeView, setActiveView] = useState<string>('Video');
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const data = algorithmData[id] || {
    name: id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    complexity: 'O(?)',
    description: t('algorithms.detail.coming_soon'),
    illAsset: 'algo_group_109.svg',
    steps: [t('about.steps.01.desc')],
  };

  const matchingVideo = VIDEOS.find((v) => v.id.startsWith(id));
  const algoHasFullContent = hasFullContent(id);

  // Optimized Selectors to avoid full store re-renders
  const toggleCompleted = useAlgorithmStore((s) => s.toggleCompleted);
  const isCompleted = useAlgorithmStore((s) => s.isCompleted);
  const progress = useAlgorithmStore((s) => s.algorithmProgress[id] || EMPTY_PROGRESS);
  const resetAlgorithmProgressTab = useAlgorithmStore((s) => s.resetAlgorithmProgressTab);

  const completed = isCompleted(id);

  // Available views for this algorithm
  const availableViews = useMemo(() => {
    if (hasFullContent(id)) return ['Video', 'Animation', 'Control', 'Create', 'Alive'] as const;
    // For now, algorithms not in registry only have Video and Animation
    return ['Video', 'Animation'] as const;
  }, [id]);



  const getViewStatus = useCallback(
    (view: string) => {
      switch (view) {
        case 'Video':
          return {
            completed: !!progress.videoWatched,
            score: progress.videoWatched ? 100 : 0,
          };
        case 'Animation':
          return {
            completed: !!progress.animationCompleted,
            score: progress.animationCompleted ? 100 : 0,
          };
        case 'Control': {
          const score = progress.controlBestScore
            ? Math.round(Number(progress.controlBestScore))
            : 0;
          return {
            completed: !!progress.controlCompleted && score === 100,
            score,
          };
        }
        case 'Create': {
          const score = progress.createCompleted
            ? (() => {
                const calc = Math.round(
                  ((Number(progress.createBlanksCorrectFirst) || 0) /
                    (Number(progress.createBlanksTotal) || 1)) *
                    100,
                );
                return isNaN(calc) ? 0 : calc;
              })()
            : 0;
          return {
            completed: !!progress.createCompleted,
            score,
          };
        }
        case 'Alive': {
          const score = progress.aliveBestScore ? Math.round(Number(progress.aliveBestScore)) : 0;
          return {
            completed: !!progress.aliveCompleted && score > 0,
            score,
          };
        }
        default:
          return { completed: false, score: 0 };
      }
    },
    [progress],
  );

  const completedCount = availableViews.filter((v: string) => getViewStatus(v).completed).length;

  const handleTabClick = (v: string) => {
    if (v === activeView) return;

    const status = getViewStatus(v);
    if (status.completed) {
      setPendingTab(v);
      setModalOpen(true);
    } else {
      setActiveView(v);
    }
  };

  const confirmRedo = () => {
    if (pendingTab) {
      resetAlgorithmProgressTab(id, pendingTab);

      // Synchronize the reset to the server so it doesn't re-hydrate as completed
      const tab = pendingTab.toLowerCase();
      const updates: Record<string, unknown> = {};
      if (tab === 'video') {
        updates.videoWatched = false;
        updates.videoCompletedAt = null;
      } else if (tab === 'animation') {
        updates.animationCompleted = false;
        updates.animationCompletedAt = null;
      } else if (tab === 'control') {
        updates.controlCompleted = false;
        updates.controlBestScore = 0;
        updates.controlCompletedAt = null;
      } else if (tab === 'create') {
        updates.createCompleted = false;
        updates.createCompletedAt = null;
        updates.createBlanksCorrectFirst = 0;
      } else if (tab === 'alive') {
        updates.aliveCompleted = false;
        updates.aliveBestScore = 0;
        updates.aliveCompletedAt = null;
      }

      fetch('/api/analytics/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithmId: id, updates }),
      }).catch((err) => console.error('Failed to sync tab reset:', err));

      setActiveView(pendingTab);
      setPendingTab(null);
    }
  };

  // Auto-mark as done if all available steps are completed
  const allTabsFinished = useMemo(() => {
    return availableViews.every((v: string) => getViewStatus(v).completed);
  }, [availableViews, getViewStatus]);

  useEffect(() => {
    if (allTabsFinished && availableViews.length > 0 && !completed) {
      toggleCompleted(id);
    }
  }, [id, allTabsFinished, completed, toggleCompleted, availableViews.length]);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeView) {
      case 'Video':
        return matchingVideo ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <VideoPlayer
              youtubeId={matchingVideo.youtubeId}
              algorithmId={id}
              title={`${data.name} Video`}
            />

            {/* Simple Explanation */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F0FBF9] dark:bg-[#112220] border border-[#269984]/20 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-4 text-[#269984]">
                <div className="p-2 rounded-xl bg-white dark:bg-black/20 shadow-sm">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="font-montserrat font-bold text-lg sm:text-xl">
                  {t('algorithms.detail.simple_explanation')}
                </h3>
              </div>
              <p className="font-montserrat text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                {t(`algorithms.list.${id}.description`)}
              </p>
            </div>
          </div>
        ) : null;

      case 'Animation':
        if (id === 'bubble-sort') {
          return (
            <Suspense fallback={<TabLoader />}>
              <div className="max-w-4xl mx-auto">
                <BubbleSortVisualizer id={id} />
              </div>
            </Suspense>
          );
        }
        break;

      case 'Control':
        if (algoHasFullContent) {
          return (
            <Suspense fallback={<TabLoader />}>
              <ControlVisualizer algorithmId={id} />
            </Suspense>
          );
        }
        break;

      case 'Create':
        if (algoHasFullContent) {
          return (
            <Suspense fallback={<TabLoader />}>
              <CodeExercise algorithmId={id} />
            </Suspense>
          );
        }
        break;

      case 'Alive':
        if (algoHasFullContent) {
          return (
            <Suspense fallback={<TabLoader />}>
              <AliveVisualizer algorithmId={id} />
            </Suspense>
          );
        }
        break;
    }

    // Fallback: coming soon
    return (
      <div className="flex items-center justify-center rounded-2xl mb-12 aspect-video max-w-3xl mx-auto bg-[#F8F8F8] dark:bg-[#1a1a1a] border border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center p-6">
          <div className="flex items-center justify-center rounded-full bg-[#F0FBF9] dark:bg-[#112220] mx-auto mb-4 w-16 h-16 shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#269984">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <p className="font-montserrat font-bold text-lg sm:text-xl text-black dark:text-white mb-2">
            {t(`features.${activeView.toLowerCase()}`)} {t('features.video')}
          </p>
          <p className="font-montserrat text-sm text-[#999] dark:text-gray-500">
            {t('algorithms.detail.view_coming_soon')
              .replace('{view}', t(`features.${activeView.toLowerCase()}`))
              .replace('{name}', data.name)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero Banner */}
      <div className="w-full py-10 md:py-14 bg-[#F0FBF9] dark:bg-[#112220]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Link
            href="/algorithms"
            className="inline-flex items-center gap-2 font-montserrat text-sm mb-6 hover:underline transition-all"
            style={{ color: '#269984' }}
          >
            ← {t('algorithms.detail.back')}
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left animate-in fade-in slide-in-from-left-10 duration-700">
              <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">
                {data.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <span
                  className="inline-block font-montserrat font-bold text-xs px-4 py-1.5 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: '#269984' }}
                >
                  {t('algorithms.detail.complexity')}: {data.complexity}
                </span>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleCompleted(id)}
                    className={`flex items-center gap-2 font-montserrat font-bold text-xs px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-lg border ${
                      completed
                        ? 'bg-green-600 text-white shadow-green-600/20 border-green-600'
                        : 'bg-white dark:bg-[#1a1a1a] text-[#269984] hover:bg-[#269984] hover:text-white border-[#269984]/20'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle className="w-4 h-4 fill-white text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    {completed
                      ? t('algorithms.detail.completed')
                      : t('algorithms.detail.mark_as_done')}
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#269984] animate-pulse" />
                    <span className="font-montserrat font-bold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {completedCount}/{availableViews.length} {t('common.completed').toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              <p
                className="font-montserrat text-sm sm:text-base lg:text-lg max-w-lg mx-auto md:mx-0 text-[#666] dark:text-gray-400"
                style={{ lineHeight: '1.8em' }}
              >
                {data.description}
              </p>
            </div>

            <div className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-80 animate-in fade-in zoom-in-95 duration-1000">
              <Image
                src={`/assets/${data.illAsset}`}
                alt={data.name}
                width={330}
                height={330}
                className="w-full h-auto dark:invert dark:hue-rotate-180 drop-shadow-2xl"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex overflow-x-auto border-b-2 border-[#E0E0E0] dark:border-neutral-800 scrollbar-hide">
          {availableViews.map((v) => {
            const status = getViewStatus(v);
            return (
              <button
                key={v}
                onClick={() => handleTabClick(v)}
                className="flex-shrink-0 font-montserrat font-bold transition-all px-5 sm:px-8 py-4 text-sm sm:text-base cursor-pointer whitespace-nowrap border-b-3 flex items-center gap-2"
                style={{
                  color: activeView === v ? '#269984' : '',
                  borderColor: activeView === v ? '#269984' : 'transparent',
                }}
              >
                <span
                  className={
                    activeView !== v
                      ? 'text-[#999] dark:text-gray-500 hover:text-[#269984] transition-colors'
                      : ''
                  }
                >
                  {t(`features.${v.toLowerCase()}`)}
                </span>
                {status.completed && (
                  <div className="flex items-center gap-1 ml-1 scale-90 sm:scale-100">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {v === 'Alive' && status.score > 0 && (
                      <span className="text-[10px] font-mono bg-green-500/10 text-green-600 dark:text-green-400 px-1 rounded">
                        {status.score}%
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-14 min-h-[500px]">
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500" key={activeView}>
          {renderTabContent()}
        </div>

        {(() => {
          const currentGuides = getRaw(`algorithms.guides.${activeView.toLowerCase()}`);
          let displaySteps = Array.isArray(currentGuides) ? currentGuides : data.steps;

          // Remove the first step if in Video tab as it is redundant with the Simple Explanation box
          if (activeView === 'Video' && displaySteps.length > 0) {
            displaySteps = displaySteps.slice(1);
          }

          return (
            <>
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 mt-16 md:mt-24">
                {t('algorithms.detail.step_by_step')}
              </h2>
              <div className="space-y-4 max-w-2xl">
                {displaySteps.map((step: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-[#F8F8F8] dark:bg-[#1a1a1a]"
                  >
                    <div
                      className="flex items-center justify-center rounded-full font-montserrat font-bold text-white flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 text-sm"
                      style={{ backgroundColor: '#269984' }}
                    >
                      {i + 1}
                    </div>
                    <p className="font-montserrat text-sm sm:text-base text-black dark:text-white pt-1.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingTab(null);
        }}
        onConfirm={confirmRedo}
        title={t('common.restart')}
        message={t('algorithms.detail.redo_confirm')}
      />
    </div>
  );
}
