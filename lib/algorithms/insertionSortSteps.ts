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
      description: 'Initial array — the first element is sorted relative to itself',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
    },
  ];

  let comparisons = 0;
  let moveCount = 0;

  for (let i = 1; i < arr.length; i++) {
    // Current element being "inserted"
    let j = i;
    
    // Step: Pick element
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: Array.from({ length: i }, (_, k) => k),
      description: `Picking ${arr[j].val} to insert into the sorted part`,
      comparisons,
      swapCount: moveCount,
      pass: i - 1,
    });

    // Move the element left until it's in the correct relative position
    while (j > 0) {
      comparisons++;
      
      // Step: Compare with neighbor
      result.push({
        array: [...arr],
        activeIndices: [j - 1, j],
        swapping: false,
        sortedIndices: Array.from({ length: i + 1 }, (_, k) => k).filter((k) => k !== j && k !== j - 1),
        description: `Is ${arr[j - 1].val} > ${arr[j].val}?`,
        comparisons,
        swapCount: moveCount,
        pass: i - 1,
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
          sortedIndices: Array.from({ length: i + 1 }, (_, k) => k).filter((k) => k !== j && k !== j - 1),
          description: `Shifting ${arr[j].val} to the right`,
          comparisons,
          swapCount: moveCount,
          pass: i - 1,
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
    });
  }

  // Final step
  result.push({
    array: [...arr],
    activeIndices: [],
    swapping: false,
    sortedIndices: arr.map((_, i) => i),
    description: 'Array is fully sorted!',
    comparisons,
    swapCount: moveCount,
    pass: arr.length - 1,
  });

  return result;
}

export const INSERTION_SORT_DEFAULT_ARRAY = [52, 14, 78, 25, 61, 9, 36, 44];
