/**
 * Node block definitions for the "Alive" tab help mode.
 * Users drag these blocks into the correct sequential order.
 */

export interface AlgorithmNode {
  id: string;
  type: 'loop' | 'condition' | 'action' | 'return';
  /** Display label */
  label: string;
  /** Correct position in the solution (1-indexed, -1 = distractor) */
  order: number;
  /** Whether this is a wrong/distractor block */
  isDistractor: boolean;
  /** Emoji icon */
  icon: string;
  /** CSS color class for the left border accent */
  colorClass: string;
}

// ─── Bubble Sort ──────────────────────────────────────────────

export const bubbleSortNodes: AlgorithmNode[] = [
  {
    id: 'outer-loop',
    type: 'loop',
    label: 'FOR i = 0 TO n - 1',
    order: 1,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-500',
  },
  {
    id: 'inner-loop',
    type: 'loop',
    label: 'FOR j = 0 TO n - i - 1',
    order: 2,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-400',
  },
  {
    id: 'compare',
    type: 'condition',
    label: 'IF arr[j] > arr[j+1]',
    order: 3,
    isDistractor: false,
    icon: '❓',
    colorClass: 'border-amber-500',
  },
  {
    id: 'swap',
    type: 'action',
    label: 'SWAP arr[j], arr[j+1]',
    order: 4,
    isDistractor: false,
    icon: '🔀',
    colorClass: 'border-green-500',
  },
  // ─── Distractors ────────────────────────────────────────
  {
    id: 'wrong-compare',
    type: 'condition',
    label: 'IF arr[j] < arr[j+1]',
    order: -1,
    isDistractor: true,
    icon: '❓',
    colorClass: 'border-red-400',
  },
  {
    id: 'wrong-loop',
    type: 'loop',
    label: 'FOR j = n TO 0',
    order: -1,
    isDistractor: true,
    icon: '🔄',
    colorClass: 'border-red-400',
  },
];

// ─── Insertion Sort ───────────────────────────────────────────

export const insertionSortNodes: AlgorithmNode[] = [
  {
    id: 'outer-loop',
    type: 'loop',
    label: 'FOR i = 1 TO n - 1',
    order: 1,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-500',
  },
  {
    id: 'pick-key',
    type: 'action',
    label: 'key = arr[i]',
    order: 2,
    isDistractor: false,
    icon: '🔑',
    colorClass: 'border-amber-500',
  },
  {
    id: 'inner-loop',
    type: 'loop',
    label: 'WHILE j >= 0 AND arr[j] > key',
    order: 3,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-400',
  },
  {
    id: 'shift',
    type: 'action',
    label: 'arr[j + 1] = arr[j]',
    order: 4,
    isDistractor: false,
    icon: '➡️',
    colorClass: 'border-green-500',
  },
  {
    id: 'insert',
    type: 'action',
    label: 'arr[j + 1] = key',
    order: 5,
    isDistractor: false,
    icon: '📥',
    colorClass: 'border-emerald-600',
  },
  // ─── Distractors ────────────────────────────────────────
  {
    id: 'wrong-condition',
    type: 'loop',
    label: 'WHILE j < n',
    order: -1,
    isDistractor: true,
    icon: '🔄',
    colorClass: 'border-red-400',
  },
  {
    id: 'wrong-action',
    type: 'action',
    label: 'arr[j] = key',
    order: -1,
    isDistractor: true,
    icon: '📥',
    colorClass: 'border-red-400',
  },
];

// ─── Registry ─────────────────────────────────────────────────

const nodeDefinitions: Record<string, AlgorithmNode[]> = {
  'bubble-sort': bubbleSortNodes,
  'insertion-sort': insertionSortNodes,
};

export function getAlgorithmNodes(algorithmId: string): AlgorithmNode[] | undefined {
  return nodeDefinitions[algorithmId];
}
