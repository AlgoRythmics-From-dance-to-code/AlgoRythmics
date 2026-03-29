'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

/**
 * Background component that synchronizes the local Zustand store
 * with the Payload CMS backend for authenticated users.
 */
export default function UserProgressSync() {
  const { data: session, status } = useSession();
  const { completedIds, visualizerProgress, hydrate, clearStore } = useAlgorithmStore();

  const isInitialMount = useRef(true);
  const isHydrating = useRef(false);
  const lastSynced = useRef({ ids: '', progress: '' });

  // 0. Cleanup on Logout: Clear the store when the user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      clearStore();
      lastSynced.current = { ids: '', progress: '' };
      isInitialMount.current = true;
    }
  }, [status, clearStore]);

  // 1. Initial Hydration: Fill the store with server data on login
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || isHydrating.current) return;

    const serverUser = session.user;

    // Phase 1: Immediate hydration from session (for completedAlgorithms which are small)
    if (serverUser.completedAlgorithms && completedIds.length === 0) {
      hydrate({
        completedIds: serverUser.completedAlgorithms as string[],
        visualizerProgress: {}, // Will be filled by Phase 2
      });
    }

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
          });
          lastSynced.current = {
            ids: JSON.stringify(data.completedIds),
            progress: JSON.stringify(data.visualizerProgress),
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

  // 2. Continuous Sync: Save local changes to the cloud
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

    const currentIds = JSON.stringify(completedIds);
    const currentProgress = JSON.stringify(visualizerProgress);

    // Only sync if data actually changed from what we last sent
    if (currentIds === lastSynced.current.ids && currentProgress === lastSynced.current.progress) {
      return;
    }

    const syncProgress = async () => {
      try {
        const response = await fetch('/api/account/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completedIds, visualizerProgress }),
        });

        if (response.ok) {
          lastSynced.current = { ids: currentIds, progress: currentProgress };
        }
      } catch (err) {
        console.error('[AlgoRythmics] Failed to sync progress to cloud:', err);
      }
    };

    // Debounce to avoid hitting the API too frequently during fast interactions
    const timer = setTimeout(syncProgress, 2000);
    return () => clearTimeout(timer);
  }, [completedIds, visualizerProgress, status]);

  return null;
}
