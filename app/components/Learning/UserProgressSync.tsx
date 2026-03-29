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
  const { completedIds, visualizerProgress, hydrate } = useAlgorithmStore();

  const isInitialMount = useRef(true);
  const lastSynced = useRef({ ids: '', progress: '' });

  // 1. Initial Hydration: Fill the store with server data on login
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const serverUser = session.user;

      // Only hydrate if we have valid server data
      if (serverUser.completedAlgorithms || serverUser.visualizerProgress) {
        // Create stable JSON strings for checking if we NEED to hydrate
        const serverIdsStr = JSON.stringify(serverUser.completedAlgorithms || []);
        const localIdsStr = JSON.stringify(completedIds);

        // If local is empty but server has data, and the data differs from local, hydrate
        if (
          completedIds.length === 0 &&
          (serverUser.completedAlgorithms?.length ?? 0) > 0 &&
          serverIdsStr !== localIdsStr
        ) {
          hydrate({
            completedIds: serverUser.completedAlgorithms,
            visualizerProgress: serverUser.visualizerProgress as Record<
              string,
              { step: number; speed: number }
            >,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  // 2. Continuous Sync: Save local changes to the cloud
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Prevent sync attempt on first mount
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
