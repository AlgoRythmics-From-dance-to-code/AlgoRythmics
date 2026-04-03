/**
 * Static code analysis for the "Alive" tab.
 * Pattern-matches user code to check for required algorithm elements.
 * Does NOT execute user code — purely structural analysis.
 */

export interface CodePattern {
  id: string;
  /** Human-readable label */
  label: string;
  /** Regex to test against the user's code */
  pattern: RegExp;
  /** How important this pattern is (for weighting the score) */
  weight: number;
}

export interface CodeAnalysisResult {
  isCorrect: boolean;
  /** 0–100 score */
  score: number;
  /** Patterns that matched */
  matched: string[];
  /** Patterns that were missing */
  missing: string[];
  /** Detailed results per pattern */
  details: { id: string; label: string; found: boolean }[];
  /** Did the code successfully run and sort? */
  executionPassed?: boolean;
  /** Runtime error or sorting failure message */
  executionError?: string;
}

// ─── Bubble Sort patterns ─────────────────────────────────────

export const bubbleSortPatterns: CodePattern[] = [
  {
    id: 'outer-loop',
    label: 'Outer loop',
    pattern: /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*\d+\s*;[^;]+;[^)]+\)/i,
    weight: 25,
  },
  {
    id: 'inner-loop',
    label: 'Inner loop',
    pattern:
      /for\s*\([^)]+\)[\s\S]*for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*\d+\s*;[^;]+;[^)]+\)/i,
    weight: 25,
  },
  {
    id: 'comparison',
    label: 'Element comparison',
    // Matches arr[j] > arr[j+1] or arr[j] > arr[j + 1], ensuring array and index variable names match
    pattern: /([a-zA-Z_]\w*)\[\s*([a-zA-Z_]\w*)\s*\]\s*>\s*\1\[\s*\2\s*\+\s*1\s*\]/i,
    weight: 25,
  },
  {
    id: 'swap',
    label: 'Swap operation',
    // Matches `temp = arr[j]; arr[j] = ...` OR `[arr[j], arr[j+1]] = [arr[j+1], arr[j]]`
    pattern:
      /(?:(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*[a-zA-Z_]\w*\[[^\]]+\])|(?:\[\s*[a-zA-Z_]\w*\[[^\]]+\]\s*,\s*[a-zA-Z_]\w*\[[^\]]+\]\s*\]\s*=\s*\[)/i,
    weight: 25,
  },
];

// ─── Insertion Sort patterns ──────────────────────────────────

export const insertionSortPatterns: CodePattern[] = [
  {
    id: 'outer-loop',
    label: 'Outer loop',
    pattern: /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*1\s*;[^;]+;[^)]+\)/i,
    weight: 20,
  },
  {
    id: 'inner-loop',
    label: 'While loop',
    pattern: /while\s*\([^;]+\)/i,
    weight: 20,
  },
  {
    id: 'key-assignment',
    label: 'Picking the key',
    pattern: /(?:let|var|const)?\s*key\s*=\s*[a-zA-Z_]\w*\[[a-zA-Z_]\w*\]/i,
    weight: 20,
  },
  {
    id: 'shift',
    label: 'Shift operation',
    pattern:
      /[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\+\s*1\s*\]\s*=\s*[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\]/i,
    weight: 20,
  },
  {
    id: 'insertion',
    label: 'Insertion',
    pattern: /[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\+\s*1\s*\]\s*=\s*key/i,
    weight: 20,
  },
];

// ─── Selection Sort patterns ──────────────────────────────────

export const selectionSortPatterns: CodePattern[] = [
  {
    id: 'outer-loop',
    label: 'Outer loop',
    pattern: /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*0\s*;[^;]+;[^)]+\)/i,
    weight: 20,
  },
  {
    id: 'min-index-init',
    label: 'Min index initialization',
    pattern: /(?:let|var|const)?\s*minIndex\s*=\s*[a-zA-Z_]\w*/i,
    weight: 20,
  },
  {
    id: 'inner-loop',
    label: 'Inner loop',
    pattern:
      /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*[a-zA-Z_]\w*\s*\+\s*1\s*;[^;]+;[^)]+\)/i,
    weight: 20,
  },
  {
    id: 'comparison',
    label: 'Min comparison',
    pattern:
      /if\s*\(\s*[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\]\s*<\s*[a-zA-Z_]\w*\[\s*minIndex\s*\]\s*\)/i,
    weight: 20,
  },
  {
    id: 'swap',
    label: 'Swap operation',
    pattern: /(?:swap|\[\s*.*\s*\]\s*=\s*\[\s*.*\s*\])/i,
    weight: 20,
  },
];

