/**
 * Merge Sort step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Merge Sort algorithm.
 */
export function generateMergeSortSteps(initialValues: number[]): SortStep[] {
  const items: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...items],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Ready to start Merge Sort',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
    },
  ];

  let comparisons = 0;
  const sorted: number[] = [];

  function merge(arr: SortItem[], start: number, mid: number, end: number) {
    const leftArr = arr.slice(start, mid + 1);
    const rightArr = arr.slice(mid + 1, end + 1);
    let i = 0,
      j = 0,
      k = start;

    result.push({
      array: [...arr],
      activeIndices: [start, end],
      swapping: false,
      sortedIndices: [...sorted],
      description: `Merging subarrays from index ${start} to ${end}`,
      comparisons,
      swapCount: 0,
      pass: 0,
    });

    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      result.push({
        array: [...arr],
        activeIndices: [start + i, mid + 1 + j],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Comparing elements from both subarrays`,
        comparisons,
        swapCount: 0,
        pass: 0,
      });

      if (leftArr[i].val <= rightArr[j].val) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      k++;

      result.push({
        array: [...arr],
        activeIndices: [k - 1],
        swapping: true,
        sortedIndices: [...sorted],
        description: `Placing the smaller element back into the merged array`,
        comparisons,
        swapCount: 0,
        pass: 0,
      });
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i++;
      k++;
      result.push({
        array: [...arr],
        activeIndices: [k - 1],
        swapping: true,
        sortedIndices: [...sorted],
        description: `Copying remaining element from left side`,
        comparisons,
        swapCount: 0,
        pass: 0,
      });
    }

    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j++;
      k++;
      result.push({
        array: [...arr],
        activeIndices: [k - 1],
        swapping: true,
        sortedIndices: [...sorted],
        description: `Copying remaining element from right side`,
        comparisons,
        swapCount: 0,
        pass: 0,
      });
    }
  }

  function sort(arr: SortItem[], start: number, end: number) {
    if (start < end) {
      const mid = Math.floor((start + end) / 2);

      result.push({
        array: [...arr],
        activeIndices: [start, mid, end],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Splitting array into halves: range [${start}-${mid}] and [${mid + 1}-${end}]`,
        comparisons,
        swapCount: 0,
        pass: 0,
      });

      sort(arr, start, mid);
      sort(arr, mid + 1, end);
      merge(arr, start, mid, end);

      if (start === 0 && end === arr.length - 1) {
        for (let idx = 0; idx < arr.length; idx++) {
          sorted.push(idx);
        }
      }
    }
  }

  const finalArr = [...items];
  sort(finalArr, 0, finalArr.length - 1);

  result.push({
    array: finalArr,
    activeIndices: [],
    swapping: false,
    sortedIndices: finalArr.map((_, i) => i),
    description: `Merge Sort complete!`,
    comparisons,
    swapCount: 0,
    pass: 0,
  });

  return result;
}

export const MERGE_SORT_DEFAULT_ARRAY = [38, 27, 43, 3, 9, 82, 10, 4, 33];
