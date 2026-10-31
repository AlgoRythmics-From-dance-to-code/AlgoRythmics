import { NextRequest, NextResponse } from 'next/server';
import { authorizeTeacherOrAdmin } from '@/lib/ai/aiAuthHelper';
import { callOpenRouterStructured } from '@/lib/ai/openRouterClient';

export const maxDuration = 60;

interface TranslationItem {
  key: string;
  hu: string;
  context?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeTeacherOrAdmin();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Teacher or Admin access required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { mode = 'translate', items = [], topic = '', mascotName = 'Bubi' } = body;

    if (mode === 'mascot') {
      // Generate mascot copy for course topic
      const mascotSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: { hu: { type: 'string' }, en: { type: 'string' }, ro: { type: 'string' } },
            required: ['hu', 'en', 'ro'],
          },
          summonLabel: {
            type: 'object',
            properties: { hu: { type: 'string' }, en: { type: 'string' }, ro: { type: 'string' } },
            required: ['hu', 'en', 'ro'],
          },
          idlePrompt: {
            type: 'object',
            properties: { hu: { type: 'string' }, en: { type: 'string' }, ro: { type: 'string' } },
            required: ['hu', 'en', 'ro'],
          },
          mistakePrompt: {
            type: 'object',
            properties: { hu: { type: 'string' }, en: { type: 'string' }, ro: { type: 'string' } },
            required: ['hu', 'en', 'ro'],
          },
          welcomeMessages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'object',
                  properties: {
                    hu: { type: 'string' },
                    en: { type: 'string' },
                    ro: { type: 'string' },
                  },
                  required: ['hu', 'en', 'ro'],
                },
              },
              required: ['text'],
            },
          },
          overconfidentMessages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'object',
                  properties: {
                    hu: { type: 'string' },
                    en: { type: 'string' },
                    ro: { type: 'string' },
                  },
                  required: ['hu', 'en', 'ro'],
                },
              },
              required: ['text'],
            },
          },
          streakMessages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'object',
                  properties: {
                    hu: { type: 'string' },
                    en: { type: 'string' },
                    ro: { type: 'string' },
                  },
                  required: ['hu', 'en', 'ro'],
                },
              },
              required: ['text'],
            },
          },
        },
        required: [
          'name',
          'summonLabel',
          'idlePrompt',
          'mistakePrompt',
          'welcomeMessages',
          'overconfidentMessages',
          'streakMessages',
        ],
      };

      const systemPrompt = `You are an educational assistant and mascot copywriter for AlgoRythmics, an interactive learning platform.
The mascot's name is "${mascotName}". You write cheerful, friendly, empathetic, pedagogically sound messages for students learning about "${topic || 'computer science and programming'}".
You MUST generate all messages natively in Hungarian (hu), English (en), and Romanian (ro).
Generate 2-3 welcome messages, 2-3 overconfident mistake messages (kind but guiding), and 2-3 streak celebration messages.`;

      const userPrompt = `Generate mascot configuration copy for topic: "${topic || 'Általános ismeretek'}". Mascot name: "${mascotName}".`;

      const { data } = await callOpenRouterStructured<{
        name: { hu: string; en: string; ro: string };
        summonLabel: { hu: string; en: string; ro: string };
        idlePrompt: { hu: string; en: string; ro: string };
        mistakePrompt: { hu: string; en: string; ro: string };
        welcomeMessages: Array<{ text: { hu: string; en: string; ro: string } }>;
        overconfidentMessages: Array<{ text: { hu: string; en: string; ro: string } }>;
        streakMessages: Array<{ text: { hu: string; en: string; ro: string } }>;
      }>({
        systemPrompt,
        userPrompt,
        schema: mascotSchema,
        schemaName: 'mascotCopyGeneration',
        timeoutMs: 45_000,
      });

      return NextResponse.json({ success: true, mascot: data });
    }

    // Default: Translation mode
    const itemsList = (Array.isArray(items) ? items : []).filter(
      (it: TranslationItem) => it && typeof it.hu === 'string' && it.hu.trim().length > 0,
    );

    if (itemsList.length === 0) {
      return NextResponse.json({ success: true, translations: [] });
    }

    const translationSchema = {
      type: 'object',
      properties: {
        translations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              en: { type: 'string', description: 'Accurate English translation' },
              ro: { type: 'string', description: 'Accurate Romanian translation' },
            },
            required: ['key', 'en', 'ro'],
          },
        },
      },
      required: ['translations'],
    };

    const systemPrompt = `You are a professional educational translator.
Translate each educational text item from Hungarian to natural, accurate English ('en') and Romanian ('ro').
CRITICAL RULES:
1. Preserve markdown syntax (e.g. ## headings, **bold**, *italic*, \`code\`, \`\`\`code blocks\`\`\`, bullet points, numbering) exactly as in the Hungarian source.
2. If text contains placeholder tokens like {{gap}} or special variables, PRESERVE them unchanged.
3. Use natural terminology appropriate for computer science and interactive education.
4. Each item in 'translations' must correspond to the requested 'key'.`;

    const userPrompt =
      `Translate the following ${itemsList.length} items from Hungarian to English and Romanian:\n` +
      JSON.stringify(itemsList, null, 2);

    const { data } = await callOpenRouterStructured<{
      translations: Array<{ key: string; en: string; ro: string }>;
    }>({
      systemPrompt,
      userPrompt,
      schema: translationSchema,
      schemaName: 'educationalTranslationBatch',
      timeoutMs: 60_000,
    });

    return NextResponse.json({ success: true, translations: data.translations || [] });
  } catch (error) {
    console.error('[AI Translation Route Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