// ─── Merge Sort patterns ────────────────────────────────────

export const mergeSortPatterns: CodePattern[] = [
  {
    id: 'base-case',
    label: 'Base case (length <= 1)',
    pattern: /if\s*\([^)]*length\s*<=\s*1[^)]*\)/i,
    weight: 25,
  },
  {
    id: 'recursion',
    label: 'Recursive calls',
    // Matches calling mergeSort twice
    pattern: /(?:mergeSort\s*\([\s\S]*){2}/i,
    weight: 25,
  },
  {
    id: 'merge-call',
    label: 'Merge function/call',
    pattern: /merge\s*\(/i,
    weight: 25,
  },
  {
    id: 'splitting',
    label: 'Splitting array',
    pattern: /slice\s*\(/i,
    weight: 25,
  },
];

// ─── Quick Sort patterns ────────────────────────────────────

export const quickSortPatterns: CodePattern[] = [
  {
    id: 'base-case',
    label: 'Base case',
    pattern: /if\s*\([^)]*length\s*<=\s*1[^)]*\)/i,
    weight: 25,
  },
  {
    id: 'pivot',
    label: 'Pivot selection',
    pattern: /pivot\s*=/i,
    weight: 25,
  },
  {
    id: 'filtering',
    label: 'Array partitioning/filtering',
    pattern: /filter|for\s*\(.*of.*\)/i,
    weight: 25,
  },
  {
    id: 'recursion',
    label: 'Recursive calls',
    pattern: /(?:quickSort\s*\([\s\S]*){2}/i,
    weight: 25,
  },
];

// ─── Linear Search patterns ───────────────────────────────────

export const linearSearchPatterns: CodePattern[] = [
  {
    id: 'loop',
    label: 'Iteration loop',
    pattern: /for\s*\(.*\)/i,
    weight: 40,
  },
  {
    id: 'comparison',
    label: 'Target comparison',
    pattern: /===\s*target|==\s*target/i,
    weight: 40,
  },
  {
    id: 'return-index',
    label: 'Returning index',
    pattern: /return\s+[a-zA-Z_]\w*/i,
    weight: 20,
  },
];

// ─── Binary Search patterns ───────────────────────────────────

export const binarySearchPatterns: CodePattern[] = [
  {
    id: 'while-loop',
    label: 'While loop (low <= high)',
    pattern: /while\s*\(\s*[a-zA-Z_]\w*\s*<=\s*[a-zA-Z_]\w*\s*\)/i,
    weight: 25,
  },
  {
    id: 'calc-mid',
    label: 'Calculating mid point',
    pattern: /mid\s*=\s*(?:Math\.floor\()?\(?[a-zA-Z_]\w*\s*\+\s*[a-zA-Z_]\w*\)?\s*\/\s*2\)?/i,
    weight: 25,
  },
  {
    id: 'comparison',
    label: 'Found target check',
    pattern: /\[\s*mid\s*\]\s*===\s*target/i,
    weight: 25,
  },
  {
    id: 'range-update',
    label: 'Updating low/high',
    pattern: /(?:low\s*=\s*mid\s*\+\s*1|high\s*=\s*mid\s*-\s*1)/i,
    weight: 25,
  },
];

/**
 * Analyze user code against expected patterns for an algorithm.
 */
export function analyzeCode(
  code: string,
  patterns: CodePattern[],
  algorithmId?: string,
): CodeAnalysisResult {
  const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
  let earnedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  const details: { id: string; label: string; found: boolean }[] = [];

  for (const pattern of patterns) {
    const found = pattern.pattern.test(code);
    details.push({ id: pattern.id, label: pattern.label, found });

    if (found) {
      matched.push(pattern.label);
      earnedWeight += pattern.weight;
    } else {
      missing.push(pattern.label);
    }
  }

  let score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Execution validation
  let executionPassed = true;
  let executionError: string | undefined;

  if (
    algorithmId === 'bubble-sort' ||
    algorithmId === 'insertion-sort' ||
    algorithmId === 'selection-sort' ||
    algorithmId === 'linear-search' ||
    algorithmId === 'binary-search' ||
    algorithmId === 'merge-sort' ||
    algorithmId === 'quick-sort' ||
    algorithmId === 'shell-sort' ||
    algorithmId === 'heap-sort' ||
    algorithmId === 'bogosort'
  ) {
    const testRes = runSortAndCheck(code, algorithmId);
    if (!testRes.passed) {
      executionPassed = false;
      executionError = testRes.error;

      // If code didn't execute correctly (syntax error or sorting mistake),
      // cap the score to 80% maximum regardless of static analysis.
      score = Math.min(score, 80);
    }
  }

  return {
    isCorrect: score === 100 && executionPassed,
    score,
    matched,
    missing,
    details,
    executionPassed,
    executionError,
  };
}

function runSortAndCheck(
  userCode: string,
  algorithmId: string,
): { passed: boolean; error?: string } {
  try {
    const testArray = [5, 2, 9, 1, 5, 6, -3, 8];
    const expected = [...testArray].sort((a, b) => a - b);

    // Safety: Inject loop limiter to prevent browser freeze
    let safeCode = userCode;
    const loopLimiter = `if (!globalThis.__loopCount) globalThis.__loopCount = 0; if (globalThis.__loopCount++ > 10000) throw new Error("Végtelen ciklus észlelve! Kérlek ellenőrizd a feltételeket.");`;

    // Insert limiter inside opening braces of for/while loops
    safeCode = safeCode.replace(
      /(for\s*\([^)]*\)\s*\{|while\s*\([^)]*\)\s*\{)/g,
      `$1 ${loopLimiter}`,
    );

    const fnMap: Record<string, string> = {
      'bubble-sort': 'bubbleSort',
      'insertion-sort': 'insertionSort',
      'selection-sort': 'selectionSort',
      'merge-sort': 'mergeSort',
      'quick-sort': 'quickSort',
      'linear-search': 'linearSearch',
      'binary-search': 'binarySearch',
      'shell-sort': 'shellSort',
      'heap-sort': 'heapSort',
      bogosort: 'bogosort',
      'n-queens': 'solveNQueens',
    };
    const fnName = fnMap[algorithmId] || 'sort';

    const isSearch = algorithmId.includes('search');
    const testTarget = isSearch ? 30 : null;

    const runnable = `
      globalThis.__loopCount = 0;
      ${safeCode}
      
      if (typeof ${fnName} === 'function') {
        let result = ${fnName}([...arr] ${isSearch ? ', ' + testTarget : ''});
        if (result !== undefined) return result;
        return arr; // return the modified array if it sorts in place
      } else {
        throw new Error("Kérlek hozz létre egy '${fnName}' nevű függvényt!");
      }
    `;

    const sortFn = new Function('arr', runnable);

    let result;
    try {
      result = sortFn([...testArray]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Kérlek hozz létre')) {
        // Fallback: If they didn't name it correctly, let's try evaluating it as a flat script modifying 'arr'
        const alternateRunnable = `
          globalThis.__loopCount = 0;
          let target = ${testTarget};
          ${safeCode}
          return typeof result !== 'undefined' ? result : arr;
        `;
        const altFn = new Function('arr', alternateRunnable);
        result = altFn([...testArray]);
      } else {
        throw err;
      }
    }

    if (isSearch) {
      const expectedIdx = testArray.indexOf(testTarget!);
      if (result !== expectedIdx) {
        return {
          passed: false,
          error: `Hiba: Hibás keresési eredmény! Kapott: ${result}, Várt: ${expectedIdx}`,
        };
      }
      return { passed: true };
    }

    if (!Array.isArray(result)) {
      return {
        passed: false,
        error: 'Hiba: A kód nem tömböt adott vissza, vagy nem módosította a kapott tömböt!',
      };
    }

    if (result.length !== expected.length) {
      return { passed: false, error: 'Hiba: A visszaadott tömb mérete nem egyezik az eredetivel!' };
    }

    for (let i = 0; i < expected.length; i++) {
      if (result[i] !== expected[i]) {
        return {
          passed: false,
          error:
            'Hiba: A tömb nem lett megfelelően rendezve. Eredményed: [' +
            result.join(', ') +
            '] Várható: [' +
            expected.join(', ') +
            ']',
        };
      }
    }

    return { passed: true };
  } catch (err: unknown) {
    return {
      passed: false,
      error: err instanceof Error ? err.message : 'Szintaktikai vagy futási hiba történt.',
    };
  }
}

// ─── Shell Sort patterns ──────────────────────────────────────

export const shellSortPatterns: CodePattern[] = [
  {
    id: 'gap-loop',
    label: 'Gap reduction loop',
    pattern: /while\s*\(\s*gap\s*>\s*0\s*\)|for\s*\(.*gap\s*=\s*gap\s*\/\s*2.*\)/i,
    weight: 30,
  },
  {
    id: 'insertion-loop',
    label: 'Gap-based insertion loop',
    pattern: /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*gap\s*;[^;]+;[^)]+\)/i,
    weight: 30,
  },
  {
    id: 'shifting',
    label: 'Element shifting',
    pattern: /\[\s*[a-zA-Z_]\w*\s*\]\s*=\s*[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*-\s*gap\s*\]/i,
    weight: 40,
  },
];

