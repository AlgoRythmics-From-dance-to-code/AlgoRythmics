import { NextRequest, NextResponse } from 'next/server';
import { authorizeAuthenticatedUser } from '@/lib/ai/aiAuthHelper';
import { callOpenRouterStructured, type OpenRouterMessage } from '@/lib/ai/openRouterClient';
import { getOpenRouterConfig } from '@/lib/ai/aiSettingsHelper';
import { buildUserLearningDossier } from '@/lib/ai/mascotContextBuilder';
import { getPayloadInstance } from '@/lib/payload';
import { ROLES } from '@/lib/constants';

export const maxDuration = 30;

const mascotResponseSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description: '1-2 sentence guiding hint in Target Language.',
    },
    mood: {
      type: 'string',
      enum: ['neutral', 'welcome', 'idle', 'mistake', 'pointing', 'streak', 'celebrate'],
    },
    annotations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          targetAnchor: {
            type: 'string',
            description: 'Must be from availableAnchors.',
          },
          effect: {
            type: 'string',
            enum: ['frame', 'underline', 'pointer', 'pulse'],
          },
          badgeText: {
            type: 'string',
          },
        },
        required: ['targetAnchor', 'effect'],
      },
    },
    quickReplies: {
      type: 'array',
      items: { type: 'string' },
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

// ── 1. Static, Cache-Friendly System Prompt (Prompt Caching enabled across all requests) ──
const STATIC_MASCOT_SYSTEM_PROMPT = `You are the friendly AI mascot guide and pedagogical tutor in AlgoRythmics.
Role: Help the student understand algorithmic concepts and solve exercises step-by-step.

CORE RULES:
1. Socratic method: NEVER reveal the full answer directly. Provide an intuitive hint, guiding clue, or thought-provoking question.
2. Only answer questions related to algorithms, programming, computer science, or the current exercise. Politely redirect off-topic queries back to the lesson.
3. If student has repeated mistakes, point directly to the relevant UI element to examine.
4. Brevity: Keep response very short and punchy: 1 to 2 sentences max.
5. UI Annotations: If pointing to an element, select targetAnchor strictly from the provided availableAnchors list.
   - effect: 'frame' (boxes), 'underline' (code/text), 'pointer' (inputs/buttons), 'pulse' (hint/submit).
6. Always respond strictly in the specified Target Language.`;

// In-memory course cache for mascot to avoid hitting Postgres on every single message
const courseDocCache = new Map<string, { doc: Record<string, unknown>; expiresAt: number }>();
const COURSE_CACHE_TTL = 60_000; // 60s
const MAX_COURSE_CACHE_ENTRIES = 100;

// In-memory burst rate limiter per user (max 20 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS_PER_MIN = 20;
const MAX_RATE_LIMIT_ENTRIES = 5000;

// Multi-layer anti-abuse trackers (cooldown, per-phase question count, daily user quota)
const lastQuestionTimestampMap = new Map<string, number>();
const phaseQuestionCountMap = new Map<string, { count: number; expiresAt: number }>();
const dailyUserQuotaMap = new Map<string, { count: number; dayKey: string }>();
const MAX_QUERY_CHARS = 200;

// Semantic response cache: caches identical (courseSlug, phaseId, locale, trigger, normalizedQuery, selectionHash) for 30 min (0 tokens!)
const mascotResponseCache = new Map<string, { response: MascotAIResponse; expiresAt: number }>();
const RESPONSE_CACHE_TTL = 30 * 60_000; // 30 minutes
const MAX_RESPONSE_CACHE_ENTRIES = 500;

function setMascotResponseCache(key: string, response: MascotAIResponse) {
  const now = Date.now();
  if (mascotResponseCache.size >= MAX_RESPONSE_CACHE_ENTRIES) {
    for (const [k, v] of mascotResponseCache.entries()) {
      if (v.expiresAt <= now) mascotResponseCache.delete(k);
    }
    if (mascotResponseCache.size >= MAX_RESPONSE_CACHE_ENTRIES) {
      const oldestKey = mascotResponseCache.keys().next().value;
      if (oldestKey !== undefined) mascotResponseCache.delete(oldestKey);
    }
  }
  mascotResponseCache.set(key, { response, expiresAt: now + RESPONSE_CACHE_TTL });
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function setCourseDocCache(
  key: string,
  value: { doc: Record<string, unknown>; expiresAt: number },
) {
  const now = Date.now();
  if (courseDocCache.size >= MAX_COURSE_CACHE_ENTRIES) {
    for (const [k, v] of courseDocCache.entries()) {
      if (v.expiresAt <= now) courseDocCache.delete(k);
    }
    if (courseDocCache.size >= MAX_COURSE_CACHE_ENTRIES) {
      const oldestKey = courseDocCache.keys().next().value;
      if (oldestKey !== undefined) courseDocCache.delete(oldestKey);
    }
  }
  courseDocCache.set(key, value);
}

function setRateLimitEntry(key: string, value: { count: number; resetAt: number }) {
  const now = Date.now();
  if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt <= now) rateLimitMap.delete(k);
    }
    if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimitMap.keys().next().value;
      if (oldestKey !== undefined) rateLimitMap.delete(oldestKey);
    }
  }
  rateLimitMap.set(key, value);
}

