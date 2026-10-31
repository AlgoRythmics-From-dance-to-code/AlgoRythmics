import { NextRequest, NextResponse } from 'next/server';
import { authorizeTeacherOrAdmin } from '@/lib/ai/aiAuthHelper';
import {
  callOpenRouterStructured,
  localizedStringSchema,
  sanitizeLocalizedField,
  LocalizedField,
} from '@/lib/ai/openRouterClient';

export const maxDuration = 60;

const singlePhaseSchema = {
  type: 'object',
  properties: {
    title: localizedStringSchema,
    summary: localizedStringSchema,
    mascotLine: localizedStringSchema,
    mascotMistakeLine: localizedStringSchema,
    hintCopy: localizedStringSchema,
    idleHelp: localizedStringSchema,
    infoContent: localizedStringSchema,
    customVideoId: { type: 'string', description: 'YouTube video ID if educational video, else empty' },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: localizedStringSchema,
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                option: localizedStringSchema,
              },
              required: ['option'],
            },
          },
          correctIndex: { type: 'integer' },
          explanation: localizedStringSchema,
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
    matching: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          left: localizedStringSchema,
          right: localizedStringSchema,
        },
        required: ['left', 'right'],
      },
    },
    ordering: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: localizedStringSchema,
        },
        required: ['text'],
      },
    },
    debugCode: { type: 'string' },
    expectedCode: { type: 'string' },
    gapFillContent: localizedStringSchema,
    gapFillOptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          option: localizedStringSchema,
        },
        required: ['option'],
      },
    },
    gapFillSolutions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          solution: localizedStringSchema,
        },
        required: ['solution'],
      },
    },
  },
  required: ['title', 'summary', 'mascotLine', 'mascotMistakeLine', 'hintCopy', 'idleHelp'],
};

interface SinglePhaseRaw {
  title: LocalizedField;
  summary: LocalizedField;
  mascotLine: LocalizedField;
  mascotMistakeLine: LocalizedField;
  hintCopy: LocalizedField;
  idleHelp: LocalizedField;
  infoContent?: LocalizedField;
  customVideoId?: string;
  quiz?: Array<{
    question: LocalizedField;
    options: Array<{ option: LocalizedField }>;
    correctIndex: number;
    explanation: LocalizedField;
  }>;
  matching?: Array<{ left: LocalizedField; right: LocalizedField }>;
  ordering?: Array<{ text: LocalizedField }>;
  debugCode?: string;
  expectedCode?: string;
  gapFillContent?: LocalizedField;
  gapFillOptions?: Array<{ option: LocalizedField }>;
  gapFillSolutions?: Array<{ solution: LocalizedField }>;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeTeacherOrAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      courseContext,
      phase,
      previousPhasesSummary = [],
      customInstruction,
      model,
    } = body;

    if (!courseContext || !phase) {
      return NextResponse.json(
        { error: 'Hiányzó courseContext vagy phase paraméter!' },
        { status: 400 }
      );
    }

    const phaseView = phase.sourceView || 'control';
    const phaseTitleHu = typeof phase.title === 'object' ? phase.title.hu : String(phase.title || '');
    const phaseSummaryHu = typeof phase.summary === 'object' ? phase.summary.hu : String(phase.summary || '');
    const courseTopic = courseContext.topic || 'Általános témakör';
    const courseDifficulty = courseContext.difficulty || 'Beginner';

    const systemPrompt = `You are an expert interactive educator and pedagogical designer across any topic (computer science, programming, general STEM, mathematics, humanities, languages, etc.).
Generate rich, high-quality, engaging interactive educational content for a specific single learning phase in a course.
You MUST provide high-quality localized translations for all 3 languages: Hungarian ("hu"), English ("en"), and Romanian ("ro").
Never output empty translations or English text inside Hungarian or Romanian fields.`;

    let viewSpecificInstructions = '';
    switch (phaseView) {
      case 'quiz':
        viewSpecificInstructions = `
CRITICAL FOR QUIZ VIEW:
You MUST generate the 'quiz' array with 2-4 comprehensive questions testing key concepts of this step.
Each question needs:
- 'question': localized question text
- 'options': 3-4 localized multiple choice options
- 'correctIndex': 0-based integer index of correct answer
- 'explanation': localized detailed explanation why that option is correct.`;
        break;

      case 'gap-fill':
        viewSpecificInstructions = `
CRITICAL FOR GAP-FILL VIEW:
You MUST generate:
- 'gapFillContent': localized text or pseudo-code/manifest containing blanks indicated by '{{gap}}'.
  IMPORTANT: If the phase is about code, YAML, config, or programming, format 'gapFillContent' as multi-line indented code with newline characters (\n), preserving proper indentation! Do NOT put everything on one line.
- 'gapFillOptions': 4-6 localized options (including distractors).
- 'gapFillSolutions': the correct answers in the order of the '{{gap}}' placeholders.`;
        break;

      case 'debug':
        viewSpecificInstructions = `
CRITICAL FOR DEBUG VIEW:
You MUST generate:
- 'debugCode': a clean piece of programming code (Python, C++ or JavaScript) with 1-2 realistic errors/bugs (e.g. wrong index, inverted comparison, off-by-one). Use newline characters (\n).
- 'expectedCode': the corrected version of the code block. Use newline characters (\n).`;
        break;

      case 'match':
        viewSpecificInstructions = `
CRITICAL FOR MATCHING VIEW:
You MUST generate the 'matching' array with 3-5 term-definition or step-purpose pairs.
Each item must have 'left' and 'right' localized text.`;
        break;

      case 'order':
        viewSpecificInstructions = `
CRITICAL FOR ORDERING VIEW:
You MUST generate the 'ordering' array with 4-5 localized steps in their correct chronological or algorithmic order.`;
        break;

      case 'info':
        viewSpecificInstructions = `
CRITICAL FOR INFO VIEW:
You MUST generate 'infoContent': a detailed, structured educational markdown text explaining the topic clearly with bullet points and code/analogy examples. Use real newline characters for markdown paragraphs, headings (###), and lists (-). Do NOT use pipes | as line delimiters.`;
        break;

      case 'video':
      case 'video-custom':
      case 'animation':
      case 'control':
      case 'create':
      case 'alive':
      case 'final-challenge':
      default:
        viewSpecificInstructions = `
This is an interactive simulation/visual view ('${phaseView}').
Provide inspiring mascot coaching dialogue ('mascotLine'), encouraging mistake reaction ('mascotMistakeLine'), helpful hint ('hintCopy'), and idle encouragement ('idleHelp').`;
        break;
    }

    const userPrompt = `
Course Topic: "${courseTopic}"
Course Difficulty: ${courseDifficulty}
Phase Goal / Title: "${phaseTitleHu}"
Phase Summary: "${phaseSummaryHu}"
Phase Type: "${phaseView}"
${customInstruction ? `TEACHER'S SPECIFIC INSTRUCTIONS FOR THIS STEP (MUST FOLLOW): "${customInstruction}"` : ''}
${previousPhasesSummary.length > 0 ? `Previous steps covered: ${previousPhasesSummary.join(', ')}` : ''}

