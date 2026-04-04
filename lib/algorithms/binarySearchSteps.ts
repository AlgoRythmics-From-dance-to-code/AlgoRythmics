/**
 * Binary Search step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Binary Search algorithm.
 * Since SortStep is used for the visualizer, we map search steps to it.
 * Binary search requires a sorted array.
 */
export function generateBinarySearchSteps(initialValues: number[], target?: number): SortStep[] {
  // Sort initial values for binary search
  const sortedValues = [...initialValues].sort((a, b) => a - b);
  const arr: SortItem[] = sortedValues.map((v, i) => ({ val: v, id: i }));
  const searchTarget = target ?? sortedValues[Math.floor(Math.random() * sortedValues.length)];
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Ready to start Binary Search...',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      target: searchTarget,
    },
  ];

  let left = 0;
  let right = arr.length - 1;
  let comparisons = 0;
  const swapCount = 0;
  const foundIndices: number[] = [];

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = arr[mid].val;
    comparisons++;

    // Compute discarded for this step (anything outside [left, right])
    const discarded: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < left || i > right) discarded.push(i);
    }

    // Step: current mid check
    result.push({
      array: [...arr],
      activeIndices: [mid],
      swapping: false,
      sortedIndices: [...foundIndices],
      discardedIndices: [...discarded],
      description: `Target is ${searchTarget}. Checking middle element at index ${mid} (${midVal}).`,
      comparisons,
      swapCount,
      pass: 0,
      target: searchTarget,
    });

    if (arr[mid].val === searchTarget) {
      foundIndices.push(mid);
      // Final discarded just for visualization
      const finalDiscarded: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        if (i !== mid) finalDiscarded.push(i);
      }
      result.push({
        array: [...arr],
        activeIndices: [mid],
        swapping: false,
        sortedIndices: [...foundIndices],
        discardedIndices: finalDiscarded,
        description: `Found target ${searchTarget} at index ${mid}!`,
        comparisons,
        swapCount,
        pass: 0,
        target: searchTarget,
      });
      break;
    } else if (arr[mid].val < searchTarget) {
      left = mid + 1;
      const nextDiscarded: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        if (i < left || i > right) nextDiscarded.push(i);
      }
      result.push({
        array: [...arr],
        activeIndices: [],
        swapping: false,
        sortedIndices: [],
        discardedIndices: nextDiscarded,
        description: `Target ${searchTarget} is larger than ${arr[mid].val}. Range is now [${left}, ${right}].`,
        comparisons,
        swapCount: 0,
        pass: 0,
        target: searchTarget,
      });
    } else {
      right = mid - 1;
      const nextDiscarded: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        if (i < left || i > right) nextDiscarded.push(i);
      }
      result.push({
        array: [...arr],
        activeIndices: [],
        swapping: false,
        sortedIndices: [],
        discardedIndices: nextDiscarded,
        description: `Target ${searchTarget} is smaller than ${arr[mid].val}. Range is now [${left}, ${right}].`,
        comparisons,
        swapCount: 0,
        pass: 0,
        target: searchTarget,
      });
    }
  }

  if (foundIndices.length === 0) {
    // Step: Not found
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: `Target ${searchTarget} NOT found in the array.`,
      comparisons,
      swapCount: 0,
      pass: 0,
      target: searchTarget,
    });
  }

  return result;
}

export const BINARY_SEARCH_DEFAULT_ARRAY = [10, 20, 30, 40, 50, 60, 70, 80, 90];
