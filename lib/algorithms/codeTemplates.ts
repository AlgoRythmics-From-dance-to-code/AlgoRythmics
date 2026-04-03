/**
 * Code templates for the "Create" (fill-in-the-blanks) exercise.
 * Each algorithm defines its pseudocode with blanks and possible distractors.
 */

export interface BlankSlot {
  /** Unique id for this blank */
  id: string;
  /** The correct answer (normalized: trimmed, compared case-insensitively) */
  answer: string;
  /** Placeholder display text */
  placeholder: string;
  /** Width hint in characters */
  widthCh: number;
  /** Distractor options shown in help-card mode (includes the correct answer) */
  options: string[];
  /** Optional hint text */
  hint?: string;
}

export interface CodeLine {
  /** Full text — blanks are marked with {{blankId}} */
  text: string;
  /** Indentation level (0 = root) */
  indent: number;
}

export interface CodeTemplate {
  algorithmId: string;
  language: string;
  lines: CodeLine[];
  blanks: BlankSlot[];
}

// ─── Bubble Sort ──────────────────────────────────────────────

export const bubbleSortTemplate: CodeTemplate = {
  algorithmId: 'bubble-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function bubbleSort(arr):', indent: 0 },
    { text: 'for i = 0 to {{blank1}}', indent: 1 },
    { text: 'for j = 0 to {{blank2}}', indent: 2 },
    { text: 'if arr[j] {{blank3}} arr[j+1]', indent: 3 },
    { text: '{{blank4}}(arr[j], arr[j+1])', indent: 4 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'arr.length + 1'],
      hint: 'How many passes does bubble sort need?',
    },
    {
      id: 'blank2',
      answer: 'arr.length - i - 1',
      placeholder: '________________',
      widthCh: 18,
      options: ['arr.length - i - 1', 'arr.length - 1', 'arr.length - i', 'i'],
      hint: 'Each pass, one more element is already sorted at the end.',
    },
    {
      id: 'blank3',
      answer: '>',
      placeholder: '__',
      widthCh: 3,
      options: ['>', '<', '>=', '<='],
      hint: 'We want ascending order — swap when left is bigger.',
    },
    {
      id: 'blank4',
      answer: 'swap',
      placeholder: '________',
      widthCh: 8,
      options: ['swap', 'compare', 'move', 'insert'],
      hint: 'Exchange the two elements.',
    },
  ],
};

// ─── Insertion Sort ───────────────────────────────────────────

export const insertionSortTemplate: CodeTemplate = {
  algorithmId: 'insertion-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function insertionSort(arr):', indent: 0 },
    { text: 'for i = 1 to {{blank1}}', indent: 1 },
    { text: 'key = {{blank2}}', indent: 2 },
    { text: 'j = i - 1', indent: 2 },
    { text: 'while j >= 0 and {{blank3}} > key:', indent: 2 },
    { text: 'arr[j + 1] = {{blank4}}', indent: 3 },
    { text: 'j = j - 1', indent: 3 },
    { text: 'arr[j + 1] = {{blank5}}', indent: 2 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'arr.length + 1'],
      hint: 'The loop should go until the end of the array.',
    },
    {
      id: 'blank2',
      answer: 'arr[i]',
      placeholder: '______',
      widthCh: 8,
      options: ['arr[i]', 'arr[j]', 'i', '0'],
      hint: 'The current element to be inserted.',
    },
    {
      id: 'blank3',
      answer: 'arr[j]',
      placeholder: '______',
      widthCh: 8,
      options: ['arr[j]', 'arr[i]', 'arr[j+1]', 'key'],
      hint: 'Compare with the element to the left.',
    },
    {
      id: 'blank4',
      answer: 'arr[j]',
      placeholder: '______',
      widthCh: 8,
      options: ['arr[j]', 'key', 'arr[i]', 'arr[j+1]'],
      hint: 'Shift the larger element to the right.',
    },
    {
      id: 'blank5',
      answer: 'key',
      placeholder: '______',
      widthCh: 8,
      options: ['key', 'arr[i]', 'arr[j]', 'temp'],
      hint: 'Insert the element in its correct position.',
    },
  ],
};

// ─── Selection Sort ───────────────────────────────────────────

