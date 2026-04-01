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
    pattern: /for[\s\S]*for\s*\(/i,
    weight: 25,
  },
  {
    id: 'comparison',
    label: 'Element comparison (>)',
    pattern: /\[.*\]\s*>\s*.*\[/i,
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
export function analyzeCode(code: string, patterns: CodePattern[]): CodeAnalysisResult {
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

  return {
    isCorrect: score === 100,
    score,
    matched,
    missing,
    details,
  };
}

// ─── Registry ─────────────────────────────────────────────────

const analysisPatterns: Record<string, CodePattern[]> = {
  'bubble-sort': bubbleSortPatterns,
};

export function getCodePatterns(algorithmId: string): CodePattern[] | undefined {
  return analysisPatterns[algorithmId];
}
