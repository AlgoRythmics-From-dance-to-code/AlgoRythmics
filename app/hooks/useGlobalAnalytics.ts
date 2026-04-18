'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook for tracking global (non-algorithm specific) events like search, theme, language, etc.
 */
export function useGlobalAnalytics() {
  const { status } = useSession();
  const isAuth = status === 'authenticated';

  const trackGlobalEvent = useCallback(
    (eventType: string, eventData?: Record<string, unknown>) => {
      if (!isAuth) return;

      // Use the generic learning-events collection but without algorithmId
      // This is used for theme_switched, language_switched, pwa_interactions etc.
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              eventType,
              eventData,
              sessionId: `global-${Date.now()}`, // Global sessions are short-lived
              durationMs: 0,
            },
          ],
        }),
      }).catch((err) => console.error('[GlobalAnalytics] event failed:', err));
    },
    [isAuth],
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number, language: string, category?: string) => {
      if (!isAuth || !query.trim()) return;

      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          resultsCount,
          language,
          category,
        }),
      }).catch((err) => console.error('[GlobalAnalytics] search track failed:', err));
    },
    [isAuth],
  );

  return { trackGlobalEvent, trackSearch };
}
