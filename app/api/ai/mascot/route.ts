import { NextRequest, NextResponse } from 'next/server';
import { authorizeAuthenticatedUser } from '@/lib/ai/aiAuthHelper';
import { callOpenRouterStructured, type OpenRouterMessage } from '@/lib/ai/openRouterClient';
import { buildUserLearningDossier } from '@/lib/ai/mascotContextBuilder';
import { getPayloadInstance } from '@/lib/payload';

export const maxDuration = 30;

const mascotResponseSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description:
        'Warm, encouraging, direct mentorship text from the mascot in the student’s language. Be concise (1-2 sentences max).',
    },
    mood: {
      type: 'string',
      enum: ['neutral', 'welcome', 'idle', 'mistake', 'pointing', 'streak', 'celebrate'],
      description: 'The visual expression / mood of the mascot character',
    },
    annotations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          targetAnchor: {
            type: 'string',
            description:
              'The exact anchor ID to fly to and highlight. MUST ONLY be chosen from the provided availableAnchors list.',
          },
          effect: {
            type: 'string',
            enum: ['frame', 'underline', 'pointer', 'pulse'],
            description:
              'Visual effect: frame (box around element), underline (line under text/code), pointer (directional pointing arrow), pulse (attention ping)',
          },
          badgeText: {
            type: 'string',
            description: 'Optional 1-3 word mini hint badge above the element, e.g. "Nézd itt!"',
          },
        },
        required: ['targetAnchor', 'effect'],
      },
      description: 'Visual UI annotations pointing to specific elements on the student’s screen',
    },
    quickReplies: {
      type: 'array',
      items: { type: 'string' },
      description: '2 short, relevant follow-up question chips for the student',
    },
  },
  required: ['message', 'mood', 'annotations', 'quickReplies'],
};

export interface MascotAIResponse {
  message: string;
  mood: 'neutral' | 'welcome' | 'idle' | 'mistake' | 'pointing' | 'streak' | 'celebrate';
  annotations: Array<{
    targetAnchor: string;
    effect: 'frame' | 'underline' | 'pointer' | 'pulse';
    badgeText?: string;
  }>;
  quickReplies: string[];
}

// In-memory course cache for mascot to avoid hitting Postgres on every single message
const courseDocCache = new Map<string, { doc: Record<string, unknown>; expiresAt: number }>();
const COURSE_CACHE_TTL = 60_000; // 60s

