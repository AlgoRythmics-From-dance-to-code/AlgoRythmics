/**
 * Helper utilities for sanitizing and normalizing course data
 * when creating, updating, or cloning courses via Payload CMS Local API
 * with locale: 'all'.
 */

export interface LocalizedString {
  hu: string;
  en: string;
  ro: string;
}

/**
 * Safely converts string or partial localized object into a full { hu, en, ro } structure.
 */
export function toLocalized(val: unknown, fallback = ''): LocalizedString {
  if (typeof val === 'string') {
    const s = val.trim() || fallback;
    return { hu: s, en: s, ro: s };
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    const hu = typeof obj.hu === 'string' && obj.hu.trim() ? obj.hu : fallback;
    const en = typeof obj.en === 'string' && obj.en.trim() ? obj.en : (hu || fallback);
    const ro = typeof obj.ro === 'string' && obj.ro.trim() ? obj.ro : (hu || fallback);
    return { hu, en, ro };
  }
  return { hu: fallback, en: fallback, ro: fallback };
}

/**
 * Normalizes a single course phase for Payload CMS schema compliance.
 */
export function sanitizePhase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase: any,
  index: number,
  courseSlug?: string
): Record<string, unknown> {
  const phaseNum = index + 1;
  const phaseId =
    typeof phase.phaseId === 'string' && phase.phaseId.trim()
      ? phase.phaseId.trim()
      : `phase-${phaseNum}`;

  const validViews = [
    'video',
    'video-custom',
    'animation',
    'control',
    'create',
    'alive',
    'quiz',
    'match',
    'order',
    'debug',
    'gap-fill',
    'info',
    'final-challenge',
  ];
  const sourceView = validViews.includes(phase.sourceView) ? phase.sourceView : 'video';

  // sourceAlgorithmId is required in Courses collection schema
  let sourceAlgorithmId =
    typeof phase.sourceAlgorithmId === 'string' && phase.sourceAlgorithmId.trim()
      ? phase.sourceAlgorithmId.trim()
      : '';
  if (!sourceAlgorithmId) {
    sourceAlgorithmId = courseSlug?.replace(/-basics.*$/, '') || 'bubble-sort';
  }

  const result: Record<string, unknown> = {
    phaseId,
    title: toLocalized(phase.title, `${phaseNum}. Fázis`),
    sourceAlgorithmId,
    sourceView,
    summary: toLocalized(phase.summary, 'Fázis leírás'),
    mascotLine: toLocalized(phase.mascotLine, ''),
    mascotMistakeLine: toLocalized(phase.mascotMistakeLine, ''),
    hintCopy: toLocalized(phase.hintCopy, ''),
    idleHelp: toLocalized(phase.idleHelp, ''),
    askConfidence: phase.askConfidence ?? true,
    maxPoints: Math.max(0, Number(phase.maxPoints) || 10),
  };

  if (phase.customVideoId) {
    result.customVideoId = String(phase.customVideoId).trim();
  }

  // Quiz questions
  if (Array.isArray(phase.quiz) && phase.quiz.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.quiz = phase.quiz.map((q: any) => ({
      question: toLocalized(q.question, 'Kérdés'),
      options: Array.isArray(q.options)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? q.options.map((opt: any) => ({
            option: toLocalized(
              typeof opt === 'object' && opt?.option ? opt.option : opt,
              'Válaszlehetőség'
            ),
          }))
        : [
            { option: toLocalized('A válasz', 'Option A') },
            { option: toLocalized('B válasz', 'Option B') },
          ],
      correctIndex: Math.max(0, Number(q.correctIndex) || 0),
      explanation: toLocalized(q.explanation, 'Magyarázat'),
    }));
  }

  // Matching
  if (Array.isArray(phase.matching) && phase.matching.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.matching = phase.matching.map((m: any) => ({
      left: toLocalized(m.left, 'Bal oldal'),
      right: toLocalized(m.right, 'Jobb oldal'),
    }));
  }

  // Ordering
  if (Array.isArray(phase.ordering) && phase.ordering.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.ordering = phase.ordering.map((o: any) => ({
      text: toLocalized(typeof o === 'object' && o?.text ? o.text : o, 'Lépés'),
    }));
  }

  if (phase.debugCode) result.debugCode = String(phase.debugCode);
  if (phase.expectedCode) result.expectedCode = String(phase.expectedCode);

  // Gap fill
  if (phase.gapFillContent) {
    result.gapFillContent = toLocalized(phase.gapFillContent, '');
    if (Array.isArray(phase.gapFillOptions)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.gapFillOptions = phase.gapFillOptions.map((g: any) => ({
        option: toLocalized(typeof g === 'object' && g?.option ? g.option : g, ''),
      }));
    }
    if (Array.isArray(phase.gapFillSolutions)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.gapFillSolutions = phase.gapFillSolutions.map((s: any) => ({
        solution: toLocalized(typeof s === 'object' && s?.solution ? s.solution : s, ''),
      }));
    }
  }

  return result;
}

