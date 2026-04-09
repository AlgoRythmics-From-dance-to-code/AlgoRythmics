/**
 * Selection Sort step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Selection Sort algorithm.
 */
export function generateSelectionSortSteps(initialValues: number[]): SortStep[] {
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
  const sorted: number[] = [];

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;

    // Step: current min highlight
    result.push({
      array: [...arr],
      activeIndices: [i],
      swapping: false,
      sortedIndices: [...sorted],
      description: `Starting pass ${i + 1}: Current minimum is ${arr[i].val}`,
      comparisons,
      swapCount,
      pass: i,
    });

    for (let j = i + 1; j < arr.length; j++) {
      comparisons++;

      // Step: compare current min with j
      result.push({
        array: [...arr],
        activeIndices: [minIdx, j],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Comparing ${arr[minIdx].val} with ${arr[j].val}...`,
        comparisons,
        swapCount,
        pass: i,
      });

      if (arr[j].val < arr[minIdx].val) {
        minIdx = j;
        // Step: new min found
        result.push({
          array: [...arr],
          activeIndices: [minIdx],
          swapping: false,
          sortedIndices: [...sorted],
          description: `New minimum found: ${arr[minIdx].val}`,
          comparisons,
          swapCount,
          pass: i,
        });
      }
    }

    if (minIdx !== i) {
      // Step: swap min with i
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swapCount++;

      result.push({
        array: [...arr],
        activeIndices: [i, minIdx],
        swapping: true,
        sortedIndices: [...sorted],
        description: `Swapping ${arr[i].val} ↔ ${arr[minIdx].val}`,
        comparisons,
        swapCount,
        pass: i,
      });
    }

    // Step: i-th element is now sorted
    sorted.push(i);
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [...sorted],
      description: `${arr[i].val} is now in its sorted position!`,
      comparisons,
      swapCount,
      pass: i,
    });
  }

  // Last element is sorted automatically
  sorted.push(arr.length - 1);
  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: [...sorted],
    description: 'Array sorted!',
    descriptionKey: 'visualizer.sorted_complete',
    comparisons,
    swapCount,
    pass: arr.length - 1,
  });

  return result;
}

export const SELECTION_SORT_DEFAULT_ARRAY = [29, 10, 14, 37, 13, 22, 5, 19, 42];
