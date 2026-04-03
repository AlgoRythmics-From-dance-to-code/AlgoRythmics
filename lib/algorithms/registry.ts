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
import {
  generateInsertionSortSteps,
  INSERTION_SORT_DEFAULT_ARRAY,
} from './insertionSortSteps';
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
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
  },
  'insertion-sort': {
    id: 'insertion-sort',
    generateSteps: generateInsertionSortSteps,
    defaultArray: INSERTION_SORT_DEFAULT_ARRAY,
    codeTemplate: getCodeTemplate('insertion-sort'),
    nodes: getAlgorithmNodes('insertion-sort'),
    codePatterns: getCodePatterns('insertion-sort'),
    legend: [
      { color: '#269984', labelKey: 'visualizer.legend_compare' },
      { color: '#f97316', labelKey: 'visualizer.legend_swap' },
      { color: '#4ade80', labelKey: 'visualizer.legend_sorted' },
    ],
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