export const selectionSortTemplate: CodeTemplate = {
  algorithmId: 'selection-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function selectionSort(arr):', indent: 0 },
    { text: 'for i = 0 to {{blank1}}', indent: 1 },
    { text: 'minIndex = i', indent: 2 },
    { text: 'for j = i + 1 to {{blank2}}', indent: 2 },
    { text: 'if arr[j] < {{blank3}}:', indent: 3 },
    { text: 'minIndex = {{blank4}}', indent: 4 },
    { text: 'if minIndex != i: swap(arr[i], {{blank5}})', indent: 2 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'arr.length + 1'],
      hint: 'The loop should process all but the last element.',
    },
    {
      id: 'blank2',
      answer: 'arr.length',
      placeholder: '__________',
      widthCh: 10,
      options: ['arr.length', 'arr.length - 1', 'i', 'n'],
      hint: 'The inner loop looks at the rest of the array.',
    },
    {
      id: 'blank3',
      answer: 'arr[minIndex]',
      placeholder: '____________',
      widthCh: 12,
      options: ['arr[minIndex]', 'arr[i]', 'min', 'arr[j]'],
      hint: 'Compare current element with the found minimum.',
    },
    {
      id: 'blank4',
      answer: 'j',
      placeholder: '__',
      widthCh: 3,
      options: ['j', 'i', 'arr[j]', 'minIndex'],
      hint: 'Update the index of the minimum element.',
    },
    {
      id: 'blank5',
      answer: 'arr[minIndex]',
      placeholder: '____________',
      widthCh: 12,
      options: ['arr[minIndex]', 'arr[j]', 'minIndex', 'arr[i]'],
      hint: 'Swap current position with the smallest found element.',
    },
  ],
};

// ─── Merge Sort ─────────────────────────────────────────────

export const mergeSortTemplate: CodeTemplate = {
  algorithmId: 'merge-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function mergeSort(arr):', indent: 0 },
    { text: 'if arr.length <= 1: return arr', indent: 1 },
    { text: 'mid = floor({{blank1}} / 2)', indent: 1 },
    { text: 'left = mergeSort({{blank2}})', indent: 1 },
    { text: 'right = mergeSort({{blank3}})', indent: 1 },
    { text: 'return {{blank4}}(left, right)', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length',
      placeholder: '__________',
      widthCh: 10,
      options: ['arr.length', 'n', '2', 'mid'],
      hint: 'Find the middle point of the array.',
    },
    {
      id: 'blank2',
      answer: 'arr.slice(0, mid)',
      placeholder: '________________',
      widthCh: 16,
      options: ['arr.slice(0, mid)', 'arr[0...mid]', 'left', 'arr'],
      hint: 'Sort the left half recursively.',
    },
    {
      id: 'blank3',
      answer: 'arr.slice(mid)',
      placeholder: '____________',
      widthCh: 12,
      options: ['arr.slice(mid)', 'arr[mid...n]', 'right', 'arr'],
      hint: 'Sort the right half recursively.',
    },
    {
      id: 'blank4',
      answer: 'merge',
      placeholder: '_______',
      widthCh: 8,
      options: ['merge', 'combine', 'join', 'sort'],
      hint: 'Combine the two sorted halves.',
    },
  ],
};

// ─── Quick Sort ───────────────────────────────────────────

export const quickSortTemplate: CodeTemplate = {
  algorithmId: 'quick-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function quickSort(arr):', indent: 0 },
    { text: 'if arr.length <= 1: return arr', indent: 1 },
    { text: 'pivot = {{blank1}}', indent: 1 },
    { text: 'left = [x for x in arr if x < {{blank2}}]', indent: 1 },
    { text: 'middle = [x for x in arr if x == pivot]', indent: 1 },
    { text: 'right = [x for x in arr if x > {{blank3}}]', indent: 1 },
    { text: 'return {{blank4}}(left) + middle + {{blank5}}(right)', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr[arr.length - 1]',
      placeholder: '___________________',
      widthCh: 19,
      options: ['arr[arr.length - 1]', 'arr[0]', 'random()', 'mid'],
      hint: 'Choose a pivot element (often the last one).',
    },
    {
      id: 'blank2',
      answer: 'pivot',
      placeholder: '_______',
      widthCh: 8,
      options: ['pivot', 'arr[0]', 'x', 'left'],
      hint: 'Filter elements smaller than the pivot.',
    },
    {
      id: 'blank3',
      answer: 'pivot',
      placeholder: '_______',
      widthCh: 8,
      options: ['pivot', 'x', 'high', 'right'],
      hint: 'Filter elements larger than the pivot.',
    },
    {
      id: 'blank4',
      answer: 'quickSort',
      placeholder: '_________',
      widthCh: 10,
      options: ['quickSort', 'sort', 'partition', 'merge'],
      hint: 'Recursively sort the left part.',
    },
    {
      id: 'blank5',
      answer: 'quickSort',
      placeholder: '_________',
      widthCh: 10,
      options: ['quickSort', 'sort', 'partition', 'merge'],
      hint: 'Recursively sort the right part.',
    },
  ],
};

