/**
 * Confidence-Based Learning (CBL) and Adaptive Scaffolding Engine for Courses.
 * Evaluates student answers in combination with their reported confidence level
 * across the 2D Knowledge-Confidence Matrix.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ConfidenceCategory =
  | 'mastery' // Correct + High Confidence
  | 'lucky' // Correct + Low/Medium Confidence
  | 'doubt' // Incorrect + Low/Medium Confidence
  | 'misconception'; // Incorrect + High Confidence

export interface ConfidenceEvaluationResult {
  category: ConfidenceCategory;
  scoreMultiplier: number;
  bonusPoints: number;
  titleKey: string;
  subtitleKey: string;
  canRetry: boolean;
  requiresReinforcement: boolean;
  explanationText?: string;
  selectedAnswerText?: string;
  correctAnswerText?: string;
}

export interface EvaluateConfidenceParams {
  isCorrect: boolean;
  confidence: ConfidenceLevel;
  basePoints?: number;
  explanation?: string;
  hintCopy?: string;
  selectedAnswerText?: string;
  correctAnswerText?: string;
  overconfidentMessage?: string;
  summary?: string;
}

/**
 * Evaluate an answer with confidence and determine adaptive feedback & scoring.
 */
export function evaluateConfidence({
  isCorrect,
  confidence,
  basePoints = 10,
  explanation,
  hintCopy,
  selectedAnswerText,
  correctAnswerText,
  overconfidentMessage,
  summary,
}: EvaluateConfidenceParams): ConfidenceEvaluationResult {
  // 1. Mastery: Correct + High Confidence
  if (isCorrect && confidence === 'high') {
    const bonusPoints = Math.round(basePoints * 0.5); // +50% bonus
    return {
      category: 'mastery',
      scoreMultiplier: 1.5,
      bonusPoints,
      titleKey: 'confidence.mastery_title',
      subtitleKey: 'confidence.mastery_subtitle',
      canRetry: false,
      requiresReinforcement: false,
      explanationText: explanation || summary,
      selectedAnswerText,
      correctAnswerText,
    };
  }

  // 2. Lucky / Reinforce: Correct + Medium/Low Confidence
  if (isCorrect && (confidence === 'medium' || confidence === 'low')) {
    return {
      category: 'lucky',
      scoreMultiplier: 1.0,
      bonusPoints: 0,
      titleKey: 'confidence.lucky_title',
      subtitleKey: 'confidence.lucky_subtitle',
      canRetry: false,
      requiresReinforcement: true,
      explanationText: explanation || hintCopy || summary,
      selectedAnswerText,
      correctAnswerText,
    };
  }

  // 3. Misconception: Incorrect + High Confidence
  if (!isCorrect && confidence === 'high') {
    return {
      category: 'misconception',
      scoreMultiplier: 0.2,
      bonusPoints: 0,
      titleKey: 'confidence.misconception_title',
      subtitleKey: 'confidence.misconception_subtitle',
      canRetry: true,
      requiresReinforcement: true,
      explanationText: overconfidentMessage || explanation || hintCopy || summary,
      selectedAnswerText,
      correctAnswerText,
    };
  }

  // 4. Doubt / Scaffolding: Incorrect + Low/Medium Confidence
  return {
    category: 'doubt',
    scoreMultiplier: 0.5,
    bonusPoints: 0,
    titleKey: 'confidence.doubt_title',
    subtitleKey: 'confidence.doubt_subtitle',
    canRetry: true,
    requiresReinforcement: false,
    explanationText: hintCopy || explanation || summary,
    selectedAnswerText,
    correctAnswerText,
  };
}

export interface CourseConfidenceSummary {
  masteryCount: number;
  luckyCount: number;
  misconceptionCount: number;
  doubtCount: number;
  totalEvaluated: number;
  masteryRate: number; // percentage 0-100
}

/**
 * Computes an aggregated 4-state Mastery/Confidence breakdown for the entire course.
 */
export function computeCourseConfidenceSummary(
  confidenceResults: Record<string, string> = {},
  phaseResults: Record<string, 'success' | 'fail' | null> = {},
): CourseConfidenceSummary {
  let masteryCount = 0;
  let luckyCount = 0;
  let misconceptionCount = 0;
  let doubtCount = 0;

  Object.entries(confidenceResults).forEach(([phaseId, rating]) => {
    const isCorrect = phaseResults[phaseId] === 'success';
    const isHigh = rating === 'high' || rating === 'very-sure';
    if (isCorrect && isHigh) masteryCount++;
    else if (isCorrect && !isHigh) luckyCount++;
    else if (!isCorrect && isHigh) misconceptionCount++;
    else doubtCount++;
  });

  const totalEvaluated = masteryCount + luckyCount + misconceptionCount + doubtCount;
  const masteryRate = totalEvaluated > 0 ? Math.round((masteryCount / totalEvaluated) * 100) : 100;

  return {
    masteryCount,
    luckyCount,
    misconceptionCount,
    doubtCount,
    totalEvaluated,
    masteryRate,
  };
}
