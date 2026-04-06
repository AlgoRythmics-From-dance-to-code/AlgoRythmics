export type CourseSourceView = 'video' | 'animation' | 'control' | 'create' | 'alive' | 'quiz' | 'info';

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
  objective: string;
  mascotLine: string;
  hintCopy: string;
  askConfidence?: boolean;
  quiz?: CourseQuizQuestion[];
  infoContent?: string;
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
  idleHelpMessages: string[];
  mistakeHelpMessages: string[];
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
        const candidate = record[property] || record.tip || record.value || record.label || record.text || record.option;
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
      const current = phase as any;
      const phaseId = current.phaseId || `phase-${index + 1}`;

      const quiz: CourseQuizQuestion[] | undefined = Array.isArray(current.quiz)
        ? current.quiz.map((q: any) => ({
            question: q.question || '',
            options: toStringArray(q.options, 'option'),
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation || '',
          }))
        : undefined;

      return {
        phaseId,
        title: current.title || humanizeSlug(phaseId),
        sourceView: current.sourceView || 'video',
        sourceAlgorithmId: current.sourceAlgorithmId || 'bubble-sort',
        summary: current.summary || '',
        objective: current.objective || '',
        mascotLine: current.mascotLine || '',
        hintCopy: current.hintCopy || '',
        askConfidence: !!current.askConfidence,
        quiz,
        infoContent: current.infoContent,
      };
    })
    .filter((phase): phase is CoursePhase => phase !== null);
}


export function normalizeCourse(doc: any): CourseBlueprint {
  const slug = doc.slug || 'untitled-course';

  return {
    slug,
    title: doc.title || humanizeSlug(slug),
    algorithmId: doc.phases?.[0]?.sourceAlgorithmId || doc.algorithmId || slug,
    summary:
      doc.summary || 'A structured course blueprint for learning the algorithm through practice.',
    heroTagline: doc.heroTagline || 'Learn by predicting, building, debugging, and reflecting.',
    icon: doc.icon || '📘',
    accentColor: doc.accentColor || DEFAULT_ACCENT,
    illustrationAsset: doc.illustrationAsset || 'algo_group_109.svg',
    estimatedMinutes: Number(doc.estimatedMinutes || 0),
    difficulty: doc.difficulty || 'Beginner',
    mascot: {
      enabled: doc.mascot?.enabled ?? true,
      name: doc.mascot?.name || 'Guide',
      asset: doc.mascot?.asset || 'algo_group_109.svg',
      accentColor: doc.mascot?.accentColor || DEFAULT_ACCENT,
      idleTriggerSeconds: Number(doc.mascot?.idleTriggerSeconds || 30),
      mistakeTriggerCount: Number(doc.mascot?.mistakeTriggerCount || 2),
      summonLabel: doc.mascot?.summonLabel || 'Summon guide',
      idlePrompt: doc.mascot?.idlePrompt || 'Need a hint?',
      mistakePrompt: doc.mascot?.mistakePrompt || 'Let us slow down and inspect the rule again.',
      welcomeMessages: toStringArray(doc.mascot?.welcomeMessages),
      idleHelpMessages: toStringArray(doc.mascot?.idleHelpMessages),
      mistakeHelpMessages: toStringArray(doc.mascot?.mistakeHelpMessages),
      overconfidentMessages: toStringArray(doc.mascot?.overconfidentMessages),
      streakMessages: toStringArray(doc.mascot?.streakMessages),
    },
    phases: toPhases(doc.phases || []),
  };
}

export const courseBlueprints: CourseBlueprint[] = [];

export async function getCourseCatalog(docs: any[] = []) {
  return docs
    .filter(Boolean)
    .map((doc) => normalizeCourse(doc))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function findCourseBySlug(slug: string, docs: any[] = []) {
  const found = docs.find((d: any) => d.slug === slug);
  if (found) {
    return normalizeCourse(found);
  }
  return null;
}
