/**
 * Quick Sort step generator.
 */

import { type SortStep, type SortItem } from './bubbleSortSteps';

/**
 * Pre-compute every step of the Quick Sort algorithm.
 */
export function generateQuickSortSteps(initialValues: number[]): SortStep[] {
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
      variables: { n: items.length, comparisons: 0, swaps: 0 },
    },
  ];

  let comparisons = 0;
  let swapCount = 0;
  const sorted: number[] = [];

  function partition(arr: SortItem[], low: number, high: number): number {
    const pivot = arr[high];

    result.push({
      array: [...arr],
      activeIndices: [high],
      swapping: false,
      sortedIndices: [...sorted],
      description: `Choosing pivot element: ${pivot.val}`,
      comparisons,
      swapCount,
      pass: 0,
      pivotIndex: high,
      highlightLine: 3,
      variables: {
        low,
        high,
        pivot: pivot.val,
        i: low - 1,
        comparisons,
        swaps: swapCount,
      },
    });

    let i = low - 1;
    for (let j = low; j < high; j++) {
      comparisons++;

      result.push({
        array: [...arr],
        activeIndices: [j, high],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Comparing element ${arr[j].val} with pivot ${pivot.val}`,
        comparisons,
        swapCount,
        pass: 0,
        pivotIndex: high,
        highlightLine: 6,
        variables: {
          low,
          high,
          pivot: pivot.val,
          i,
          j,
          'arr[j]': arr[j].val,
          'arr[j] < pivot': arr[j].val < pivot.val,
          comparisons,
          swaps: swapCount,
        },
      });

      if (arr[j].val < pivot.val) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [i, j],
          swapping: true,
          sortedIndices: [...sorted],
          description: `Moving smaller element to the left: Swapping ${arr[i].val} ↔ ${arr[j].val}`,
          comparisons,
          swapCount,
          pass: 0,
          pivotIndex: high,
          highlightLine: 7,
          variables: {
            low,
            high,
            pivot: pivot.val,
            i,
            j,
            'arr[i]': arr[i].val,
            'arr[j]': arr[j].val,
            comparisons,
            swaps: swapCount,
          },
        });
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    swapCount++;

    result.push({
      array: [...arr],
      activeIndices: [i + 1, high],
      swapping: true,
      sortedIndices: [...sorted],
      description: `Placing pivot into its final position: Swapping ${arr[i + 1].val} ↔ ${arr[high].val}`,
      comparisons,
      swapCount,
      pass: 0,
      pivotIndex: i + 1,
      highlightLine: 8,
      variables: {
        low,
        high,
        pivotIndex: i + 1,
        pivot: arr[i + 1].val,
        'arr[i+1]': arr[i + 1].val,
        comparisons,
        swaps: swapCount,
      },
    });

    sorted.push(i + 1);
    return i + 1;
  }

  function sort(arr: SortItem[], low: number, high: number) {
    if (low < high) {
      const pi = partition(arr, low, high);
      sort(arr, low, pi - 1);
      sort(arr, pi + 1, high);
    } else if (low === high) {
      sorted.push(low);
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
      swaps: swapCount,
      status: 'Sorted',
    },
  });

  return result;
}

export const QUICK_SORT_DEFAULT_ARRAY = [10, 80, 30, 90, 40, 50, 70, 20, 60];
