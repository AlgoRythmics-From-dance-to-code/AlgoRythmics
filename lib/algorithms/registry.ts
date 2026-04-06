/**
 * Central algorithm registry — provides a unified lookup for
 * step generators, code templates, node definitions, and analysis patterns.
 * Designed for reuse across algorithm detail pages and courses.
 */

import {
  generateBubbleSortSteps,
  BUBBLE_SORT_DEFAULT_ARRAY,
  type SortStep,
} from './bubbleSortSteps';
import { generateInsertionSortSteps, INSERTION_SORT_DEFAULT_ARRAY } from './insertionSortSteps';
import { generateSelectionSortSteps, SELECTION_SORT_DEFAULT_ARRAY } from './selectionSortSteps';
import { generateMergeSortSteps, MERGE_SORT_DEFAULT_ARRAY } from './mergeSortSteps';
import { generateQuickSortSteps, QUICK_SORT_DEFAULT_ARRAY } from './quickSortSteps';
import { generateLinearSearchSteps, LINEAR_SEARCH_DEFAULT_ARRAY } from './linearSearchSteps';
import { generateBinarySearchSteps, BINARY_SEARCH_DEFAULT_ARRAY } from './binarySearchSteps';
import { generateShellSortSteps, SHELL_SORT_DEFAULT_ARRAY } from './shellSortSteps';
import { generateHeapSortSteps, HEAP_SORT_DEFAULT_ARRAY } from './heapSortSteps';
import { generateBogosortSteps, BOGOSORT_DEFAULT_ARRAY } from './bogosortSteps';
import { generateNQueensSteps, N_QUEENS_DEFAULT_N } from './nQueensSteps';
import { getCodeTemplate, type CodeTemplate } from './codeTemplates';
import { getAlgorithmNodes, type AlgorithmNode } from './nodeDefinitions';
import { getCodePatterns, type CodePattern } from './codeAnalysis';

export interface AlgorithmDefinition {
  id: string;
  generateSteps: (values: number[]) => SortStep[];
  defaultArray: number[];
  codeTemplate?: CodeTemplate;
  nodes?: AlgorithmNode[];
  codePatterns?: CodePattern[];
  legend: { color: string; labelKey: string }[];
  category: 'sorting' | 'searching' | 'backtracking' | 'fun';
  suggestedPhases?: { id: string; label: string }[];
}

// ─── Registered Algorithms ────────────────────────────────────

