import { sql } from '@payloadcms/db-postgres';
import { getPayloadInstance } from '../payload';
import type { AiSetting } from '../../payload-types';

export interface OpenRouterConfig {
  model: string;
  apiKey: string;
  isConfigured: boolean;
  mascotEnabled: boolean;
  mascotMaxMessagesPerDay: number;
  mascotMaxMessagesPerPhase: number;
  mascotCooldownSeconds: number;
}

let cachedConfig: OpenRouterConfig | null = null;
let cacheExpiresAt = 0;
let columnsEnsured = false;
const CACHE_TTL_MS = 30_000; // 30 seconds

async function ensureAiSettingsColumns() {
  if (columnsEnsured) return;
  try {
    const payload = await getPayloadInstance();
    const db = payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    };
    if (db?.drizzle?.execute) {
      await db.drizzle.execute(sql`
        ALTER TABLE "ai_settings" ADD COLUMN IF NOT EXISTS "mascot_enabled" boolean DEFAULT true;
        ALTER TABLE "ai_settings" ADD COLUMN IF NOT EXISTS "mascot_max_messages_per_day" numeric DEFAULT 30;
        ALTER TABLE "ai_settings" ADD COLUMN IF NOT EXISTS "mascot_max_messages_per_phase" numeric DEFAULT 5;
        ALTER TABLE "ai_settings" ADD COLUMN IF NOT EXISTS "mascot_cooldown_seconds" numeric DEFAULT 8;
      `);
    }
    columnsEnsured = true;
  } catch (err) {
    console.warn('[AISettingsHelper] Could not auto-ensure ai_settings columns:', err);
  }
}

/**
 * Retrieves the OpenRouter AI configuration from Payload CMS (ai-settings global).
 * Falls back to environment variables only if the database value is empty.
 * Caches the result in memory for 30 seconds to eliminate redundant database hits.
 */
export async function getOpenRouterConfig(): Promise<OpenRouterConfig> {
  const now = Date.now();
  if (cachedConfig && cacheExpiresAt > now) {
    return cachedConfig;
  }

  try {
    await ensureAiSettingsColumns();
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
    const mascotEnabled = settings?.mascotEnabled !== false;
    const mascotMaxMessagesPerDay = Math.max(
      1,
      Math.min(500, Number(settings?.mascotMaxMessagesPerDay) || 30),
    );
    const mascotMaxMessagesPerPhase = Math.max(
      1,
      Math.min(50, Number(settings?.mascotMaxMessagesPerPhase) || 5),
    );
    const mascotCooldownSeconds = Math.max(
      0,
      Math.min(120, Number(settings?.mascotCooldownSeconds ?? 8)),
    );

    cachedConfig = {
      model,
      apiKey,
      isConfigured: Boolean(apiKey),
      mascotEnabled,
      mascotMaxMessagesPerDay,
      mascotMaxMessagesPerPhase,
      mascotCooldownSeconds,
    };
    cacheExpiresAt = now + CACHE_TTL_MS;

    return cachedConfig;
  } catch (err) {
    console.warn('[AISettingsHelper] Failed to read ai-settings global:', err);
    const envModel = process.env.OPENROUTER_DEFAULT_MODEL?.trim() || 'google/gemini-2.5-flash';
    const envApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
    return {
      model: envModel,
      apiKey: envApiKey,
      isConfigured: Boolean(envApiKey),
      mascotEnabled: true,
      mascotMaxMessagesPerDay: 30,
      mascotMaxMessagesPerPhase: 5,
      mascotCooldownSeconds: 8,
    };
  }
}

/**
 * Invalidate cached config if settings are updated in admin.
 */
export function invalidateAiSettingsCache() {
  cachedConfig = null;
  cacheExpiresAt = 0;
}
