import { NextRequest, NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../../lib/payload';
import { headers as getHeaders } from 'next/headers';
import { markdownToLexical } from '@/lib/courses/lexicalConverter';
import type { Course } from '../../../../payload-types';

export const maxDuration = 60;

// ── Types for AI-generated course data ──
interface LocalizedField {
  hu: string;
  en: string;
  ro: string;
}

interface AIMascotMessage {
  text: LocalizedField | string;
}

interface AIQuizOption {
  option: LocalizedField | string;
}

interface AIQuizItem {
  question: LocalizedField | string;
  options: AIQuizOption[];
  correctIndex: number;
  explanation: LocalizedField | string;
}

interface AIMatchingItem {
  left: LocalizedField | string;
  right: LocalizedField | string;
}

interface AIOrderingItem {
  text: LocalizedField | string;
}

interface AIGapFillOption {
  option: LocalizedField | string;
}

interface AIGapFillSolution {
  solution: LocalizedField | string;
}

interface AIPhase {
  phaseId: string;
  title: LocalizedField | string;
  sourceAlgorithmId?: string;
  sourceView: string;
  summary: LocalizedField | string;
  mascotLine: LocalizedField | string;
  mascotMistakeLine: LocalizedField | string;
  hintCopy: LocalizedField | string;
  idleHelp: LocalizedField | string;
  askConfidence?: boolean;
  maxPoints?: number;
  infoContent: LocalizedField | string | { hu: unknown; en: unknown; ro: unknown };
  customVideoId?: string;
  quiz?: AIQuizItem[];
  matching?: AIMatchingItem[];
  ordering?: AIOrderingItem[];
  debugCode?: string;
  expectedCode?: string;
  gapFillContent: LocalizedField | string;
  gapFillOptions?: AIGapFillOption[];
  gapFillSolutions?: AIGapFillSolution[];
}

interface AIMascot {
  enabled?: boolean;
  name: LocalizedField | string;
  asset?: string;
  accentColor?: string;
  idleTriggerSeconds?: number;
  mistakeTriggerCount?: number;
  summonLabel: LocalizedField | string;
  idlePrompt: LocalizedField | string;
  mistakePrompt: LocalizedField | string;
  welcomeMessages?: AIMascotMessage[];
  overconfidentMessages?: AIMascotMessage[];
  streakMessages?: AIMascotMessage[];
}

interface AICourseData {
  title: LocalizedField | string;
  slug: string;
  summary: LocalizedField | string;
  heroTagline: LocalizedField | string;
  icon?: string;
  accentColor?: string;
  illustrationAsset?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  mascot?: AIMascot;
  phases: AIPhase[];
}

// Simple in-memory rate limiter: track last request timestamp per user email
const lastRequestMap = new Map<string, number>();
const RATE_LIMIT_MS = 30_000; // 30 seconds between requests
const OPENROUTER_TIMEOUT_MS = 120_000; // 2 minute timeout for OpenRouter API calls

const localizedStringSchema = {
  type: 'object',
  properties: {
    hu: { type: 'string', description: 'Hungarian translation' },
    en: { type: 'string', description: 'English translation' },
    ro: { type: 'string', description: 'Romanian translation' },
  },
  required: ['hu', 'en', 'ro'],
};

const openRouterSchema = {
  type: 'object',
  properties: {
    title: localizedStringSchema,
    slug: {
      type: 'string',
      description: 'URL slug for the course, e.g., selection-sort-basics, in lowercase kebab-case',
    },
    summary: localizedStringSchema,
    heroTagline: localizedStringSchema,
    icon: {
      type: 'string',
      description: 'A single, relevant emoji for the course card, e.g. 🧠, 💻, 📊, 🔍',
    },
    accentColor: {
      type: 'string',
      description: 'Hex color string matching the course theme, e.g. #269984, #4F46E5, #059669',
    },
    illustrationAsset: {
      type: 'string',
      description:
        'Filename of illustration SVG, choose from: algo_group_109.svg, algo_group_119.svg, algo_group_132.svg, algo_group_142.svg, algo_group_166.svg, algo_group_167.svg, algo_group_168.svg, algo_group_170.svg, algo_group_174.svg, algo_group_176.svg, algo_group_177.svg, algo_group_181.svg, algo_group_182.svg, algo_group_184.svg, algo_sorting_icon.svg',
    },
    estimatedMinutes: { type: 'integer', description: 'Estimated minutes to complete' },
    difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
    mascot: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        name: localizedStringSchema,
        asset: {
          type: 'string',
          description:
            'Filename of mascot asset, choose from: bubble_dragon.png, algo_group_109.svg, algo_group_184.svg',
        },
        accentColor: {
          type: 'string',
          description: 'Hex color string for mascot theme, e.g. #269984, #4F46E5',
        },
        idleTriggerSeconds: {
          type: 'integer',
          description: 'Inactivity trigger in seconds (default 30)',
        },
        mistakeTriggerCount: {
          type: 'integer',
          description: 'Consecutive mistake trigger count (default 2)',
        },
        summonLabel: localizedStringSchema,
        idlePrompt: localizedStringSchema,
        mistakePrompt: localizedStringSchema,
        welcomeMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: localizedStringSchema,
            },
            required: ['text'],
          },
        },
        overconfidentMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: localizedStringSchema,
            },
            required: ['text'],
          },
        },
        streakMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: localizedStringSchema,
            },
            required: ['text'],
          },
        },
      },
      required: [
        'enabled',
        'name',
        'asset',
        'accentColor',
        'idleTriggerSeconds',
        'mistakeTriggerCount',
        'summonLabel',
        'idlePrompt',
        'mistakePrompt',
        'welcomeMessages',
        'overconfidentMessages',
        'streakMessages',
      ],
    },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phaseId: { type: 'string' },
          title: localizedStringSchema,
          sourceAlgorithmId: { type: 'string' },
          sourceView: {
            type: 'string',
            enum: [
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
            ],
          },
          summary: localizedStringSchema,
          mascotLine: localizedStringSchema,
          mascotMistakeLine: localizedStringSchema,
          hintCopy: localizedStringSchema,
          idleHelp: localizedStringSchema,
          askConfidence: { type: 'boolean' },
          maxPoints: { type: 'integer' },
          infoContent: localizedStringSchema,
          customVideoId: { type: 'string' },
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
        required: [
          'phaseId',
          'title',
          'sourceAlgorithmId',
          'sourceView',
          'summary',
          'askConfidence',
        ],
      },
    },
  },
  required: [
    'title',
    'slug',
    'summary',
    'heroTagline',
    'icon',
    'accentColor',
    'illustrationAsset',
    'estimatedMinutes',
    'difficulty',
    'mascot',
    'phases',
  ],
};