const registry: Record<string, AlgorithmDefinition> = {
  'bubble-sort': {
    id: 'bubble-sort',
    generateSteps: generateBubbleSortSteps,
    defaultArray: BUBBLE_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('bubble-sort'),
    nodes: getAlgorithmNodes('bubble-sort'),
    codePatterns: getCodePatterns('bubble-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
    suggestedPhases: [
      { id: 'motivation', label: 'Motiváció (Bevezetés)' },
      { id: 'guided-visualization', label: 'Vezetett vizualizáció (Animáció)' },
      { id: 'code-building', label: 'Kód építése (Szerkezet)' },
      { id: 'analysis', label: 'Algoritmus elemzés (Komplexitás)' },
      { id: 'final-challenge', label: 'Záró kihívás (Vége)' },
    ],
  },
  'insertion-sort': {
    id: 'insertion-sort',
    generateSteps: generateInsertionSortSteps,
    defaultArray: INSERTION_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('insertion-sort'),
    nodes: getAlgorithmNodes('insertion-sort'),
    codePatterns: getCodePatterns('insertion-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
    suggestedPhases: [
      { id: 'motivation', label: 'Motiváció (Bevezetés)' },
      { id: 'guided-visualization', label: 'Vezetett vizualizáció (Animáció)' },
      { id: 'code-building', label: 'Kód építése (Szerkezet)' },
      { id: 'analysis', label: 'Algoritmus elemzés (Komplexitás)' },
      { id: 'final-challenge', label: 'Záró kihívás (Vége)' },
    ],
  },
  'selection-sort': {
    id: 'selection-sort',
    generateSteps: generateSelectionSortSteps,
    defaultArray: SELECTION_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('selection-sort'),
    nodes: getAlgorithmNodes('selection-sort'),
    codePatterns: getCodePatterns('selection-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'merge-sort': {
    id: 'merge-sort',
    generateSteps: generateMergeSortSteps,
    defaultArray: MERGE_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('merge-sort'),
    nodes: getAlgorithmNodes('merge-sort'),
    codePatterns: getCodePatterns('merge-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'quick-sort': {
    id: 'quick-sort',
    generateSteps: generateQuickSortSteps,
    defaultArray: QUICK_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('quick-sort'),
    nodes: getAlgorithmNodes('quick-sort'),
    codePatterns: getCodePatterns('quick-sort'),
    category: 'sorting',
    legend: [
      { color: '#a855f7', labelKey: 'visualizer.legend_pivot' },
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'linear-search': {
    id: 'linear-search',
    generateSteps: generateLinearSearchSteps,
    defaultArray: LINEAR_SEARCH_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('linear-search'),
    nodes: getAlgorithmNodes('linear-search'),
    codePatterns: getCodePatterns('linear-search'),
    category: 'searching',
    legend: [{ color: '#269984', labelKey: 'visualizer.legend_compare' }],
  },
  'binary-search': {
    id: 'binary-search',
    generateSteps: generateBinarySearchSteps,
    defaultArray: BINARY_SEARCH_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('binary-search'),
    nodes: getAlgorithmNodes('binary-search'),
    codePatterns: getCodePatterns('binary-search'),
    category: 'searching',
    legend: [{ color: '#269984', labelKey: 'visualizer.legend_compare' }],
  },
  'shell-sort': {
    id: 'shell-sort',
    generateSteps: generateShellSortSteps,
    defaultArray: SHELL_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('shell-sort'),
    nodes: getAlgorithmNodes('shell-sort'),
    codePatterns: getCodePatterns('shell-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'heap-sort': {
    id: 'heap-sort',
    generateSteps: generateHeapSortSteps,
    defaultArray: HEAP_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('heap-sort'),
    nodes: getAlgorithmNodes('heap-sort'),
    codePatterns: getCodePatterns('heap-sort'),
    category: 'sorting',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  bogosort: {
    id: 'bogosort',
    generateSteps: generateBogosortSteps,
    defaultArray: BOGOSORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('bogosort'),
    nodes: getAlgorithmNodes('bogosort'),
    codePatterns: getCodePatterns('bogosort'),
    category: 'fun',
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'n-queens': {
    id: 'n-queens',
    generateSteps: generateNQueensSteps,
    defaultArray: N_QUEENS_DEFAULT_N,
    codeTemplate: getCodeTemplate('n-queens'),
    nodes: getAlgorithmNodes('n-queens'),
    codePatterns: getCodePatterns('n-queens'),
    category: 'backtracking',
    legend: [{ color: '#269984', labelKey: 'visualizer.legend_compare' }],
  },
};

/**
 * Get a full algorithm definition by ID.
 * Returns undefined if the algorithm isn't registered yet.
 */
export function getAlgorithm(algorithmId: string): AlgorithmDefinition | undefined {
  return registry[algorithmId];
}

/**
 * Check whether an algorithm has full learning content (all 5 tabs).
 */
export function hasFullContent(algorithmId: string): boolean {
  const algo = registry[algorithmId];
  if (!algo) return false;
  return !!(algo.codeTemplate && algo.nodes && algo.codePatterns);
}

export { type SortStep, type SortItem } from './bubbleSortSteps';
export { type CodeTemplate, type BlankSlot } from './codeTemplates';
export { type AlgorithmNode } from './nodeDefinitions';
export { type CodeAnalysisResult, analyzeCode } from './codeAnalysis';
