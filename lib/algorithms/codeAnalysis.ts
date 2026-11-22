/**
 * Static code analysis for the "Alive" tab.
 * Pattern-matches user code to check for required algorithm elements,
 * plus safe bounded execution testing.
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
      /for\s*\([^)]+\)[\s\S]{0,400}?for\s*\(\s*(?:let|var|const)?\s*[a-zA-Z_]\w*\s*=\s*\d+\s*;[^;]+;[^)]+\)/i,
    weight: 25,
  },
  {
    id: 'comparison',
    label: 'Element comparison',
    pattern: /([a-zA-Z_]\w*)\[\s*([a-zA-Z_]\w*)\s*\]\s*>\s*\1\[\s*\2\s*\+\s*1\s*\]/i,
    weight: 25,
  },
  {
    id: 'swap',
    label: 'Swap operation',
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
    pattern: /(?:let|var|const)?\s*(?:minIndex|minIdx|min_idx|min)\s*=\s*[a-zA-Z_]\w*/i,
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
      /if\s*\(\s*(?:[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\]\s*<\s*[a-zA-Z_]\w*\[\s*(?:minIndex|minIdx|min_idx|min)\s*\]|[a-zA-Z_]\w*\[\s*(?:minIndex|minIdx|min_idx|min)\s*\]\s*>\s*[a-zA-Z_]\w*\[\s*[a-zA-Z_]\w*\s*\])\s*\)/i,
    weight: 20,
  },
  {
    id: 'swap',
    label: 'Swap operation',
    pattern: /(?:swap|\[\s*[^\]\n]+\s*\]\s*=\s*\[\s*[^\]\n]+\s*\]|(?:let|var|const)?\s*temp\s*=)/i,
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
    pattern: /filter|for\s*\([^)\n]*\bof\b[^)\n]*\)/i,
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
const EXECUTABLE_ALGORITHMS = new Set([
  'bubble-sort',
  'insertion-sort',
  'selection-sort',
  'linear-search',
  'binary-search',
  'merge-sort',
  'quick-sort',
  'shell-sort',
  'heap-sort',
]);

function evaluateStaticAnalysis(code: string, patterns: CodePattern[]) {
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

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { score, matched, missing, details };
}

function finalizeAnalysisResult(
  staticRes: ReturnType<typeof evaluateStaticAnalysis>,
  testRes: { passed: boolean; error?: string } | null,
): CodeAnalysisResult {
  let { score } = staticRes;
  let executionPassed = true;
  let executionError: string | undefined;

  if (testRes && !testRes.passed) {
    executionPassed = false;
    executionError = testRes.error;

    // If code didn't execute correctly (syntax error or sorting mistake),
    // cap the score to 80% maximum regardless of static analysis.
    score = Math.min(score, 80);
  }

  return {
    isCorrect: score === 100 && executionPassed,
    score,
    matched: staticRes.matched,
    missing: staticRes.missing,
    details: staticRes.details,
    executionPassed,
    executionError,
  };
}

export function analyzeCode(
  code: string,
  patterns: CodePattern[],
  algorithmId?: string,
): CodeAnalysisResult {
  const staticRes = evaluateStaticAnalysis(code, patterns);
  const testRes =
    algorithmId && EXECUTABLE_ALGORITHMS.has(algorithmId)
      ? runSortAndCheck(code, algorithmId)
      : null;
  return finalizeAnalysisResult(staticRes, testRes);
}

/**
 * Asynchronous code analyzer that runs student code in an isolated Blob Web Worker
 * with a hard timeout so infinite loops or blocking code never freezes the UI thread.
 */
export async function analyzeCodeAsync(
  code: string,
  patterns: CodePattern[],
  algorithmId?: string,
): Promise<CodeAnalysisResult> {
  const staticRes = evaluateStaticAnalysis(code, patterns);
  const testRes =
    algorithmId && EXECUTABLE_ALGORITHMS.has(algorithmId)
      ? await runSortAndCheckInWorker(code, algorithmId)
      : null;
  return finalizeAnalysisResult(staticRes, testRes);
}

