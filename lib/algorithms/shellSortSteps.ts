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
      description: 'Initial array — ready to sort',
      descriptionKey: 'visualizer.initial',
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
      let j = i;

      while (j >= gap) {
        comparisons++;
        // Comparison step
        result.push({
          array: [...arr],
          activeIndices: [j, j - gap],
          swapping: false,
          sortedIndices: [],
          description: `Comparing elements with gap ${gap}: ${arr[j - gap].val} and ${arr[j].val}`,
          comparisons,
          swapCount,
          pass: gap,
        });

        if (arr[j - gap].val > arr[j].val) {
          // Swap
          const temp = arr[j];
          arr[j] = arr[j - gap];
          arr[j - gap] = temp;
          swapCount++;

          result.push({
            array: [...arr],
            activeIndices: [j, j - gap],
            swapping: true,
            sortedIndices: [],
            description: `Swapping ${arr[j].val} ↔ ${arr[j - gap].val}`,
            comparisons,
            swapCount,
            pass: gap,
          });
          j -= gap;
        } else {
          break;
        }
      }
    }
  }

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
  });

  return result;
}

export const SHELL_SORT_DEFAULT_ARRAY = [64, 34, 25, 12, 22, 11, 90, 4, 33];
