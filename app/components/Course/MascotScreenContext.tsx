'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';

export interface MascotAnnotation {
  targetAnchor: string;
  effect: 'frame' | 'underline' | 'pointer' | 'pulse';
  badgeText?: string;
}

export interface MascotScreenState {
  sourceView: string;
  currentSelection?: unknown;
  isComplete?: boolean;
  extra?: Record<string, unknown>;
}

interface MascotScreenContextValue {
  screenState: MascotScreenState;
  reportScreenState: (update: Partial<MascotScreenState>) => void;
  getAvailableAnchors: () => string[];
  activeAnnotations: MascotAnnotation[];
  setAnnotations: (annotations: MascotAnnotation[]) => void;
  clearAnnotations: () => void;
  scrollAnchorIntoView: (anchorId: string) => boolean;
}

const MascotScreenContext = createContext<MascotScreenContextValue | null>(null);

function areScreenStatesEqual(a: MascotScreenState, b: Partial<MascotScreenState>): boolean {
  if (b.sourceView !== undefined && b.sourceView !== a.sourceView) return false;
  if (b.isComplete !== undefined && b.isComplete !== a.isComplete) return false;

  if (b.currentSelection !== undefined) {
    if (JSON.stringify(a.currentSelection) !== JSON.stringify(b.currentSelection)) return false;
  }

  if (b.extra !== undefined) {
    if (JSON.stringify(a.extra) !== JSON.stringify(b.extra)) return false;
  }

  return true;
}

export function MascotScreenProvider({ children }: { children: React.ReactNode }) {
  const [screenState, setScreenState] = useState<MascotScreenState>({
    sourceView: 'general',
  });
  const [activeAnnotations, setActiveAnnotations] = useState<MascotAnnotation[]>([]);

  const reportScreenState = useCallback((update: Partial<MascotScreenState>) => {
    setScreenState((prev) => {
      if (areScreenStatesEqual(prev, update)) {
        return prev;
      }
      return {
        ...prev,
        ...update,
      };
    });
  }, []);

  const getAvailableAnchors = useCallback((): string[] => {
    if (typeof document === 'undefined') return [];
    const elements = document.querySelectorAll('[data-mascot-anchor]');
    const anchors: string[] = [];
    elements.forEach((el) => {
      const id = el.getAttribute('data-mascot-anchor');
      if (id && !anchors.includes(id)) {
        anchors.push(id);
      }
    });
    return anchors;
  }, []);

  const setAnnotations = useCallback((newAnnotations: MascotAnnotation[]) => {
    setActiveAnnotations((prev) => {
      if (prev.length === newAnnotations.length) {
        const isSame = prev.every(
          (p, i) =>
            p.targetAnchor === newAnnotations[i]?.targetAnchor &&
            p.effect === newAnnotations[i]?.effect &&
            p.badgeText === newAnnotations[i]?.badgeText,
        );
        if (isSame) return prev;
      }
      return newAnnotations;
    });
  }, []);

  const clearAnnotations = useCallback(() => {
    setActiveAnnotations((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const scrollAnchorIntoView = useCallback((anchorId: string): boolean => {
    if (typeof document === 'undefined') return false;
    const target = document.querySelector(`[data-mascot-anchor="${anchorId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);

  // Automatically dismiss annotations after 15 seconds if not interacted with
  const autoClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (activeAnnotations.length > 0) {
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = setTimeout(() => {
        setActiveAnnotations((prev) => (prev.length === 0 ? prev : []));
      }, 15000);
    }
    return () => {
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    };
  }, [activeAnnotations]);

  const contextValue = useMemo<MascotScreenContextValue>(
    () => ({
      screenState,
      reportScreenState,
      getAvailableAnchors,
      activeAnnotations,
      setAnnotations,
      clearAnnotations,
      scrollAnchorIntoView,
    }),
    [
      screenState,
      reportScreenState,
      getAvailableAnchors,
      activeAnnotations,
      setAnnotations,
      clearAnnotations,
      scrollAnchorIntoView,
    ],
  );

  return (
    <MascotScreenContext.Provider value={contextValue}>{children}</MascotScreenContext.Provider>
  );
}

const noopMascotContext: MascotScreenContextValue = {
  screenState: { sourceView: '', isComplete: false },
  reportScreenState: () => {},
  getAvailableAnchors: () => [],
  activeAnnotations: [],
  setAnnotations: () => {},
  clearAnnotations: () => {},
  scrollAnchorIntoView: () => false,
};

/**
 * Hook to access mascot screen state and controls.
 * Falls back to a safe no-op context when mounted outside MascotScreenProvider (e.g. standalone algo/video pages).
 */
export function useMascotScreen(): MascotScreenContextValue {
  const ctx = useContext(MascotScreenContext);
  return ctx || noopMascotContext;
}

/**
 * Convenient helper hook for phase sub-components to report their state automatically.
 * Serializes data to prevent infinite re-render cycles when callers pass inline literals.
 * Safe to use outside MascotScreenProvider (no-op).
 */
export function useReportMascotScreen(
  sourceView: string,
  currentSelection?: unknown,
  isComplete?: boolean,
  extra?: Record<string, unknown>,
) {
  const { reportScreenState } = useMascotScreen();
  const lastSerializedRef = useRef<string>('');

  useEffect(() => {
    const payload = {
      sourceView,
      currentSelection,
      isComplete,
      extra,
    };
    try {
      const serialized = JSON.stringify(payload);
      if (serialized === lastSerializedRef.current) {
        return;
      }
      lastSerializedRef.current = serialized;
      reportScreenState(payload);
    } catch {
      // Fallback if not serializable
      reportScreenState(payload);
    }
  }, [sourceView, currentSelection, isComplete, extra, reportScreenState]);
}