export async function POST(req: NextRequest) {
  try {
    // ── 0. Check Global AI Mascot Master Switch first (0 DB queries if cached, 0 tokens) ──
    const aiConfig = await getOpenRouterConfig();
    if (!aiConfig.mascotEnabled) {
      return NextResponse.json({
        success: false,
        globallyDisabled: true,
        fallback: true,
        error: 'AI Mascot is globally disabled by administrator.',
      });
    }

    const user = await authorizeAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIdKey = String(user.id);
    const now = Date.now();

    // 1. Burst rate limit check (per minute)
    const rateData = rateLimitMap.get(userIdKey);
    if (rateData && rateData.resetAt > now) {
      if (rateData.count >= MAX_REQUESTS_PER_MIN) {
        return NextResponse.json(
          {
            success: false,
            rateLimited: true,
            error: 'Kérlek várj egy pillanatot a következő kérdés előtt (sebességkorlát).',
          },
          { status: 429 },
        );
      }
      rateData.count += 1;
    } else {
      setRateLimitEntry(userIdKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
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

    const sanitizedUserQuery =
      typeof userQuery === 'string' ? userQuery.trim().slice(0, MAX_QUERY_CHARS) : '';
    const isDirectQuestion = trigger === 'question' || Boolean(sanitizedUserQuery);

    // ── 2. Multi-Layer Anti-Abuse Limits for Chat Questions ──
    if (isDirectQuestion) {
      // 2a. Cooldown between consecutive chat questions
      const cooldownMs = (aiConfig.mascotCooldownSeconds ?? 8) * 1000;
      const lastQuestionAt = lastQuestionTimestampMap.get(userIdKey) || 0;
      if (cooldownMs > 0 && now - lastQuestionAt < cooldownMs) {
        const remainingSec = Math.max(1, Math.ceil((cooldownMs - (now - lastQuestionAt)) / 1000));
        const cooldownMsg =
          locale === 'en'
            ? `Please wait ${remainingSec}s before asking your next question.`
            : locale === 'ro'
              ? `Te rugăm să aștepți ${remainingSec}s înainte de următoarea întrebare.`
              : `Kérlek várj még ${remainingSec} másodpercet a következő kérdés előtt!`;
        return NextResponse.json({
          success: false,
          rateLimited: true,
          cooldownRemainingSec: remainingSec,
          limitMessage: cooldownMsg,
        });
      }

      // 2b. Per-Phase Question Cap (prevents infinite chatting on a single step)
      const maxPerPhase = aiConfig.mascotMaxMessagesPerPhase || 5;
      const phaseKey = `${userIdKey}:${courseSlug}:${phaseId || 'default'}`;
      const existingPhaseCount = phaseQuestionCountMap.get(phaseKey);
      const currentPhaseQuestions =
        existingPhaseCount && existingPhaseCount.expiresAt > now ? existingPhaseCount.count : 0;

      if (currentPhaseQuestions >= maxPerPhase) {
        const phaseLimitMsg =
          locale === 'en'
            ? `You have reached the ${maxPerPhase}-question limit for this step. Try applying the hints above to solve the task!`
            : locale === 'ro'
              ? `Ai atins limita de ${maxPerPhase} întrebări pentru acest pas. Încearcă să aplici indiciile de mai sus!`
              : `Elérted az ehhez a lépéshez tartozó ${maxPerPhase} kérdéses limitet. Próbáld meg alkalmazni az eddigi tippeket a megoldáshoz!`;
        return NextResponse.json({
          success: false,
          fallback: true,
          limitReached: 'phase',
          limitMessage: phaseLimitMsg,
        });
      }

      // 2c. Daily Per-User AI Quota (prevents draining OpenRouter credits)
      const maxPerDay = aiConfig.mascotMaxMessagesPerDay || 30;
      const todayKey = getTodayKey();
      const userDaily = dailyUserQuotaMap.get(userIdKey);
      const currentDailyCount = userDaily && userDaily.dayKey === todayKey ? userDaily.count : 0;

      if (currentDailyCount >= maxPerDay) {
        const dailyLimitMsg =
          locale === 'en'
            ? `You have reached your daily AI chat quota (${maxPerDay} messages/day). Switching to built-in step hints!`
            : locale === 'ro'
              ? `Ai atins limita zilnică de chat AI (${maxPerDay} mesaje/zi). Trecem la indiciile locale ale pasului!`
              : `Elérted a napi AI chat keretedet (${maxPerDay} üzenet/nap). A kabala a beépített lépésenkénti tippekre váltott!`;
        return NextResponse.json({
          success: false,
          fallback: true,
          limitReached: 'daily',
          limitMessage: dailyLimitMsg,
        });
      }

      // Record question usage
      lastQuestionTimestampMap.set(userIdKey, now);
      phaseQuestionCountMap.set(phaseKey, {
        count: currentPhaseQuestions + 1,
        expiresAt: now + 2 * 60 * 60 * 1000, // 2h TTL per phase session
      });
      dailyUserQuotaMap.set(userIdKey, {
        count: currentDailyCount + 1,
        dayKey: todayKey,
      });
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
        setCourseDocCache(cacheKey, { doc: courseDoc, expiresAt: now + COURSE_CACHE_TTL });
      }
    }

    if (!courseDoc) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Enforce visibility access control on private courses
    if (courseDoc.visibility === 'private') {
      const rawInstructor = courseDoc.instructor;
      const instructorId =
        rawInstructor && typeof rawInstructor === 'object' && 'id' in rawInstructor
          ? String((rawInstructor as { id: string | number }).id)
          : rawInstructor !== undefined && rawInstructor !== null
            ? String(rawInstructor)
            : '';
      if (user.role !== ROLES.ADMIN && instructorId !== String(user.id)) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    const phases = (courseDoc.phases || []) as Array<Record<string, unknown>>;
    const currentPhase = phases.find((p) => p.phaseId === phaseId) || phases[0];

    const sourceAlgorithmId = (currentPhase?.sourceAlgorithmId as string) || undefined;
    const mascotConfig = (courseDoc.mascot || {}) as Record<string, unknown>;
    const mascotName =
      (typeof mascotConfig.name === 'object' && mascotConfig.name !== null
        ? (mascotConfig.name as Record<string, string>)[locale]
        : String(mascotConfig.name || 'Bubi')) || 'Bubi';

    // Build user dossier (cached for 40s in mascotContextBuilder)
    const dossier = await buildUserLearningDossier(user.id, courseSlug, phaseId, sourceAlgorithmId);

    // ── 3. Dynamic Context Pruning (Exercise data only when asked or on mistake) ──
    const isExerciseContextNeeded =
      trigger === 'question' || trigger === 'mistake' || Boolean(sanitizedUserQuery);

    const rawAnchors = Array.isArray(screenSnapshot.availableAnchors)
      ? (screenSnapshot.availableAnchors as string[])
      : [];
    // Only pass relevant anchors when interacting with exercise, capped at 10 to save tokens
    const availableAnchors = isExerciseContextNeeded ? rawAnchors.slice(0, 10) : [];

    const targetLang = locale === 'en' ? 'English' : locale === 'ro' ? 'Romanian' : 'Hungarian';

    const contextLines: string[] = [
      `Mascot: "${mascotName}" | Student: ${dossier.identity.firstName || 'Tanuló'} | Language: ${targetLang}`,
      `Current Step: "${currentPhase?.title || ''}" (${currentPhase?.sourceView || 'general'})`,
      `Goal: "${currentPhase?.summary || ''}"`,
      `State: Streak ${dossier.globalStats.currentStreak} | Points ${dossier.globalStats.totalPoints} | Step ${dossier.currentCourseState.activePhaseIndex + 1}/${phases.length}`,
    ];

    if (isExerciseContextNeeded) {
      if (currentPhase?.hintCopy) {
        contextLines.push(`Hint: "${currentPhase.hintCopy}"`);
      }
      if (currentPhase?.quiz) {
        const q0 = (currentPhase.quiz as Array<Record<string, unknown>>)[0];
        if (q0) {
          contextLines.push(
            `Quiz Question: "${q0.question || ''}" (Correct Index: ${q0.correctIndex})`,
          );
        }
      }
      if (currentPhase?.gapFillContent) {
        contextLines.push(
          `GapFill: "${String(currentPhase.gapFillContent).slice(0, 160)}" | Solutions: ${JSON.stringify(currentPhase.gapFillSolutions)}`,
        );
      }
      if (availableAnchors.length > 0) {
        contextLines.push(`Available Anchors: ${JSON.stringify(availableAnchors)}`);
      }
      if (screenSnapshot.currentSelection) {
        contextLines.push(
          `Draft: ${JSON.stringify(screenSnapshot.currentSelection).slice(0, 100)}`,
        );
      }
    }

    const contextBlock = contextLines.join('\n');

    // ── 4. Conversation Messages (Static system prefix + pruned history) ──
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: STATIC_MASCOT_SYSTEM_PROMPT },
    ];

    // Include last 2 turns, capped to 120 chars each to prevent history accumulation
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      chatHistory.slice(-2).forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: String(msg.content).slice(0, 120),
          });
        }
      });
    }

    const userInstruction = sanitizedUserQuery
      ? `Student: "${sanitizedUserQuery}". Give a 1-2 sentence guiding Socratic reply and point to relevant anchors if helpful.`
      : `Trigger: "${trigger}". Give an encouraging 1-sentence tip and point to relevant anchors if helpful.`;

    messages.push({
      role: 'user',
      content: `[CONTEXT]\n${contextBlock}\n\n[TASK]\n${userInstruction}`,
    });

    // Call OpenRouter (or serve from 0-token response cache if identical query/trigger on same step)
    const selectionKey = screenSnapshot.currentSelection
      ? JSON.stringify(screenSnapshot.currentSelection).slice(0, 60)
      : '';
    const normalizedQueryKey = sanitizedUserQuery.toLowerCase().replace(/\s+/g, ' ');
    const responseCacheKey = `${courseSlug}:${phaseId || 'default'}:${locale}:${trigger}:${normalizedQueryKey}:${selectionKey}`;
    const cachedAiEntry = mascotResponseCache.get(responseCacheKey);

    let aiResponse: MascotAIResponse;
    if (cachedAiEntry && cachedAiEntry.expiresAt > now) {
      aiResponse = cachedAiEntry.response;
    } else {
      const result = await callOpenRouterStructured<MascotAIResponse>({
        messages,
        schema: mascotResponseSchema,
        schemaName: 'mascot_ai_response',
        timeoutMs: 15_000,
        disableReasoning: true,
        maxTokens: 280,
        temperature: 0.25,
      });
      aiResponse = result.data;
      setMascotResponseCache(responseCacheKey, aiResponse);
    }

    // Sanitize annotations to only valid client screen anchors
    const validAnnotations = (aiResponse.annotations || []).filter(
      (a) => a.targetAnchor && rawAnchors.includes(a.targetAnchor),
    );

    const phaseKey = `${userIdKey}:${courseSlug}:${phaseId || 'default'}`;
    const usedInPhase = phaseQuestionCountMap.get(phaseKey)?.count || 0;

    return NextResponse.json({
      success: true,
      mascot: {
        name: mascotName,
        message: aiResponse.message,
        mood: aiResponse.mood || 'pointing',
        annotations: validAnnotations,
        quickReplies: (aiResponse.quickReplies || []).slice(0, 2),
      },
      limits: {
        cooldownSeconds: aiConfig.mascotCooldownSeconds,
        maxMessagesPerPhase: aiConfig.mascotMaxMessagesPerPhase,
        usedMessagesInPhase: usedInPhase,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[Mascot API Route] Falling back to local mascot hint:', message);
    return NextResponse.json({
      success: false,
      fallback: true,
      error: 'AI service unavailable',
    });
  }
}
