'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, ShieldAlert, Sparkles, Star, X, RotateCcw } from 'lucide-react';

import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CourseBlueprint, CoursePhase } from '../../../lib/courses/courseCatalog';
import { VIDEOS } from '../../../lib/constants';

const AlgorithmVisualizer = dynamic(() => import('../Learning/AlgorithmVisualizer'));
const ControlVisualizer = dynamic(() => import('../Learning/ControlVisualizer'));
const CodeExercise = dynamic(() => import('../Learning/CodeExercise'));
const AliveVisualizer = dynamic(() => import('../Learning/AliveVisualizer'));
const VideoPlayer = dynamic(() => import('../Learning/VideoPlayer'));
const RestartCourseModal = dynamic(() => import('./RestartCourseModal'));

const MatchingComponent = dynamic(() => import('./MatchingComponent'));
const OrderingComponent = dynamic(() => import('./OrderingComponent'));
const GapFillComponent = dynamic(() => import('./GapFillComponent'));
const DebugComponent = dynamic(() => import('./DebugComponent'));

type ConfidenceLevel = 'very-sure' | 'sure' | 'unsure' | 'guess';
type PendingAdvance = {
  phaseId: string;
};

function getCompletionFlag(
  progress: ReturnType<typeof useAlgorithmStore.getState>['algorithmProgress'][string],
  courseProgress: { completedPhases: string[] },
  phase: CoursePhase,
) {
  if (courseProgress?.completedPhases?.includes(phase.phaseId)) return true;

  switch (phase.sourceView) {
    case 'video':
      return !!progress?.videoWatched;
    case 'animation':
      return !!progress?.animationCompleted;
    case 'control':
      return !!progress?.controlCompleted;
    case 'create':
      return !!progress?.createCompleted;
    case 'alive':
    case 'final-challenge':
      return !!progress?.aliveCompleted;
    default:
      return false;
  }
}

function InfoComponent({ phase, courseId }: { phase: CoursePhase; courseId: string }) {
  const { markCoursePhaseComplete } = useAlgorithmStore();
  const { t } = useLocale();
  const isRead = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {phase.infoContent}
        </p>
      </div>
      {!isRead && (
        <button
          onClick={() => markCoursePhaseComplete(courseId, phase.phaseId)}
          className="self-end px-8 py-3 bg-[#269984] text-white rounded-xl font-bold hover:bg-[#1f7a6a] transition-all shadow-lg shadow-[#269984]/20"
        >
          {t('course.info_understand')}
        </button>
      )}
    </div>
  );
}

