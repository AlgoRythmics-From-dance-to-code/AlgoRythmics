/**
 * Live Simulation Engine for CodeExercise ("Create" mode).
 * Evaluates student filled blanks strictly and returns clean localization keys
 * and parameters for zero hardcoded strings.
 */

import { getCodeTemplate } from './codeTemplates';

export type SimulationStatus = 'success' | 'reversed' | 'partial' | 'incomplete' | 'error';

export interface SimulationResult {
  initialArray: number[];
  resultArray: number[];
  status: SimulationStatus;
  feedbackKey: string;
  feedbackParams?: Record<string, string | number>;
  isCorrect: boolean;
  filledCount: number;
  totalBlanks: number;
  target?: number;
  foundIndex?: number;
}

const DEFAULT_SAMPLE_ARRAY = [42, 15, 88, 30, 65];

function normalize(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '');
}

/**
 * Validate and simulate the student's code on the test array.
 */
export function simulateCreateTemplate(
  algorithmId: string,
  blanks: Record<string, string>,
  sampleArray: number[] = DEFAULT_SAMPLE_ARRAY,
): SimulationResult {
  const initial = [...sampleArray];
  const template = getCodeTemplate(algorithmId);

  if (!template) {
    return {
      initialArray: initial,
      resultArray: [...initial],
      status: 'incomplete',
      feedbackKey: 'sandbox.feedback_empty',
      isCorrect: false,
      filledCount: 0,
      totalBlanks: 0,
    };
  }

  const totalBlanks = template.blanks.length;
  const filledSlots = template.blanks.filter((b) => blanks[b.id]?.trim().length > 0);
  const filledCount = filledSlots.length;

  // 1. If NO blanks filled yet
  if (filledCount === 0) {
    return {
      initialArray: initial,
      resultArray: [...initial],
      status: 'incomplete',
      feedbackKey: 'sandbox.feedback_empty',
      isCorrect: false,
      filledCount: 0,
      totalBlanks,
    };
  }

  // 2. Check each blank strictly
  const wrongBlanks: { id: string; userVal: string; expected: string; hint?: string }[] = [];
  for (const slot of template.blanks) {
    const userVal = blanks[slot.id]?.trim() || '';
    if (userVal.length === 0) continue;

    const normUser = normalize(userVal);
    const normExpected = normalize(slot.answer);

    // Also accept valid alternative options if applicable
    const isValid =
      normUser === normExpected ||
      (slot.id === 'blank1' && normUser === 'n-1' && normExpected === 'arr.length-1') ||
      (slot.id === 'blank1' && normUser === 'n' && normExpected === 'arr.length') ||
      (slot.id === 'blank2' && normUser === 'n-i-1' && normExpected === 'arr.length-i-1') ||
      (slot.id === 'blank2' && normUser === 'low<high' && normExpected === 'low<=high');

    if (!isValid) {
      wrongBlanks.push({
        id: slot.id,
        userVal,
        expected: slot.answer,
        hint: slot.hint,
      });
    }
  }

  // 3. Check for specific common misconception: reversed sorting (< instead of > in bubble sort)
  const isBubbleSort = algorithmId === 'bubble-sort';
  const b3Op = blanks.blank3?.trim();
  if (isBubbleSort && (b3Op === '<' || b3Op === '<=')) {
    const reversedSorted = [...initial].sort((a, b) => b - a);
    return {
      initialArray: initial,
      resultArray: reversedSorted,
      status: 'reversed',
      feedbackKey: 'sandbox.feedback_reversed',
      isCorrect: false,
      filledCount,
      totalBlanks,
    };
  }

  // 4. If any filled blank is wrong, give immediate targeted feedback
  if (wrongBlanks.length > 0) {
    const firstWrong = wrongBlanks[0];
    return {
      initialArray: initial,
      resultArray: [...initial],
      status: 'partial',
      feedbackKey: 'sandbox.feedback_wrong',
      feedbackParams: { value: firstWrong.userVal },
      isCorrect: false,
      filledCount,
      totalBlanks,
    };
  }

  // 5. If not all blanks are filled yet, show progress state
  if (filledCount < totalBlanks) {
    return {
      initialArray: initial,
      resultArray: [...initial],
      status: 'incomplete',
      feedbackKey: 'sandbox.feedback_progress',
      feedbackParams: { remaining: totalBlanks - filledCount },
      isCorrect: false,
      filledCount,
      totalBlanks,
    };
  }

  // 6. ALL blanks are correctly filled -> run algorithm and return SUCCESS!
  const sortedResult = [...initial].sort((a, b) => a - b);

  if (algorithmId === 'linear-search') {
    const target = 88;
    const foundIndex = initial.indexOf(target);
    return {
      initialArray: initial,
      resultArray: initial,
      status: 'success',
      feedbackKey: 'sandbox.feedback_success_linear',
      feedbackParams: { target, index: foundIndex },
      isCorrect: true,
      filledCount,
      totalBlanks,
      target,
      foundIndex,
    };
  }

  if (algorithmId === 'binary-search') {
    const target = 42;
    const sorted = [...initial].sort((a, b) => a - b);
    const foundIndex = sorted.indexOf(target);
    return {
      initialArray: sorted,
      resultArray: sorted,
      status: 'success',
      feedbackKey: 'sandbox.feedback_success_binary',
      feedbackParams: { target, index: foundIndex },
      isCorrect: true,
      filledCount,
      totalBlanks,
      target,
      foundIndex,
    };
  }

  if (algorithmId === 'n-queens') {
    return {
      initialArray: [0, 0, 0, 0],
      resultArray: [1, 3, 0, 2],
      status: 'success',
      feedbackKey: 'sandbox.feedback_success_queens',
      isCorrect: true,
      filledCount,
      totalBlanks,
    };
  }

  return {
    initialArray: initial,
    resultArray: sortedResult,
    status: 'success',
    feedbackKey: 'sandbox.feedback_success_sort',
    isCorrect: true,
    filledCount,
    totalBlanks,
  };
}