// In-memory rate limiter per user (max 30 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS = 30;

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const userIdKey = String(user.id);
    const now = Date.now();
    const rateData = rateLimitMap.get(userIdKey);
    if (rateData && rateData.resetAt > now) {
      if (rateData.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: 'Kérlek várj egy pillanatot a következő kérdés előtt (sebességkorlát).' },
          { status: 429 },
        );
      }
      rateData.count += 1;
    } else {
      rateLimitMap.set(userIdKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    const body = await req.json();
    const {
      courseSlug,
      phaseId,
      trigger = 'question',
      userQuery,
      chatHistory = [],
      locale = 'hu',
      screenSnapshot = {},
    } = body;

    if (!courseSlug) {
      return NextResponse.json({ error: 'courseSlug is required' }, { status: 400 });
    }

    // Load course data (cached for 60s for speed)
    const cacheKey = `${courseSlug}:${locale}`;
    let courseDoc: Record<string, unknown> | undefined;
    const cachedCourse = courseDocCache.get(cacheKey);

    if (cachedCourse && cachedCourse.expiresAt > now) {
      courseDoc = cachedCourse.doc;
    } else {
      const payload = await getPayloadInstance();
      const courseRes = await payload.find({
        collection: 'courses',
        where: { slug: { equals: courseSlug } },
        limit: 1,
        depth: 0,
        locale: locale as 'all' | 'en' | 'hu' | 'ro',
      });
      courseDoc = courseRes.docs?.[0] as unknown as Record<string, unknown> | undefined;
      if (courseDoc) {
        courseDocCache.set(cacheKey, { doc: courseDoc, expiresAt: now + COURSE_CACHE_TTL });
      }
    }

    if (!courseDoc) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const phases = (courseDoc.phases || []) as Array<Record<string, unknown>>;
    const currentPhase =
      phases.find((p) => p.phaseId === phaseId) ||
      phases[Number(courseDoc.activePhaseIndex) || 0] ||
      phases[0];

    const sourceAlgorithmId = (currentPhase?.sourceAlgorithmId as string) || 'bubble-sort';
    const mascotConfig = (courseDoc.mascot || {}) as Record<string, unknown>;
    const mascotName =
      (typeof mascotConfig.name === 'object' && mascotConfig.name !== null
        ? (mascotConfig.name as Record<string, string>)[locale]
        : String(mascotConfig.name || 'Bubi')) || 'Bubi';

    // Build user dossier (cached for 40s in mascotContextBuilder)
    const dossier = await buildUserLearningDossier(user.id, courseSlug, phaseId, sourceAlgorithmId);

    // Filter available anchors from screen
    const availableAnchors = Array.isArray(screenSnapshot.availableAnchors)
      ? (screenSnapshot.availableAnchors as string[])
      : [];

    const targetLang = locale === 'en' ? 'English' : locale === 'ro' ? 'Romanian' : 'Hungarian';

    // Streamlined, token-efficient system prompt for rapid Time-To-First-Token (TTFT)
    const systemPrompt = `You are "${mascotName}", the friendly AI mascot guide in AlgoRythmics.
Role: Help student ${dossier.identity.firstName} solve this step.
LANGUAGE: Respond strictly in ${targetLang}.

RULES:
1. NEVER reveal the exact answer directly. Give a Socratic hint or guiding clue.
2. If student has 3+ mistakes, you can point directly to the exact element.
3. Keep response very short and punchy: 1 to 2 sentences max.
4. Pointing: Select targetAnchor ONLY from AVAILABLE_ANCHORS list.
   - effect: 'frame' (boxes), 'underline' (code/text), 'pointer' (inputs/buttons), 'pulse' (hint/submit).

STUDENT STATE:
- Streak: ${dossier.globalStats.currentStreak} | Points: ${dossier.globalStats.totalPoints} | Step: Phase ${dossier.currentCourseState.activePhaseIndex + 1}/${phases.length}

CURRENT STEP:
- Title: "${currentPhase?.title || ''}" (${currentPhase?.sourceView || ''})
- Goal: "${currentPhase?.summary || ''}"
${currentPhase?.hintCopy ? `- Hint: "${currentPhase.hintCopy}"` : ''}
${
  currentPhase?.quiz
    ? `- Quiz Question: "${(currentPhase.quiz as Array<Record<string, unknown>>)[0]?.question || ''}"
- Correct Index: ${(currentPhase.quiz as Array<Record<string, unknown>>)[0]?.correctIndex}`
    : ''
}
${
  currentPhase?.gapFillContent
    ? `- GapFill: "${String(currentPhase.gapFillContent).slice(0, 200)}"
- Solutions: ${JSON.stringify(currentPhase.gapFillSolutions)}`
    : ''
}

SCREEN:
- View: "${screenSnapshot.sourceView || currentPhase?.sourceView || 'general'}"
- Available Anchors: ${JSON.stringify(availableAnchors)}
- Draft: ${JSON.stringify(screenSnapshot.currentSelection || null)}`;

    // Construct conversation messages (keep only last 2 turns to minimize latency)
    const messages: OpenRouterMessage[] = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      chatHistory.slice(-2).forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content) });
        }
      });
    }

    if (userQuery) {
      messages.push({
        role: 'user',
        content: `Student: "${userQuery}". Give a 1-2 sentence guiding reply and point to relevant anchors if helpful.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `Trigger: "${trigger}". Give an encouraging 1-sentence tip and point to relevant anchors if helpful.`,
      });
    }

    // Call OpenRouter with high throughput, no reasoning, and low maxTokens for maximum speed
    const { data: aiResponse } = await callOpenRouterStructured<MascotAIResponse>({
      messages,
      schema: mascotResponseSchema,
      schemaName: 'mascot_ai_response',
      timeoutMs: 15_000,
      disableReasoning: true,
      maxTokens: 180,
      temperature: 0.25,
    });

    // Sanitize annotations to only valid client screen anchors
    const validAnnotations = (aiResponse.annotations || []).filter(
      (a) =>
        a.targetAnchor &&
        (availableAnchors.length === 0 || availableAnchors.includes(a.targetAnchor)),
    );

    return NextResponse.json({
      success: true,
      mascot: {
        name: mascotName,
        message: aiResponse.message,
        mood: aiResponse.mood || 'pointing',
        annotations: validAnnotations,
        quickReplies: (aiResponse.quickReplies || []).slice(0, 2),
      },
    });
  } catch (error) {
    console.error('[Mascot API Route Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
