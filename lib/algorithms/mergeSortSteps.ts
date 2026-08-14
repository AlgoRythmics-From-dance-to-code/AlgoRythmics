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
      description: 'Initial array — ready to sort',
      descriptionKey: 'visualizer.initial',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      highlightLine: 1,
      variables: { n: items.length, comparisons: 0, placements: 0 },
    },
  ];

  let comparisons = 0;
  let swapCount = 0; // Tracking placements as visual "swaps"
  const sorted: number[] = [];

  function merge(arr: SortItem[], start: number, mid: number, end: number) {
    const leftArr = [...arr.slice(start, mid + 1)];
    const rightArr = [...arr.slice(mid + 1, end + 1)];
    let i = 0,
      j = 0,
      k = start;

    result.push({
      array: [...arr],
      activeIndices: [start, end],
      swapping: false,
      sortedIndices: [...sorted],
      description: `Merging subarrays: [${start}-${mid}] and [${mid + 1}-${end}]`,
      comparisons,
      swapCount,
      pass: 0,
      highlightLine: 7,
      variables: {
        start,
        mid,
        end,
        leftSize: leftArr.length,
        rightSize: rightArr.length,
        comparisons,
        placements: swapCount,
      },
    });

    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      result.push({
        array: [...arr],
        activeIndices: [start + i, mid + 1 + j],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Comparing elements: ${leftArr[i].val} and ${rightArr[j].val}`,
        comparisons,
        swapCount,
        pass: 0,
        highlightLine: 9,
        variables: {
          start,
          end,
          i,
          j,
          k,
          'L[i]': leftArr[i].val,
          'R[j]': rightArr[j].val,
          'L[i] <= R[j]': leftArr[i].val <= rightArr[j].val,
          comparisons,
          placements: swapCount,
        },
      });

      const targetItem = leftArr[i].val <= rightArr[j].val ? leftArr[i] : rightArr[j];
      const targetId = targetItem.id;

      // Find where this ID is in the current array to perform a swap
      let foundIdx = -1;
      for (let p = k; p <= end; p++) {
        if (arr[p].id === targetId) {
          foundIdx = p;
          break;
        }
      }

      if (foundIdx !== -1 && foundIdx !== k) {
        const temp = arr[k];
        arr[k] = arr[foundIdx];
        arr[foundIdx] = temp;
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [k, foundIdx],
          swapping: true,
          sortedIndices: [...sorted],
          description: `Placing ${arr[k].val} into position ${k}`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 9,
          variables: {
            k,
            placedVal: arr[k].val,
            comparisons,
            placements: swapCount,
          },
        });
      } else if (foundIdx === k) {
        result.push({
          array: [...arr],
          activeIndices: [k],
          swapping: false,
          sortedIndices: [...sorted],
          description: `${arr[k].val} is already in the correct position`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 9,
          variables: {
            k,
            placedVal: arr[k].val,
            comparisons,
            placements: swapCount,
          },
        });
      }

      if (leftArr[i].val <= rightArr[j].val) {
        i++;
      } else {
        j++;
      }
      k++;
    }

    while (i < leftArr.length) {
      const targetId = leftArr[i].id;
      let foundIdx = -1;
      for (let p = k; p <= end; p++) {
        if (arr[p].id === targetId) {
          foundIdx = p;
          break;
        }
      }

      if (foundIdx !== -1 && foundIdx !== k) {
        const temp = arr[k];
        arr[k] = arr[foundIdx];
        arr[foundIdx] = temp;
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [k, foundIdx],
          swapping: true,
          sortedIndices: [...sorted],
          description: `Copying remaining element ${arr[k].val} from left side`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 9,
          variables: {
            k,
            placedVal: arr[k].val,
            remainingSide: 'left',
            comparisons,
            placements: swapCount,
          },
        });
      } else if (foundIdx === k) {
        result.push({
          array: [...arr],
          activeIndices: [k],
          swapping: false,
          sortedIndices: [...sorted],
          description: `${arr[k].val} is already in position`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 9,
          variables: {
            k,
            placedVal: arr[k].val,
            comparisons,
            placements: swapCount,
          },
        });
      }
      i++;
      k++;
    }

    while (j < rightArr.length) {
      const targetId = rightArr[j].id;
      let foundIdx = -1;
      for (let p = k; p <= end; p++) {
        if (arr[p].id === targetId) {
          foundIdx = p;
          break;
        }
      }

      if (foundIdx !== -1 && foundIdx !== k) {
        const temp = arr[k];
        arr[k] = arr[foundIdx];
        arr[foundIdx] = temp;
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [k, foundIdx],
          swapping: true,
          sortedIndices: [...sorted],
          description: `Copying remaining element ${arr[k].val} from right side`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 10,
          variables: {
            k,
            placedVal: arr[k].val,
            remainingSide: 'right',
            comparisons,
            placements: swapCount,
          },
        });
      } else if (foundIdx === k) {
        result.push({
          array: [...arr],
          activeIndices: [k],
          swapping: false,
          sortedIndices: [...sorted],
          description: `${arr[k].val} is already in position`,
          comparisons,
          swapCount,
          pass: 0,
          highlightLine: 10,
          variables: {
            k,
            placedVal: arr[k].val,
            comparisons,
            placements: swapCount,
          },
        });
      }
      j++;
      k++;
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
        description: `Splitting: [${start}-${mid}] and [${mid + 1}-${end}]`,
        comparisons,
        swapCount,
        pass: 0,
        highlightLine: 3,
        variables: {
          start,
          mid,
          end,
          comparisons,
          placements: swapCount,
        },
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
    description: 'Array sorted!',
    descriptionKey: 'visualizer.sorted_complete',
    comparisons,
    swapCount,
    pass: 0,
    highlightLine: 1,
    variables: {
      comparisons,
      placements: swapCount,
      status: 'Sorted',
    },
  });

  return result;
}

export const MERGE_SORT_DEFAULT_ARRAY = [38, 27, 43, 3, 9, 82, 10, 4, 33];
