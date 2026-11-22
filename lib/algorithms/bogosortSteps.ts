/**
 * Bogosort step generator (for fun).
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute some steps of the Bogosort algorithm.
 * Since Bogosort is stochastic, we simulate a few unsuccessful shuffles
 * before finally showing the sorted array for the demo.
 */
export function generateBogosortSteps(initialValues: number[]): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Ready to start Bogosort... good luck!',
      descriptionKey: 'visualizer.bogosort_ready',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      highlightLine: 1,
      variables: { attempts: 0, isSorted: false },
    },
  ];

  const n = arr.length;
  let attempts = 0;
  const maxAttempts = 5; // Limiting for visualizer sanity

  function isSorted(items: SortItem[]): boolean {
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].val > items[i + 1].val) return false;
    }
    return true;
  }

  function shuffle(items: SortItem[]) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  while (!isSorted(arr) && attempts < maxAttempts) {
    attempts++;
    shuffle(arr);

    result.push({
      array: [...arr],
      activeIndices: arr.map((_, i) => i),
      swapping: true,
      sortedIndices: [],
      description: `Attempt ${attempts}: Shuffled the entire array!`,
      descriptionKey: 'visualizer.bogosort_attempt',
      descriptionParams: { attempts },
      comparisons: Math.max(0, n - 1),
      swapCount: n,
      pass: attempts,
      highlightLine: 3,
      variables: {
        attempts,
        isSorted: isSorted(arr),
        comparisons: Math.max(0, n - 1),
        shuffledItems: n,
      },
    });
  }

  const foundNaturally = isSorted(arr);
  const sortedArr = [...initialValues].sort((a, b) => a - b).map((v, i) => ({ val: v, id: i }));
  result.push({
    array: foundNaturally ? [...arr] : sortedArr,
    activeIndices: [],
    swapping: false,
    sortedIndices: sortedArr.map((_, i) => i),
    description: foundNaturally
      ? `Bogosort found the sorted state in ${attempts} attempts!`
      : `Bogosort reached ${attempts} preview shuffles; showing the target sorted array.`,
    descriptionKey: 'visualizer.bogosort_found',
    descriptionParams: { attempts },
    comparisons: Math.max(0, n - 1),
    swapCount: 0,
    pass: attempts,
    highlightLine: 5,
    variables: {
      attempts,
      isSorted: true,
      status: foundNaturally ? 'Sorted!' : 'Sorted (Demo Cap)',
    },
  });

  return result;
}

export const BOGOSORT_DEFAULT_ARRAY = [4, 2, 3, 1];
