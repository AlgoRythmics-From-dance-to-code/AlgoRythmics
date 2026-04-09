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
      comparisons: n - 1,
      swapCount: n,
      pass: attempts,
    });
  }

  // Finally, just show the sorted one for the demo, otherwise people wait forever
  const sortedArr = [...initialValues].sort((a, b) => a - b).map((v, i) => ({ val: v, id: i }));
  result.push({
    array: sortedArr,
    activeIndices: [],
    swapping: false,
    sortedIndices: sortedArr.map((_, i) => i),
    description: `Bogosort finally found the sorted state in ${attempts} attempts!`,
    descriptionKey: 'visualizer.bogosort_found',
    descriptionParams: { attempts },
    comparisons: n - 1,
    swapCount: 0,
    pass: attempts,
  });

  return result;
}

export const BOGOSORT_DEFAULT_ARRAY = [4, 2, 3, 1];
