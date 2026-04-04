/**
 * N-Queens step generator (simplified for array-based visualization).
 */

import { type SortStep } from './bubbleSortSteps';

/**
 * Pre-compute steps for the N-Queens problem.
 * We represent the board as an array where arr[i] is the column of the queen in row i.
 */
export function generateNQueensSteps(nValues: number[]): SortStep[] {
  const n = Array.isArray(nValues) ? nValues[0] : typeof nValues === 'number' ? nValues : 4;
  const board: number[] = Array(n).fill(-1);
  const result: SortStep[] = [
    {
      array: board.map((v, i) => ({ val: v, id: i })),
      activeIndices: [],
      swapping: false,
      sortedIndices: [],
      description: `Target: Place ${n} queens on a ${n}x${n} board without conflicts.`,
      comparisons: 0,
      swapCount: 0,
      pass: 0,
      target: n,
    },
  ];

  let comparisons = 0;

  function isSafe(row: number, col: number, currentBoard: number[]): boolean {
    for (let i = 0; i < row; i++) {
      comparisons++;
      if (currentBoard[i] === col || Math.abs(currentBoard[i] - col) === Math.abs(i - row)) {
        return false;
      }
    }
    return true;
  }

  function solve(row: number): boolean {
    if (row === n) return true;

    for (let col = 0; col < n; col++) {
      // Step: Prepare to try this column
      result.push({
        array: board.map((v, i) => ({ val: v, id: i })),
        activeIndices: [row],
        swapping: false,
        sortedIndices: board.map((v, i) => (v !== -1 && i < row ? i : -1)).filter((v) => v !== -1),
        description: `Try placing a queen in Row ${row}, Col ${col}`,
        comparisons,
        swapCount: col,
        pass: row,
        target: n,
      });

      board[row] = col;

      if (isSafe(row, col, board)) {
        result.push({
          array: board.map((v, i) => ({ val: v, id: i })),
          activeIndices: [row],
          swapping: false,
          sortedIndices: board
            .map((v, i) => (v !== -1 && i <= row ? i : -1))
            .filter((v) => v !== -1),
          description: `Safe! Row ${row}, Col ${col} is valid. Proceeding to Row ${row + 1}.`,
          comparisons,
          swapCount: col,
          pass: row,
          target: n,
        });

        if (solve(row + 1)) return true;

        // If we're here, sub-search failed. We need to show this cell failed at this level.
        result.push({
          array: board.map((v, i) => ({ val: v, id: i })),
          activeIndices: [row],
          swapping: true,
          sortedIndices: board
            .map((v, i) => (v !== -1 && i < row ? i : -1))
            .filter((v) => v !== -1),
          description: `No solution found with queen at (${row}, ${col}). Backtracking Row ${row}...`,
          comparisons,
          swapCount: col,
          pass: row,
          target: n,
        });
      } else {
        result.push({
          array: board.map((v, i) => ({ val: v, id: i })),
          activeIndices: [row],
          swapping: true,
          sortedIndices: board
            .map((v, i) => (v !== -1 && i < row ? i : -1))
            .filter((v) => v !== -1),
          description: `Conflict at Row ${row}, Col ${col}. This cell is under attack.`,
          comparisons,
          swapCount: col,
          pass: row,
          target: n,
        });
      }

      board[row] = -1;
    }
    return false;
  }

  solve(0);

  result.push({
    array: board.map((v, i) => ({ val: v, id: i })),
    activeIndices: [],
    swapping: false,
    sortedIndices: board.map((_, i) => i),
    description: `N-Queens solution found! All queens are safely placed.`,
    comparisons,
    swapCount: 0,
    pass: 0,
    target: n,
  });

  return result;
}

export const N_QUEENS_DEFAULT_N = [8];
