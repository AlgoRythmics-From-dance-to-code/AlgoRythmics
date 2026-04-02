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

function runSortAndCheck(userCode: string): { passed: boolean; error?: string } {
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

    const runnable = `
      globalThis.__loopCount = 0;
      ${safeCode}
      
      if (typeof bubbleSort === 'function') {
        let result = bubbleSort([...arr]);
        if (result !== undefined) return result;
        return arr; // return the modified array if it sorts in place
      } else {
        throw new Error("Kérlek hozz létre egy 'bubbleSort' nevű függvényt, ahogy a Create - Code Exercise is kérte!");
      }
    `;

    const sortFn = new Function('arr', runnable);

    let result;
    try {
      result = sortFn([...testArray]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Kérlek hozz létre')) {
        // Fallback: If they didn't name it bubbleSort, let's try evaluating it as a flat script modifying 'arr'
        const alternateRunnable = `
          globalThis.__loopCount = 0;
          ${safeCode}
          return arr;
        `;
        const altFn = new Function('arr', alternateRunnable);
        result = altFn([...testArray]);
      } else {
        throw err;
      }
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

// ─── Registry ─────────────────────────────────────────────────

const analysisPatterns: Record<string, CodePattern[]> = {
  'bubble-sort': bubbleSortPatterns,
};

export function getCodePatterns(algorithmId: string): CodePattern[] | undefined {
  return analysisPatterns[algorithmId];
}