// ─── Heap Sort patterns ───────────────────────────────────────

export const heapSortPatterns: CodePattern[] = [
  {
    id: 'build-heap',
    label: 'Building max heap',
    pattern: /buildMaxHeap|for\s*\(.*length\s*\/\s*2.*/i,
    weight: 30,
  },
  {
    id: 'extraction-loop',
    label: 'Extraction loop',
    pattern:
      /for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*[a-zA-Z_]\w*\.length\s*-\s*1\s*;[^;]+;[^)]+\)/i,
    weight: 30,
  },
  {
    id: 'heapify-call',
    label: 'Heapify function/call',
    pattern: /heapify|maxHeapify/i,
    weight: 40,
  },
];

// ─── Bogosort patterns ────────────────────────────────────────

export const bogosortPatterns: CodePattern[] = [
  {
    id: 'is-sorted-check',
    label: 'Sorted check',
    pattern: /isSorted|check/i,
    weight: 50,
  },
  {
    id: 'shuffle-call',
    label: 'Shuffle operation',
    pattern: /shuffle|random/i,
    weight: 50,
  },
];

// ─── Registry ─────────────────────────────────────────────────

const analysisPatterns: Record<string, CodePattern[]> = {
  'bubble-sort': bubbleSortPatterns,
  'insertion-sort': insertionSortPatterns,
  'selection-sort': selectionSortPatterns,
  'merge-sort': mergeSortPatterns,
  'quick-sort': quickSortPatterns,
  'linear-search': linearSearchPatterns,
  'binary-search': binarySearchPatterns,
  'shell-sort': shellSortPatterns,
  'heap-sort': heapSortPatterns,
  bogosort: bogosortPatterns,
  'n-queens': [
    {
      id: 'is-safe',
      label: 'Safe placement check',
      pattern: /isSafe|check|valid/i,
      weight: 30,
    },
    {
      id: 'recursion',
      label: 'Recursive solve call',
      pattern: /solve|solveNQueens/i,
      weight: 40,
    },
    {
      id: 'backtrack',
      label: 'Backtracking step',
      pattern: /\[\s*[a-zA-Z_]\w*\s*\]\s*=\s*-\s*1/i,
      weight: 30,
    },
  ],
};

export function getCodePatterns(algorithmId: string): CodePattern[] | undefined {
  return analysisPatterns[algorithmId];
}
