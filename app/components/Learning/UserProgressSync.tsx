'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { APP_CONFIG } from '../../../lib/constants';

/**
 * Background component that synchronizes the local Zustand store
 * with the Payload CMS backend for authenticated users.
 */
export default function UserProgressSync() {
  const { data: session, status } = useSession();
  const {
    completedIds,
    visualizerProgress,
    algorithmProgress,
    courseProgress,
    hydrate,
    clearStore,
  } = useAlgorithmStore();

  const isInitialMount = useRef(true);
  const isHydrating = useRef(false);
  const lastSynced = useRef({ ids: '', progress: '', algorithm: '', course: '' });

  // 0. Cleanup on Logout: Clear the store when the user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      clearStore();
      lastSynced.current = { ids: '', progress: '', algorithm: '', course: '' };
      isInitialMount.current = true;
    }
  }, [status, clearStore]);

  // 1. Initial Hydration: Fill the store with server data on login
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || isHydrating.current) return;

    // Phase 2: Background hydration of full progress (including large JSON objects)
    const fetchFullProgress = async () => {
      isHydrating.current = true;
      try {
        const response = await fetch('/api/account/progress');
        if (response.ok) {
          const data = await response.json();
          hydrate({
            completedIds: data.completedIds,
            visualizerProgress: data.visualizerProgress,
            algorithmProgress: data.algorithmProgress,
            courseProgress: data.courseProgress,
          });
          lastSynced.current = {
            ids: JSON.stringify(data.completedIds),
            progress: JSON.stringify(data.visualizerProgress),
            algorithm: JSON.stringify(data.algorithmProgress),
            course: JSON.stringify(data.courseProgress),
          };
        }
      } catch (err) {
        console.error('[AlgoRythmics] Failed to hydrate progress from cloud:', err);
      } finally {
        isHydrating.current = false;
      }
    };

    fetchFullProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  // 2. Persistent Sync Logic
  const syncProgress = useCallback(async () => {
    if (status !== 'authenticated' || isHydrating.current) return;

    const currentIds = JSON.stringify(completedIds);
    const currentProgress = JSON.stringify(visualizerProgress);
    const currentAlgorithmProgress = JSON.stringify(algorithmProgress);
    const currentCourseProgress = JSON.stringify(courseProgress);

    // Only sync if data actually changed from what we last sent
    if (
      currentIds === lastSynced.current.ids &&
      currentProgress === lastSynced.current.progress &&
      currentAlgorithmProgress === lastSynced.current.algorithm &&
      currentCourseProgress === lastSynced.current.course
    ) {
      return;
    }

    try {
      const response = await fetch('/api/account/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedIds, visualizerProgress, algorithmProgress, courseProgress }),
      });

      if (response.ok) {
        lastSynced.current = {
          ids: currentIds,
          progress: currentProgress,
          algorithm: currentAlgorithmProgress,
          course: currentCourseProgress,
        };
      }
    } catch (err) {
      console.error('[AlgoRythmics] Failed to sync progress to cloud:', err);
    }
  }, [completedIds, visualizerProgress, algorithmProgress, courseProgress, status]);

  // 3. Continuous Sync: Save local changes to the cloud
  useEffect(() => {
    if (status !== 'authenticated' || isHydrating.current) return;

    // Prevent sync attempt on first mount or before first hydration completes
    if (isInitialMount.current && completedIds.length === 0) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce to avoid hitting the API too frequently during fast interactions
    const timer = setTimeout(syncProgress, APP_CONFIG.SYNC_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [completedIds, visualizerProgress, algorithmProgress, courseProgress, status, syncProgress]);

  // 4. Lifecycle Sync: Immediate persistence on tab closure or visibility change
  useEffect(() => {
    const handleExit = () => {
      // Check if there are unsynced changes
      const currentIds = JSON.stringify(completedIds);
      const currentProgress = JSON.stringify(visualizerProgress);
      const currentAlgorithmProgress = JSON.stringify(algorithmProgress);
      const currentCourseProgress = JSON.stringify(courseProgress);

      if (
        currentIds !== lastSynced.current.ids ||
        currentProgress !== lastSynced.current.progress ||
        currentAlgorithmProgress !== lastSynced.current.algorithm ||
        currentCourseProgress !== lastSynced.current.course
      ) {
        // Use sendBeacon for best-effort delivery during page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob(
            [JSON.stringify({ completedIds, visualizerProgress, algorithmProgress, courseProgress })],
            { type: 'application/json' },
          );
          navigator.sendBeacon('/api/account/progress', blob);
        } else {
          // Fallback
          syncProgress();
        }
      }
    };

    window.addEventListener('beforeunload', handleExit);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [completedIds, visualizerProgress, algorithmProgress, syncProgress]);

  return null;
}
