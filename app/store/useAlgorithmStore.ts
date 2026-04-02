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
  controlMistakes?: number;
  createHelpUsed?: boolean;
  createBlanksCorrectFirst?: number;
  createBlanksTotal?: number;
  createTotalTimeMs?: number;
  aliveBestScore?: number;
  controlHintsUsed?: number;
  animationPlayCount?: number;
  aliveHelpUsed?: boolean;
  aliveCodeSubmissions?: number;
  aliveLastCode?: string;
  aliveTotalTimeMs?: number;
  aliveLastActivityAt?: string;
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
  }) => void;

  isInteractionLocked: boolean;
  setInteractionLocked: (locked: boolean) => void;

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

      // Actions
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
        const { algorithmProgress } = get();
        const current = algorithmProgress[id] || {};
        const updates: Partial<AlgorithmProgress> = {};

        switch (tab.toLowerCase()) {
          case 'video':
            updates.videoWatched = false;
            updates.videoCompletedAt = null;
            break;
          case 'animation':
            updates.animationCompleted = false;
            updates.animationCompletedAt = null;
            break;
          case 'control':
            updates.controlCompleted = false;
            updates.controlBestScore = 0;
            updates.controlMistakes = 0;
            updates.controlCompletedAt = null;
            break;
          case 'create':
            updates.createCompleted = false;
            updates.createBlanksCorrectFirst = 0;
            updates.createBlanksTotal = 0;
            updates.createCompletedAt = null;
            break;
          case 'alive':
            updates.aliveCompleted = false;
            updates.aliveBestScore = 0;
            updates.aliveCompletedAt = null;
            break;
        }

        set({
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
        }));
      },

      isInteractionLocked: false,
      setInteractionLocked: (locked) => set({ isInteractionLocked: locked }),

      resetFilters: () => set({ activeCategory: 'all', searchQuery: '' }),
      clearStore: () =>
        set({
          completedIds: [],
          visualizerProgress: {},
          algorithmProgress: {},
          activeCategory: 'all',
          searchQuery: '',
          isInteractionLocked: false,
        }),
    }),
    {
      name: 'algorythmics-learning-storage', // Persistence key
    },
  ),
);
