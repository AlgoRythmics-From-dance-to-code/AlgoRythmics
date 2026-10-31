'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  ShieldAlert,
  Sparkles,
  Send,
  CornerDownRight,
  Anchor,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CourseBlueprint, CoursePhase } from '../../../lib/courses/courseCatalog';
import { useLocale } from '../../i18n/LocaleProvider';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMascotScreen, type MascotAnnotation } from './MascotScreenContext';
import MascotAnnotationOverlay from './MascotAnnotationOverlay';

interface AIMascotWidgetProps {
  course: CourseBlueprint;
  activePhase: CoursePhase;
  activePhaseIndex: number;
  mascotEnabled: boolean;
  phaseMistakesCount: number;
  onHelped?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const markdownComponents = {
  strong: ({ children }: { children?: React.ReactNode }) => (
    <span className="font-bold text-teal-700 dark:text-teal-300">{children}</span>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <span className="italic font-semibold text-amber-700 dark:text-amber-300">{children}</span>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px] text-teal-600 dark:text-teal-400 font-bold">
      {children}
    </code>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
};

export default function AIMascotWidget({
  course,
  activePhase,
  activePhaseIndex: _activePhaseIndex,
  mascotEnabled,
  phaseMistakesCount,
  onHelped,
}: AIMascotWidgetProps) {
  const { t, locale } = useLocale();
  const { incrementCourseMascotInteraction, incrementCourseMistakes } = useAlgorithmStore();
  const { trackEvent } = useAnalytics(course.algorithmId, undefined, course.slug);

  const { screenState, getAvailableAnchors, setAnnotations, clearAnnotations } = useMascotScreen();

  const mascotConfig = course.mascot;
  const isEnabled = mascotEnabled && mascotConfig.enabled && mascotConfig.mode !== 'disabled';
  const mode = mascotConfig.mode || 'ai-fallback';

  // Floating & Position State
  const [mascotVisible, setMascotVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFlownToTarget, setIsFlownToTarget] = useState(false);
  const [targetedAnchor, setTargetedAnchor] = useState<string | null>(null);
  const [mascotTargetPos, setMascotTargetPos] = useState<{
    x: number;
    y: number;
    dir: 'left' | 'right' | 'down';
  } | null>(null);

  const [mascotMood, setMascotMood] = useState<
    'neutral' | 'welcome' | 'idle' | 'mistake' | 'pointing' | 'streak' | 'celebrate'
  >('welcome');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  // Interactive Chat State
  const [userQueryInput, setUserQueryInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Stable refs for volatile inputs
  const onHelpedRef = useRef(onHelped);
  onHelpedRef.current = onHelped;

  const screenStateRef = useRef(screenState);
  screenStateRef.current = screenState;

  const chatHistoryRef = useRef(chatHistory);
  chatHistoryRef.current = chatHistory;

  const mascotVisibleRef = useRef(mascotVisible);
  mascotVisibleRef.current = mascotVisible;

  const activePhaseRef = useRef(activePhase);
  activePhaseRef.current = activePhase;

  const mascotConfigRef = useRef(mascotConfig);
  mascotConfigRef.current = mascotConfig;

  const phaseMistakesCountRef = useRef(phaseMistakesCount);
  phaseMistakesCountRef.current = phaseMistakesCount;

  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  const lastHandledMistakeCountRef = useRef(0);

  // Manual fallback helper
  const getRandomMessage = useCallback((pool: string[]) => {
    if (!pool || pool.length === 0) return '';
    return pool[Math.floor(Math.random() * pool.length)] || '';
  }, []);

  // Strict Viewport Clamped Position Calculator for the Mascot Avatar
  const calculateAnchorPosition = useCallback((anchorId: string) => {
    if (typeof document === 'undefined') return null;
    const targetEl = document.querySelector(`[data-mascot-anchor="${anchorId}"]`);
    if (!targetEl) return null;

    const rect = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mascotW = 68;
    const mascotH = 68;

    const minX = 16;
    const maxX = Math.max(minX, vw - mascotW - 16);
    const minY = 76; // below sticky navbar
    const maxY = Math.max(minY, vh - mascotH - 24); // above bottom

    // Try placing to the right of the element
    let posX = rect.right + 14;
    let posY = rect.top + rect.height / 2 - mascotH / 2;
    let dir: 'left' | 'right' | 'down' = 'left';

    // If doesn't fit on right
    if (posX + mascotW > maxX) {
      // Try left of element
      if (rect.left - mascotW - 14 >= minX) {
        posX = rect.left - mascotW - 14;
        dir = 'right';
      } else {
        // Top center
        posX = rect.left + rect.width / 2 - mascotW / 2;
        posY = rect.top - mascotH - 12;
        dir = 'down';
      }
    }

    // Strict Viewport Clamping (ensures mascot is ALWAYS on-screen)
    const clampedX = Math.max(minX, Math.min(maxX, posX));
    const clampedY = Math.max(minY, Math.min(maxY, posY));

    return { x: clampedX, y: clampedY, dir };
  }, []);

  // Flying physics: moves ONLY the mascot sprite to the target element without scrolling the page!
  const flyToTargetAnchor = useCallback(
    (anchorId: string) => {
      if (typeof document === 'undefined') return;
      // Do NOT auto-scroll the page! Keep the user's scroll position untouched.
      const pos = calculateAnchorPosition(anchorId);
      if (pos) {
        setTargetedAnchor(anchorId);
        setMascotTargetPos(pos);
        setIsFlownToTarget(true);
      }
    },
    [calculateAnchorPosition],
  );

  const returnToDock = useCallback(() => {
    setTargetedAnchor(null);
    setMascotTargetPos(null);
    setIsFlownToTarget(false);
    clearAnnotations();
  }, [clearAnnotations]);

  // Synchronize flying mascot position on window scroll and resize
  useEffect(() => {
    if (!targetedAnchor) return;

    let rafId: number | null = null;
    const updatePos = () => {
      const pos = calculateAnchorPosition(targetedAnchor);
      if (pos) {
        setMascotTargetPos(pos);
      }
    };

    const handleScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePos);
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetedAnchor, calculateAnchorPosition]);

  // Core AI Caller with seamless manual fallback
  const fetchAiMascotAdvice = useCallback(
    async (trigger: string, queryText?: string) => {
      const currentPhase = activePhaseRef.current;
      const currentConfig = mascotConfigRef.current;
      const currentMistakes = phaseMistakesCountRef.current;
      const currentScreen = screenStateRef.current;
      const currentHistory = chatHistoryRef.current;

      // If user typed a question, add it immediately to chat history and show thinking state
      if (queryText) {
        setChatHistory((prev) => [...prev, { role: 'user', content: queryText }]);
        setMascotVisible(true);
        setIsMinimized(false);
      }

      if (mode === 'manual-only') {
        // Pure manual fallback
        let fallbackMsg = '';
        if (trigger === 'mistake') {
          const intro =
            currentPhase.mascotMistakeLine ||
            currentConfig.mistakePrompt ||
            t('course.mistake_prompt');
          fallbackMsg = currentPhase.hintCopy ? `${intro} ${currentPhase.hintCopy}` : intro;
          setMascotMood('mistake');
        } else if (trigger === 'idle') {
          fallbackMsg = currentPhase.idleHelp || currentConfig.idlePrompt || t('course.idle_help');
          setMascotMood('idle');
        } else if (trigger === 'welcome') {
          fallbackMsg =
            currentPhase.mascotLine ||
            getRandomMessage(currentConfig.welcomeMessages) ||
            currentPhase.summary;
          setMascotMood('welcome');
        } else {
          fallbackMsg = currentPhase.hintCopy || currentPhase.mascotLine || currentPhase.summary;
          setMascotMood('neutral');
        }

        if (queryText) {
          setChatHistory((prev) => [...prev, { role: 'assistant', content: fallbackMsg }]);
        } else {
          setMascotMessage(fallbackMsg);
        }

        setMascotVisible(true);
        setIsMinimized(false);
        incrementCourseMascotInteraction(course.slug);
        trackEventRef.current('mascot_interaction', {
          courseId: course.slug,
          phaseId: currentPhase.phaseId,
          phaseType: currentPhase.sourceView,
          trigger,
          mode: 'manual',
          advice: fallbackMsg.slice(0, 300),
          mistakesCount: currentMistakes,
        });
        onHelpedRef.current?.();
        return;
      }

      // AI-Only or AI-Fallback mode
      setIsAiLoading(true);
      try {
        const availableAnchors = getAvailableAnchors();
        const res = await fetch('/api/ai/mascot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseSlug: course.slug,
            phaseId: currentPhase.phaseId,
            trigger,
            userQuery: queryText,
            chatHistory: currentHistory,
            locale: locale || 'hu',
            screenSnapshot: {
              sourceView: currentScreen.sourceView || currentPhase.sourceView,
              availableAnchors,
              currentSelection: currentScreen.currentSelection,
              isComplete: currentScreen.isComplete,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`AI Mascot API error: ${res.status}`);
        }

        const data = await res.json();
        const mascotRes = data.mascot;

        if (!mascotRes || !mascotRes.message) {
          throw new Error('Empty AI mascot response');
        }

        if (queryText) {
          // Add AI assistant answer to chat history
          setChatHistory((prev) => [...prev, { role: 'assistant', content: mascotRes.message }]);
        } else {
          // Standalone phase advice
          setMascotMessage(mascotRes.message);
        }

        setMascotMood(mascotRes.mood || 'pointing');
        setQuickReplies(Array.isArray(mascotRes.quickReplies) ? mascotRes.quickReplies : []);

        if (Array.isArray(mascotRes.annotations) && mascotRes.annotations.length > 0) {
          setAnnotations(mascotRes.annotations as MascotAnnotation[]);
          const primaryAnchor = mascotRes.annotations[0].targetAnchor;
          if (primaryAnchor) {
            flyToTargetAnchor(primaryAnchor);
          }
        }

        setMascotVisible(true);
        setIsMinimized(false);
        incrementCourseMascotInteraction(course.slug);
        trackEventRef.current('mascot_interaction', {
          courseId: course.slug,
          phaseId: currentPhase.phaseId,
          phaseType: currentPhase.sourceView,
          trigger,
          mode: 'ai',
          userQuery: queryText || undefined,
          advice: mascotRes.message.slice(0, 300),
          mood: mascotRes.mood,
          targetAnchors: Array.isArray(mascotRes.annotations)
            ? mascotRes.annotations.map((a: MascotAnnotation) => a.targetAnchor)
            : [],
          mistakesCount: currentMistakes,
        });
        onHelpedRef.current?.();
      } catch (err) {
        console.warn('[AIMascotWidget] AI call failed. Fallback triggered:', err);
        if (mode === 'ai-fallback') {
          // Graceful fallback to manual messages
          let fallbackMsg = '';
          if (trigger === 'mistake') {
            const intro =
              currentPhase.mascotMistakeLine ||
              currentConfig.mistakePrompt ||
              t('course.mistake_prompt');
            fallbackMsg = currentPhase.hintCopy ? `${intro} ${currentPhase.hintCopy}` : intro;
            setMascotMood('mistake');
          } else {
            fallbackMsg =
              currentPhase.idleHelp ||
              currentPhase.hintCopy ||
              currentPhase.mascotLine ||
              currentPhase.summary;
            setMascotMood('neutral');
          }

          if (queryText) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content: fallbackMsg }]);
          } else {
            setMascotMessage(fallbackMsg);
          }

          setMascotVisible(true);
          setIsMinimized(false);
          incrementCourseMascotInteraction(course.slug);
          trackEventRef.current('mascot_interaction', {
            courseId: course.slug,
            phaseId: currentPhase.phaseId,
            phaseType: currentPhase.sourceView,
            trigger,
            mode: 'ai_fallback',
            advice: fallbackMsg.slice(0, 300),
            mistakesCount: currentMistakes,
          });
          onHelpedRef.current?.();
        }
      } finally {
        setIsAiLoading(false);
      }
    },
    [
      mode,
      t,
      getRandomMessage,
      incrementCourseMascotInteraction,
      course.slug,
      getAvailableAnchors,
      locale,
      setAnnotations,
      flyToTargetAnchor,
    ],
  );

  // Trigger: On Phase Enter (Welcome Advice)
  useEffect(() => {
    if (!isEnabled) return;
    returnToDock();
    clearAnnotations();
    setChatHistory([]);
    lastHandledMistakeCountRef.current = 0;

    // Initial greeting if phase has explicit line or on first phase
    const timeout = setTimeout(() => {
      fetchAiMascotAdvice('welcome');
    }, 400);

    return () => clearTimeout(timeout);
  }, [activePhase.phaseId, isEnabled, returnToDock, clearAnnotations, fetchAiMascotAdvice]);

  // Trigger: Consecutive Mistakes Threshold
  const mistakeTriggerThresh = mascotConfig.mistakeTriggerCount || 2;
  useEffect(() => {
    if (!isEnabled) return;
    if (
      phaseMistakesCount >= mistakeTriggerThresh &&
      phaseMistakesCount > lastHandledMistakeCountRef.current
    ) {
      lastHandledMistakeCountRef.current = phaseMistakesCount;
      incrementCourseMistakes(course.slug);
      fetchAiMascotAdvice('mistake');
    }
  }, [
    phaseMistakesCount,
    mistakeTriggerThresh,
    isEnabled,
    incrementCourseMistakes,
    course.slug,
    fetchAiMascotAdvice,
  ]);

  // Trigger: Inactivity (Idle Timer) - Only when mascot is NOT visible and chat is not active!
  useEffect(() => {
    if (!isEnabled) return;
    let timer: NodeJS.Timeout;
    const idleSeconds = Math.max(90, mascotConfig.idleTriggerSeconds || 90);

    const resetIdleTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Only trigger if mascot is closed and user has no ongoing chat
        if (
          !screenStateRef.current.isComplete &&
          !mascotVisibleRef.current &&
          chatHistoryRef.current.length === 0
        ) {
          fetchAiMascotAdvice('idle');
        }
      }, idleSeconds * 1000);
    };

    const onUserActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', onUserActivity);
    window.addEventListener('keydown', onUserActivity);
    window.addEventListener('click', onUserActivity);
    resetIdleTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('click', onUserActivity);
    };
  }, [activePhase.phaseId, mascotConfig.idleTriggerSeconds, isEnabled, fetchAiMascotAdvice]);

  // Handle Question Submit
  const handleSendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = userQueryInput.trim();
    if (!query || isAiLoading) return;
    setUserQueryInput('');
    fetchAiMascotAdvice('question', query);
  };

  const handleQuickReply = (text: string) => {
    if (isAiLoading) return;
    fetchAiMascotAdvice('question', text);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* 1. Visual Highlights & Pointing Annotations Overlay on Target Elements (No flickering) */}
      <MascotAnnotationOverlay accentColor={mascotConfig.accentColor || '#269984'} />

      {/* 2. THE FLYING MASCOT SPRITE (Only the mascot character moves!) */}
      <AnimatePresence>
        {isFlownToTarget && mascotTargetPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: mascotTargetPos.x,
              y: mascotTargetPos.y,
            }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="fixed top-0 left-0 z-[80] pointer-events-auto cursor-pointer"
            onClick={returnToDock}
            title="Kattints ide a kabala visszahívásához a sarokba"
          >
            <div className="relative group flex items-center gap-2 select-none">
              {/* Soft Static Halo (No aggressive pulsing) */}
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: `${mascotConfig.accentColor || '#269984'}33` }}
              />

              {/* Character Avatar */}
              <div className="w-14 h-14 relative drop-shadow-xl">
                <Image
                  src={`/assets/${mascotConfig.asset || 'algo_group_109.svg'}`}
                  alt={mascotConfig.name}
                  width={56}
                  height={56}
                  className="object-contain pointer-events-none"
                />
              </div>

              {/* Pointing Badge / Arrow or Thinking State */}
              {isAiLoading ? (
                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase text-white shadow-2xl flex items-center gap-1.5 whitespace-nowrap border border-white/20 animate-pulse"
                  style={{ backgroundColor: mascotConfig.accentColor || '#269984' }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gondolkodom...</span>
                </div>
              ) : (
                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase text-white shadow-2xl flex items-center gap-1.5 whitespace-nowrap border border-white/20"
                  style={{ backgroundColor: mascotConfig.accentColor || '#269984' }}
                >
                  <span>
                    {mascotTargetPos.dir === 'left'
                      ? '👈'
                      : mascotTargetPos.dir === 'right'
                        ? '👉'
                        : '👇'}
                  </span>
                  <span>{mascotConfig.name}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. FIXED DIALOGUE DOCK (Always stays in the corner - elevated z-index so nothing blocks it!) */}
      <div className="fixed bottom-8 left-8 sm:left-8 z-[75] pointer-events-auto flex flex-col items-start select-none">
        <AnimatePresence mode="wait">
          {mascotVisible ? (
            isMinimized ? (
              /* Minimized Sleek Pill */
              <motion.div
                key="mascot-minimized-pill"
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full shadow-2xl border-2 cursor-pointer group"
                style={{ borderColor: `${mascotConfig.accentColor || '#269984'}40` }}
                onClick={() => setIsMinimized(false)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden relative border p-0.5 bg-slate-50 dark:bg-slate-800">
                  <Image
                    src={`/assets/${mascotConfig.asset || 'algo_group_109.svg'}`}
                    alt={mascotConfig.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[11px] font-black uppercase"
                      style={{ color: mascotConfig.accentColor || '#269984' }}
                    >
                      {mascotConfig.name}
                    </span>
                    {isAiLoading && (
                      <span className="flex items-center gap-1 text-[9px] text-teal-600 font-bold">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        gondolkodik...
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[140px]">
                    {chatHistory.length > 0
                      ? chatHistory[chatHistory.length - 1].content.slice(0, 30)
                      : mascotMessage.slice(0, 30)}
                    ...
                  </span>
                </div>
                <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors ml-1" />
              </motion.div>
            ) : (
              /* Full Fixed Dialogue Card */
              <motion.div
                key="mascot-full-dialog"
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                className="w-80 sm:w-96 max-w-[calc(100vw-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] border-2 flex flex-col gap-3 relative cursor-default"
                style={{ borderColor: `${mascotConfig.accentColor || '#269984'}40` }}
              >
                {/* Header: Avatar, Name, Badges & Window Controls */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    {/* Character Mini Avatar if not flying away */}
                    {!isFlownToTarget && (
                      <div className="w-8 h-8 rounded-full overflow-hidden relative border p-0.5 bg-slate-50 dark:bg-slate-800">
                        <Image
                          src={`/assets/${mascotConfig.asset || 'algo_group_109.svg'}`}
                          alt={mascotConfig.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span
                      className="text-xs font-black uppercase tracking-wider"
                      style={{ color: mascotConfig.accentColor || '#269984' }}
                    >
                      {mascotConfig.name}
                    </span>
                    {mode === 'ai-only' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                    {mode === 'ai-fallback' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        AI+
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isFlownToTarget && (
                      <button
                        type="button"
                        onClick={returnToDock}
                        title="Visszahívás a sarokba"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[10px] font-bold text-teal-700 dark:text-teal-300 hover:brightness-110 transition-colors"
                      >
                        <Anchor className="w-3 h-3" />
                        <span>Visszahívás</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMascotVisible(false);
                        returnToDock();
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {t('course.understand') || 'Értem'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      title="Minimalizálás"
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMascotVisible(false);
                        returnToDock();
                      }}
                      title="Bezárás"
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Warning / Advice indicator badge */}
                {mascotMood === 'mistake' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider w-fit">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{t('course.advice') || 'Segítő Tanács'}</span>
                  </div>
                )}

                {/* Conversation Body with Rich Text / Markdown Rendering (No duplicates!) */}
                <div className="max-h-[48vh] overflow-y-auto pr-1 space-y-2.5">
                  {chatHistory.length > 0 ? (
                    /* Conversational Thread */
                    <div className="space-y-2 pb-1">
                      {chatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ml-6 font-semibold border border-teal-500/20 text-right'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 mr-4 font-normal'
                          }`}
                        >
                          <ReactMarkdown components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ))}

                      {/* Prominent Thinking Indicator in Chat */}
                      {isAiLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-2xl text-xs bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/20 text-teal-900 dark:text-teal-200 mr-4 flex items-center gap-2.5 shadow-sm"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-[#269984] shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-1">
                              <span>{mascotConfig.name} épp gondolkodik</span>
                              <span className="animate-pulse">•••</span>
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                              Hamarosan kész a válasz
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : isAiLoading ? (
                    /* Initial Thinking State before message arrives */
                    <div className="py-4 px-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-500/20 flex items-center gap-3 text-xs font-semibold text-teal-800 dark:text-teal-200">
                      <Loader2 className="w-5 h-5 animate-spin text-[#269984] shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {mascotConfig.name} gondolkodik a lépésen...
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                          Hamarosan érkezik a segítség
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Initial Single Phase Advice */
                    <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 leading-relaxed font-montserrat">
                      <ReactMarkdown components={markdownComponents}>{mascotMessage}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Contextual Quick Replies Chips */}
                {quickReplies.length > 0 && !isAiLoading && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-white/10 hover:text-teal-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all active:scale-95"
                      >
                        <CornerDownRight className="w-3 h-3 text-[#269984]" />
                        <span>{reply}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Controls: ALWAYS-VISIBLE Chat Input */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                  <form onSubmit={handleSendQuestion} className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={userQueryInput}
                      onChange={(e) => setUserQueryInput(e.target.value)}
                      disabled={isAiLoading}
                      placeholder={
                        isAiLoading
                          ? `${mascotConfig.name} gondolkodik...`
                          : 'Kérdezz a kabalától...'
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#269984] disabled:opacity-60 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!userQueryInput.trim() || isAiLoading}
                      className="h-7 w-7 rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-40 transition-transform active:scale-95 shrink-0"
                      style={{ backgroundColor: mascotConfig.accentColor || '#269984' }}
                      title="Küldés"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )
          ) : (
            /* Compact Summon Button Pill */
            <motion.button
              key="mascot-summon-pill"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchAiMascotAdvice('summon')}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 dark:bg-gray-900/95 border-2 rounded-full shadow-xl hover:shadow-2xl transition-all group select-none backdrop-blur-md"
              style={{
                borderColor: `${mascotConfig.accentColor || '#269984'}40`,
                color: mascotConfig.accentColor || '#269984',
              }}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border p-0.5 pointer-events-none bg-slate-50 dark:bg-slate-800">
                <Image
                  src={`/assets/${mascotConfig.asset || 'algo_group_109.svg'}`}
                  alt={mascotConfig.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-black uppercase tracking-wider">
                {isAiLoading
                  ? `${mascotConfig.name} gondolkodik...`
                  : mascotConfig.summonLabel || `${mascotConfig.name} segítő`}
              </span>
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#269984]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
