import { NextRequest, NextResponse } from 'next/server';
import { authorizeTeacherOrAdmin } from '@/lib/ai/aiAuthHelper';
import {
  callOpenRouterStructured,
  localizedStringSchema,
  sanitizeLocalizedField,
  LocalizedField,
} from '@/lib/ai/openRouterClient';

export const maxDuration = 60;

const outlineSchema = {
  type: 'object',
  properties: {
    title: localizedStringSchema,
    slug: {
      type: 'string',
      description: 'URL slug for the course in lowercase kebab-case, e.g. selection-sort-basics',
    },
    summary: localizedStringSchema,
    heroTagline: localizedStringSchema,
    icon: {
      type: 'string',
      description: 'A single, relevant emoji for the course card, e.g. 🧠, 💻, 📊, 🔍, ⚡',
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
        accentColor: { type: 'string' },
        idleTriggerSeconds: { type: 'integer' },
        mistakeTriggerCount: { type: 'integer' },
        summonLabel: localizedStringSchema,
        idlePrompt: localizedStringSchema,
        mistakePrompt: localizedStringSchema,
        welcomeMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: { text: localizedStringSchema },
            required: ['text'],
          },
        },
        overconfidentMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: { text: localizedStringSchema },
            required: ['text'],
          },
        },
        streakMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: { text: localizedStringSchema },
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
          maxPoints: { type: 'integer' },
        },
        required: ['phaseId', 'title', 'sourceAlgorithmId', 'sourceView', 'summary'],
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

interface AIOutlineRaw {
  title: LocalizedField;
  slug: string;
  summary: LocalizedField;
  heroTagline: LocalizedField;
  icon?: string;
  accentColor?: string;
  illustrationAsset?: string;
  estimatedMinutes?: number;
  difficulty?: string;
  mascot?: {
    enabled?: boolean;
    name: LocalizedField;
    asset?: string;
    accentColor?: string;
    idleTriggerSeconds?: number;
    mistakeTriggerCount?: number;
    summonLabel: LocalizedField;
    idlePrompt: LocalizedField;
    mistakePrompt: LocalizedField;
    welcomeMessages?: Array<{ text: LocalizedField }>;
    overconfidentMessages?: Array<{ text: LocalizedField }>;
    streakMessages?: Array<{ text: LocalizedField }>;
  };
  phases: Array<{
    phaseId: string;
    title: LocalizedField;
    sourceAlgorithmId: string;
    sourceView: string;
    summary: LocalizedField;
    maxPoints?: number;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeTeacherOrAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, difficulty = 'Beginner', phasesCount = 5, customInstruction, model } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Kérjük, adj meg egy algoritmus vagy programozási témakört!' },
        { status: 400 },
      );
    }

    const safeCount = Math.max(3, Math.min(8, Number(phasesCount) || 5));

    const systemPrompt = `You are an expert curriculum developer and computer science educator.
Generate an engaging, pedagogically structured algorithm course blueprint and outline.
You MUST provide high-quality localized translations for all 3 languages: Hungarian ("hu"), English ("en"), and Romanian ("ro").
Never output empty translations or English text inside Hungarian or Romanian fields.`;

    const userPrompt = `
Topic: "${topic.trim()}"
Target difficulty level: ${difficulty}
Number of learning phases to plan: exactly ${safeCount} steps.
${customInstruction ? `Special teacher instructions for this course outline: "${customInstruction}"` : ''}

Plan a logical educational progression:
1. Start with an intuitive real-world introduction or video concept.
2. Follow with visual interactive simulation or step-by-step control.
3. Progress to quizzes, code debugging, gap-fill, or ordering exercises to test understanding.
4. Conclude with a challenge or synthesis.

Diversity of phase views to choose from: 'video', 'control', 'quiz', 'gap-fill', 'debug', 'match', 'order', 'info', 'animation', 'alive'.
Ensure the 'sourceAlgorithmId' logically fits the algorithm (e.g. 'insertion-sort', 'binary-search', 'bubble-sort', 'linear-search', etc.).
`;

    const { data: rawOutline, modelUsed } = await callOpenRouterStructured<AIOutlineRaw>({
      model,
      systemPrompt,
      userPrompt,
      schema: outlineSchema,
      schemaName: 'course_outline_blueprint',
      timeoutMs: 60_000,
    });

    // Sanitize localized fields
    const sanitizedCourse = {
      title: sanitizeLocalizedField(rawOutline.title, topic.trim()),
      slug: (rawOutline.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase(),
      summary: sanitizeLocalizedField(rawOutline.summary, `${topic} interaktív tanfolyam`),
      heroTagline: sanitizeLocalizedField(
        rawOutline.heroTagline,
        'Sajátítsd el az algoritmust lépésről lépésre!',
      ),
      icon: rawOutline.icon || '📘',
      accentColor: rawOutline.accentColor || '#269984',
      illustrationAsset: rawOutline.illustrationAsset || 'algo_group_109.svg',
      estimatedMinutes: rawOutline.estimatedMinutes || safeCount * 5,
      difficulty: rawOutline.difficulty || difficulty,
      mascot: rawOutline.mascot
        ? {
            enabled: rawOutline.mascot.enabled ?? true,
            name: sanitizeLocalizedField(rawOutline.mascot.name, 'Bubi'),
            asset: rawOutline.mascot.asset || 'algo_group_109.svg',
            accentColor: rawOutline.mascot.accentColor || '#269984',
            idleTriggerSeconds: rawOutline.mascot.idleTriggerSeconds || 30,
            mistakeTriggerCount: rawOutline.mascot.mistakeTriggerCount || 2,
            summonLabel: sanitizeLocalizedField(rawOutline.mascot.summonLabel, 'Segítség'),
            idlePrompt: sanitizeLocalizedField(
              rawOutline.mascot.idlePrompt,
              'Segíthetek a következő lépésben?',
            ),
            mistakePrompt: sanitizeLocalizedField(
              rawOutline.mascot.mistakePrompt,
              'Ne aggódj a hibák miatt, próbáld újra!',
            ),
            welcomeMessages: (rawOutline.mascot.welcomeMessages || []).map((m) => ({
              text: sanitizeLocalizedField(m.text, 'Üdvözöllek!'),
            })),
            overconfidentMessages: (rawOutline.mascot.overconfidentMessages || []).map((m) => ({
              text: sanitizeLocalizedField(m.text, 'Figyelj oda a részletekre!'),
            })),
            streakMessages: (rawOutline.mascot.streakMessages || []).map((m) => ({
              text: sanitizeLocalizedField(m.text, 'Kiváló munka!'),
            })),
          }
        : undefined,
      phases: (rawOutline.phases || []).map((p, idx) => ({
        phaseId: p.phaseId || `phase-${idx + 1}`,
        title: sanitizeLocalizedField(p.title, `${idx + 1}. Lépés`),
        sourceAlgorithmId: p.sourceAlgorithmId || 'bubble-sort',
        sourceView: p.sourceView || 'control',
        summary: sanitizeLocalizedField(p.summary, ''),
        maxPoints: Number(p.maxPoints) || 10,
        isGenerated: false, // Indicates detailed content is pending
      })),
    };

    return NextResponse.json({
      success: true,
      course: sanitizedCourse,
      modelUsed,
    });
  } catch (error) {
    console.error('[GenerateOutline API Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
