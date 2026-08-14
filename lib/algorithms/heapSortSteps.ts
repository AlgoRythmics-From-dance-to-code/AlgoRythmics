/**
 * Heap Sort step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Heap Sort algorithm.
 */
export function generateHeapSortSteps(initialValues: number[]): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Initial array — ready to sort',
      descriptionKey: 'visualizer.initial',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      highlightLine: 1,
      variables: { n: arr.length, comparisons: 0, swaps: 0 },
    },
  ];

  let comparisons = 0;
  let swapCount = 0;
  const sorted: number[] = [];
  const n = arr.length;

  function heapify(arr: SortItem[], n: number, i: number) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;

    result.push({
      array: [...arr],
      activeIndices: [i],
      swapping: false,
      sortedIndices: [...sorted],
      description: `Heapifying at index ${i}`,
      comparisons,
      swapCount,
      pass: 0,
      highlightLine: 7,
      variables: {
        i,
        largest: i,
        l,
        r,
        'arr[i]': arr[i].val,
        comparisons,
        swaps: swapCount,
      },
    });

    if (l < n) {
      comparisons++;
      if (arr[l].val > arr[largest].val) {
        largest = l;
      }
    }

    if (r < n) {
      comparisons++;
      if (arr[r].val > arr[largest].val) {
        largest = r;
      }
    }

    if (largest !== i) {
      const temp = arr[i];
      arr[i] = arr[largest];
      arr[largest] = temp;
      swapCount++;

      result.push({
        array: [...arr],
        activeIndices: [i, largest],
        swapping: true,
        sortedIndices: [...sorted],
        description: `Swapping ${arr[i].val} ↔ ${arr[largest].val} to maintain heap property`,
        comparisons,
        swapCount,
        pass: 0,
        highlightLine: 10,
        variables: {
          i,
          largest,
          swapped: `${arr[i].val} ↔ ${arr[largest].val}`,
          comparisons,
          swaps: swapCount,
        },
      });

      heapify(arr, n, largest);
    }
  }

  // Build heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: [...sorted],
    description: `Heap built! Starting extraction of elements...`,
    comparisons,
    swapCount,
    pass: 0,
    highlightLine: 2,
    variables: {
      status: 'Heap Built',
      comparisons,
      swaps: swapCount,
    },
  });

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    // Current element is sorted at the end
    const temp = arr[0];
    arr[0] = arr[i];
    arr[i] = temp;
    swapCount++;

    result.push({
      array: [...arr],
      activeIndices: [0, i],
      swapping: true,
      sortedIndices: [...sorted],
      description: `Swapping root (largest) with end of heap: ${arr[0].val} ↔ ${arr[i].val}`,
      comparisons,
      swapCount,
      pass: 0,
      highlightLine: 4,
      variables: {
        i,
        'root (max)': arr[i].val,
        newAtRoot: arr[0].val,
        comparisons,
        swaps: swapCount,
      },
    });

    sorted.push(i);
    heapify(arr, i, 0);
  }

  sorted.push(0);
  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: arr.map((_, i) => i),
    description: 'Array sorted!',
    descriptionKey: 'visualizer.sorted_complete',
    comparisons,
    swapCount,
    pass: 0,
    highlightLine: 1,
    variables: {
      comparisons,
      swaps: swapCount,
      status: 'Sorted',
    },
  });

  return result;
}

export const HEAP_SORT_DEFAULT_ARRAY = [12, 11, 13, 5, 6, 7, 8, 1, 9];
