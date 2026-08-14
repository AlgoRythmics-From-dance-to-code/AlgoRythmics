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
      highlightLine: 1,
      variables: { n: arr.length, comparisons: 0, swaps: 0 },
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
      highlightLine: 3,
      variables: {
        i,
        minIdx: i,
        'arr[minIdx]': arr[i].val,
        comparisons,
        swaps: swapCount,
      },
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
        highlightLine: 5,
        variables: {
          i,
          j,
          minIdx,
          'arr[minIdx]': arr[minIdx].val,
          'arr[j]': arr[j].val,
          'arr[j] < arr[minIdx]': arr[j].val < arr[minIdx].val,
          comparisons,
          swaps: swapCount,
        },
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
          highlightLine: 6,
          variables: {
            i,
            j,
            minIdx: j,
            'arr[minIdx]': arr[j].val,
            comparisons,
            swaps: swapCount,
          },
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
        highlightLine: 7,
        variables: {
          i,
          minIdx,
          temp: temp.val,
          'arr[i]': arr[i].val,
          'arr[minIdx]': arr[minIdx].val,
          comparisons,
          swaps: swapCount,
        },
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
      highlightLine: 2,
      variables: {
        i,
        sortedVal: arr[i].val,
        comparisons,
        swaps: swapCount,
      },
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
    highlightLine: 8,
    variables: {
      comparisons,
      swaps: swapCount,
      status: 'Sorted',
    },
  });

  return result;
}

export const SELECTION_SORT_DEFAULT_ARRAY = [29, 10, 14, 37, 13, 22, 5, 19, 42];
