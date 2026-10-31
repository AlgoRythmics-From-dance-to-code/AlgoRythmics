import { NextRequest, NextResponse } from 'next/server';
import { authorizeAuthenticatedUser } from '@/lib/ai/aiAuthHelper';
import { callOpenRouterStructured, type OpenRouterMessage } from '@/lib/ai/openRouterClient';
import { buildUserLearningDossier } from '@/lib/ai/mascotContextBuilder';
import { getPayloadInstance } from '@/lib/payload';

export const maxDuration = 45;

const mascotResponseSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description:
        'Warm, encouraging, direct mentorship text from the mascot in the student’s language. Be concise (1-3 sentences max).',
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
            description:
              'Optional 1-3 word mini hint badge above the element, e.g. "Nézd itt!" or "Ciklushatár?"',
          },
        },
        required: ['targetAnchor', 'effect'],
      },
      description: 'Visual UI annotations pointing to specific elements on the student’s screen',
    },
    quickReplies: {
      type: 'array',
      items: { type: 'string' },
      description:
        '2-3 short, relevant contextual follow-up question chips for the student to ask next',
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

// In-memory rate limiter per user (max 25 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS = 25;

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

    // Load course data to know the exact phase, solution, and mascot config
    const payload = await getPayloadInstance();
    const courseRes = await payload.find({
      collection: 'courses',
      where: { slug: { equals: courseSlug } },
      limit: 1,
      depth: 0,
      locale: locale as 'all' | 'en' | 'hu' | 'ro',
    });

    const courseDoc = courseRes.docs?.[0] as unknown as Record<string, unknown> | undefined;
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

    // Build rich user dossier
    const dossier = await buildUserLearningDossier(user.id, courseSlug, phaseId, sourceAlgorithmId);

    // Filter available anchors from screen
    const availableAnchors = Array.isArray(screenSnapshot.availableAnchors)
      ? (screenSnapshot.availableAnchors as string[])
      : [];

    // System prompt with Socratic spoiler protection and personality
    const systemPrompt = `You are "${mascotName}", the intelligent, friendly, and encouraging AI mascot guide of AlgoRythmics.
Your role is to guide the student (${dossier.identity.firstName}) step-by-step through their interactive course.

LANGUAGE RULE:
You MUST respond strictly in the requested language: "${locale === 'en' ? 'English' : locale === 'ro' ? 'Romanian' : 'Hungarian'}".

PEDAGOGICAL & SOCRATIC RULES:
1. NEVER directly blur out the raw solution (e.g. do NOT say "The answer is option B" or "Type 42 in the blank").
2. Instead, guide the student with a smart, inspiring hint or thought-provoking question that prompts them to notice the pattern.
3. If the student has had 3+ mistakes on this step, you can be significantly more specific and provide a clear hint pointing directly to the exact element.
4. Keep your speech concise and conversational: 1 to 3 punchy sentences. No long lectures.
5. You can point to and highlight elements on the student's screen! When pointing to an element, choose ONLY from the "AVAILABLE_ANCHORS" list.
   - Use 'frame' to box an option, button, or container.
   - Use 'underline' to underline a specific line of code or text.
   - Use 'pointer' to draw a directional guiding arrow towards an input, slider, or button.
   - Use 'pulse' to highlight a hint or submit button.

LEARNER PROFILE CONTEXT:
- Name: ${dossier.identity.name}
- Total Points: ${dossier.globalStats.totalPoints} pts
- Streak: ${dossier.globalStats.currentStreak} (Longest: ${dossier.globalStats.longestStreak})
- Average Accuracy: ${dossier.globalStats.averageScore}%
- Badges: ${dossier.globalStats.badges.map((b) => b.id).join(', ') || 'Keletkező bajnok'}
- Current Course Progress: Phase ${dossier.currentCourseState.activePhaseIndex + 1} of ${phases.length}
- CBL Confidence Stats: ${dossier.currentCourseState.confidenceSummary?.masteryCount || 0} Mastery, ${dossier.currentCourseState.confidenceSummary?.misconceptionCount || 0} Misconceptions.

CURRENT PHASE CONTEXT:
- Phase Title: "${currentPhase?.title || ''}"
- Phase Type (sourceView): "${currentPhase?.sourceView || ''}"
- Phase Goal / Summary: "${currentPhase?.summary || ''}"
- Manual Phase Hint: "${currentPhase?.hintCopy || ''}"
${
  currentPhase?.quiz
    ? `- Quiz Question: "${(currentPhase.quiz as Array<Record<string, unknown>>)[0]?.question || ''}"
- Options: ${JSON.stringify((currentPhase.quiz as Array<Record<string, unknown>>)[0]?.options)}
- Correct Index: ${(currentPhase.quiz as Array<Record<string, unknown>>)[0]?.correctIndex}
- Explanation: "${(currentPhase.quiz as Array<Record<string, unknown>>)[0]?.explanation || ''}"`
    : ''
}
${
  currentPhase?.debugCode
    ? `- Debug Code:
${currentPhase.debugCode}
- Expected Code:
${currentPhase.expectedCode}`
    : ''
}
${
  currentPhase?.gapFillContent
    ? `- Gap Fill Text: "${currentPhase.gapFillContent}"
- Solutions: ${JSON.stringify(currentPhase.gapFillSolutions)}`
    : ''
}

LIVE SCREEN STATE (What the student is seeing/interacting with right now):
- Screen View: "${screenSnapshot.sourceView || currentPhase?.sourceView || 'general'}"
- Available Anchors currently visible on DOM: ${JSON.stringify(availableAnchors)}
- Student's current action/draft: ${JSON.stringify(screenSnapshot.currentSelection || null)}
- Phase complete flag: ${Boolean(screenSnapshot.isComplete)}

TRIGGER REASON: "${trigger}"
${userQuery ? `STUDENT ASKED: "${userQuery}"` : ''}
`;

    // Construct conversation messages
    const messages: OpenRouterMessage[] = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      chatHistory.slice(-4).forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content) });
        }
      });
    }

    if (userQuery) {
      messages.push({
        role: 'user',
        content: `Student Question: "${userQuery}". Respond as ${mascotName}, indicating any relevant UI element to highlight from the available anchors.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `The trigger "${trigger}" occurred on screen for phase "${currentPhase?.title}". Give a proactive, helpful mentoring line and point to relevant elements if appropriate.`,
      });
    }

    const { data: aiResponse } = await callOpenRouterStructured<MascotAIResponse>({
      messages,
      schema: mascotResponseSchema,
      schemaName: 'mascot_ai_response',
      timeoutMs: 25_000,
      disableReasoning: true,
      maxTokens: 450,
      temperature: 0.35,
    });

    // Sanitize annotations so they only target anchors genuinely present on the client screen
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
        quickReplies: aiResponse.quickReplies || [],
      },
    });
  } catch (error) {
    console.error('[Mascot API Route Error]:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
