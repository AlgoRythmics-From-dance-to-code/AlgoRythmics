export type CourseSourceView =
  | 'video'
  | 'video-custom'
  | 'animation'
  | 'control'
  | 'create'
  | 'alive'
  | 'quiz'
  | 'match'
  | 'order'
  | 'debug'
  | 'gap-fill'
  | 'info'
  | 'final-challenge';

export type CourseQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type CoursePhase = {
  phaseId: string;
  title: string;
  sourceView: CourseSourceView;
  sourceAlgorithmId: string;
  summary: string;
  mascotLine: string;
  mascotMistakeLine?: string;
  hintCopy: string;
  idleHelp?: string;
  askConfidence?: boolean;
  maxPoints: number;
  quiz?: CourseQuizQuestion[];
  infoContent?: string;
  customVideoId?: string;
  matching?: { left: string; right: string }[];
  ordering?: { text: string }[];
  debugCode?: string;
  expectedCode?: string;
  gapFillContent?: string;
  gapFillOptions?: string[];
  gapFillSolutions?: string[];
};

export type CourseMascot = {
  enabled: boolean;
  name: string;
  asset: string;
  accentColor: string;
  idleTriggerSeconds: number;
  mistakeTriggerCount: number;
  summonLabel: string;
  idlePrompt: string;
  mistakePrompt: string;
  welcomeMessages: string[];
  overconfidentMessages: string[];
  streakMessages: string[];
};

export type CourseBlueprint = {
  slug: string;
  title: string;
  algorithmId: string;
  summary: string;
  heroTagline: string;
  icon: string;
  accentColor: string;
  illustrationAsset: string;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mascot: CourseMascot;
  phases: CoursePhase[];
  category?: string;
};

export type CourseCollectionDoc = Partial<CourseBlueprint> & {
  id?: string;
  slug?: string;
};

const DEFAULT_ACCENT = '#269984';

function humanizeSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Normalizes string arrays that might come from Payload as objects with a 'text' or 'tip' or 'option' property.
 */
function toStringArray(value: unknown, property: string = 'text'): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const candidate =
          record[property] ||
          record.tip ||
          record.value ||
          record.label ||
          record.text ||
          record.option;
        if (typeof candidate === 'string') return candidate;
      }
      return '';
    })
    .filter((item) => item.trim().length > 0);
}

function toPhases(value: unknown): CoursePhase[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((phase, index): CoursePhase | null => {
      if (!phase || typeof phase !== 'object') return null;
      const current = phase as Record<string, unknown>;
      const phaseId = (current.phaseId as string) || `phase-${index + 1}`;

      const quiz: CourseQuizQuestion[] | undefined = Array.isArray(current.quiz)
        ? current.quiz.map((q: unknown) => {
            const quizItem = q as Record<string, unknown>;
            return {
              question: (quizItem.question as string) || '',
              options: toStringArray(quizItem.options, 'option'),
              correctIndex: typeof quizItem.correctIndex === 'number' ? quizItem.correctIndex : 0,
              explanation: (quizItem.explanation as string) || '',
            };
          })
        : undefined;

      return {
        phaseId,
        title: (current.title as string) || humanizeSlug(phaseId),
        sourceView: (current.sourceView as CourseSourceView) || 'video',
        sourceAlgorithmId: (current.sourceAlgorithmId as string) || 'bubble-sort',
        summary: (current.summary as string) || '',
        mascotLine: (current.mascotLine as string) || '',
        mascotMistakeLine: (current.mascotMistakeLine as string) || '',
        hintCopy: (current.hintCopy as string) || '',
        idleHelp: (current.idleHelp as string) || '',
        askConfidence: !!current.askConfidence,
        maxPoints: typeof current.maxPoints === 'number' ? current.maxPoints : 10,
        quiz,
        infoContent: current.infoContent as string,
        customVideoId: current.customVideoId as string,
        matching: Array.isArray(current.matching)
          ? current.matching.map((m: Record<string, unknown>) => ({
              left: (m.left as string) || '',
              right: (m.right as string) || '',
            }))
          : undefined,
        ordering: Array.isArray(current.ordering)
          ? current.ordering.map((o: Record<string, unknown>) => ({
              text: (o.text as string) || '',
            }))
          : undefined,
        debugCode: current.debugCode as string,
        expectedCode: current.expectedCode as string,
        gapFillContent: current.gapFillContent as string,
        gapFillOptions: Array.isArray(current.gapFillOptions)
          ? current.gapFillOptions.map((o: Record<string, unknown>) => o.option as string)
          : undefined,
        gapFillSolutions: Array.isArray(current.gapFillSolutions)
          ? current.gapFillSolutions.map((s: Record<string, unknown>) => s.solution as string)
          : undefined,
      };
    })
    .filter((phase): phase is CoursePhase => phase !== null);
}

export function normalizeCourse(doc: Record<string, unknown>): CourseBlueprint {
  const slug = (doc.slug as string) || 'untitled-course';
  const mascot = (doc.mascot as Record<string, unknown>) || {};
  const phases = (doc.phases as unknown[]) || [];

  return {
    slug,
    title: (doc.title as string) || humanizeSlug(slug),
    algorithmId:
      ((phases[0] as Record<string, unknown>)?.sourceAlgorithmId as string) ||
      (doc.algorithmId as string) ||
      slug,
    summary:
      (doc.summary as string) ||
      'A structured course blueprint for learning the algorithm through practice.',
    heroTagline:
      (doc.heroTagline as string) || 'Learn by predicting, building, debugging, and reflecting.',
    icon: (doc.icon as string) || '📘',
    accentColor: (doc.accentColor as string) || DEFAULT_ACCENT,
    illustrationAsset: (doc.illustrationAsset as string) || 'algo_group_109.svg',
    estimatedMinutes: Number(doc.estimatedMinutes || 0),
    difficulty: (doc.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
    mascot: {
      enabled: mascot.enabled !== false,
      name: (mascot.name as string) || 'Guide',
      asset: (mascot.asset as string) || 'algo_group_109.svg',
      accentColor: (mascot.accentColor as string) || DEFAULT_ACCENT,
      idleTriggerSeconds: Number(mascot.idleTriggerSeconds || 30),
      mistakeTriggerCount: Number(mascot.mistakeTriggerCount || 2),
      summonLabel: (mascot.summonLabel as string) || 'Summon guide',
      idlePrompt: (mascot.idlePrompt as string) || 'Need a hint?',
      mistakePrompt:
        (mascot.mistakePrompt as string) || 'Let us slow down and inspect the rule again.',
      welcomeMessages: toStringArray(mascot.welcomeMessages),
      overconfidentMessages: toStringArray(mascot.overconfidentMessages),
      streakMessages: toStringArray(mascot.streakMessages),
    },
    phases: toPhases(phases),
    category: doc.category as string,
  };
}

export const courseBlueprints: CourseBlueprint[] = [];

export async function getCourseCatalog(docs: unknown[] = []) {
  return docs
    .filter((doc): doc is Record<string, unknown> => !!doc && typeof doc === 'object')
    .map((doc) => normalizeCourse(doc))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function findCourseBySlug(slug: string, docs: unknown[] = []) {
  const found = docs.find((d) => {
    const doc = d as Record<string, unknown>;
    return doc && doc.slug === slug;
  }) as Record<string, unknown> | undefined;

  if (found) {
    return normalizeCourse(found);
  }
  return null;
}
