/**
 * Bubble Sort step generator — extracted for reuse across
 * Animation, Control, and other components.
 */

export interface SortItem {
  val: number;
  id: number;
}

export interface SortStep {
  array: SortItem[];
  activeIndices: number[];
  swapping: boolean;
  sortedIndices: number[];
  /** Human-readable description of this step */
  description?: string;
  /** Running count of comparisons so far */
  comparisons?: number;
  /** Running count of swaps so far */
  swapCount?: number;
  /** Which outer-loop pass (0-indexed) */
  pass?: number;
}

/**
 * Pre-compute every step of the Bubble Sort algorithm.
 * Returns an array of immutable snapshots (each step is a new copy).
 */
export function generateBubbleSortSteps(initialValues: number[]): SortStep[] {
  const arr: SortItem[] = initialValues.map((v, i) => ({ val: v, id: i }));
  const result: SortStep[] = [
    {
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: 'Initial array — ready to sort',
      comparisons: 0,
      swapCount: 0,
      pass: 0,
    },
  ];

  const sorted: number[] = [];
  let comparisons = 0;
  let swapCount = 0;

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      comparisons++;

      // Step: compare
      result.push({
        array: [...arr],
        activeIndices: [j, j + 1],
        swapping: false,
        sortedIndices: [...sorted],
        description: `Comparing ${arr[j].val} and ${arr[j + 1].val}...`,
        comparisons,
        swapCount,
        pass: i,
      });

      if (arr[j].val > arr[j + 1].val) {
        // Step: swap
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapCount++;

        result.push({
          array: [...arr],
          activeIndices: [j, j + 1],
          swapping: true,
          sortedIndices: [...sorted],
          description: `Swapping ${arr[j].val} ↔ ${arr[j + 1].val}`,
          comparisons,
          swapCount,
          pass: i,
        });
      }
    }

    // Mark the end of this pass
    sorted.push(arr.length - i - 1);
    result.push({
      array: [...arr],
      activeIndices: [],
      swapping: false,
      sortedIndices: [...sorted],
      description: `${arr[arr.length - i - 1].val} is now sorted!`,
      comparisons,
      swapCount,
      pass: i,
    });
  }

  return result;
}

/** Default array for bubble sort demos */
export const BUBBLE_SORT_DEFAULT_ARRAY = [45, 12, 89, 34, 67, 23, 56, 10, 78];
