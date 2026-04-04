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

// ─── Selection Sort ───────────────────────────────────────────

export const selectionSortNodes: AlgorithmNode[] = [
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
    id: 'init-min',
    type: 'action',
    label: 'minIndex = i',
    order: 2,
    isDistractor: false,
    icon: '📍',
    colorClass: 'border-amber-400',
  },
  {
    id: 'inner-loop',
    type: 'loop',
    label: 'FOR j = i + 1 TO n',
    order: 3,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-400',
  },
  {
    id: 'compare',
    type: 'condition',
    label: 'IF arr[j] < arr[minIndex]',
    order: 4,
    isDistractor: false,
    icon: '❓',
    colorClass: 'border-amber-600',
  },
  {
    id: 'update-min',
    type: 'action',
    label: 'minIndex = j',
    order: 5,
    isDistractor: false,
    icon: '🎯',
    colorClass: 'border-orange-500',
  },
  {
    id: 'swap',
    type: 'action',
    label: 'SWAP arr[i], arr[minIndex]',
    order: 6,
    isDistractor: false,
    icon: '🔀',
    colorClass: 'border-green-500',
  },
];

// ─── Merge Sort ─────────────────────────────────────────────

export const mergeSortNodes: AlgorithmNode[] = [
  {
    id: 'base-case',
    type: 'condition',
    label: 'IF length <= 1 RETURN',
    order: 1,
    isDistractor: false,
    icon: '🛑',
    colorClass: 'border-red-500',
  },
  {
    id: 'split',
    type: 'action',
    label: 'split into LEFT and RIGHT',
    order: 2,
    isDistractor: false,
    icon: '✂️',
    colorClass: 'border-blue-400',
  },
  {
    id: 'recurse-left',
    type: 'action',
    label: 'mergeSort(LEFT)',
    order: 3,
    isDistractor: false,
    icon: '🔁',
    colorClass: 'border-indigo-400',
  },
  {
    id: 'recurse-right',
    type: 'action',
    label: 'mergeSort(RIGHT)',
    order: 4,
    isDistractor: false,
    icon: '🔁',
    colorClass: 'border-indigo-500',
  },
  {
    id: 'merge',
    type: 'action',
    label: 'MERGE(LEFT, RIGHT)',
    order: 5,
    isDistractor: false,
    icon: '🤝',
    colorClass: 'border-emerald-500',
  },
];

// ─── Quick Sort ───────────────────────────────────────────

export const quickSortNodes: AlgorithmNode[] = [
  {
    id: 'base-case',
    type: 'condition',
    label: 'IF length <= 1 RETURN',
    order: 1,
    isDistractor: false,
    icon: '🛑',
    colorClass: 'border-red-500',
  },
  {
    id: 'pick-pivot',
    type: 'action',
    label: 'pick PIVOT',
    order: 2,
    isDistractor: false,
    icon: '🎯',
    colorClass: 'border-amber-500',
  },
  {
    id: 'partition',
    type: 'action',
    label: 'PARTITION around pivot',
    order: 3,
    isDistractor: false,
    icon: '➗',
    colorClass: 'border-blue-500',
  },
  {
    id: 'recurse-left',
    type: 'action',
    label: 'quickSort(LEFT)',
    order: 4,
    isDistractor: false,
    icon: '🔁',
    colorClass: 'border-indigo-400',
  },
  {
    id: 'recurse-right',
    type: 'action',
    label: 'quickSort(RIGHT)',
    order: 5,
    isDistractor: false,
    icon: '🔁',
    colorClass: 'border-indigo-500',
  },
];

// ─── Linear Search ─────────────────────────────────────────

export const linearSearchNodes: AlgorithmNode[] = [
  {
    id: 'loop',
    type: 'loop',
    label: 'FOR i = 0 TO n - 1',
    order: 1,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-500',
  },
  {
    id: 'compare',
    type: 'condition',
    label: 'IF arr[i] == target',
    order: 2,
    isDistractor: false,
    icon: '❓',
    colorClass: 'border-amber-500',
  },
  {
    id: 'found',
    type: 'return',
    label: 'RETURN index i',
    order: 3,
    isDistractor: false,
    icon: '✅',
    colorClass: 'border-green-500',
  },
  {
    id: 'not-found',
    type: 'return',
    label: 'RETURN -1 (after loop)',
    order: 4,
    isDistractor: false,
    icon: '❌',
    colorClass: 'border-red-500',
  },
];

// ─── Binary Search ─────────────────────────────────────────

export const binarySearchNodes: AlgorithmNode[] = [
  {
    id: 'while',
    type: 'loop',
    label: 'WHILE low <= high',
    order: 1,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-500',
  },
  {
    id: 'calc-mid',
    type: 'action',
    label: 'mid = (low + high) / 2',
    order: 2,
    isDistractor: false,
    icon: '📍',
    colorClass: 'border-amber-400',
  },
  {
    id: 'check-found',
    type: 'condition',
    label: 'IF arr[mid] == target',
    order: 3,
    isDistractor: false,
    icon: '✅',
    colorClass: 'border-green-500',
  },
  {
    id: 'go-right',
    type: 'action',
    label: 'IF arr[mid] < target: low = mid + 1',
    order: 4,
    isDistractor: false,
    icon: '➡️',
    colorClass: 'border-indigo-400',
  },
  {
    id: 'go-left',
    type: 'action',
    label: 'ELSE: high = mid - 1',
    order: 5,
    isDistractor: false,
    icon: '⬅️',
    colorClass: 'border-indigo-500',
  },
];

