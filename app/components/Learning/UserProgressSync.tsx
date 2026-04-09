'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { APP_CONFIG } from '../../../lib/constants';

/**
 * Helper to clear all authentication related cookies manually as a fallback
 */
const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    // Clear next-auth, payload and any other auth related cookies
    if (name.includes('auth') || name.includes('token') || name.includes('session')) {
       document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
       document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
       document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict;`;
    }
  }
};

/**
 * Background component that synchronizes the local Zustand store
 * with the Payload CMS backend for authenticated users.
 */
export default function UserProgressSync() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
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

  // Do not sync on auth pages or while loading
  const isAuthPage = 
    pathname?.includes('/login') || 
    pathname?.includes('/register') || 
    pathname?.includes('/forgot-password') || 
    pathname?.includes('/reset-password');

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
    if (status !== 'authenticated' || !session?.user || isHydrating.current || isAuthPage) return;

    const fetchFullProgress = async () => {
      isHydrating.current = true;
      try {
        const response = await fetch('/api/account/progress');
        
        // Handle stale sessions silently - do not force redirect on auth pages or random background calls
        if (response.status === 401) {
          console.warn('[AlgoRythmics] Session stale. Clearing local session and progress data.');
          clearStore();
          clearAuthCookies();
          signOut({ redirect: false });
          return;
        }

        if (response.ok) {
          const data = await response.json();
          hydrate({
            completedIds: data.completedIds || [],
            visualizerProgress: data.visualizerProgress || {},
            algorithmProgress: data.algorithmProgress || {},
            courseProgress: data.courseProgress || {},
          });
          lastSynced.current = {
            ids: JSON.stringify(data.completedIds || []),
            progress: JSON.stringify(data.visualizerProgress || {}),
            algorithm: JSON.stringify(data.algorithmProgress || {}),
            course: JSON.stringify(data.courseProgress || {}),
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
  }, [status, session, isAuthPage]);

  // 2. Persistent Sync Logic
  const syncProgress = useCallback(async () => {
    if (status !== 'authenticated' || isHydrating.current || isAuthPage) return;

    const currentIds = JSON.stringify(completedIds);
    const currentProgress = JSON.stringify(visualizerProgress);
    const currentAlgorithmProgress = JSON.stringify(algorithmProgress);
    const currentCourseProgress = JSON.stringify(courseProgress);

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
        body: JSON.stringify({
          completedIds,
          visualizerProgress,
          algorithmProgress,
          courseProgress,
        }),
      });

      if (response.status === 401) {
        console.warn('[AlgoRythmics] syncProgress returned 401. Clearing local session.');
        clearStore();
        clearAuthCookies();
        signOut({ redirect: false });
        return;
      }

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
  }, [completedIds, visualizerProgress, algorithmProgress, courseProgress, status, isAuthPage, clearStore]);

  // 3. Continuous Sync
  useEffect(() => {
    if (status !== 'authenticated' || isHydrating.current || isAuthPage) return;

    if (isInitialMount.current && completedIds.length === 0) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(syncProgress, APP_CONFIG.SYNC_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [completedIds, visualizerProgress, algorithmProgress, courseProgress, status, syncProgress, isAuthPage]);

  // 4. Lifecycle Sync: Immediate persistence on tab closure
  useEffect(() => {
    const handleExit = () => {
      if (status !== 'authenticated' || isAuthPage) return;

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
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob(
            [
              JSON.stringify({
                completedIds,
                visualizerProgress,
                algorithmProgress,
                courseProgress,
              }),
            ],
            { type: 'application/json' },
          );
          navigator.sendBeacon('/api/account/progress', blob);
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
  }, [completedIds, visualizerProgress, algorithmProgress, courseProgress, status, isAuthPage]);

  return null;
}