async function callOpenRouter(
  apiKey: string,
  activeModel: string,
  promptText: string,
  schema: typeof openRouterSchema,
): Promise<Response> {
  const startTime = Date.now();
  console.log(`[AI Course Generation] Initiating OpenRouter request to model: ${activeModel}`);

  // AbortController with timeout to prevent hanging requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  const systemPrompt = `You are an expert curriculum developer and computer science educator. 
Your goal is to generate a comprehensive, high-quality programming/algorithm course blueprint.
You must return valid JSON matching the following schema. You MUST generate high-quality translations for all three languages ("hu", "en", "ro") for all localized properties. Do not include markdown codeblocks or conversational text, just raw JSON.
Schema:
${JSON.stringify(schema)}`;

  // Try with json_schema first
  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
        'X-Title': 'AlgoRythmics',
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptText },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'course_blueprint',
            schema: schema,
          },
        },
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }

  clearTimeout(timeout);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[AI Course Generation] OpenRouter response received in ${duration}s. Status: ${response.status}`,
  );

  // Fallback if structured json_schema is not supported by the selected model
  if (!response.ok) {
    console.warn(
      `[AI Course Generation] Warning: Primary structured schema call failed with status ${response.status} for model ${activeModel}. Attempting fallback to json_object...`,
    );
    const fallbackStart = Date.now();
    const fallbackController = new AbortController();
    const fallbackTimeout = setTimeout(() => fallbackController.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
          'X-Title': 'AlgoRythmics',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
        signal: fallbackController.signal,
      });
    } catch (err: unknown) {
      clearTimeout(fallbackTimeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `OpenRouter fallback request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s`,
        );
      }
      throw err;
    }
    clearTimeout(fallbackTimeout);
    const fallbackDuration = ((Date.now() - fallbackStart) / 1000).toFixed(2);
    console.log(
      `[AI Course Generation] Fallback response received in ${fallbackDuration}s. Status: ${response.status}`,
    );
  }

  return response;
}

