import type { SortItem, SortStep } from './bubbleSortSteps';

/**
 * Insertion Sort step generator.
 * Uses a "swap-down" approach for better visualization with persistent IDs.
 */

export function generateInsertionSortSteps(initialValues: number[]): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [0],
      description: 'Initial array — ready to sort',
      descriptionKey: 'visualizer.initial',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      highlightLine: 1,
      variables: { n: arr.length, comparisons: 0, shifts: 0 },
    },
  ];

  let comparisons = 0;
  let moveCount = 0;

  for (let i = 1; i < arr.length; i++) {
    // Current element being "inserted"
    let j = i;
    const currentKey = arr[i].val;

    // Step: Pick element
    result.push({
      array: [...arr],
      activeIndices: [i],
      swapping: false,
      sortedIndices: Array.from({ length: i }, (_, k) => k),
      description: `Picking ${arr[j].val} to insert into the sorted part`,
      comparisons,
      swapCount: moveCount,
      pass: i - 1,
      highlightLine: 3,
      variables: {
        i,
        key: currentKey,
        j: i - 1,
        comparisons,
        shifts: moveCount,
      },
    });

    // Move the element left until it's in the correct relative position
    while (j > 0) {
      comparisons++;

      // Step: Compare with neighbor
      result.push({
        array: [...arr],
        activeIndices: [j - 1, j],
        swapping: false,
        sortedIndices: Array.from({ length: i + 1 }, (_, k) => k).filter(
          (k) => k !== j && k !== j - 1,
        ),
        description: `Is ${arr[j - 1].val} > ${arr[j].val}?`,
        comparisons,
        swapCount: moveCount,
        pass: i - 1,
        highlightLine: 5,
        variables: {
          i,
          j: j - 1,
          key: arr[j].val,
          'arr[j]': arr[j - 1].val,
          'arr[j] > key': arr[j - 1].val > arr[j].val,
          comparisons,
          shifts: moveCount,
        },
      });

      if (arr[j - 1].val > arr[j].val) {
        // Swap (representing a shift)
        const temp = arr[j];
        arr[j] = arr[j - 1];
        arr[j - 1] = temp;
        moveCount++;

        // Step: Swapping/Shifting
        result.push({
          array: [...arr],
          activeIndices: [j - 1, j],
          swapping: true,
          sortedIndices: Array.from({ length: i + 1 }, (_, k) => k).filter(
            (k) => k !== j && k !== j - 1,
          ),
          description: `Shifting ${arr[j].val} to the right`,
          comparisons,
          swapCount: moveCount,
          pass: i - 1,
          highlightLine: 6,
          variables: {
            i,
            j: j - 1,
            shiftedVal: arr[j].val,
            comparisons,
            shifts: moveCount,
          },
        });

        j--;
      } else {
        // Correct position found for this element
        break;
      }
    }

    // Step: Relative block sorted
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: Array.from({ length: i + 1 }, (_, k) => k),
      description: `Target element placed — sorted area grows`,
      comparisons,
      swapCount: moveCount,
      pass: i - 1,
      highlightLine: 8,
      variables: {
        i,
        placedAt: j,
        key: arr[j].val,
        comparisons,
        shifts: moveCount,
      },
    });
  }

  // Final step
  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: arr.map((_, i) => i),
    description: 'Array sorted!',
    descriptionKey: 'visualizer.sorted_complete',
    comparisons,
    swapCount: moveCount,
    pass: arr.length - 1,
    highlightLine: 9,
    variables: {
      comparisons,
      shifts: moveCount,
      status: 'Sorted',
    },
  });

  return result;
}

export const INSERTION_SORT_DEFAULT_ARRAY = [52, 14, 78, 25, 61, 9, 36, 44];