// ─── Linear Search ─────────────────────────────────────────

export const linearSearchTemplate: CodeTemplate = {
  algorithmId: 'linear-search',
  language: 'pseudocode',
  lines: [
    { text: 'function linearSearch(arr, target):', indent: 0 },
    { text: 'for i = 0 to {{blank1}}', indent: 1 },
    { text: 'if {{blank2}} == target:', indent: 2 },
    { text: 'return {{blank3}}', indent: 3 },
    { text: 'return {{blank4}}', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'i'],
      hint: 'Iterate through the entire array.',
    },
    {
      id: 'blank2',
      answer: 'arr[i]',
      placeholder: '______',
      widthCh: 8,
      options: ['arr[i]', 'i', 'target', 'arr'],
      hint: 'Check the current element.',
    },
    {
      id: 'blank3',
      answer: 'i',
      placeholder: '__',
      widthCh: 3,
      options: ['i', 'arr[i]', 'true', 'found'],
      hint: 'Return the index where target was found.',
    },
    {
      id: 'blank4',
      answer: '-1',
      placeholder: '___',
      widthCh: 4,
      options: ['-1', 'null', 'false', '0'],
      hint: 'Return this if the target is not found.',
    },
  ],
};

// ─── Binary Search ─────────────────────────────────────────

export const binarySearchTemplate: CodeTemplate = {
  algorithmId: 'binary-search',
  language: 'pseudocode',
  lines: [
    { text: 'function binarySearch(arr, target):', indent: 0 },
    { text: 'low = 0, high = {{blank1}}', indent: 1 },
    { text: 'while {{blank2}}:', indent: 1 },
    { text: 'mid = (low + high) / 2', indent: 2 },
    { text: 'if arr[mid] == target: return mid', indent: 2 },
    { text: 'else if arr[mid] < target: {{blank3}}', indent: 2 },
    { text: 'else: {{blank4}}', indent: 2 },
    { text: 'return -1', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'mid'],
      hint: 'The search range starts with the whole array.',
    },
    {
      id: 'blank2',
      answer: 'low <= high',
      placeholder: '___________',
      widthCh: 12,
      options: ['low <= high', 'low < high', 'true', 'low != high'],
      hint: 'Continue searching enquanto the range is valid.',
    },
    {
      id: 'blank3',
      answer: 'low = mid + 1',
      placeholder: '_____________',
      widthCh: 14,
      options: ['low = mid + 1', 'low = mid', 'high = mid - 1', 'low++'],
      hint: 'If target is larger, search the right half.',
    },
    {
      id: 'blank4',
      answer: 'high = mid - 1',
      placeholder: '______________',
      widthCh: 15,
      options: ['high = mid - 1', 'high = mid', 'low = mid + 1', 'high--'],
      hint: 'If target is smaller, search the left half.',
    },
  ],
};

// ─── Shell Sort ─────────────────────────────────────────────

export const shellSortTemplate: CodeTemplate = {
  algorithmId: 'shell-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function shellSort(arr):', indent: 0 },
    { text: 'gap = floor({{blank1}} / 2)', indent: 1 },
    { text: 'while gap > 0:', indent: 1 },
    { text: 'for i = gap to {{blank2}}:', indent: 2 },
    { text: 'temp = arr[i], j = i', indent: 3 },
    { text: 'while j >= gap and arr[j - gap] > temp:', indent: 3 },
    { text: 'arr[j] = {{blank3}}', indent: 4 },
    { text: 'j -= gap', indent: 4 },
    { text: 'arr[j] = {{blank4}}', indent: 3 },
    { text: 'gap = floor(gap / 2)', indent: 2 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length',
      placeholder: '__________',
      widthCh: 10,
      options: ['arr.length', 'n', 'gap', '2'],
      hint: 'The initial gap should be half the length of the array.',
    },
    {
      id: 'blank2',
      answer: 'arr.length',
      placeholder: '__________',
      widthCh: 10,
      options: ['arr.length', 'n', 'gap', 'i'],
      hint: 'The loop should process the rest of the array elements.',
    },
    {
      id: 'blank3',
      answer: 'arr[j - gap]',
      placeholder: '____________',
      widthCh: 12,
      options: ['arr[j - gap]', 'arr[j]', 'temp', 'gap'],
      hint: 'Shift elements until the right position is found.',
    },
    {
      id: 'blank4',
      answer: 'temp',
      placeholder: '____',
      widthCh: 4,
      options: ['temp', 'arr[j]', 'gap', 'j'],
      hint: 'Place the element back into its gap-sorted position.',
    },
  ],
};

