/**
 * Shell Sort step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Shell Sort algorithm.
 */
export function generateShellSortSteps(initialValues: number[]): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Ready to start Shell Sort',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
    },
  ];

  let comparisons = 0;
  let swapCount = 0;
  const n = arr.length;

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: `Current gap: ${gap}`,
      comparisons,
      swapCount,
      pass: gap,
    });

    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;

      result.push({
        array: [...arr],
        activeIndices: [i, j - gap],
        swapping: false,
        sortedIndices: [],
        description: `Inserting arr[${i}] into its gap-sorted position`,
        comparisons,
        swapCount,
        pass: gap,
      });

      while (j >= gap && arr[j - gap].val > temp.val) {
        comparisons++;
        arr[j] = arr[j - gap];
        j -= gap;
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [j, j + gap],
          swapping: true,
          sortedIndices: [],
          description: `Shifting element at arr[${j + gap}] to arr[${j}]`,
          comparisons,
          swapCount,
          pass: gap,
        });
      }
      arr[j] = temp;

      result.push({
        array: [...arr],
        activeIndices: [j],
        swapping: false,
        sortedIndices: [],
        description: `Placed element in its position for current gap`,
        comparisons,
        swapCount,
        pass: gap,
      });
    }
  }

  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: arr.map((_, i) => i),
    description: `Shell Sort complete!`,
    comparisons,
    swapCount,
    pass: 0,
  });

  return result;
}

export const SHELL_SORT_DEFAULT_ARRAY = [64, 34, 25, 12, 22, 11, 90, 4, 33];
