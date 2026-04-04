'use client';

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../../../i18n/LocaleProvider';

import VideoPlayer from '../../../components/Learning/VideoPlayer';
import { VIDEOS, ALGORITHMS } from '../../../../lib/constants';
import { useAlgorithmStore, type AlgorithmProgress } from '../../../store/useAlgorithmStore';
import { hasFullContent } from '../../../../lib/algorithms/registry';
import { CheckCircle, Circle, Lightbulb } from 'lucide-react';
import { ConfirmationModal } from '../../../components/Learning/ConfirmationModal';

// Lazy load heavy components
const AlgorithmVisualizer = lazy(() => import('../../../components/Learning/AlgorithmVisualizer'));
const ControlVisualizer = lazy(() => import('../../../components/Learning/ControlVisualizer'));
const CodeExercise = lazy(() => import('../../../components/Learning/CodeExercise'));
const AliveVisualizer = lazy(() => import('../../../components/Learning/AliveVisualizer'));

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

  const data = useMemo(() => {
    const algo = ALGORITHMS.find((a) => a.id === id);
    if (!algo) {
      return {
        name: id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        complexity: 'O(?)',
        description: t('algorithms.detail.coming_soon'),
        illAsset: 'algo_group_109.svg',
        steps: [t('about.steps.01.desc')],
      };
    }

    return {
      name: t(`algorithms.list.${id}.name`),
      complexity: algo.complexity,
      description: t(`algorithms.list.${id}.description`),
      illAsset: algo.illAsset,
      steps: algo.steps,
    };
  }, [id, t]);

  const matchingVideo = VIDEOS.find((v) => v.id.startsWith(id));
  const algoHasFullContent = hasFullContent(id);

  // Optimized Selectors to avoid full store re-renders
  const toggleCompleted = useAlgorithmStore((s) => s.toggleCompleted);
  const progress = useAlgorithmStore((s) => s.algorithmProgress[id] || EMPTY_PROGRESS);
  const resetAlgorithmProgressTab = useAlgorithmStore((s) => s.resetAlgorithmProgressTab);
  const completed = useAlgorithmStore((s) => s.completedIds.includes(id));

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
      // 1. Update the local store (Zustand)
      resetAlgorithmProgressTab(id, pendingTab);

      // 2. Immediate Synchronization to Backend
      // We don't wait for the debounced UserProgressSync to ensure the reset is persistent even on refresh
      const store = useAlgorithmStore.getState();

      fetch('/api/account/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedIds: store.completedIds,
          visualizerProgress: store.visualizerProgress,
          algorithmProgress: {
            [id]: store.algorithmProgress[id],
          },
        }),
      }).catch((err) => console.error('Failed to sync immediate reset:', err));

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
        return (
          <Suspense fallback={<TabLoader />}>
            <div className="max-w-4xl mx-auto">
              <AlgorithmVisualizer id={id} />
            </div>
          </Suspense>
        );

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