// ─── Shell Sort ─────────────────────────────────────────────

export const shellSortNodes: AlgorithmNode[] = [
  {
    id: 'outer-loop',
    type: 'loop',
    label: 'FOR gap = n/2 DOWN TO 1',
    order: 1,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-500',
  },
  {
    id: 'inner-loop',
    type: 'loop',
    label: 'FOR i = gap TO n - 1',
    order: 2,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-400',
  },
  {
    id: 'pick-temp',
    type: 'action',
    label: 'temp = arr[i]',
    order: 3,
    isDistractor: false,
    icon: '📍',
    colorClass: 'border-amber-400',
  },
  {
    id: 'while-shift',
    type: 'loop',
    label: 'WHILE j >= gap AND arr[j-gap] > temp',
    order: 4,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-300',
  },
  {
    id: 'shift',
    type: 'action',
    label: 'arr[j] = arr[j - gap]',
    order: 5,
    isDistractor: false,
    icon: '➡️',
    colorClass: 'border-green-400',
  },
  {
    id: 'insert',
    type: 'action',
    label: 'arr[j] = temp',
    order: 6,
    isDistractor: false,
    icon: '📥',
    colorClass: 'border-green-600',
  },
];

// ─── Heap Sort ──────────────────────────────────────────────

export const heapSortNodes: AlgorithmNode[] = [
  {
    id: 'build-heap',
    type: 'action',
    label: 'BUILD MAX-HEAP(arr)',
    order: 1,
    isDistractor: false,
    icon: '🏗️',
    colorClass: 'border-blue-500',
  },
  {
    id: 'loop',
    type: 'loop',
    label: 'FOR i = n-1 DOWN TO 1',
    order: 2,
    isDistractor: false,
    icon: '🔄',
    colorClass: 'border-blue-400',
  },
  {
    id: 'swap',
    type: 'action',
    label: 'SWAP root WITH arr[i]',
    order: 3,
    isDistractor: false,
    icon: '🔀',
    colorClass: 'border-amber-500',
  },
  {
    id: 'heapify',
    type: 'action',
    label: 'MAX-HEAPIFY(arr, 0, i)',
    order: 4,
    isDistractor: false,
    icon: '🔁',
    colorClass: 'border-green-500',
  },
];

// ─── Bogosort ───────────────────────────────────────────────

export const bogosortNodes: AlgorithmNode[] = [
  {
    id: 'check',
    type: 'condition',
    label: 'WHILE NOT isSorted(arr)',
    order: 1,
    isDistractor: false,
    icon: '❓',
    colorClass: 'border-amber-500',
  },
  {
    id: 'shuffle',
    type: 'action',
    label: 'SHUFFLE(arr)',
    order: 2,
    isDistractor: false,
    icon: '🎲',
    colorClass: 'border-blue-500',
  },
  {
    id: 'done',
    type: 'return',
    label: 'RETURN arr',
    order: 3,
    isDistractor: false,
    icon: '✅',
    colorClass: 'border-green-500',
  },
];

// ─── Registry ─────────────────────────────────────────────────

const nodeDefinitions: Record<string, AlgorithmNode[]> = {
  'bubble-sort': bubbleSortNodes,
  'insertion-sort': insertionSortNodes,
  'selection-sort': selectionSortNodes,
  'merge-sort': mergeSortNodes,
  'quick-sort': quickSortNodes,
  'linear-search': linearSearchNodes,
  'binary-search': binarySearchNodes,
  'shell-sort': shellSortNodes,
  'heap-sort': heapSortNodes,
  bogosort: bogosortNodes,
  'n-queens': [
    {
      id: 'base-case',
      type: 'condition',
      label: 'IF row == n THEN return true',
      order: 1,
      isDistractor: false,
      icon: '🏁',
      colorClass: 'border-blue-500',
    },
    {
      id: 'loop',
      type: 'loop',
      label: 'FOR col = 0 TO n - 1',
      order: 2,
      isDistractor: false,
      icon: '🔄',
      colorClass: 'border-blue-400',
    },
    {
      id: 'safe-check',
      type: 'condition',
      label: 'IF isSafe(row, col)',
      order: 3,
      isDistractor: false,
      icon: '🛡️',
      colorClass: 'border-amber-500',
    },
    {
      id: 'place',
      type: 'action',
      label: 'board[row] = col',
      order: 4,
      isDistractor: false,
      icon: '👑',
      colorClass: 'border-indigo-500',
    },
    {
      id: 'recursive',
      type: 'action',
      label: 'solve(row + 1)',
      order: 5,
      isDistractor: false,
      icon: '🔁',
      colorClass: 'border-green-500',
    },
    {
      id: 'backtrack',
      type: 'action',
      label: 'board[row] = -1',
      order: 6,
      isDistractor: false,
      icon: '🔙',
      colorClass: 'border-red-500',
    },
  ],
};

export function getAlgorithmNodes(algorithmId: string): AlgorithmNode[] | undefined {
  return nodeDefinitions[algorithmId];
}
