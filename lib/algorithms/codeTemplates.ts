/**
 * Code templates for the "Create" (fill-in-the-blanks) exercise.
 * Each algorithm defines its pseudocode with blanks and possible distractors.
 */

export interface BlankSlot {
  /** Unique id for this blank */
  id: string;
  /** The correct answer (normalized: trimmed, compared case-insensitively) */
  answer: string;
  /** Placeholder display text */
  placeholder: string;
  /** Width hint in characters */
  widthCh: number;
  /** Distractor options shown in help-card mode (includes the correct answer) */
  options: string[];
  /** Optional hint text */
  hint?: string;
}

export interface CodeLine {
  /** Full text — blanks are marked with {{blankId}} */
  text: string;
  /** Indentation level (0 = root) */
  indent: number;
}

export interface CodeTemplate {
  algorithmId: string;
  language: string;
  lines: CodeLine[];
  blanks: BlankSlot[];
}

// ─── Bubble Sort ──────────────────────────────────────────────

export const bubbleSortTemplate: CodeTemplate = {
  algorithmId: 'bubble-sort',
  language: 'pseudocode',
  lines: [
    { text: 'function bubbleSort(arr):', indent: 0 },
    { text: 'for i = 0 to {{blank1}}', indent: 1 },
    { text: 'for j = 0 to {{blank2}}', indent: 2 },
    { text: 'if arr[j] {{blank3}} arr[j+1]', indent: 3 },
    { text: '{{blank4}}(arr[j], arr[j+1])', indent: 4 },
    { text: 'return arr', indent: 1 },
  ],
  blanks: [
    {
      id: 'blank1',
      answer: 'arr.length - 1',
      placeholder: '____________',
      widthCh: 14,
      options: ['arr.length - 1', 'arr.length', 'n', 'arr.length + 1'],
      hint: 'How many passes does bubble sort need?',
    },
    {
      id: 'blank2',
      answer: 'arr.length - i - 1',
      placeholder: '________________',
      widthCh: 18,
      options: ['arr.length - i - 1', 'arr.length - 1', 'arr.length - i', 'i'],
      hint: 'Each pass, one more element is already sorted at the end.',
    },
    {
      id: 'blank3',
      answer: '>',
      placeholder: '__',
      widthCh: 3,
      options: ['>', '<', '>=', '<='],
      hint: 'We want ascending order — swap when left is bigger.',
    },
    {
      id: 'blank4',
      answer: 'swap',
      placeholder: '________',
      widthCh: 8,
      options: ['swap', 'compare', 'move', 'insert'],
      hint: 'Exchange the two elements.',
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────

const templates: Record<string, CodeTemplate> = {
  'bubble-sort': bubbleSortTemplate,
};

export function getCodeTemplate(algorithmId: string): CodeTemplate | undefined {
  return templates[algorithmId];
}