// ─── Heap Sort ──────────────────────────────────────────────

export const heapSortTemplate: CodeTemplate = {
  algorithmId: 'heap-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function heapSort(arr):', indent: 0 },
    { text: 'buildMaxHeap({{blank1}})', indent: 1 },
    { text: 'for i = arr.length - 1 down to 1:', indent: 1 },
    { text: 'swap(arr[0], {{blank2}})', indent: 2 },
    { text: 'maxHeapify(arr, {{blank3}}, 0)', indent: 2 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr',
      placeholder: '___',
      widthCh: 3,
      options: ['arr', 'heap', 'tree', 'root'],
      hint: 'First, transform the array into a max heap.',
    },
    {
      id: 'blank2',
      answer: 'arr[i]',
      placeholder: '______',
      widthCh: 6,
      options: ['arr[i]', 'arr[0]', 'last', 'max'],
      hint: 'Exchange the root (max element) with the last element.',
    },
    {
      id: 'blank3',
      answer: 'i',
      placeholder: '__',
      widthCh: 2,
      options: ['i', 'n', '0', 'length'],
      hint: 'Maintain the heap property on the reduced heap.',
    },
  ],
};

// ─── Bogosort ───────────────────────────────────────────────

export const bogosortTemplate: CodeTemplate = {
  algorithmId: 'bogosort',
  language: 'pseudocode',
  lines: [
    { text: 'function bogosort(arr):', indent: 0 },
    { text: 'while not {{blank1}}(arr):', indent: 1 },
    { text: '{{blank2}}(arr)', indent: 2 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'isSorted',
      placeholder: '________',
      widthCh: 8,
      options: ['isSorted', 'check', 'correct', 'sorted'],
      hint: 'Repeat until the arrangement is correct.',
    },
    {
      id: 'blank2',
      answer: 'shuffle',
      placeholder: '_______',
      widthCh: 7,
      options: ['shuffle', 'randomize', 'permute', 'mix'],
      hint: 'Radomly reorder the elements.',
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────

const templates: Record<string, CodeTemplate> = {
  'bubble-sort': bubbleSortTemplate,
  'insertion-sort': insertionSortTemplate,
  'selection-sort': selectionSortTemplate,
  'merge-sort': mergeSortTemplate,
  'quick-sort': quickSortTemplate,
  'linear-search': linearSearchTemplate,
  'binary-search': binarySearchTemplate,
  'shell-sort': shellSortTemplate,
  'heap-sort': heapSortTemplate,
  bogosort: bogosortTemplate,
  'n-queens': {
    algorithmId: 'n-queens',
    language: 'pseudocode',
    lines: [
      { text: 'function solve(row):', indent: 0 },
      { text: 'if row == n: return true', indent: 1 },
      { text: 'for col = 0 to n - 1:', indent: 1 },
      { text: 'if {{blank1}}(row, col):', indent: 2 },
      { text: 'board[row] = col', indent: 3 },
      { text: 'if {{blank2}}(row + 1):', indent: 3 },
      { text: 'return true', indent: 4 },
      { text: 'board[row] = {{blank3}} // backtrack', indent: 3 },
      { text: 'return false', indent: 1 },
    ],
    blanks: [
      {
        id: 'blank1',
        answer: 'isSafe',
        placeholder: '______',
        widthCh: 6,
        options: ['isSafe', 'check', 'place', 'valid'],
        hint: 'Check if this column is safe for the queen.',
      },
      {
        id: 'blank2',
        answer: 'solve',
        placeholder: '_____',
        widthCh: 5,
        options: ['solve', 'solveNQueens', 'place', 'next'],
        hint: 'Recursively try placing the queen in the next row.',
      },
      {
        id: 'blank3',
        answer: '-1',
        placeholder: '___',
        widthCh: 3,
        options: ['-1', '0', 'null', 'false'],
        hint: 'Remove the queen from the current position.',
      },
    ],
  },
};

export function getCodeTemplate(algorithmId: string): CodeTemplate | undefined {
  return templates[algorithmId];
}
