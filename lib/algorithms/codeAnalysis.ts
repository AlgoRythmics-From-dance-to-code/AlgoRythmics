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
    pattern: /for\s*\(/i,
    weight: 25,
  },
  {
    id: 'inner-loop',
    label: 'Inner loop (nested)',
    pattern: /for[\s\S]*?for\s*\(/i,
    weight: 25,
  },
  {
    id: 'comparison',
    label: 'Element comparison (>)',
    pattern: /(\[.*\]|arr.*)\s*>\s*(\[.*\]|arr.*|.*\[)/i,
    weight: 25,
  },
  {
    id: 'swap',
    label: 'Swap operation',
    pattern: /(?:temp|swap|=\s*.*\[.*\][\s\S]{0,50}=\s*.*\[.*\])/i,
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

  if (algorithmId === 'bubble-sort') {
    const testRes = runSortAndCheck(code);
    executionPassed = testRes.passed;
    if (!testRes.passed) {
      executionError = testRes.error;
      // Penalty for failing the execution test
      if (score === 100) {
        score = 80;
      }
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

function runSortAndCheck(userCode: string): { passed: boolean; error?: string } {
  try {
    // If user provided a full function, we need to extract the call or invoke it.
    // However, a simpler way is to just define it and then call it if it's a named function,
    // or just execute the body if it's plain code.

    let executableCode = userCode;

    // Check if code contains a function named 'bubbleSort' or similar
    const funcMatch = userCode.match(/function\s+(\w+)\s*\(/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      executableCode = `${userCode}; return ${funcName}(arr);`;
    }

    // Inject simple infinite loop protection
    const safeCode = `
      let __loopCount = 0;
      ${executableCode.replace(
        /(?:for|while)\s*\([^)]+\)\s*\{/g,
        '$& if (++__loopCount > 5000) throw new Error("Infinite loop or too many iterations."); ',
      )}
      return arr;
    `;
    const fn = new Function('arr', safeCode);

    const tests = [
      { input: [5, 3, 8, 1, 2], expected: [1, 2, 3, 5, 8] },
      { input: [9, 7, 5, 3, 1], expected: [1, 3, 5, 7, 9] },
      { input: [1, 2, 3], expected: [1, 2, 3] },
    ];

    for (const test of tests) {
      const arrCtx = [...test.input];
      const returned = fn(arrCtx);
      // Fallback to arrCtx if user didn't explicitly return an array
      const finalized =
        Array.isArray(returned) && returned.length === test.expected.length ? returned : arrCtx;

      for (let i = 0; i < test.expected.length; i++) {
        if (finalized[i] !== test.expected[i]) {
          return {
            passed: false,
            error:
              'Incorrect sorting. Tested [' +
              test.input.join(', ') +
              '] -> Result [' +
              finalized.join(', ') +
              ']',
          };
        }
      }
    }
    return { passed: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax or Runtime Error';
    return { passed: false, error: message };
  }
}

// ─── Registry ─────────────────────────────────────────────────

const analysisPatterns: Record<string, CodePattern[]> = {
  'bubble-sort': bubbleSortPatterns,
};

export function getCodePatterns(algorithmId: string): CodePattern[] | undefined {
  return analysisPatterns[algorithmId];
}
