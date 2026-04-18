'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAlgorithmStore, type AlgorithmProgress } from '../store/useAlgorithmStore';
import { APP_CONFIG } from '../../lib/constants';

interface LearningEvent {
  algorithmId?: string;
  courseId?: string;
  tab?: string;
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
export function useAnalytics(algorithmId?: string, tab?: string, courseId?: string) {
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
    flushTimer.current = setTimeout(flushEvents, APP_CONFIG.SYNC_INTERVAL_MS);
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
    progressFlushTimer.current = setTimeout(flushProgress, APP_CONFIG.SYNC_INTERVAL_MS);
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

  const summarizeProgressSnapshot = useCallback((progress: AlgorithmProgress | undefined) => {
    if (!progress) return undefined;
    // Return a subset of fields to keep payload small
    return {
      completed:
        !!progress.videoCompletedAt ||
        !!progress.animationCompletedAt ||
        !!progress.controlCompletedAt,
      watchTime: progress.videoWatchTimeMs,
      bestScore: Math.max(progress.controlBestScore || 0, progress.aliveBestScore || 0),
      isFinished: progress.overallProgress === 100,
    };
  }, []);

  const getCoarseUserAgent = useCallback((ua: string) => {
    if (!ua) return 'unknown';
    if (ua.includes('Mobi')) return 'mobile';
    if (ua.includes('Tablet')) return 'tablet';
    return 'desktop';
  }, []);

  /**
   * Track a single event. Call this from components.
   */
  const trackEvent = useCallback(
    (eventType: string, eventData?: Record<string, unknown>) => {
      if (!isAuth) return;

      const now = Date.now();
      const storeState = useAlgorithmStore.getState();

      const rawProgress = algorithmId ? storeState.algorithmProgress[algorithmId] : undefined;
      const rawCourseProgress = courseId ? storeState.courseProgress[courseId] : undefined;

      // Auto-enrich eventData with MINIMIZED environmental context
      const enrichedData = {
        ...eventData,
        // Include summary snapshots instead of full objects to save DB space
        currentProgress: summarizeProgressSnapshot(rawProgress),
        currentCourseProgress: rawCourseProgress
          ? {
              completedCount: rawCourseProgress.completedPhases?.length || 0,
              activePhase: rawCourseProgress.activePhaseIndex,
            }
          : undefined,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        viewport:
          typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined,
        theme:
          typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light',
        device:
          typeof navigator !== 'undefined' ? getCoarseUserAgent(navigator.userAgent) : undefined,
      };

      const event: LearningEvent = {
        algorithmId,
        courseId,
        tab,
        eventType,
        eventData: enrichedData,
        sessionId: sessionId.current,
        durationMs: now - lastEventTime.current,
      };
      lastEventTime.current = now;
      eventBuffer.current.push(event);

      scheduleEventFlush();
    },
    [
      algorithmId,
      courseId,
      tab,
      isAuth,
      scheduleEventFlush,
      summarizeProgressSnapshot,
      getCoarseUserAgent,
    ],
  );

  /**
   * Update algorithm progress (optimistic + buffered sync).
   * Set syncNow to true for critical actions (like reset) to bypass debouncing.
   */
  const updateProgress = useCallback(
    (updates: Partial<AlgorithmProgress>, syncNow: boolean = false) => {
      if (!algorithmId) return; // Progress updates require an algorithmId
      // Optimistically update frontend state immediately
      updateAlgorithmProgress(algorithmId, updates);

      if (!isAuth) return;

      // Buffer the backend update
      progressBuffer.current = { ...progressBuffer.current, ...updates };

      if (syncNow) {
        flushProgress();
      } else {
        scheduleProgressFlush();
      }
    },
    [algorithmId, isAuth, updateAlgorithmProgress, scheduleProgressFlush, flushProgress],
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
