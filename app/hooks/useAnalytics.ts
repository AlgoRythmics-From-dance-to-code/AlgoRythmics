'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAlgorithmStore, type AlgorithmProgress } from '../store/useAlgorithmStore';

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
 * Batches events and progress updates to minimize network requests.
 * Uses navigator.sendBeacon on visibilitychange/unload to prevent data loss.
 */
export function useAnalytics(algorithmId: string, tab: string) {
  const { status } = useSession();
  const isAuth = status === 'authenticated';
  const { updateAlgorithmProgress } = useAlgorithmStore();

  const sessionId = useRef(generateId());
  const lastEventTime = useRef(Date.now());

  // Buffers
  const eventBuffer = useRef<LearningEvent[]>([]);
  const progressBuffer = useRef<Partial<AlgorithmProgress>>({});

  // Timers
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- EVENTS FLUSH ---
  const flushEvents = useCallback(() => {
    if (eventBuffer.current.length === 0 || !isAuth) return;

    const events = [...eventBuffer.current];
    eventBuffer.current = [];

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).catch((err: unknown) => {
      console.error('[Analytics] event flush failed:', err);
      eventBuffer.current.unshift(...events); // retry later
    });
  }, [isAuth]);

  const scheduleEventFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushEvents, 3000);
  }, [flushEvents]);

  // --- PROGRESS FLUSH ---
  const flushProgress = useCallback(() => {
    const updates = progressBuffer.current;
    if (Object.keys(updates).length === 0 || !isAuth) return;

    progressBuffer.current = {};

    fetch('/api/analytics/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithmId, updates }),
    }).catch((err: unknown) => {
      console.error('[Analytics] progress flush failed:', err);
      progressBuffer.current = { ...updates, ...progressBuffer.current };
    });
  }, [isAuth, algorithmId]);

  const scheduleProgressFlush = useCallback(() => {
    if (progressFlushTimer.current) clearTimeout(progressFlushTimer.current);
    progressFlushTimer.current = setTimeout(flushProgress, 3000);
  }, [flushProgress]);

  // --- SYNCHRONOUS FLUSH FOR UNLOAD/VISIBILITY ---
  const syncFlushAll = useCallback(() => {
    if (!isAuth) return;

    if (eventBuffer.current.length > 0) {
      try {
        navigator.sendBeacon(
          '/api/analytics/event',
          new Blob([JSON.stringify({ events: eventBuffer.current })], { type: 'application/json' }),
        );
        eventBuffer.current = [];
      } catch {
        flushEvents();
      }
    }

    if (Object.keys(progressBuffer.current).length > 0) {
      try {
        navigator.sendBeacon(
          '/api/analytics/progress',
          new Blob([JSON.stringify({ algorithmId, updates: progressBuffer.current })], {
            type: 'application/json',
          }),
        );
        progressBuffer.current = {};
      } catch {
        flushProgress();
      }
    }
  }, [isAuth, algorithmId, flushEvents, flushProgress]);

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

      scheduleEventFlush();
    },
    [algorithmId, tab, isAuth, scheduleEventFlush],
  );

  /**
   * Update algorithm progress (optimistic + buffered sync).
   */
  const updateProgress = useCallback(
    (updates: Partial<AlgorithmProgress>) => {
      // Optimistically update frontend state immediately
      updateAlgorithmProgress(algorithmId, updates);

      if (!isAuth) return;

      // Buffer the backend update
      progressBuffer.current = { ...progressBuffer.current, ...updates };
      scheduleProgressFlush();
    },
    [algorithmId, isAuth, updateAlgorithmProgress, scheduleProgressFlush],
  );

  // Tab Lifecycle (mount/unmount)
  const hasTrackedEnter = useRef(false);
  useEffect(() => {
    if (status === 'loading') return;

    if (!hasTrackedEnter.current) {
      if (isAuth) trackEvent('tab_enter');
      hasTrackedEnter.current = true;
    }

    return () => {
      if (!hasTrackedEnter.current) return;
      hasTrackedEnter.current = false;
      if (isAuth) trackEvent('tab_exit');

      // Flush anything remaining
      syncFlushAll();
    };
  }, [trackEvent, isAuth, status, syncFlushAll]);

  // Page visibility & unload handlers - best practice for mobile & modern browsers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncFlushAll();
      }
    };

    const handleBeforeUnload = () => {
      syncFlushAll();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncFlushAll]);

  return {
    trackEvent,
    updateProgress,
    sessionId: sessionId.current,
  };
}