interface PreparedExecution {
  testArray: number[];
  expected: number[];
  isSearch: boolean;
  searchArray: number[];
  testTarget: number | null;
  runnable: string;
  alternateRunnable: string;
  initialInput: number[];
}

function prepareExecution(userCode: string, algorithmId: string): PreparedExecution {
  const testArray = [5, 2, 9, 1, 5, 6, -3, 8];
  const expected = [...testArray].sort((a, b) => a - b);

  // Safety: Inject loop and recursion limiter to prevent hangs (even on braceless loops or recursion)
  let safeCode = userCode;
  const loopLimiter = `if (++__loopCount > 10000) throw new Error("Végtelen ciklus vagy túl mély rekurzió észlelve! Kérlek ellenőrizd a leállási feltételeket.");`;

  // 1. Guard braceless while/for loops by injecting condition check inside the loop header or body
  const whileGuard = `((++__loopCount <= 10000) ? true : (() => { throw new Error("Végtelen ciklus vagy túl mély rekurzió észlelve! Kérlek ellenőrizd a leállási feltételeket."); })())`;
  safeCode = safeCode.replace(/\bwhile\s*\(([^)]+)\)/g, `while (${whileGuard} && ($1))`);

  // 2. Insert limiter inside opening braces of for, do, function, and arrow function blocks
  safeCode = safeCode.replace(
    /(for\s*\([^)]*\)\s*\{|do\s*\{|function\s+[a-zA-Z_$][\w$]*\s*\([^)]*\)\s*\{|=>\s*\{)/g,
    `$1 ${loopLimiter}`,
  );

  // 3. Also guard braceless for(init; cond; step) by wrapping the condition expression
  safeCode = safeCode.replace(
    /\bfor\s*\(([^;]*);([^;]*);([^)]*)\)/g,
    (_match, init, cond, step) => {
      const cleanCond = cond.trim() || 'true';
      return `for (${init}; (++__loopCount <= 10000 ? (${cleanCond}) : (() => { throw new Error("Végtelen ciklus észlelve! Kérlek ellenőrizd a feltételeket."); })()); ${step})`;
    },
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
  const isBinarySearch = algorithmId === 'binary-search';
  const testTarget = isSearch ? 5 : null;

  const runnable = `
    let __loopCount = 0;
    ${safeCode}
    
    if (typeof ${fnName} === 'function') {
      const inputArr = [...arr];
      let result = ${fnName}(inputArr${isSearch ? ', ' + testTarget : ''});
      if (result !== undefined) return result;
      return inputArr; // return the modified copy if it sorts in place
    } else {
      throw new Error("Kérlek hozz létre egy '${fnName}' nevű függvényt!");
    }
  `;

  const alternateRunnable = `
    let __loopCount = 0;
    let target = ${testTarget};
    ${safeCode}
    return typeof result !== 'undefined' ? result : arr;
  `;

  const searchArray = isBinarySearch ? [...expected] : [...testArray];
  const initialInput = isSearch ? [...searchArray] : [...testArray];

  return {
    testArray,
    expected,
    isSearch,
    searchArray,
    testTarget,
    runnable,
    alternateRunnable,
    initialInput,
  };
}

function validateExecutionResult(
  result: unknown,
  isSearch: boolean,
  searchArray: number[],
  testTarget: number | null,
  expected: number[],
): { passed: boolean; error?: string } {
  if (isSearch) {
    const expectedIdx = searchArray.indexOf(testTarget!);
    const isMatch =
      typeof result === 'number' &&
      (expectedIdx === -1
        ? result === -1
        : result >= 0 && result < searchArray.length && searchArray[result] === testTarget);
    if (!isMatch) {
      return {
        passed: false,
        error: `Hiba: Hibás keresési eredmény! Kapott: ${result}, Várt index pl.: ${expectedIdx}`,
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
}

function runSortAndCheck(
  userCode: string,
  algorithmId: string,
): { passed: boolean; error?: string } {
  try {
    const prep = prepareExecution(userCode, algorithmId);
    const sortFn = new Function('arr', prep.runnable);

    let result: unknown;
    try {
      result = sortFn([...prep.initialInput]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Kérlek hozz létre')) {
        // Fallback: If they didn't name it correctly, evaluate as a flat script modifying 'arr'
        const alternateRunnable = prep.alternateRunnable;
        const altFn = new Function('arr', alternateRunnable);
        result = altFn([...prep.initialInput]);
      } else {
        throw err;
      }
    }

    return validateExecutionResult(
      result,
      prep.isSearch,
      prep.searchArray,
      prep.testTarget,
      prep.expected,
    );
  } catch (err: unknown) {
    return {
      passed: false,
      error: err instanceof Error ? err.message : 'Szintaktikai vagy futási hiba történt.',
    };
  }
}

const WORKER_SCRIPT = `
self.onmessage = function(event) {
  var data = event.data;
  var blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'navigator', 'postMessage', 'close', 'self', 'globalThis', 'Worker'];
  var result;
  try {
    var fn = new Function('arr', ...blocked, data.runnable);
    try {
      result = fn(data.initialInput.slice());
    } catch (err) {
      if (err && typeof err.message === 'string' && err.message.indexOf('Kérlek hozz létre') !== -1) {
        var altFn = new Function('arr', ...blocked, data.alternateRunnable);
        result = altFn(data.initialInput.slice());
      } else {
        throw err;
      }
    }
    self.postMessage({ ok: true, result: result });
  } catch (err) {
    self.postMessage({
      ok: false,
      error: (err && err.message) ? String(err.message) : 'Szintaktikai vagy futási hiba történt.'
    });
  }
};
`;

const WORKER_TIMEOUT_MS = 1500;

function runSortAndCheckInWorker(
  userCode: string,
  algorithmId: string,
): Promise<{ passed: boolean; error?: string }> {
  if (
    typeof window === 'undefined' ||
    typeof Worker === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return Promise.resolve(runSortAndCheck(userCode, algorithmId));
  }

  let prep: PreparedExecution;
  try {
    prep = prepareExecution(userCode, algorithmId);
  } catch (err: unknown) {
    return Promise.resolve({
      passed: false,
      error: err instanceof Error ? err.message : 'Szintaktikai vagy futási hiba történt.',
    });
  }

  return new Promise((resolve) => {
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    let worker: Worker | null = null;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      try {
        worker?.terminate();
      } catch {
        // Ignore worker termination errors
      }
      URL.revokeObjectURL(workerUrl);
    };

    const finish = (outcome: { passed: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome);
    };

    const timeoutId = setTimeout(() => {
      finish({
        passed: false,
        error: 'Időtúllépés (1.5 mp): valószínűleg végtelen ciklus vagy túl lassú végrehajtás.',
      });
    }, WORKER_TIMEOUT_MS);

    try {
      worker = new Worker(workerUrl);
      worker.onmessage = (
        event: MessageEvent<{ ok: boolean; result?: unknown; error?: string }>,
      ) => {
        const payload = event.data;
        if (!payload || !payload.ok) {
          finish({
            passed: false,
            error: payload?.error || 'Szintaktikai vagy futási hiba történt.',
          });
          return;
        }
        finish(
          validateExecutionResult(
            payload.result,
            prep.isSearch,
            prep.searchArray,
            prep.testTarget,
            prep.expected,
          ),
        );
      };
      worker.onerror = (event: ErrorEvent) => {
        finish({
          passed: false,
          error: event.message || 'Szintaktikai vagy futási hiba történt.',
        });
      };
      worker.postMessage({
        runnable: prep.runnable,
        alternateRunnable: prep.alternateRunnable,
        initialInput: prep.initialInput,
      });
    } catch (err: unknown) {
      finish({
        passed: false,
        error:
          err instanceof Error ? err.message : 'Nem sikerült elindítani a végrehajtó környezetet.',
      });
    }
  });
}

// ─── Shell Sort patterns ──────────────────────────────────────

export const shellSortPatterns: CodePattern[] = [
  {
    id: 'gap-loop',
    label: 'Gap reduction loop',
    pattern: /while\s*\(\s*gap\s*>\s*0\s*\)|for\s*\([^)\n]*gap\s*(?:=|>>=|\/=)[^)\n]*\)/i,
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
