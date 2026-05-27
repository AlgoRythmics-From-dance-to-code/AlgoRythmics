import { NextRequest, NextResponse } from 'next/server';
import { getPayloadInstance } from '../../../../lib/payload';
import { headers as getHeaders } from 'next/headers';
import { markdownToLexical } from '@/lib/courses/lexicalConverter';

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
    estimatedMinutes: { type: 'integer', description: 'Estimated minutes to complete' },
    difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
    mascot: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        name: localizedStringSchema,
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
    'estimatedMinutes',
    'difficulty',
    'mascot',
    'phases',
  ],
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize user (admin or editor roles only)
    const payload = await getPayloadInstance();
    const headers = await getHeaders();
    const { user } = await payload.auth({ headers });

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request parameters
    const { prompt, model } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const activeModel = model || 'google/gemini-2.5-flash';

    // 3. Verify OpenRouter API Key exists
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENROUTER_API_KEY is not configured in the environment. Please add it to your .env file.',
        },
        { status: 500 },
      );
    }

    // 4. Construct prompt instructions
    const promptText = `
You are an expert curriculum developer and computer science educator. 
Your goal is to generate a comprehensive, high-quality programming/algorithm course blueprint based on the user's prompt.

The prompt contains a general description of the course and a step-by-step description of the planned learning phases.

Course Outline and Plan:
${prompt}

CRITICAL REQUIREMENT:
1. You MUST generate ALL localized text fields in all three supported languages: Hungarian ("hu"), English ("en"), and Romanian ("ro").
2. Every field defined as an object containing "hu", "en", and "ro" properties MUST have high-quality, pedagogically accurate translations in all three languages. Do not use English in place of Hungarian or Romanian.
3. Choose a difficulty level and estimated duration that makes sense for the content.
4. Set up the mascot settings with name and relevant welcome/idle/mistake messages matching the target languages.
5. Create learning phases matching the planned steps provided in the prompt. If a planned step is marked as [EMPTY - AI must invent...], you must creatively design a unique, interactive learning task (such as a gap-fill, debugging exercise, ordering, or quiz) that logically fits in that position of the course curriculum.
6. The 'sourceAlgorithmId' for each phase must match the main algorithm slug (e.g., 'selection-sort' or 'bubble-sort').
7. Use diverse 'sourceView' types across phases. Here are the available types and their required parameters:
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
`;

    // 5. Call OpenRouter API with structured response schema
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          {
            role: 'system',
            content: `You are an expert curriculum developer. You must return valid JSON matching the following schema. You MUST generate high-quality translations for all three languages ("hu", "en", "ro") for all localized properties. Do not include markdown codeblocks or conversational text, just raw JSON:\n${JSON.stringify(openRouterSchema)}`,
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'course_blueprint',
            schema: openRouterSchema,
          },
        },
      }),
    });

    // Fallback if structured json_schema is not supported by the selected model
    if (!response.ok) {
      console.warn(
        '[OpenRouter] Primary structured schema call failed, attempting fallback to json_object...',
      );
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
            {
              role: 'system',
              content: `You are an expert curriculum developer. You must return valid JSON matching the following schema. You MUST generate high-quality translations for all three languages ("hu", "en", "ro") for all localized properties. Do not include markdown codeblocks or conversational text, just raw JSON:\n${JSON.stringify(openRouterSchema)}`,
            },
            {
              role: 'user',
              content: promptText,
            },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
      });
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
    if (!generatedText) {
      return NextResponse.json(
        { error: 'No content received from OpenRouter API model' },
        { status: 502 },
      );
    }

    // Extract JSON in case the model wrapped it in markdown codeblocks
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```')) {
      const match = jsonText.match(/```(?:json)?([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      }
    }

    // 6. Return structured course JSON
    const courseData = JSON.parse(jsonText);

    // Convert infoContent Markdown string to Lexical JSON object for all locales
    if (courseData && Array.isArray(courseData.phases)) {
      for (const phase of courseData.phases) {
        if (phase.infoContent) {
          const info = phase.infoContent;
          if (typeof info === 'string') {
            phase.infoContent = {
              hu: markdownToLexical(info),
              en: markdownToLexical(info),
              ro: markdownToLexical(info),
            };
          } else if (typeof info === 'object') {
            phase.infoContent = {
              hu: typeof info.hu === 'string' ? markdownToLexical(info.hu) : info.hu,
              en: typeof info.en === 'string' ? markdownToLexical(info.en) : info.en,
              ro: typeof info.ro === 'string' ? markdownToLexical(info.ro) : info.ro,
            };
          }
        }
      }
    }

    return NextResponse.json(courseData);
  } catch (err: unknown) {
    console.error('[GenerateCourse API Exception]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Internal Server Error: ${msg}` }, { status: 500 });
  }
}
