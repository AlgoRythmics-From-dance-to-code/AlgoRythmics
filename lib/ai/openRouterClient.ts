import { getOpenRouterConfig } from './aiSettingsHelper';

export const localizedStringSchema = {
  type: 'object',
  properties: {
    hu: { type: 'string' },
    en: { type: 'string' },
    ro: { type: 'string' },
  },
  required: ['hu', 'en', 'ro'],
};

export interface LocalizedField {
  hu: string;
  en: string;
  ro: string;
}

export function sanitizeLocalizedField(
  val: LocalizedField | string | null | undefined,
  defaultText = '',
): LocalizedField {
  if (!val) {
    return { hu: defaultText, en: defaultText, ro: defaultText };
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return { hu: trimmed || defaultText, en: trimmed || defaultText, ro: trimmed || defaultText };
  }
  if (typeof val === 'object') {
    const hu = typeof val.hu === 'string' ? val.hu.trim() : '';
    const en = typeof val.en === 'string' ? val.en.trim() : '';
    const ro = typeof val.ro === 'string' ? val.ro.trim() : '';
    const fallback = hu || en || ro || defaultText;
    return {
      hu: hu || fallback,
      en: en || fallback,
      ro: ro || fallback,
    };
  }
  return { hu: defaultText, en: defaultText, ro: defaultText };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallOpenRouterOptions {
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  messages?: OpenRouterMessage[];
  schema: Record<string, unknown>;
  schemaName: string;
  timeoutMs?: number;
  disableReasoning?: boolean;
  temperature?: number;
  maxTokens?: number;
}

function isFatalAuthOrQuotaStatus(status: number): boolean {
  return status === 401 || status === 402 || status === 403;
}

export async function callOpenRouterStructured<T>(
  options: CallOpenRouterOptions,
): Promise<{ data: T; modelUsed: string }> {
  const {
    systemPrompt = '',
    userPrompt = '',
    messages: customMessages,
    schema,
    schemaName,
    timeoutMs = 90_000,
    disableReasoning = false,
    temperature,
    maxTokens,
  } = options;

  const aiConfig = await getOpenRouterConfig();
  const apiKey = options.apiKey?.trim() || aiConfig.apiKey;
  let activeModel = options.model?.trim() || aiConfig.model || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error(
      'Az OpenRouter API kulcs nincs beállítva a Payload CMS adminisztrációs felületén (AI Beállítások).',
    );
  }

  const finalMessages =
    customMessages && customMessages.length > 0
      ? customMessages
      : [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          ...(userPrompt ? [{ role: 'user' as const, content: userPrompt }] : []),
        ];

  const executeCall = async (
    modelToUse: string,
    format: 'json_schema' | 'json_object',
    reasoningMode: 'disabled' | 'none' = disableReasoning ? 'disabled' : 'none',
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const payloadBody: Record<string, unknown> = {
      model: modelToUse,
      messages: finalMessages,
      response_format:
        format === 'json_schema'
          ? {
              type: 'json_schema',
              json_schema: {
                name: schemaName,
                schema,
              },
            }
          : { type: 'json_object' },
      provider: {
        sort: 'throughput',
      },
    };

    if (reasoningMode === 'disabled') {
      payloadBody.reasoning = { enabled: false, effort: 'none' };
    }

    if (typeof temperature === 'number') {
      payloadBody.temperature = temperature;
    }
    if (typeof maxTokens === 'number') {
      payloadBody.max_tokens = maxTokens;
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
          'X-Title': 'AlgoRythmics',
        },
        body: JSON.stringify(payloadBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenRouter kérés időtúllépés miatt megszakadt (${timeoutMs / 1000}s).`);
      }
      throw err;
    }
  };

  // 1. Primary call with structured json_schema
  let response = await executeCall(activeModel, 'json_schema');

  // Short-circuit immediately on auth/credit errors (401, 402, 403) to avoid burning redundant retries
  if (!response.ok && isFatalAuthOrQuotaStatus(response.status)) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP hiba (${response.status}): ${errorText}`);
  }

  // 2. Single fallback to json_object (without reasoning flag) if model rejected schema or reasoning parameter
  if (!response.ok) {
    console.warn(
      `[OpenRouter] Primary schema call failed (${response.status}) for ${activeModel}. Falling back to json_object...`,
    );
    response = await executeCall(activeModel, 'json_object', 'none');
    if (!response.ok && isFatalAuthOrQuotaStatus(response.status)) {
      const errorText = await response.text();
      throw new Error(`OpenRouter HTTP hiba (${response.status}): ${errorText}`);
    }
  }

  // 3. Only if model itself is unavailable (404 / 429 / 5xx), try openrouter/free once
  if (!response.ok && activeModel !== 'openrouter/free') {
    console.warn(`[OpenRouter] Model ${activeModel} failed. Falling back to openrouter/free...`);
    activeModel = 'openrouter/free';
    response = await executeCall(activeModel, 'json_object', 'none');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP hiba (${response.status}): ${errorText}`);
  }

  const jsonResult = await response.json();
  const rawContent = jsonResult?.choices?.[0]?.message?.content;

  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('A választott AI modell üres választ adott. Kérjük, próbáld újra.');
  }

  // Extract JSON from response (strip markdown fences if present)
  let cleanText = rawContent.trim();
  cleanText = cleanText.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');

  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleanText) as T;
    return { data: parsed, modelUsed: activeModel };
  } catch {
    console.error('[OpenRouter] JSON Parse Error. Raw text:', rawContent);
    throw new Error('Az AI válaszát nem sikerült JSON formátumban feldolgozni. Próbáld újra.');
  }
}
