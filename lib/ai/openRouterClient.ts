import { getOpenRouterConfig } from './aiSettingsHelper';

export const localizedStringSchema = {
  type: 'object',
  properties: {
    hu: { type: 'string', description: 'Hungarian translation' },
    en: { type: 'string', description: 'English translation' },
    ro: { type: 'string', description: 'Romanian translation' },
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

interface CallOpenRouterOptions {
  apiKey?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  schemaName: string;
  timeoutMs?: number;
}

export async function callOpenRouterStructured<T>(
  options: CallOpenRouterOptions,
): Promise<{ data: T; modelUsed: string }> {
  const {
    systemPrompt,
    userPrompt,
    schema,
    schemaName,
    timeoutMs = 90_000,
  } = options;

  const aiConfig = await getOpenRouterConfig();
  const apiKey = options.apiKey?.trim() || aiConfig.apiKey;
  let activeModel = options.model?.trim() || aiConfig.model || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error(
      'Az OpenRouter API kulcs nincs beállítva a Payload CMS adminisztrációs felületén (AI Beállítások).'
    );
  }

  const executeCall = async (modelToUse: string, format: 'json_schema' | 'json_object') => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
          'X-Title': 'AlgoRythmics',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
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
        }),
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

  // 1. Try with structured json_schema
  let response = await executeCall(activeModel, 'json_schema');

  // 2. If structured schema call fails with 400 (not supported) or non-ok, try json_object fallback
  if (!response.ok) {
    console.warn(
      `[OpenRouter] Primary schema call failed (${response.status}) for ${activeModel}. Falling back to json_object...`
    );
    response = await executeCall(activeModel, 'json_object');
  }

  // 3. If model doesn't exist or rate-limited on specific model, try free model fallback
  if (!response.ok && activeModel !== 'openrouter/free') {
    console.warn(`[OpenRouter] Model ${activeModel} failed. Falling back to openrouter/free...`);
    activeModel = 'openrouter/free';
    response = await executeCall(activeModel, 'json_schema');
    if (!response.ok) {
      response = await executeCall(activeModel, 'json_object');
    }
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
  } catch (parseError) {
    console.error('[OpenRouter] JSON Parse Error. Raw text:', rawContent);
    throw new Error('Az AI válaszát nem sikerült JSON formátumban feldolgozni. Próbáld újra.');
  }
}
