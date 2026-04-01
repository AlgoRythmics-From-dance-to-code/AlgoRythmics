'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAlgorithmStore } from '../store/useAlgorithmStore';

interface LearningEvent {
  algorithmId: string;
  tab: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  sessionId: string;
  durationMs: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Custom hook for tracking learning analytics.
 * Buffers events and flushes them in batches every 3 seconds.
 * Uses navigator.sendBeacon on page unload so no events are lost.
 */
export function useAnalytics(algorithmId: string, tab: string) {
  const { status } = useSession();
  const isAuth = status === 'authenticated';
  const { updateAlgorithmProgress } = useAlgorithmStore();

  const sessionId = useRef(generateId());
  const lastEventTime = useRef(Date.now());
  const eventBuffer = useRef<LearningEvent[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush buffered events to the backend
  const flush = useCallback(() => {
    if (eventBuffer.current.length === 0 || !isAuth) return;

    const events = [...eventBuffer.current];
    eventBuffer.current = [];

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).catch((err) => {
      console.error('[Analytics] flush failed:', err);
      // Put events back in the buffer for retry
      eventBuffer.current.unshift(...events);
    });
  }, [isAuth]);

  // Debounced flush (3 seconds)
  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 3000);
  }, [flush]);

  /**
   * Track a single event. Call this from components.
   */
  const trackEvent = useCallback(
    (eventType: string, eventData?: Record<string, unknown>) => {
      if (!isAuth) return;

      const now = Date.now();
      const event: LearningEvent = {
        algorithmId,
        tab,
        eventType,
        eventData,
        sessionId: sessionId.current,
        durationMs: now - lastEventTime.current,
      };
      lastEventTime.current = now;
      eventBuffer.current.push(event);

      scheduleFlush();
    },
    [algorithmId, tab, isAuth, scheduleFlush],
  );

  /**
   * Update algorithm progress (calls the upsert endpoint).
   */
  const updateProgress = useCallback(
    async (updates: Record<string, unknown>) => {
      // Optimistically update frontend state immediately
      updateAlgorithmProgress(algorithmId, updates);
      
      if (!isAuth) return;
      try {
        await fetch('/api/analytics/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ algorithmId, updates }),
        });
      } catch (err) {
        console.error('[Analytics] progress update failed:', err);
      }
    },
    [algorithmId, isAuth, updateAlgorithmProgress],
  );

  // Auto-track tab_enter on mount and tab_exit on unmount
  useEffect(() => {
    trackEvent('tab_enter');

    return () => {
      trackEvent('tab_exit');
      // Flush remaining events synchronously via sendBeacon
      if (eventBuffer.current.length > 0 && isAuth) {
        try {
          navigator.sendBeacon(
            '/api/analytics/event',
            new Blob([JSON.stringify({ events: eventBuffer.current })], {
              type: 'application/json',
            }),
          );
          eventBuffer.current = [];
        } catch {
          // Fallback: try a normal flush
          flush();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page unload handler — last chance to flush
  useEffect(() => {
    const handleUnload = () => {
      if (eventBuffer.current.length > 0 && isAuth) {
        navigator.sendBeacon(
          '/api/analytics/event',
          new Blob([JSON.stringify({ events: eventBuffer.current })], {
            type: 'application/json',
          }),
        );
        eventBuffer.current = [];
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isAuth]);

  return {
    trackEvent,
    updateProgress,
    sessionId: sessionId.current,
  };
}