${viewSpecificInstructions}

Generate the detailed phase content matching the requested schema. Provide natural, friendly mascot mentoring lines and hints in all 3 languages (hu, en, ro).
`;

    const { data: rawPhase, modelUsed } = await callOpenRouterStructured<SinglePhaseRaw>({
      model,
      systemPrompt,
      userPrompt,
      schema: singlePhaseSchema,
      schemaName: 'course_single_phase_content',
      timeoutMs: 60_000,
    });

    // Sanitize and structure the phase
    const sanitizedPhase = {
      phaseId: phase.phaseId || `phase-${Date.now().toString(36)}`,
      title: sanitizeLocalizedField(rawPhase.title, phaseTitleHu || 'Fázis'),
      sourceView: phaseView,
      sourceAlgorithmId: phase.sourceAlgorithmId || 'bubble-sort',
      summary: sanitizeLocalizedField(rawPhase.summary, phaseSummaryHu || ''),
      maxPoints: Number(phase.maxPoints) || 10,
      mascotLine: sanitizeLocalizedField(rawPhase.mascotLine, 'Figyeld meg a lépéseket!'),
      mascotMistakeLine: sanitizeLocalizedField(rawPhase.mascotMistakeLine, 'Semmi baj, próbáld meg újra!'),
      hintCopy: sanitizeLocalizedField(rawPhase.hintCopy, 'Gondold végig az algoritmus logikáját.'),
      idleHelp: sanitizeLocalizedField(rawPhase.idleHelp, 'Kattints az egyik elemre a folytatáshoz!'),
      infoContent: rawPhase.infoContent ? sanitizeLocalizedField(rawPhase.infoContent, '') : undefined,
      customVideoId: rawPhase.customVideoId?.trim() || phase.customVideoId || '',
      quiz: Array.isArray(rawPhase.quiz)
        ? rawPhase.quiz.map((q) => ({
            question: sanitizeLocalizedField(q.question, 'Kérdés'),
            options: (q.options || []).map((o) => ({
              option: sanitizeLocalizedField(o.option, 'Válasz'),
            })),
            correctIndex: Math.max(0, Number(q.correctIndex) || 0),
            explanation: sanitizeLocalizedField(q.explanation, 'Magyarázat'),
          }))
        : undefined,
      matching: Array.isArray(rawPhase.matching)
        ? rawPhase.matching.map((m) => ({
            left: sanitizeLocalizedField(m.left, 'Bal'),
            right: sanitizeLocalizedField(m.right, 'Jobb'),
          }))
        : undefined,
      ordering: Array.isArray(rawPhase.ordering)
        ? rawPhase.ordering.map((o) => ({
            text: sanitizeLocalizedField(o.text, 'Lépés'),
          }))
        : undefined,
      debugCode: rawPhase.debugCode || '',
      expectedCode: rawPhase.expectedCode || '',
      gapFillContent: rawPhase.gapFillContent ? sanitizeLocalizedField(rawPhase.gapFillContent, '') : undefined,
      gapFillOptions: Array.isArray(rawPhase.gapFillOptions)
        ? rawPhase.gapFillOptions.map((g) => ({
            option: sanitizeLocalizedField(g.option, ''),
          }))
        : undefined,
      gapFillSolutions: Array.isArray(rawPhase.gapFillSolutions)
        ? rawPhase.gapFillSolutions.map((s) => ({
            solution: sanitizeLocalizedField(s.solution, ''),
          }))
        : undefined,
      isGenerated: true,
    };

    return NextResponse.json({
      success: true,
      phase: sanitizedPhase,
      modelUsed,
    });
  } catch (error) {
    console.error('[GeneratePhase API Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
