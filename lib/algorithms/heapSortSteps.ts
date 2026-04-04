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
      description: 'Ready to start Heap Sort',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
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
    description: `Heap Sort complete!`,
    comparisons,
    swapCount,
    pass: 0,
  });

  return result;
}

export const HEAP_SORT_DEFAULT_ARRAY = [12, 11, 13, 5, 6, 7, 8, 1, 9];
