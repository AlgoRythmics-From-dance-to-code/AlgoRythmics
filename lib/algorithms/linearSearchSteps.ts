/**
 * Linear Search step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Linear Search algorithm.
 * Since SortStep is used for the visualizer, we map search steps to it.
 */
export function generateLinearSearchSteps(initialValues: number[], target?: number): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const searchTarget = target ?? initialValues[Math.floor(Math.random() * initialValues.length)];
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Initial array — ready to search',
      descriptionKey: 'visualizer.search_initial',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      target: searchTarget,
    },
  ];

  let comparisons = 0;
  const foundIndices: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    comparisons++;

    // Anything before i is already checked and not found
    const discarded: number[] = [];
    for (let d = 0; d < i; d++) discarded.push(d);

    // Step: current index check
    result.push({
      array: [...arr],
      activeIndices: [i],
      swapping: false,
      sortedIndices: [...foundIndices],
      discardedIndices: [...discarded],
      description: `Target is ${searchTarget}. Checking index ${i} (${arr[i].val})...`,
      comparisons,
      swapCount: 0,
      pass: 0,
      target: searchTarget,
    });

    if (arr[i].val === searchTarget) {
      foundIndices.push(i);
      // Everything except found index is discarded now that we found it
      const finalDiscarded: number[] = [];
      for (let d = 0; d < arr.length; d++) {
        if (d !== i) finalDiscarded.push(d);
      }
      result.push({
        array: [...arr],
        activeIndices: [i],
        swapping: false,
        sortedIndices: [...foundIndices],
        discardedIndices: finalDiscarded,
        description: `Found target ${searchTarget} at index ${i}!`,
        comparisons,
        swapCount: 0,
        pass: 0,
        target: searchTarget,
      });
      break;
    }
  }

  if (foundIndices.length === 0) {
    // Step: Not found
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      discardedIndices: arr.map((_, i) => i),
      description: `Target ${searchTarget} NOT found in the array.`,
      comparisons,
      swapCount: 0,
      pass: 0,
      target: searchTarget,
    });
  }

  return result;
}

export const LINEAR_SEARCH_DEFAULT_ARRAY = [10, 50, 30, 70, 80, 60, 20, 90, 40];
