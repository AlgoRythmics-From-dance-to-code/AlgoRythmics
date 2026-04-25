'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Category = 'all' | 'sorting' | 'searching' | 'backtracking' | 'fun';

export interface AlgorithmProgress {
  videoWatched?: boolean;
  animationCompleted?: boolean;
  controlCompleted?: boolean;
  createCompleted?: boolean;
  aliveCompleted?: boolean;
  videoCompletedAt?: string | null;
  animationCompletedAt?: string | null;
  controlCompletedAt?: string | null;
  createCompletedAt?: string | null;
  aliveCompletedAt?: string | null;
  controlBestScore?: number;
  controlBestTimeMs?: number;
  controlMistakes?: number;
  createMistakes?: number;
  controlAttempts?: number;
  createHelpUsed?: boolean;
  createBlanksCorrectFirst?: number;
  createBlanksTotal?: number;
  createAttempts?: number;
  createTotalTimeMs?: number;
  aliveBestScore?: number;
  controlHintsUsed?: number;
  animationPlayCount?: number;
  animationTotalTimeMs?: number;
  videoWatchTimeMs?: number;
  aliveHelpUsed?: boolean;
  aliveCodeSubmissions?: number;
  aliveLastCode?: string;
  aliveTotalTimeMs?: number;
  controlTotalTimeMs?: number;
  aliveLastActivityAt?: string;
  isFinished?: boolean;
  overallProgress?: number;
}

interface AlgorithmState {
  // Filter state
  activeCategory: Category;
  searchQuery: string;
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;

  // Progress state
  completedIds: string[];
  toggleCompleted: (id: string) => void;
  isCompleted: (id: string) => boolean;

  // Visualizer Persistence
  visualizerProgress: Record<string, { step: number; speed: number }>;
  updateVisualizerProgress: (id: string, step: number, speed?: number) => void;

  // Analytics Progress Cache
  algorithmProgress: Record<string, AlgorithmProgress>;
  updateAlgorithmProgress: (id: string, updates: Partial<AlgorithmProgress>) => void;
  resetAlgorithmProgressTab: (id: string, tab: string) => void;

  // Hydration
  hydrate: (data: {
    completedIds?: string[];
    visualizerProgress?: Record<string, { step: number; speed: number }>;
    algorithmProgress?: Record<string, AlgorithmProgress>;
    courseProgress?: Record<
      string,
      {
        activePhaseIndex: number;
        completedPhases: string[];
        lastConfidenceRating?: string;
        phaseResults?: Record<string, 'success' | 'fail'>;
        isCompleted?: boolean;
      }
    >;
  }) => void;

  // Course progress
  courseProgress: Record<
    string,
    {
      activePhaseIndex: number;
      completedPhases: string[];
      lastConfidenceRating?: string;
      phaseResults?: Record<string, 'success' | 'fail'>;
      points?: number;
      isCompleted?: boolean;
      totalTimeMs?: number;
      totalMistakes?: number;
      mascotInteractionsTotal?: number;
      confidenceResults?: Record<string, string>;
      firstStartedAt?: string;
      lastActivityAt?: string;
      phasePoints?: Record<
        string,
        {
          earned: number;
          max: number;
          helpUsed: boolean;
          partial: boolean;
        }
      >;
      detailedStats?: Record<
        string,
        {
          timeSpentMs: number;
          completed: boolean;
          completedAt?: string | null;
          result: 'success' | 'fail' | null;
          helpUsed: boolean;
          mascotHelpCount: number;
          improvedAfterMascot: boolean;
          attempts: number;
          mistakes: number;
          mascotIntentionallyDisabled?: boolean;
        }
      >;
    }
  >;
  setCourseActivePhase: (courseId: string, activePhaseIndex: number) => void;
  updateCoursePhaseStats: (
    courseId: string,
    phaseId: string,
    updates: Partial<{
      timeSpentMs: number;
      completed: boolean;
      result: 'success' | 'fail';
      helpUsed: boolean;
      mascotHelpCount: number;
      improvedAfterMascot: boolean;
      mistakes: number;
      mascotIntentionallyDisabled?: boolean;
    }>,
  ) => void;
  incrementCourseMascotInteraction: (courseId: string) => void;
  updateCourseTotalTime: (courseId: string, timeToAddMs: number) => void;
  incrementCourseMistakes: (courseId: string) => void;
  markCoursePhaseComplete: (courseId: string, phaseId: string) => void;
  markCourseCompleted: (courseId: string) => void;
  resetCoursePhasesFrom: (courseId: string, phaseIndex: number, phaseIds: string[]) => void;
  resetCourseProgress: (courseId: string) => void;
  setCourseConfidenceRating: (courseId: string, phaseId: string, rating: string) => void;
  setCoursePhaseResult: (courseId: string, phaseId: string, result: 'success' | 'fail') => void;
  addCoursePoints: (courseId: string, points: number) => void;
  setCoursePhasePoints: (
    courseId: string,
    phaseId: string,
    data: { earned: number; max: number; helpUsed: boolean; partial: boolean },
  ) => void;
  syncProgress: () => Promise<void>;