function QuizComponent({ phase, courseId, onMistake }: { phase: CoursePhase; courseId: string, onMistake?: () => void }) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult } = useAlgorithmStore();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const questions = phase.quiz || [];
  const q = questions[0];

  if (!q) return null;

  const handleSelect = (idx: number) => {
    if (isDone) return;
    setSelectedIdx(idx);
    setShowFeedback(true);

    const isCorrect = idx === q.correctIndex;
    if (!isCorrect) onMistake?.();
    setCoursePhaseResult(courseId, phase.phaseId, isCorrect ? 'success' : 'fail');
    markCoursePhaseComplete(courseId, phase.phaseId);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h3 className="text-xl font-bold text-black dark:text-white leading-snug">{q.question}</h3>
      <div className="grid gap-3">
        {q.options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isHovered = !isDone && !showFeedback;
          const isCorrect = idx === q.correctIndex;

          let borderClass = 'border-gray-100 dark:border-white/10';
          let bgClass = 'bg-white dark:bg-white/5';
          let textClass = 'text-gray-700 dark:text-gray-300';

          if (showFeedback || isDone) {
            if (isCorrect) {
              borderClass = 'border-green-500';
              bgClass = 'bg-green-500/5';
              textClass = 'text-green-700 dark:text-green-400';
            } else if (isSelected) {
              borderClass = 'border-red-500';
              bgClass = 'bg-red-500/5';
              textClass = 'text-red-700 dark:text-red-400';
            }
          } else if (isSelected) {
            borderClass = 'border-[#269984]';
            bgClass = 'bg-[#269984]/5';
            textClass = 'text-[#269984]';
          }

          return (
            <button
              key={idx}
              disabled={isDone || showFeedback}
              onClick={() => handleSelect(idx)}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${borderClass} ${bgClass} ${textClass} ${isHovered && 'hover:border-[#269984] hover:bg-[#269984]/5'}`}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold shrink-0 ${isSelected ? 'border-current' : 'border-gray-200 dark:border-white/10'}`}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1 font-bold text-sm tracking-tight">{option}</span>
              {(showFeedback || isDone) && isCorrect && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </button>
          );
        })}
      </div>
      {(showFeedback || isDone) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-5 rounded-2xl border-l-4 ${
            selectedIdx === q.correctIndex || (isDone && selectedIdx === null)
              ? 'bg-green-500/5 border-green-500 text-green-800 dark:text-green-400'
              : 'bg-red-500/5 border-red-500 text-red-800 dark:text-red-400'
          }`}
        >
          <p className="font-black uppercase tracking-widest text-[10px] mb-2 opacity-60">
            {t('course.quiz_explanation')}
          </p>
          <p className="text-sm leading-relaxed font-medium">{q.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

function PhaseBody({ 
  phase, 
  course, 
  onMistake 
}: { 
  phase: CoursePhase; 
  course: CourseBlueprint; 
  onMistake?: () => void;
}) {
  const { t } = useLocale();
  const algorithmId = phase.sourceAlgorithmId || course.algorithmId;

  switch (phase.sourceView) {
    case 'info':
      return <InfoComponent phase={phase} courseId={course.slug} />;
    case 'quiz':
      return <QuizComponent phase={phase} courseId={course.slug} onMistake={onMistake} />;
    case 'video': {
      const video =
        VIDEOS.find((item) => item.id === algorithmId) ||
        VIDEOS.find((item) => item.id === 'bubble-sort');
      return video ? (
        <VideoPlayer youtubeId={video.youtubeId} algorithmId={algorithmId} title={phase.title} />
      ) : null;
    }
    case 'animation':
      return <AlgorithmVisualizer id={algorithmId} />;
    case 'control':
      return <ControlVisualizer algorithmId={algorithmId} onMistake={onMistake} />;
    case 'create':
      return <CodeExercise algorithmId={algorithmId} />;
    case 'alive':
      return <AliveVisualizer algorithmId={algorithmId} onMistake={onMistake} />;
    case 'match':
      return <MatchingComponent phase={phase} courseId={course.slug} onMistake={onMistake} />;
    case 'order':
      return <OrderingComponent phase={phase} courseId={course.slug} onMistake={onMistake} />;
    case 'gap-fill':
      return <GapFillComponent phase={phase} courseId={course.slug} onMistake={onMistake} />;
    case 'debug':
      return <DebugComponent phase={phase} courseId={course.slug} onMistake={onMistake} />;
    case 'video-custom':
      return (
        <VideoPlayer 
          youtubeId={phase.customVideoId || ''} 
          algorithmId={algorithmId} 
          title={phase.title} 
        />
      );
    case 'final-challenge':
      return (
        <div className="relative">
          <div className="absolute -top-4 -right-4 z-10 rotate-12 bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-white">
            {t('course.final_challenge')}
          </div>
          <AliveVisualizer algorithmId={algorithmId} onMistake={onMistake} />
        </div>
      );
    default:
      return null;
  }
}

export default function CoursePlayer({ course }: { course: CourseBlueprint }) {
  const {
    algorithmProgress,
    resetAlgorithmProgressTab,
    courseProgress,
    setCourseActivePhase,
    resetCoursePhasesFrom,
    resetCourseProgress,
    setCourseConfidenceRating,
    addCoursePoints,
    markCourseCompleted,
    updateCoursePhaseStats,
    incrementCourseMascotInteraction,
    incrementCourseMistakes,
    updateCourseTotalTime,
    syncProgress,
  } = useAlgorithmStore();
  const { t } = useLocale();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  // Enabled if still loading (on by default) or explicitly not false
  const mascotEnabled = sessionStatus === 'loading' ? true : session?.user?.mascotEnabled !== false;

  useEffect(() => {
    if (!mascotEnabled) setMascotVisible(false);
  }, [mascotEnabled]);

  const [phaseMistakesCount, setPhaseMistakesCount] = useState(0);
  const phaseStartTime = useRef(Date.now());
  const mascotHelpedCurrentPhase = useRef(false);
  const phaseMascotHelpCount = useRef(0);

  const completedPhaseStatuses = useMemo(
    () =>
      course.phases.map((phase) => {
        const progress = algorithmProgress[phase.sourceAlgorithmId || course.algorithmId] || {};
        const cp = courseProgress[course.slug] || { completedPhases: [] };
        return getCompletionFlag(progress, cp, phase);
      }),
    [algorithmProgress, course.algorithmId, course.phases, course.slug, courseProgress],
  );

  const firstIncompletePhaseIndex = useMemo(() => {
    const index = completedPhaseStatuses.findIndex((completed) => !completed);
    return index >= 0 ? index : course.phases.length;
  }, [completedPhaseStatuses, course.phases.length]);

  const initialPhaseIndex = useMemo(() => {
    const stored = courseProgress[course.slug]?.activePhaseIndex;
    if (typeof stored === 'number' && stored >= 0 && stored < course.phases.length) {
      return Math.min(stored, firstIncompletePhaseIndex);
    }

    return Math.max(Math.min(firstIncompletePhaseIndex, course.phases.length - 1), 0);
  }, [course.phases.length, course.slug, courseProgress, firstIncompletePhaseIndex]);

  const [activePhaseIndex, setActivePhaseIndex] = useState(initialPhaseIndex);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [mascotMood, setMascotMood] = useState<
    'idle' | 'mistake' | 'confidence' | 'neutral' | 'welcome' | 'streak' | 'overconfident'
  >('welcome');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [mascotActions, setMascotActions] = useState<boolean>(false); // Show Yes/No buttons
  const [streak, setStreak] = useState(0);
  const [phaseKey, setPhaseKey] = useState(0);
  const [pendingAdvance, setPendingAdvance] = useState<PendingAdvance | null>(null);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [isFinished, setIsFinished] = useState(!!courseProgress[course.slug]?.isCompleted);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isInternalReset, setIsInternalReset] = useState(false);
  const [modalMode, setModalMode] = useState<'restart' | 'checkpoint'>('restart');
  const [pendingPhaseIndex, setPendingPhaseIndex] = useState<number | null>(null);
  const promptShownRef = useRef(false);

  // Resume from stored state after hydration
  useEffect(() => {
    setHasHydrated(true);
    const storedProgress = courseProgress[course.slug];
    if (storedProgress) {
      if (typeof storedProgress.activePhaseIndex === 'number') {
        const resumeIndex = Math.min(storedProgress.activePhaseIndex, firstIncompletePhaseIndex);
        setActivePhaseIndex(resumeIndex);
      }
      if (storedProgress.isCompleted) {
        setIsFinished(true);
      }
    }
  }, [course.slug, firstIncompletePhaseIndex]); // Run once on mount (course.slug check handles navigation)

  // Auto-prompt to restart if course was already completed on entry
  useEffect(() => {
    if (courseProgress[course.slug]?.isCompleted && !promptShownRef.current) {
      promptShownRef.current = true;
      setIsInternalReset(false);
      setModalMode('restart');
      setShowRestartModal(true);
    }
  }, [course.slug, courseProgress[course.slug]?.isCompleted]);

  const handleConfirmRestart = () => {
    if (modalMode === 'restart') {
      resetCourseProgress(course.slug);
      course.phases.forEach((p) => {
        resetAlgorithmProgressTab(p.sourceAlgorithmId || course.algorithmId, p.sourceView);
      });
      setActivePhaseIndex(0);
      setIsFinished(false);
      setPhaseKey((v) => v + 1);
      setMascotVisible(false);
      setPendingAdvance(null);
      setShowConfidenceModal(false);
      syncProgress();
    } else if (modalMode === 'checkpoint' && pendingPhaseIndex !== null) {
      resetFutureProgressFrom(pendingPhaseIndex);
      resetCoursePhasesFrom(
        course.slug,
        pendingPhaseIndex,
        course.phases.map((p) => p.phaseId),
      );
      setActivePhaseIndex(pendingPhaseIndex);
      setPhaseKey((v) => v + 1);
      syncProgress();
    }
    setShowRestartModal(false);
    setPendingPhaseIndex(null);
  };

  const handleCancelRestart = () => {
    setShowRestartModal(false);
    setPendingPhaseIndex(null);
    if (!isInternalReset && modalMode === 'restart') {
      router.push('/courses');
    }
  };

  const [mascotDragPos, setMascotDragPos] = useState({ x: 0, y: 0 });

  const getRandomMessage = (pool: string[]) => {
    if (!pool || pool.length === 0) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const activePhase = course.phases[activePhaseIndex];

  // Monitor idle activity
  useEffect(() => {
    if (!activePhase) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          setMascotMood('idle');
          setMascotMessage(activePhase.idleHelp || course.mascot.idlePrompt);
          setMascotActions(true); // Offer help buttons
          if (mascotEnabled) setMascotVisible(true);
        },
        (course.mascot.idleTriggerSeconds || 30) * 1000,
      );
    };

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [
    activePhaseIndex,
    course.mascot.idleTriggerSeconds,
    course.mascot.idlePrompt,
    phaseKey,
    setMascotActions,
    setMascotMessage,
    setMascotMood,
    setMascotVisible,
    activePhase,
  ]);

  const currentMistakeTriggered = useMemo(() => {
    if (!activePhase) return false;
    const thresh = course.mascot.mistakeTriggerCount || 2;
    
    // Check algorithm-level control mistakes (persistent)
    const progress = algorithmProgress[activePhase.sourceAlgorithmId || course.algorithmId] || {};
    const algoMistakes = progress.controlMistakes || 0;

    // Trigger if EITHER persistent control mistakes OR current phase session mistakes hit thresh
    return (
      (activePhase.sourceView === 'control' && algoMistakes >= thresh) ||
      phaseMistakesCount >= thresh
    );
  }, [activePhase, algorithmProgress, course.algorithmId, course.mascot.mistakeTriggerCount, phaseMistakesCount]);

  useEffect(() => {
    if (currentMistakeTriggered) {
      setMascotMood('mistake');
      const intro = activePhase.mascotMistakeLine || course.mascot.mistakePrompt || t('course.mistake_prompt');
      const hint = activePhase.hintCopy;
      setMascotMessage(hint ? `${intro} ${hint}` : intro);
      if (mascotEnabled) setMascotVisible(true);
      setMascotActions(false);
      incrementCourseMascotInteraction(course.slug);
      incrementCourseMistakes(course.slug);
      mascotHelpedCurrentPhase.current = true;
      phaseMascotHelpCount.current += 1;
    }
  }, [currentMistakeTriggered, activePhase.mascotMistakeLine, activePhase.hintCopy, course.mascot.mistakePrompt, course.slug, incrementCourseMascotInteraction, incrementCourseMistakes]);

  const activeProgress =
    algorithmProgress[activePhase?.sourceAlgorithmId || course.algorithmId] || {};
  const activePhaseProgress = courseProgress[course.slug] || { completedPhases: [] };
  const phaseComplete = activePhase
    ? getCompletionFlag(activeProgress, activePhaseProgress, activePhase)
    : false;

  const canOpenPhase = (phaseIndex: number) => phaseIndex <= firstIncompletePhaseIndex;

  // Remove the automatic hiding of the mascot on phase change to fulfill "ne resetelődjön amikor válaszol"

  // Only jump index when the course slug changes (mount or navigation)
  const lastSlug = useRef(course.slug);
  useEffect(() => {
    if (lastSlug.current !== course.slug) {
      setActivePhaseIndex(initialPhaseIndex);
      lastSlug.current = course.slug;
    }
  }, [course.slug, initialPhaseIndex]);

  // Handle mascot message when phase changes (triggered by user or slug change)
  useEffect(() => {
    // 1. Log time for PREVIOUS phase before moving on
    const logPreviousPhaseTime = () => {
      const elapsed = Date.now() - phaseStartTime.current;
      updateCourseTotalTime(course.slug, elapsed);

      // Extract the PREVIOUS phase ID
      // This is tricky because we already advanced activePhaseIndex in some cases
      // But we can use a ref for lastActiveIndex
    };

    // Actually, it's better to update on unmount of the phase or when handleContinue happens.

    const phaseAdvice = activePhase.mascotLine;
    if (phaseAdvice) {
      setMascotMood('welcome');
      setMascotMessage(phaseAdvice);
      if (mascotEnabled) setMascotVisible(true);
      setMascotActions(false);
      // If it's a specific instruction (not just general objective), count it
      if (activePhase.mascotLine) {
        incrementCourseMascotInteraction(course.slug);
        mascotHelpedCurrentPhase.current = true;
      }
    }
    
    phaseStartTime.current = Date.now();
    phaseMascotHelpCount.current = phaseAdvice ? 1 : 0;
    setPhaseMistakesCount(0);
    mascotHelpedCurrentPhase.current = !!phaseAdvice;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhaseIndex, course.slug]);

  useEffect(() => {
    if (!hasHydrated) return;
    setCourseActivePhase(course.slug, activePhaseIndex);
  }, [activePhaseIndex, course.slug, setCourseActivePhase, hasHydrated]);

  const resetFutureProgressFrom = (phaseIndex: number) => {
    const futurePhases = course.phases.slice(phaseIndex + 1);

    futurePhases.forEach((phase) => {
      resetAlgorithmProgressTab(phase.sourceAlgorithmId || course.algorithmId, phase.sourceView);
    });
  };

  const handleJumpToPhase = (phaseIndex: number) => {
    if (!canOpenPhase(phaseIndex)) {
      return;
    }

    if (phaseIndex < activePhaseIndex) {
      setIsInternalReset(true);
      setModalMode('checkpoint');
      setPendingPhaseIndex(phaseIndex);
      setShowRestartModal(true);
      return;
    }

    setActivePhaseIndex(phaseIndex);
  };

  const applyAdvance = (level?: ConfidenceLevel) => {
    if (!activePhase) return;

    const result = courseProgress[course.slug]?.phaseResults?.[activePhase.phaseId];
    const isAlreadyCompleted = courseProgress[course.slug]?.completedPhases.includes(
      activePhase.phaseId,
    );
    // Don't award points if the user failed a quiz phase
    const isFailure = activePhase.sourceView === 'quiz' && result === 'fail';

    // Smart logic for mascot reactions based on results
    if (!isAlreadyCompleted) {
      if (isFailure) {
        setStreak(0);
        if (level === 'very-sure') {
          // Overconfident case
          if (course.mascot.enabled) {
            setMascotMood('overconfident');
            setMascotMessage(getRandomMessage(course.mascot.overconfidentMessages));
            if (mascotEnabled) setMascotVisible(true);
            setMascotActions(false);
          }
        }
      } else {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak >= 3 && course.mascot.enabled) {
          setMascotMood('streak');
          setMascotMessage(getRandomMessage(course.mascot.streakMessages));
          if (mascotEnabled) setMascotVisible(true);
          setMascotActions(false);
        }
      }
    }

    if (level) {
      // Only award points if the phase was not already completed and it's not a failure
      if (!isAlreadyCompleted && !isFailure) {
        addCoursePoints(course.slug, 20);
      }
      setCourseConfidenceRating(course.slug, level);
    } else {
      if (!isAlreadyCompleted && !isFailure) {
        addCoursePoints(course.slug, 20);
      }
    }

    const elapsed = Date.now() - phaseStartTime.current;
    
    // Auto-success for info and video phases once completed
    const isAutoSuccess = activePhase.sourceView === 'info' || activePhase.sourceView === 'video';
    const storedResult = courseProgress[course.slug]?.phaseResults?.[activePhase.phaseId];
    const finalResult = storedResult || (isAutoSuccess ? 'success' : null);
    const isSuccess = finalResult === 'success';

    // Track "improved after mascot"
    const improved = mascotHelpedCurrentPhase.current && isSuccess;

    // Determine if help was used in the algorithm part
    const progress = algorithmProgress[activePhase.sourceAlgorithmId || course.algorithmId] || {};
    let helpUsed = false;
    if (activePhase.sourceView === 'create') helpUsed = !!progress.createHelpUsed;
    if (activePhase.sourceView === 'alive' || activePhase.sourceView === 'final-challenge') helpUsed = !!progress.aliveHelpUsed;
    if (activePhase.sourceView === 'control') helpUsed = (progress.controlHintsUsed || 0) > 0;

    updateCoursePhaseStats(course.slug, activePhase.phaseId, {
      timeSpentMs: (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.timeSpentMs || 0) + elapsed,
      completed: true,
      result: isSuccess ? 'success' : 'fail',
      helpUsed,
      mascotHelpCount: (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mascotHelpCount || 0) + phaseMascotHelpCount.current,
      improvedAfterMascot: improved,
      mistakes: (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mistakes || 0) + phaseMistakesCount,
      mascotIntentionallyDisabled: !mascotEnabled,
    });
    updateCourseTotalTime(course.slug, elapsed);

    if (activePhaseIndex < course.phases.length - 1) {
      setActivePhaseIndex((value) => value + 1);
    } else {
      markCourseCompleted(course.slug);
      setIsFinished(true);
      promptShownRef.current = true;
    }

    setPendingAdvance(null);
  };

  const handleContinue = () => {
    if (!activePhase || !phaseComplete) return;

    const nextPhaseIndex =
      activePhaseIndex < course.phases.length - 1 ? activePhaseIndex + 1 : null;

    if (nextPhaseIndex !== null && !canOpenPhase(nextPhaseIndex)) {
      return;
    }

    const askConfidenceNow = activePhase.askConfidence;

    if (askConfidenceNow) {
      if (course.mascot.enabled) {
        setMascotMood('confidence');
        setMascotMessage(t('course.confidence_prompt'));
        if (mascotEnabled) setMascotVisible(true);
      }
      setShowConfidenceModal(true);
      return;
    }

    applyAdvance();
  };

  const handleResetCourse = () => {
    setIsInternalReset(true);
    setModalMode('restart');
    setShowRestartModal(true);
  };

  if (!activePhase) return null;

  return (
    <section className="relative rounded-[2.25rem] border border-[#269984]/15 bg-white p-6 shadow-[0_18px_70px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/5">
      <AnimatePresence>
        <RestartCourseModal
          isOpen={showRestartModal}
          onClose={handleCancelRestart}
          onConfirm={handleConfirmRestart}
          title={modalMode === 'restart' ? t('course.restart_title') : t('course.checkpoint_title')}
          message={
            modalMode === 'restart'
              ? (courseProgress[course.slug]?.isCompleted && !isInternalReset 
                  ? t('course.restart_completed_message')
                  : t('course.restart_message'))
              : t('course.checkpoint_message')
          }
          confirmLabel={modalMode === 'restart' ? t('course.restart_confirm') : t('course.checkpoint_confirm')}
          cancelLabel={isInternalReset ? t('course.cancel_continue') : t('course.cancel_back')}
        />

        {isFinished && (
          <motion.div
            key="finish-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-[2.25rem] bg-white/90 p-8 backdrop-blur-md dark:bg-black/90"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="absolute -inset-4 animate-pulse rounded-full bg-amber-400/20 blur-xl px-12" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                  className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl"
                >
                  <Sparkles className="h-12 w-12 text-white" />
                </motion.div>
              </div>

              <h2 className="mb-2 text-4xl font-black text-black dark:text-white uppercase tracking-tight">
                {t('course.congratulations')}
              </h2>
              <p className="mb-8 text-lg font-bold text-[#269984] uppercase tracking-widest">
                {t('course.completed_course', { title: course.title })}
              </p>

              <div className="mb-10 grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/20 dark:bg-amber-900/10">
                  <div className="text-[10px] font-black uppercase tracking-tighter text-amber-600 dark:text-amber-500/70 mb-1">
                    {t('course.total_score')}
                  </div>
                  <div className="text-3xl font-black text-[#B45309] dark:text-amber-400 tabular-nums">
                    {courseProgress[course.slug]?.points || 0}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[#269984]/10 bg-[#f0fbf9]/50 p-4 dark:border-white/5 dark:bg-white/5">
                  <div className="text-[10px] font-black uppercase tracking-tighter text-[#269984] dark:text-[#269984]/70 mb-1">
                    {t('course.total_checkpoints')}
                  </div>
                  <div className="text-3xl font-black text-[#269984] dark:text-[#269984] tabular-nums">
                    {course.phases.length}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#269984] px-8 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-[#269984]/30 transition-transform hover:-translate-y-1"
                >
                  {t('course.next_courses')}
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => setIsFinished(false)}
                  className="rounded-2xl border border-gray-100 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50 dark:border-white/5 dark:bg-white/5 dark:text-gray-500"
                >
                  {t('course.review_course')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f0fbf9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#269984] dark:bg-white/10">
            <Sparkles className="h-3.5 w-3.5" />
            {t('course.playable_course')}
          </div>
          <h2 className="mt-3 text-3xl font-bold text-black dark:text-white">{course.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-400">
            {course.heroTagline}
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <button
            onClick={handleResetCourse}
            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10"
          >
            {t('course.reset_course')}
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {t('course.points')}
              </div>
              <div className="mt-1 font-bold text-black dark:text-white">
                {courseProgress[course.slug]?.points || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {t('course.phase')}
              </div>
              <div className="mt-1 font-bold text-black dark:text-white">
                {activePhaseIndex + 1}/{course.phases.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 mb-14 px-4">
        {/* Progress Container */}
        <div className="relative pt-12">
          {/* Main Track */}
          <div className="absolute top-1/2 left-0 w-full h-[6px] -translate-y-1/2 rounded-full bg-gray-100 dark:bg-white/5" />

          {/* Active Fill Track */}
          <motion.div
            initial={false}
            animate={{
              width: `${(activePhaseIndex / Math.max(1, course.phases.length - 1)) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute top-1/2 left-0 h-[6px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#269984] to-[#36b39c]"
          />

          {/* Spheres / Checkpoints */}
          <div className="absolute top-1/2 left-0 w-full flex justify-between -translate-y-1/2">
            {course.phases.map((phase, index) => {
              const completed = completedPhaseStatuses[index];
              const isActive = index === activePhaseIndex;
              const locked = !canOpenPhase(index) && !completed;

              return (
                <div key={phase.phaseId} className="relative flex flex-col items-center group">
                  {/* Tooltip Label (Shows on Hover) */}
                  <div className="absolute bottom-full mb-6 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-30">
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xl flex flex-col items-center">
                      <span>{phase.title}</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-white" />
                    </div>
                  </div>

                  {/* The Sphere */}
                  <motion.button
                    disabled={locked}
                    onClick={() => handleJumpToPhase(index)}
                    whileHover={!locked ? { scale: 1.25, y: -2 } : {}}
                    whileTap={!locked ? { scale: 0.9 } : {}}
                    className={`relative z-20 w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 ${
                      locked
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed dark:bg-white/5 dark:border-white/10 opacity-40'
                        : completed
                          ? 'bg-[#269984] border-[#269984] text-white shadow-[0_0_15px_rgba(38,153,132,0.3)]'
                          : isActive
                            ? 'bg-white border-[#269984] text-[#269984] shadow-[0_0_20px_rgba(38,153,132,0.4)] scale-110'
                            : 'bg-white border-gray-200 text-gray-400 dark:bg-black/40 dark:border-white/10 hover:border-[#269984]/50'
                    }`}
                  >
                    {completed ? (
                      <Check className="w-4 h-4 stroke-[3px]" />
                    ) : (
                      <span className="text-[11px] font-black">{index + 1}</span>
                    )}
                  </motion.button>

                  {/* Phase Status indicator below */}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-full mt-4 flex flex-col items-center"
                    >
                      <div className="w-1 h-1 rounded-full bg-[#269984] mb-1" />
                      <span className="text-[9px] font-bold text-[#269984] uppercase tracking-tighter whitespace-nowrap">
                        Current
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend / Status Text */}
        <div className="mt-12 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#269984]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border-2 border-[#269984] bg-white" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/10" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Locked
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-black/20 px-3 py-1 rounded-full border border-gray-100 dark:border-white/5">
            {phaseComplete ? 'Phase complete' : 'In Progress'} • {activePhaseIndex + 1}/
            {course.phases.length}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#269984]">
                Current phase
              </div>
              <h3 className="mt-2 text-2xl font-bold text-black dark:text-white">
                {activePhase.title}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-400">
                {activePhase.summary}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f8faf9] px-4 py-3 text-sm dark:bg-black/20">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Completion
              </div>
              <div
                className={`mt-1 font-bold ${phaseComplete ? 'text-green-600 dark:text-green-400' : 'text-[#269984]'}`}
              >
                {phaseComplete ? 'Ready to continue' : 'Finish the embedded activity'}
              </div>
            </div>
          </div>

          <div key={`${activePhase.phaseId}-${phaseKey}`} className="mt-6">
            <PhaseBody 
            phase={activePhase} 
            course={course} 
            onMistake={() => setPhaseMistakesCount(c => c + 1)} 
          />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleContinue}
              disabled={!phaseComplete}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: course.accentColor }}
            >
              {activePhaseIndex === course.phases.length - 1 ? 'Finish course' : 'Next phase'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {pendingAdvance && (
          <div className="rounded-[2rem] border border-[#269984]/20 bg-[#f0fbf9] p-5 shadow-sm dark:bg-black/20">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#269984]">
              {t('courses.confidence_check')}
            </div>
            <p className="mt-2 text-sm leading-7 text-[#444] dark:text-gray-300">
              Hogy érzed, mennyire sikerült eddig elsajátítani a látottakat?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(
                [
                  ['very-sure', 'Nagyon biztos vagyok'],
                  ['sure', 'Biztos vagyok'],
                  ['unsure', 'Bizonytalan vagyok'],
                  ['guess', 'Csak tippeltem'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => applyAdvance(value)}
                  className="rounded-full border border-[#269984]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#269984] transition-colors hover:bg-[#e8f7f3] dark:bg-black/20 dark:text-white dark:hover:bg-white/10"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfidenceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowConfidenceModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-gray-900"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex flex-col items-end mb-6">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 italic">
                    Rewards
                  </span>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 shadow-sm animate-in zoom-in-95 duration-500">
                    <div className="flex animate-in fade-in slide-in-from-right-10 duration-700">
                      <div className="flex items-center gap-3 px-6 py-3 rounded-[2rem] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-700/20 shadow-lg">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shadow-xl shadow-amber-400/30 animate-pulse">
                          <Star className="w-6 h-6 text-white fill-white/20" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-amber-600 dark:text-amber-400/80 -mb-1">
                            Grand Total
                          </span>
                          <span className="font-montserrat font-black text-[#B45309] dark:text-amber-300 text-2xl tabular-nums">
                            {courseProgress[course.slug]?.points || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-black dark:text-white">
                  Hogy állunk a tudással?
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  Szeretnénk tudni, hogy eddig mennyire érted a kurzust, és minden világos-e
                  számodra.
                </p>

                <div className="grid w-full gap-3">
                  {(
                    [
                      ['very-sure', 'Nagyon biztos vagyok benne!'],
                      ['sure', 'Azt hiszem, értem az egészet.'],
                      ['unsure', 'Vannak még homályos részek.'],
                      ['guess', 'Még csak barátkozom vele.'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setShowConfidenceModal(false);
                        applyAdvance(value);
                      }}
                      className="group flex items-center justify-between rounded-2xl border-2 border-gray-100 bg-gray-50 px-6 py-4 text-left transition-all hover:border-[#269984] hover:bg-[#269984]/5 dark:border-white/5 dark:bg-white/5 dark:hover:border-[#269984]"
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#269984]">
                        {label}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#269984]" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowConfidenceModal(false)}
                  className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
                >
                  Később válaszolok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* UNIFIED HUB: Handles both the summon button and Bubi himself */}
      {course.mascot.enabled && mascotEnabled && (
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={{
            left: 0,
            right: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000,
            top: typeof window !== 'undefined' ? -window.innerHeight + 100 : -1000,
            bottom: 0,
          }}
          animate={{ x: mascotDragPos.x, y: mascotDragPos.y }}
          onDragEnd={(_, info) => {
            setMascotDragPos({
              x: mascotDragPos.x + info.offset.x,
              y: mascotDragPos.y + info.offset.y,
            });
          }}
          className="fixed bottom-8 left-8 z-[60] pointer-events-none flex flex-col items-start"
        >
          <div className="pointer-events-auto">
            <AnimatePresence mode="wait">
              {mascotVisible ? (
                <motion.div
                  key="mascot-full"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="flex flex-col items-start gap-4 w-64"
                >
                  <motion.div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-[#269984]/20 relative cursor-default">
                    <div className="absolute top-full left-6 w-3 h-3 bg-white dark:bg-gray-900 rotate-45 border-r border-b border-[#269984]/20" />

                    {mascotMood === 'mistake' && (
                      <div className="mb-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Tanács
                      </div>
                    )}

                    <p className="font-montserrat text-sm leading-relaxed text-gray-700 dark:text-gray-300 pr-2">
                      {mascotMessage}
                    </p>

                    {mascotActions && mascotMood === 'idle' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setMascotMood('neutral');
                            const advice =
                              activePhase.idleHelp || activePhase.hintCopy || activePhase.mascotLine || activePhase.summary;
                            setMascotMessage(advice);
                            setMascotActions(false);
                          }}
                          className="flex-1 py-1.5 bg-[#269984] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        >
                          Igen, segíts!
                        </button>
                        <button
                          onClick={() => setMascotVisible(false)}
                          className="flex-1 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        >
                          Nem köszi
                        </button>
                      </div>
                    )}

                    {!mascotActions && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          <button
                            onClick={() =>
                              setMascotMessage(
                                `${activePhase.title}: ${activePhase.hintCopy || activePhase.mascotLine || activePhase.summary}`,
                              )
                            }
                            className="px-2 py-1 bg-[#269984]/5 hover:bg-[#269984]/15 text-[#269984] rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors flex-shrink-0"
                          >
                            Hogy állunk?
                          </button>
                          <button
                            onClick={() => setMascotMessage(course.summary)}
                            className="px-2 py-1 bg-[#269984]/5 hover:bg-[#269984]/15 text-[#269984] rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors flex-shrink-0"
                          >
                            Összegzés
                          </button>
                        </div>
                        <button
                          onClick={() => setMascotVisible(false)}
                          className="block w-full text-center py-2 bg-[#f0fbf9] dark:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#269984] hover:bg-[#269984] hover:text-white transition-colors"
                        >
                          Értem
                        </button>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="w-16 h-16 relative cursor-grab active:cursor-grabbing group select-none ml-4"
                    onClick={() => {
                      setMascotMood('welcome');
                      setMascotMessage(getRandomMessage(course.mascot.welcomeMessages));
                      setMascotActions(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-[#269984]/10 rounded-full blur-2xl group-hover:bg-[#269984]/20 transition-colors" />
                    <Image
                      src={`/assets/${course.mascot.asset}`}
                      alt={course.mascot.name}
                      width={64}
                      height={64}
                      className="drop-shadow-2xl transform active:scale-95 transition-transform"
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.button
                  key="summon-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setMascotMood('neutral');
                    const welcomeMsg =
                      activePhase.mascotLine || `Ebben a részben épp: ${activePhase.title}`;
                    setMascotMessage(welcomeMsg);
                    setMascotActions(false);
                    setMascotVisible(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-[#269984]/20 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-[#269984] group cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-[#269984]/10 pointer-events-none">
                    <Image
                      src={`/assets/${course.mascot.asset}`}
                      alt="Mascot"
                      width={20}
                      height={20}
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#269984] pointer-events-none">
                    {course.mascot.summonLabel}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </section>
  );
}