function sanitizeLocalizedField(
  val: LocalizedField | string | null | undefined,
  defaultText: string = '',
): LocalizedField {
  if (!val) {
    return { hu: defaultText, en: defaultText, ro: defaultText };
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return { hu: trimmed, en: trimmed, ro: trimmed };
  }
  if (typeof val === 'object') {
    const hu = typeof val.hu === 'string' ? val.hu.trim() : '';
    const en = typeof val.en === 'string' ? val.en.trim() : '';
    const ro = typeof val.ro === 'string' ? val.ro.trim() : '';

    // Find a fallback among the available translations
    const fallback = hu || en || ro || defaultText;

    return {
      hu: hu || fallback,
      en: en || fallback,
      ro: ro || fallback,
    };
  }
  return { hu: defaultText, en: defaultText, ro: defaultText };
}

export async function POST(req: NextRequest) {
  console.log('[AI Course Generation] === Generation Requested ===');
  try {
    // 1. Authorize user (admin or editor roles only)
    console.log('[AI Course Generation] Authorizing user...');
    const payload = await getPayloadInstance();
    const headers = await getHeaders();
    const { user } = await payload.auth({ headers });

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      console.warn('[AI Course Generation] Authorization failed: User not admin or editor.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[AI Course Generation] Authorized as ${user.email} (Role: ${user.role})`);

    // Rate limiting: prevent spamming the API
    const userEmail = user.email || 'unknown';
    const now = Date.now();
    const lastReq = lastRequestMap.get(userEmail) || 0;
    if (now - lastReq < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastReq)) / 1000);
      console.warn(`[AI Course Generation] Rate limited: ${userEmail} must wait ${waitSec}s.`);
      return NextResponse.json(
        { error: `Please wait ${waitSec} seconds before generating again.` },
        { status: 429 },
      );
    }
    lastRequestMap.set(userEmail, now);

    // 2. Parse request parameters
    console.log('[AI Course Generation] Parsing request parameters...');
    const { prompt, model } = await req.json();
    if (!prompt) {
      console.warn('[AI Course Generation] Error: Prompt is missing.');
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let activeModel = model?.trim() ? model.trim() : 'openrouter/free';
    console.log(`[AI Course Generation] Target model set to: ${activeModel}`);

    // 3. Verify OpenRouter API Key exists
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[AI Course Generation] Error: OPENROUTER_API_KEY is missing.');
      return NextResponse.json(
        {
          error:
            'OPENROUTER_API_KEY is not configured in the environment. Please add it to your .env file.',
        },
        { status: 500 },
      );
    }

    // 4. Construct prompt instructions
    console.log('[AI Course Generation] Constructing prompt instructions...');
    const promptText = `
Based on the user's prompt, generate a comprehensive, high-quality programming/algorithm course blueprint.
The course should cover the topic and follow the step-by-step description of the planned learning phases.

Course Outline and Plan:
${prompt}

⚠️ TOP PRIORITY — PHASES ARE MANDATORY:
The "phases" array is the MOST IMPORTANT part of the output. You MUST generate at least 3 phases (ideally matching the number of steps in the outline above). Each phase must have a unique phaseId, title, sourceAlgorithmId, sourceView, and summary. A course with an empty phases array is USELESS and UNACCEPTABLE. Generate the phases FIRST, then fill in the course-level metadata.

CRITICAL REQUIREMENTS:
1. You MUST generate ALL localized text fields in all three supported languages natively: Hungarian ("hu"), English ("en"), and Romanian ("ro"). Don't just translate word-by-word; make them sound natural and educational.
2. Every field defined as an object containing "hu", "en", and "ro" properties MUST have high-quality, pedagogically accurate translations in all three languages. Do not use English in place of Hungarian or Romanian.
3. Choose a difficulty level and estimated duration that makes sense for the content.
4. Set up the mascot settings with name and relevant welcome/idle/mistake messages matching the target languages.
5. Create learning phases matching the planned steps provided in the outline. If a planned step is marked as [EMPTY - AI must invent...], you must creatively design a unique, interactive learning task (such as a gap-fill, debugging exercise, ordering, or quiz) that logically fits in that position of the course curriculum.
6. The 'sourceAlgorithmId' for each phase must logically match the main algorithm slug being taught (e.g., 'selection-sort' or 'bubble-sort').
7. Use diverse 'sourceView' types across phases depending on what makes the best educational sense. Here are the available types and their required parameters:
   - 'info': Requires 'infoContent' (a detailed educational explanation or text in markdown).
   - 'video-custom': Requires 'customVideoId' (a YouTube Video ID string, e.g., 'Ns4TPTC8whw').
   - 'quiz': Requires the 'quiz' array populated with 2-4 questions. Each question needs:
     * 'question' (the text of the question)
     * 'options' (array of objects with 'option' text)
     * 'correctIndex' (0-based integer index of the correct answer)
     * 'explanation' (why it is correct)
   - 'match': Requires the 'matching' array populated with 3-5 term pairs to connect. Each pair needs 'left' and 'right'.
   - 'order': Requires the 'ordering' array populated with 4-6 text items in their correct sequential order.
   - 'debug': Requires 'debugCode' (a piece of code with simple errors/bugs) and 'expectedCode' (the corrected code block).
   - 'gap-fill': Requires 'gapFillContent' (a sentence or code block with blanks represented by '{{gap}}'), 'gapFillOptions' (list of decoy and correct options), and 'gapFillSolutions' (the correct answers in order of the gaps).
   - 'video', 'animation', 'control', 'create', 'alive', 'final-challenge': Standard interactive algorithm visualizations. They do not require any of the above custom parameters (only the common properties like phaseId, title, summary, etc.).
8. Ensure you fully populate the corresponding fields for the selected 'sourceView' for all three languages.
9. REMINDER: The "phases" array MUST NOT be empty. Generate at least one phase per step in the outline.
`;

    // 5. Call OpenRouter API with structured response schema
    let response = await callOpenRouter(apiKey, activeModel, promptText, openRouterSchema);

    // If the model does not exist or fails, and activeModel wasn't already 'openrouter/free', fallback and retry!
    if (!response.ok && activeModel !== 'openrouter/free') {
      const errorText = await response.clone().text();
      console.warn(
        `[AI Course Generation] Model '${activeModel}' failed with status ${response.status}: ${errorText}. Falling back to 'openrouter/free'...`,
      );
      activeModel = 'openrouter/free';
      response = await callOpenRouter(apiKey, activeModel, promptText, openRouterSchema);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter API HTTP Error]:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter returned error code ${response.status}: ${errorText}` },
        { status: 502 },
      );
    }

    const resultData = await response.json();
    const generatedText = resultData?.choices?.[0]?.message?.content;
    const finishReason = resultData?.choices?.[0]?.finish_reason;

    if (!generatedText) {
      // Log full response for debugging
      console.error(
        '[AI Course Generation] Empty content from model. Full response:',
        JSON.stringify(resultData, null, 2),
      );

      let errorDetail = `No content received from model "${activeModel}".`;
      if (finishReason === 'length') {
        errorDetail +=
          ' The response was cut off due to token length limits. Try a simpler prompt or a model with higher context.';
      } else if (resultData?.error) {
        errorDetail += ` API error: ${resultData.error.message || JSON.stringify(resultData.error)}`;
      } else {
        errorDetail +=
          ' The model returned an empty response. This often happens with free models under heavy load. Please try again or switch to a different model.';
      }

      return NextResponse.json({ error: errorDetail }, { status: 502 });
    }

    // Extract JSON in case the model wrapped it in markdown codeblocks or added conversational text
    console.log('[AI Course Generation] Extracting and parsing JSON from response...');
    let jsonText = generatedText.trim();
    let courseData;

    try {
      // Strip all markdown code fences (handles nested backticks in code fields)
      jsonText = jsonText.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');

      // Find the outermost JSON object
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }

      courseData = JSON.parse(jsonText);
      console.log('[AI Course Generation] JSON successfully parsed.');
    } catch {
      console.error('[OpenRouter API] JSON Parse Error. Generated text was:', generatedText);
      return NextResponse.json(
        { error: 'Failed to parse the JSON response from the AI model. Please try again.' },
        { status: 502 },
      );
    }

    if (courseData) {
      // Validate that phases are present – this is the most critical part
      if (!Array.isArray(courseData.phases) || courseData.phases.length === 0) {
        console.error(
          '[AI Course Generation] VALIDATION FAILED: Model returned empty or missing phases array.',
          'Course-level keys:',
          Object.keys(courseData),
        );
        return NextResponse.json(
          {
            error:
              'The AI model generated the course metadata but did not generate any learning phases. ' +
              'This usually happens with free models that have limited output tokens. ' +
              'Please try again, or switch to a more capable model (e.g., Gemini 2.5 Flash or GPT-4o Mini).',
          },
          { status: 502 },
        );
      }

      console.log(
        `[AI Course Generation] Sanitizing course data (${courseData.phases.length} phases, converting localized fields & markdown to Lexical)...`,
      );
      // Sanitize course-level fields
      courseData.title = sanitizeLocalizedField(courseData.title, 'Course Title');
      courseData.summary = sanitizeLocalizedField(courseData.summary, 'Course Summary');
      courseData.heroTagline = sanitizeLocalizedField(courseData.heroTagline, 'Course Tagline');

      // Sanitize mascot fields
      if (courseData.mascot) {
        courseData.mascot.name = sanitizeLocalizedField(courseData.mascot.name, 'Guide');
        courseData.mascot.summonLabel = sanitizeLocalizedField(
          courseData.mascot.summonLabel,
          'Summon guide',
        );
        courseData.mascot.idlePrompt = sanitizeLocalizedField(courseData.mascot.idlePrompt, '');
        courseData.mascot.mistakePrompt = sanitizeLocalizedField(
          courseData.mascot.mistakePrompt,
          '',
        );

        if (Array.isArray(courseData.mascot.welcomeMessages)) {
          courseData.mascot.welcomeMessages = courseData.mascot.welcomeMessages.map(
            (msg: AIMascotMessage) => ({
              text: sanitizeLocalizedField(msg?.text, 'Welcome'),
            }),
          );
        }
        if (Array.isArray(courseData.mascot.overconfidentMessages)) {
          courseData.mascot.overconfidentMessages = courseData.mascot.overconfidentMessages.map(
            (msg: AIMascotMessage) => ({
              text: sanitizeLocalizedField(msg?.text, 'Watch out'),
            }),
          );
        }
        if (Array.isArray(courseData.mascot.streakMessages)) {
          courseData.mascot.streakMessages = courseData.mascot.streakMessages.map(
            (msg: AIMascotMessage) => ({
              text: sanitizeLocalizedField(msg?.text, 'Great job'),
            }),
          );
        }
      }

      // Sanitize phases
      if (Array.isArray(courseData.phases)) {
        courseData.phases.forEach((phase: AIPhase) => {
          phase.title = sanitizeLocalizedField(phase.title, 'Phase Title');
          phase.summary = sanitizeLocalizedField(phase.summary, 'Phase Summary');
          phase.mascotLine = sanitizeLocalizedField(phase.mascotLine, '');
          phase.mascotMistakeLine = sanitizeLocalizedField(phase.mascotMistakeLine, '');
          phase.hintCopy = sanitizeLocalizedField(phase.hintCopy, '');
          phase.idleHelp = sanitizeLocalizedField(phase.idleHelp, '');

          // Handle infoContent (markdown to lexical)
          const rawInfo = sanitizeLocalizedField(phase.infoContent as LocalizedField | string, '');
          phase.infoContent = {
            hu: markdownToLexical(rawInfo.hu),
            en: markdownToLexical(rawInfo.en),
            ro: markdownToLexical(rawInfo.ro),
          };

          // Quiz questions
          if (Array.isArray(phase.quiz)) {
            phase.quiz.forEach((qItem: AIQuizItem) => {
              qItem.question = sanitizeLocalizedField(qItem.question, 'Question');
              qItem.explanation = sanitizeLocalizedField(qItem.explanation, 'Explanation');
              if (Array.isArray(qItem.options)) {
                qItem.options.forEach((optItem: AIQuizOption) => {
                  optItem.option = sanitizeLocalizedField(optItem.option, 'Option');
                });
              }
            });
          }

          // Matching
          if (Array.isArray(phase.matching)) {
            phase.matching.forEach((mItem: AIMatchingItem) => {
              mItem.left = sanitizeLocalizedField(mItem.left, 'Left');
              mItem.right = sanitizeLocalizedField(mItem.right, 'Right');
            });
          }

          // Ordering
          if (Array.isArray(phase.ordering)) {
            phase.ordering.forEach((oItem: AIOrderingItem) => {
              oItem.text = sanitizeLocalizedField(oItem.text, 'Order Step');
            });
          }

          // Gap fill
          phase.gapFillContent = sanitizeLocalizedField(phase.gapFillContent, '');
          if (Array.isArray(phase.gapFillOptions)) {
            phase.gapFillOptions.forEach((gItem: AIGapFillOption) => {
              gItem.option = sanitizeLocalizedField(gItem.option, 'Option');
            });
          }
          if (Array.isArray(phase.gapFillSolutions)) {
            phase.gapFillSolutions.forEach((sItem: AIGapFillSolution) => {
              sItem.solution = sanitizeLocalizedField(sItem.solution, 'Solution');
            });
          }
        });
      }
    }

    // Save directly via Payload Local API using locale: 'all'
    // This saves all 3 locales (hu, en, ro) in a single create call
    console.log('[AI Course Generation] Saving course via Payload Local API with locale: "all"...');

    // Build the localized data structure that Payload expects with locale: 'all'
    const buildLocalizedPayload = (data: AICourseData) => {
      const result: Record<string, unknown> = {};

      // Localized text fields at course level — these are {hu, en, ro} objects
      // Payload's locale:'all' supports passing these directly
      result.title = data.title;
      result.slug = data.slug;
      result.summary = data.summary;
      result.heroTagline = data.heroTagline;
      result.icon = data.icon;
      result.accentColor = data.accentColor;
      result.illustrationAsset = data.illustrationAsset;
      result.estimatedMinutes = data.estimatedMinutes;
      result.difficulty = data.difficulty;

      // Mascot group — non-localized fields plus localized sub-fields
      if (data.mascot) {
        result.mascot = {
          enabled: data.mascot.enabled ?? true,
          name: data.mascot.name, // {hu, en, ro}
          asset: data.mascot.asset,
          accentColor: data.mascot.accentColor,
          idleTriggerSeconds: data.mascot.idleTriggerSeconds,
          mistakeTriggerCount: data.mascot.mistakeTriggerCount,
          summonLabel: data.mascot.summonLabel, // {hu, en, ro}
          idlePrompt: data.mascot.idlePrompt, // {hu, en, ro}
          mistakePrompt: data.mascot.mistakePrompt, // {hu, en, ro}
          welcomeMessages: data.mascot.welcomeMessages?.map((msg: AIMascotMessage) => ({
            text: msg.text, // {hu, en, ro}
          })),
          overconfidentMessages: data.mascot.overconfidentMessages?.map((msg: AIMascotMessage) => ({
            text: msg.text, // {hu, en, ro}
          })),
          streakMessages: data.mascot.streakMessages?.map((msg: AIMascotMessage) => ({
            text: msg.text, // {hu, en, ro}
          })),
        };
      }

      // Phases — all localized fields stay as {hu, en, ro} objects
      if (Array.isArray(data.phases)) {
        result.phases = data.phases.map((phase: AIPhase) => ({
          phaseId: phase.phaseId,
          title: phase.title, // {hu, en, ro}
          sourceAlgorithmId: phase.sourceAlgorithmId,
          sourceView: phase.sourceView,
          summary: phase.summary, // {hu, en, ro}
          mascotLine: phase.mascotLine, // {hu, en, ro}
          mascotMistakeLine: phase.mascotMistakeLine, // {hu, en, ro}
          hintCopy: phase.hintCopy, // {hu, en, ro}
          idleHelp: phase.idleHelp, // {hu, en, ro}
          askConfidence: phase.askConfidence ?? true,
          maxPoints: phase.maxPoints ?? 10,
          infoContent: phase.infoContent, // {hu: LexicalObj, en: LexicalObj, ro: LexicalObj}
          customVideoId: phase.customVideoId,
          quiz: phase.quiz?.map((q: AIQuizItem) => ({
            question: q.question, // {hu, en, ro}
            options: q.options?.map((o: AIQuizOption) => ({
              option: o.option, // {hu, en, ro}
            })),
            correctIndex: q.correctIndex,
            explanation: q.explanation, // {hu, en, ro}
          })),
          matching: phase.matching?.map((m: AIMatchingItem) => ({
            left: m.left, // {hu, en, ro}
            right: m.right, // {hu, en, ro}
          })),
          ordering: phase.ordering?.map((o: AIOrderingItem) => ({
            text: o.text, // {hu, en, ro}
          })),
          debugCode: phase.debugCode,
          expectedCode: phase.expectedCode,
          gapFillContent: phase.gapFillContent, // {hu, en, ro}
          gapFillOptions: phase.gapFillOptions?.map((g: AIGapFillOption) => ({
            option: g.option, // {hu, en, ro}
          })),
          gapFillSolutions: phase.gapFillSolutions?.map((s: AIGapFillSolution) => ({
            solution: s.solution, // {hu, en, ro}
          })),
        }));
      }

      return result;
    };

    const payloadData = buildLocalizedPayload(courseData);

    try {
      // Use locale: 'all' to save all 3 locales in a single create call
      // This avoids the complex extractLocale logic and array id issues
      const created = await payload.create({
        collection: 'courses',
        data: payloadData as unknown as Course,
        locale: 'all' as 'hu',
      });

      console.log(
        `[AI Course Generation] === Course saved successfully with locale: 'all'! ID: ${created.id} ===`,
      );
      return NextResponse.json({
        success: true,
        courseId: created.id,
        slug: courseData.slug,
      });
    } catch (saveError: unknown) {
      console.error('[AI Course Generation] Payload save error:', saveError);
      // If save fails (e.g. duplicate slug), still return the generated data
      // so the user can manually adjust and save
      const saveMsg = saveError instanceof Error ? saveError.message : String(saveError);
      return NextResponse.json({
        success: false,
        saveError: saveMsg,
        generatedData: courseData,
      });
    }
  } catch (err: unknown) {
    console.error('[GenerateCourse API Exception]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Internal Server Error: ${msg}` }, { status: 500 });
  }
}