  isInteractionLocked: boolean;
  setInteractionLocked: (locked: boolean) => void;

  isRehydrated: boolean;
  setHasRehydrated: (val: boolean) => void;

  // Reset
  resetFilters: () => void;
  clearStore: () => void;
}

export const useAlgorithmStore = create<AlgorithmState>()(
  persist(
    (set, get) => ({
      // Defaults
      activeCategory: 'all',
      searchQuery: '',
      completedIds: [],
      visualizerProgress: {},
      algorithmProgress: {},
      courseProgress: {},
      isRehydrated: false,

      // Actions
      setHasRehydrated: (val) => set({ isRehydrated: val }),
      setCategory: (category) => set({ activeCategory: category }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleCompleted: (id) => {
        const { completedIds } = get();
        if (completedIds.includes(id)) {
          set({ completedIds: completedIds.filter((item) => item !== id) });
        } else {
          set({ completedIds: [...completedIds, id] });
        }
      },

      isCompleted: (id) => get().completedIds.includes(id),

      updateVisualizerProgress: (id, step, speed) => {
        const { visualizerProgress } = get();
        const current = visualizerProgress[id] || { step: 0, speed: 1 };
        set({
          visualizerProgress: {
            ...visualizerProgress,
            [id]: {
              step,
              speed: speed !== undefined ? speed : current.speed,
            },
          },
        });
      },

      updateAlgorithmProgress: (id, updates) => {
        const { algorithmProgress } = get();
        const current = algorithmProgress[id] || {};
        set({
          algorithmProgress: {
            ...algorithmProgress,
            [id]: { ...current, ...updates },
          },
        });
      },

      resetAlgorithmProgressTab: (id, tab) => {
        const { algorithmProgress, visualizerProgress, completedIds } = get();
        const current = algorithmProgress[id] || {};
        const updates: Partial<AlgorithmProgress> = {};

        switch (tab.toLowerCase()) {
          case 'video':
            updates.videoWatched = false;
            updates.videoCompletedAt = null;
            updates.videoWatchTimeMs = 0;
            break;
          case 'animation':
            updates.animationCompleted = false;
            updates.animationCompletedAt = null;
            updates.animationTotalTimeMs = 0;
            updates.animationPlayCount = 0;
            set({
              visualizerProgress: {
                ...visualizerProgress,
                [id]: { step: 0, speed: visualizerProgress[id]?.speed || 1 },
              },
            });
            break;
          case 'control':
            updates.controlCompleted = false;
            updates.controlCompletedAt = null;
            updates.controlBestScore = 0;
            updates.controlBestTimeMs = 0;
            updates.controlMistakes = 0;
            updates.controlAttempts = 0;
            updates.controlHintsUsed = 0;
            updates.controlTotalTimeMs = 0;
            break;
          case 'create':
            updates.createCompleted = false;
            updates.createBlanksCorrectFirst = 0;
            updates.createBlanksTotal = 0;
            updates.createAttempts = 0;
            updates.createHelpUsed = false;
            updates.createTotalTimeMs = 0;
            updates.createMistakes = 0;
            updates.createCompletedAt = null;
            break;
          case 'alive':
            updates.aliveCompleted = false;
            updates.aliveBestScore = 0;
            updates.aliveCodeSubmissions = 0;
            updates.aliveLastCode = '';
            updates.aliveTotalTimeMs = 0;
            updates.aliveCompletedAt = null;
            break;
        }

        const nextCompletedIds = completedIds.filter((item) => item !== id);
        set({
          completedIds: nextCompletedIds,
          algorithmProgress: {
            ...algorithmProgress,
            [id]: { ...current, ...updates },
          },
        });
      },

      hydrate: (data) => {
        if (!data) return;
        set((state) => ({
          completedIds: data.completedIds || state.completedIds,
          visualizerProgress: data.visualizerProgress || state.visualizerProgress,
          algorithmProgress: data.algorithmProgress || state.algorithmProgress,
          courseProgress: data.courseProgress || state.courseProgress,
        }));
      },

      setCourseActivePhase: (courseId, activePhaseIndex) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              activePhaseIndex,
              firstStartedAt: current.firstStartedAt || new Date().toISOString(),
            },
          },
        });
      },

      updateCoursePhaseStats: (courseId, phaseId, updates) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const stats = current.detailedStats || {};
        const old = stats[phaseId] || {
          timeSpentMs: 0,
          completed: false,
          result: null,
          helpUsed: false,
          mascotHelpCount: 0,
          improvedAfterMascot: false,
          attempts: 0,
          mistakes: 0,
          mascotIntentionallyDisabled: false,
        };

        const now = new Date().toISOString();
        // Never downgrade a previously completed phase to incomplete (partial saves use completed: false)
        const nextCompleted = old.completed ? true : (updates.completed ?? old.completed);
        const nextResult = old.result === 'success' ? 'success' : (updates.result ?? old.result);
        // Only increment attempts when this is a real completion, not a partial save
        const nextAttempts = updates.completed ? (old.attempts || 0) + 1 : old.attempts || 0;
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              firstStartedAt: current.firstStartedAt || now,
              lastActivityAt: now,
              detailedStats: {
                ...stats,
                [phaseId]: {
                  ...old,
                  ...updates,
                  completed: nextCompleted,
                  result: nextResult,
                  attempts: nextAttempts,
                  completedAt: updates.completed ? now : old.completedAt,
                },
              },
            },
          },
        });
      },

      incrementCourseMascotInteraction: (courseId) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const interactions = (current.mascotInteractionsTotal || 0) + 1;
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              mascotInteractionsTotal: interactions,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      updateCourseTotalTime: (courseId, timeToAddMs) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const total = (current.totalTimeMs || 0) + timeToAddMs;
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              totalTimeMs: total,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      incrementCourseMistakes: (courseId) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const mistakesCount = (current.totalMistakes || 0) + 1;
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              totalMistakes: mistakesCount,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      markCoursePhaseComplete: (courseId, phaseId) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        if (current.completedPhases?.includes(phaseId)) return;

        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              completedPhases: [...(current.completedPhases || []), phaseId],
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      markCourseCompleted: (courseId: string) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              isCompleted: true,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      resetCoursePhasesFrom: (courseId, phaseIndex, phaseIds) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };

        // Standard checkpoint logic:
        // Keep everything strictly BEFORE the target phase as completed.
        const keptPhaseIds = phaseIds.slice(0, phaseIndex);
        const nextCompleted = (current.completedPhases || []).filter((id) =>
          keptPhaseIds.includes(id),
        );

        const currentResults = current.phaseResults || {};
        const nextResults: Record<string, 'success' | 'fail'> = {};
        nextCompleted.forEach((id) => {
          if (currentResults[id]) nextResults[id] = currentResults[id];
        });

        // Smart points subtraction:
        // Instead of re-summing everything (which breaks legacy points missing from map),
        // we identify exactly which phases are being removed and subtract their points.
        const removedIds = (current.completedPhases || []).filter(
          (id) => !nextCompleted.includes(id),
        );

        let pointsToRemove = 0;
        removedIds.forEach((id) => {
          // Subtract either the recorded points or 10 if missing (legacy baseline)
          pointsToRemove += current.phasePoints?.[id]?.earned ?? 10;
        });

        const nextPoints = Math.max(0, (current.points || 0) - pointsToRemove);

        // Update the phasePoints map by removing entries for the removed phases
        const nextPhasePoints = { ...(current.phasePoints || {}) };
        removedIds.forEach((id) => {
          delete nextPhasePoints[id];
        });

        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              activePhaseIndex: phaseIndex,
              completedPhases: nextCompleted,
              phaseResults: nextResults,
              phasePoints: nextPhasePoints,
              points: nextPoints,
              isCompleted: false,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      resetCourseProgress: (courseId: string) => {
        const { courseProgress } = get();
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              activePhaseIndex: 0,
              completedPhases: [],
              phaseResults: {},
              confidenceResults: {},
              lastConfidenceRating: undefined,
              isCompleted: false,
              points: 0,
              totalTimeMs: 0,
              totalMistakes: 0,
              mascotInteractionsTotal: 0,
              detailedStats: {},
              phasePoints: {},
              lastActivityAt: new Date().toISOString(),
              firstStartedAt: new Date().toISOString(),
            },
          },
        });
      },

      syncProgress: async () => {
        const { completedIds, visualizerProgress, algorithmProgress, courseProgress } = get();
        try {
          await fetch('/api/account/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              completedIds,
              visualizerProgress,
              algorithmProgress,
              courseProgress,
            }),
          });
        } catch (err) {
          console.error('[Store] Sync failed:', err);
        }
      },

      setCourseConfidenceRating: (courseId, phaseId, rating) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const history = current.confidenceResults || {};
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              lastConfidenceRating: rating,
              confidenceResults: { ...history, [phaseId]: rating },
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      setCoursePhaseResult: (courseId, phaseId, result) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const results = current.phaseResults || {};
        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              phaseResults: { ...results, [phaseId]: result },
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      addCoursePoints: (_courseId, _pointsToAdd) => {
        // Points are now always derived from phasePoints map in setCoursePhasePoints.
        // This stub is kept for API compatibility — actual update happens there.
      },

      setCoursePhasePoints: (courseId, phaseId, data) => {
        const { courseProgress } = get();
        const current = courseProgress[courseId] || {
          activePhaseIndex: 0,
          completedPhases: [],
          points: 0,
        };
        const existingMap = current.phasePoints || {};
        const oldEarned = existingMap[phaseId]?.earned || 0;

        // If it was already completed but missing from map, we assume it contributed 0 to our total
        // OR we treat it as new points. Since we want to be smart:
        const nextPhasePoints = { ...existingMap, [phaseId]: data };

        // Smart addition: Only add the DIFFERENCE to the total
        const diff = data.earned - oldEarned;
        const nextPoints = Math.max(0, (current.points || 0) + diff);

        set({
          courseProgress: {
            ...courseProgress,
            [courseId]: {
              ...current,
              phasePoints: nextPhasePoints,
              points: nextPoints,
              lastActivityAt: new Date().toISOString(),
            },
          },
        });
      },

      isInteractionLocked: false,
      setInteractionLocked: (locked) => set({ isInteractionLocked: locked }),

      resetFilters: () => set({ activeCategory: 'all', searchQuery: '' }),
      clearStore: () =>
        set({
          completedIds: [],
          visualizerProgress: {},
          algorithmProgress: {},
          courseProgress: {},
          activeCategory: 'all',
          searchQuery: '',
          isInteractionLocked: false,
        }),
    }),
    {
      name: 'algorythmics-learning-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasRehydrated(true);
      },
    },
  ),
);
