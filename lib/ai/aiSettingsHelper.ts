import { getPayloadInstance } from '../payload';
import type { AiSetting } from '../../payload-types';

export interface OpenRouterConfig {
  model: string;
  apiKey: string;
  isConfigured: boolean;
}

/**
 * Retrieves the OpenRouter AI configuration from Payload CMS (ai-settings global).
 * Falls back to environment variables only if the database value is empty.
 */
export async function getOpenRouterConfig(): Promise<OpenRouterConfig> {
  try {
    const payload = await getPayloadInstance();
    const settings = (await payload.findGlobal({
      slug: 'ai-settings',
      overrideAccess: true,
    })) as AiSetting;

    const dbModel = settings?.model?.trim();
    const dbApiKey = settings?.apiKey?.trim();

    const envModel = process.env.OPENROUTER_DEFAULT_MODEL?.trim();
    const envApiKey = process.env.OPENROUTER_API_KEY?.trim();

    const model = dbModel || envModel || 'google/gemini-2.5-flash';
    const apiKey = dbApiKey || envApiKey || '';

    return {
      model,
      apiKey,
      isConfigured: Boolean(apiKey),
    };
  } catch (err) {
    console.warn('[AISettingsHelper] Failed to read ai-settings global:', err);
    const envModel = process.env.OPENROUTER_DEFAULT_MODEL?.trim() || 'google/gemini-2.5-flash';
    const envApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
    return {
      model: envModel,
      apiKey: envApiKey,
      isConfigured: Boolean(envApiKey),
    };
  }
}