/**
 * Normalizes mascot configuration for Payload CMS schema compliance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeMascot(mascot: any): Record<string, unknown> {
  if (!mascot || typeof mascot !== 'object') {
    return {
      enabled: true,
      name: toLocalized('Bubi', 'Bubi'),
      asset: 'algo_group_109.svg',
      accentColor: '#269984',
      idleTriggerSeconds: 30,
      mistakeTriggerCount: 2,
      summonLabel: { hu: 'Segítség kérése', en: 'Summon guide', ro: 'Ajutor' },
      idlePrompt: {
        hu: 'Segíthetek a következő lépésben?',
        en: 'Need help with this step?',
        ro: 'Ai nevoie de ajutor?',
      },
      mistakePrompt: {
        hu: 'Ne aggódj a hibák miatt, együtt megoldjuk!',
        en: "Don't worry about mistakes, let's solve it together!",
        ro: 'Nu-ți face griji, rezolvăm împreună!',
      },
      welcomeMessages: [
        { text: { hu: 'Üdv a kurzuson!', en: 'Welcome to the course!', ro: 'Bun venit la curs!' } },
      ],
      overconfidentMessages: [
        {
          text: {
            hu: 'Nézd át újra alaposan a lépéseket!',
            en: 'Review the steps carefully!',
            ro: 'Verifică pașii cu atenție!',
          },
        },
      ],
      streakMessages: [
        { text: { hu: 'Kiváló válaszsorozat!', en: 'Great streak!', ro: 'Serie excelentă!' } },
      ],
    };
  }

  return {
    enabled: mascot.enabled ?? true,
    name: toLocalized(mascot.name, 'Bubi'),
    asset: mascot.asset || 'algo_group_109.svg',
    accentColor: mascot.accentColor || '#269984',
    idleTriggerSeconds: Math.max(5, Number(mascot.idleTriggerSeconds) || 30),
    mistakeTriggerCount: Math.max(1, Number(mascot.mistakeTriggerCount) || 2),
    summonLabel: toLocalized(mascot.summonLabel, 'Segítség kérése'),
    idlePrompt: toLocalized(mascot.idlePrompt, 'Segíthetek a következő lépésben?'),
    mistakePrompt: toLocalized(mascot.mistakePrompt, 'Ne aggódj a hibák miatt!'),
    welcomeMessages: Array.isArray(mascot.welcomeMessages) && mascot.welcomeMessages.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? mascot.welcomeMessages.map((m: any) => ({
          text: toLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Üdv a kurzuson!'),
        }))
      : [{ text: { hu: 'Üdv a kurzuson!', en: 'Welcome to the course!', ro: 'Bun venit la curs!' } }],
    overconfidentMessages:
      Array.isArray(mascot.overconfidentMessages) && mascot.overconfidentMessages.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? mascot.overconfidentMessages.map((m: any) => ({
            text: toLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Nézd át újra!'),
          }))
        : [{ text: { hu: 'Nézd át újra!', en: 'Take another look!', ro: 'Mai verifică!' } }],
    streakMessages: Array.isArray(mascot.streakMessages) && mascot.streakMessages.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? mascot.streakMessages.map((m: any) => ({
          text: toLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Kiváló!'),
        }))
      : [{ text: { hu: 'Kiváló haladás!', en: 'Great streak!', ro: 'Excelent!' } }],
  };
}

/**
 * Builds a complete Payload course document data object suitable for create/update with locale: 'all'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPayloadCourseData(input: any): Record<string, unknown> {
  const {
    title,
    slug,
    summary,
    heroTagline,
    difficulty = 'Beginner',
    estimatedMinutes = 20,
    visibility = 'public',
    isOfficial = false,
    instructor,
    phases = [],
    mascot,
    accentColor = '#269984',
    icon = '📘',
    illustrationAsset = 'algo_group_109.svg',
  } = input;

  const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const finalDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'Beginner';

  const data: Record<string, unknown> = {
    title: toLocalized(title, 'Új kurzus'),
    slug: String(slug).trim(),
    summary: toLocalized(summary, 'Kurzus összefoglaló leírás'),
    heroTagline: toLocalized(heroTagline || '', ''),
    difficulty: finalDifficulty,
    estimatedMinutes: Math.max(1, Number(estimatedMinutes) || 20),
    visibility: visibility === 'private' ? 'private' : 'public',
    isOfficial: Boolean(isOfficial),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phases: (Array.isArray(phases) ? phases : []).map((p: any, idx: number) =>
      sanitizePhase(p, idx, slug)
    ),
    mascot: sanitizeMascot(mascot),
    accentColor: accentColor || '#269984',
    icon: icon || '📘',
    illustrationAsset: illustrationAsset || 'algo_group_109.svg',
  };

  if (instructor !== undefined && instructor !== null) {
    data.instructor = instructor;
  }

  return data;
}
