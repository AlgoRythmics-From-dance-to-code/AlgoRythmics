'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { RichText } from '../Payload/RichText';

import { useShallow } from 'zustand/react/shallow';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import type { CourseBlueprint, CoursePhase } from '../../../lib/courses/courseCatalog';
import { VIDEOS } from '../../../lib/constants';
import { BaseUser } from '../../../lib/types/auth';
import { useAnalytics } from '../../hooks/useAnalytics';

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
const ConfidenceSelector = dynamic(() => import('./ConfidenceSelector'));
const AdaptiveFeedbackCard = dynamic(() => import('./AdaptiveFeedbackCard'));

import {
  evaluateConfidence,
  computeCourseConfidenceSummary,
  type ConfidenceLevel,
  type ConfidenceEvaluationResult,
} from '../../../lib/courses/confidenceEngine';

type LegacyConfidenceLevel = 'very-sure' | 'sure' | 'unsure' | 'guess' | ConfidenceLevel;

function getCompletionFlag(
  progress: ReturnType<typeof useAlgorithmStore.getState>['algorithmProgress'][string],
  courseProgress: { completedPhases: string[]; firstStartedAt?: string },
  phase: CoursePhase,
) {
  if (courseProgress?.completedPhases?.includes(phase.phaseId)) return true;

  const courseStartStr = courseProgress?.firstStartedAt;
  if (!courseStartStr) return false;

  const courseStartTime = new Date(courseStartStr).getTime();

  const isCompletedAfterCourseStart = (completionTimeStr?: string | null) => {
    if (!completionTimeStr) return false;
    return new Date(completionTimeStr).getTime() >= courseStartTime - 5000;
  };

  switch (phase.sourceView) {
    case 'video':
    case 'video-custom':
      return !!progress?.videoWatched && isCompletedAfterCourseStart(progress?.videoCompletedAt);
    case 'animation':
      return (
        !!progress?.animationCompleted &&
        isCompletedAfterCourseStart(progress?.animationCompletedAt)
      );
    case 'control':
      return (
        !!progress?.controlCompleted && isCompletedAfterCourseStart(progress?.controlCompletedAt)
      );
    case 'create':
      return (
        !!progress?.createCompleted && isCompletedAfterCourseStart(progress?.createCompletedAt)
      );
    case 'alive':
    case 'final-challenge':
      return !!progress?.aliveCompleted && isCompletedAfterCourseStart(progress?.aliveCompletedAt);
    default:
      return false;
  }
}

// --- Sub-components (InfoComponent, QuizComponent, PhaseBody) unchanged from original ---

function InfoComponent({
  phase,
  courseId,
  accentColor,
}: {
  phase: CoursePhase;
  courseId: string;
  accentColor: string;
}) {
  const { markCoursePhaseComplete, setCoursePhasePoints, syncProgress } = useAlgorithmStore(
    useShallow((state) => ({
      markCoursePhaseComplete: state.markCoursePhaseComplete,
      setCoursePhasePoints: state.setCoursePhasePoints,
      syncProgress: state.syncProgress,
    })),
  );
  const { t } = useLocale();
  const isRead = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="markdown-content">
        <RichText content={phase.infoContent} />
      </div>
      {!isRead && (
        <button
          onClick={() => {
            const maxPoints = phase.maxPoints || 10;
            setCoursePhasePoints(courseId, phase.phaseId, {
              earned: maxPoints,
              max: maxPoints,
              helpUsed: false,
              partial: false,
            });
            markCoursePhaseComplete(courseId, phase.phaseId);
            syncProgress();
          }}
          style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}ee)` }}
          className="self-end px-8 py-3 text-white rounded-xl font-bold transition-all shadow-lg hover:brightness-110 active:scale-95"
        >
          {t('course.info_understand')}
        </button>
      )}
    </div>
  );
}

function QuizComponent({
  phase,
  courseId,
  accentColor: _accentColor,
  onMistake,
}: {
  phase: CoursePhase;
  courseId: string;
  accentColor: string;
  onMistake?: () => void;
}) {
  const { t } = useLocale();
  const {
    markCoursePhaseComplete,
    setCoursePhasePoints,
    setCoursePhaseResult,
    setCourseConfidenceRating,
    syncProgress,
  } = useAlgorithmStore(
    useShallow((state) => ({
      markCoursePhaseComplete: state.markCoursePhaseComplete,
      setCoursePhasePoints: state.setCoursePhasePoints,
      setCoursePhaseResult: state.setCoursePhaseResult,
      setCourseConfidenceRating: state.setCourseConfidenceRating,
      syncProgress: state.syncProgress,
    })),
  );
  const [tentativeIdx, setTentativeIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const questions = phase.quiz || [];
  const q = questions[0];

  if (!q) return null;

  const handleSubmit = (idxToSubmit: number) => {
    if (isDone || evaluation) return;
    setSelectedIdx(idxToSubmit);

    const isCorrect = idxToSubmit === q.correctIndex;
    const evalResult = evaluateConfidence({
      isCorrect,
      confidence,
      basePoints: phase.maxPoints || 10,
      explanation: q.explanation,
      selectedAnswerText: q.options[idxToSubmit],
      correctAnswerText: q.options[q.correctIndex],
      hintCopy: phase.hintCopy,
      summary: phase.summary,
    });

    setEvaluation(evalResult);

    if (!isCorrect) onMistake?.();
    setCoursePhaseResult(courseId, phase.phaseId, isCorrect ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);

    const maxPoints = phase.maxPoints || 10;
    const earned = Math.min(
      maxPoints + evalResult.bonusPoints,
      Math.round(maxPoints * evalResult.scoreMultiplier) + evalResult.bonusPoints,
    );

    setCoursePhasePoints(courseId, phase.phaseId, {
      earned,
      max: maxPoints,
      helpUsed: false,
      partial: !isCorrect,
    });

    if (isCorrect || !evalResult.canRetry) {
      markCoursePhaseComplete(courseId, phase.phaseId);
    }

    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    setSelectedIdx(null);
    setTentativeIdx(null);
    setEvaluation(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h3 className="text-xl font-bold text-black dark:text-white leading-snug">{q.question}</h3>

      {/* Options List */}
      <div className="grid gap-3">
        {q.options.map((option, idx) => {
          const isTentative = tentativeIdx === idx && !evaluation && !isDone;
          const isFinalSelected = selectedIdx === idx;
          const isCorrect = idx === q.correctIndex;

          let borderClass = 'border-gray-200/80 dark:border-white/10';
          let bgClass = 'bg-white dark:bg-white/5';
          let textClass = 'text-gray-700 dark:text-gray-300';

          if (evaluation || isDone) {
            if (isCorrect) {
              borderClass = 'border-emerald-500 ring-2 ring-emerald-500/20';
              bgClass = 'bg-emerald-500/10 dark:bg-emerald-500/20';
              textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
            } else if (isFinalSelected) {
              borderClass = 'border-rose-500 ring-2 ring-rose-500/20';
              bgClass = 'bg-rose-500/10 dark:bg-rose-500/20';
              textClass = 'text-rose-700 dark:text-rose-300';
            }
          } else if (isTentative) {
            borderClass = 'border-[#269984] ring-2 ring-[#269984]/25 shadow-md';
            bgClass = 'bg-[#269984]/10 dark:bg-[#269984]/20';
            textClass = 'text-[#269984] dark:text-[#36D6BA] font-bold';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isDone || !!evaluation}
              onClick={() => {
                if (isDone || evaluation) return;
                setTentativeIdx(idx);
              }}
              className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.005] active:scale-[0.995] ${borderClass} ${bgClass} ${textClass}`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  isTentative
                    ? 'border-[#269984] bg-[#269984] text-white shadow-sm'
                    : isFinalSelected
                      ? 'border-current text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1 font-semibold text-sm sm:text-base tracking-tight leading-snug">
                {option}
              </span>
              {(evaluation || isDone) && isCorrect && (
                <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Confidence Level Selector & Submit Action */}
      {!evaluation && !isDone && (
        <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 shadow-sm">
          <ConfidenceSelector selected={confidence} onChange={(level) => setConfidence(level)} />

          <button
            type="button"
            disabled={tentativeIdx === null}
            onClick={() => tentativeIdx !== null && handleSubmit(tentativeIdx)}
            className={`w-full py-4 rounded-xl font-montserrat font-black text-sm uppercase tracking-widest text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              tentativeIdx !== null
                ? 'bg-[#269984] hover:bg-[#208270] shadow-[#269984]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer'
                : 'bg-gray-300 dark:bg-white/10 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{t('confidence.submit_answer') || 'Válasz megerősítése'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Adaptive Feedback Card */}
      {evaluation && <AdaptiveFeedbackCard evaluation={evaluation} onRetry={handleRetry} />}

      {/* Legacy/Default Done Feedback if opened after completion */}
      {!evaluation && isDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border-l-4 bg-green-500/5 border-green-500 text-green-800 dark:text-green-400"
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
  onMistake,
  accentColor,
}: {
  phase: CoursePhase;
  course: CourseBlueprint;
  onMistake?: () => void;
  accentColor: string;
}) {
  const { t } = useLocale();
  const algorithmId = phase.sourceAlgorithmId || course.algorithmId;

  switch (phase.sourceView) {
    case 'info':
      return <InfoComponent phase={phase} courseId={course.slug} accentColor={accentColor} />;
    case 'quiz':
      return (
        <QuizComponent
          phase={phase}
          courseId={course.slug}
          accentColor={course.accentColor}
          onMistake={onMistake}
        />
      );
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
      return <CodeExercise algorithmId={algorithmId} onMistake={onMistake} />;
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

// --- Main Component ---

export default function CoursePlayer({ course }: { course: CourseBlueprint }) {
  const {
    algorithmProgress,
    resetAlgorithmProgressTab,
    courseProgress,
    setCourseActivePhase,
    resetCoursePhasesFrom,
    resetCourseProgress,
    setCourseConfidenceRating,
    setCoursePhasePoints,
    markCoursePhaseComplete,
    markCourseCompleted,
    updateCoursePhaseStats,
    incrementCourseMascotInteraction,
    incrementCourseMistakes,
    updateCourseTotalTime,
    isRehydrated,
    syncProgress,
  } = useAlgorithmStore(
    useShallow((state) => ({
      algorithmProgress: state.algorithmProgress,
      resetAlgorithmProgressTab: state.resetAlgorithmProgressTab,
      courseProgress: state.courseProgress,
      setCourseActivePhase: state.setCourseActivePhase,
      resetCoursePhasesFrom: state.resetCoursePhasesFrom,
      resetCourseProgress: state.resetCourseProgress,
      setCourseConfidenceRating: state.setCourseConfidenceRating,
      setCoursePhasePoints: state.setCoursePhasePoints,
      markCoursePhaseComplete: state.markCoursePhaseComplete,
      markCourseCompleted: state.markCourseCompleted,
      updateCoursePhaseStats: state.updateCoursePhaseStats,
      incrementCourseMascotInteraction: state.incrementCourseMascotInteraction,
      incrementCourseMistakes: state.incrementCourseMistakes,
      updateCourseTotalTime: state.updateCourseTotalTime,
      isRehydrated: state.isRehydrated,
      syncProgress: state.syncProgress,
    })),
  );

  const { trackEvent } = useAnalytics(course.algorithmId, undefined, course.slug);
  const { t } = useLocale();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const mascotEnabled =
    sessionStatus === 'loading' ? true : (session?.user as BaseUser)?.mascotEnabled !== false;

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

  const courseProgressSnapshotRef = useRef(courseProgress);
  const lastSnapshotSlugRef = useRef('');

  const initialPhaseIndex = useMemo(() => {
    const stored = courseProgress[course.slug]?.activePhaseIndex;
    if (typeof stored === 'number' && stored >= 0 && stored < course.phases.length) {
      return Math.min(stored, firstIncompletePhaseIndex);
    }
    return Math.max(Math.min(firstIncompletePhaseIndex, course.phases.length - 1), 0);
  }, [course.phases.length, course.slug, firstIncompletePhaseIndex, courseProgress]);

  const [activePhaseIndex, setActivePhaseIndex] = useState(initialPhaseIndex);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverGap, setPopoverGap] = useState<{
    index: number;
    phases: CoursePhase[];
    x: number;
  } | null>(null);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [mascotMood, setMascotMood] = useState<
    'idle' | 'mistake' | 'confidence' | 'neutral' | 'welcome' | 'streak' | 'overconfident'
  >('welcome');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [mascotActions, setMascotActions] = useState<boolean>(false);
  const [streak, setStreak] = useState(0);
  const [phaseKey, setPhaseKey] = useState(0);
  const [isFinished, setIsFinished] = useState(!!courseProgress[course.slug]?.isCompleted);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isInternalReset, setIsInternalReset] = useState(false);
  const [modalMode, setModalMode] = useState<'restart' | 'checkpoint'>('restart');
  const [pendingPhaseIndex, setPendingPhaseIndex] = useState<number | null>(null);
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isRehydrated) return;
    if (lastSnapshotSlugRef.current !== course.slug) {
      courseProgressSnapshotRef.current = useAlgorithmStore.getState().courseProgress;
      lastSnapshotSlugRef.current = course.slug;
    }
    setHasHydrated(true);
    const storedProgress = useAlgorithmStore.getState().courseProgress[course.slug];
    if (storedProgress) {
      if (typeof storedProgress.activePhaseIndex === 'number')
        setActivePhaseIndex(Math.min(storedProgress.activePhaseIndex, firstIncompletePhaseIndex));
      if (storedProgress.isCompleted) setIsFinished(true);
    }
  }, [isRehydrated, course.slug, firstIncompletePhaseIndex]);

  useEffect(() => {
    if (courseProgressSnapshotRef.current[course.slug]?.isCompleted && !promptShownRef.current) {
      promptShownRef.current = true;
      setIsInternalReset(false);
      setModalMode('restart');
      setShowRestartModal(true);
    }
  }, [course.slug]);

  const handleConfirmRestart = () => {
    if (modalMode === 'restart') {
      resetCourseProgress(course.slug);
      setActivePhaseIndex(0);
      setIsFinished(false);
      setPhaseKey((v) => v + 1);
      setMascotVisible(false);
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
    if (!isInternalReset && modalMode === 'restart') router.push('/courses');
  };

  const [mascotDragPos, setMascotDragPos] = useState({ x: 0, y: 0 });

  const getRandomMessage = (pool: string[]) => pool[Math.floor(Math.random() * pool.length)] || '';

  const activePhase = course.phases[activePhaseIndex];

  useEffect(() => {
    if (!activePhase) return;
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          setMascotMood('idle');
          setMascotMessage(activePhase.idleHelp || course.mascot.idlePrompt);
          setMascotActions(true);
          if (mascotEnabled) setMascotVisible(true);
        },
        (course.mascot.idleTriggerSeconds || 30) * 1000,
      );
    };
    const handleActivity = () => resetTimer();
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
    mascotEnabled,
  ]);

  const currentMistakeTriggered = useMemo(() => {
    if (!activePhase) return false;
    const thresh = course.mascot.mistakeTriggerCount || 2;
    const progress = algorithmProgress[activePhase.sourceAlgorithmId || course.algorithmId] || {};
    return (
      (activePhase.sourceView === 'control' && (progress.controlMistakes || 0) >= thresh) ||
      phaseMistakesCount >= thresh
    );
  }, [
    activePhase,
    algorithmProgress,
    course.algorithmId,
    course.mascot.mistakeTriggerCount,
    phaseMistakesCount,
  ]);

  useEffect(() => {
    if (currentMistakeTriggered) {
      setMascotMood('mistake');
      const intro =
        activePhase.mascotMistakeLine || course.mascot.mistakePrompt || t('course.mistake_prompt');
      setMascotMessage(activePhase.hintCopy ? `${intro} ${activePhase.hintCopy}` : intro);
      if (mascotEnabled) setMascotVisible(true);
      setMascotActions(false);
      incrementCourseMascotInteraction(course.slug);
      incrementCourseMistakes(course.slug);
      mascotHelpedCurrentPhase.current = true;
      phaseMascotHelpCount.current += 1;
    }
  }, [
    currentMistakeTriggered,
    activePhase.mascotMistakeLine,
    activePhase.hintCopy,
    course.mascot.mistakePrompt,
    course.slug,
    incrementCourseMascotInteraction,
    incrementCourseMistakes,
    mascotEnabled,
    t,
  ]);

  const activeProgress =
    algorithmProgress[activePhase?.sourceAlgorithmId || course.algorithmId] || {};
  const activePhaseProgress = courseProgress[course.slug] || { completedPhases: [] };
  const phaseComplete = activePhase
    ? getCompletionFlag(activeProgress, activePhaseProgress, activePhase)
    : false;
  const canOpenPhase = (phaseIndex: number) => phaseIndex <= firstIncompletePhaseIndex;

  useEffect(() => {
    const phaseAdvice = activePhase.mascotLine;
    if (phaseAdvice) {
      setMascotMood('welcome');
      setMascotMessage(phaseAdvice);
      if (mascotEnabled) setMascotVisible(true);
      setMascotActions(false);
      if (activePhase.mascotLine) {
        incrementCourseMascotInteraction(course.slug);
        mascotHelpedCurrentPhase.current = true;
      }
    }
    phaseStartTime.current = Date.now();
    phaseMascotHelpCount.current = phaseAdvice ? 1 : 0;
    setPhaseMistakesCount(0);
    mascotHelpedCurrentPhase.current = !!phaseAdvice;
    trackEvent('course_phase_enter', {
      phaseId: activePhase.phaseId,
      phaseType: activePhase.sourceView,
      title: activePhase.title,
      isRepeat: !!useAlgorithmStore
        .getState()
        .courseProgress[course.slug]?.completedPhases?.includes(activePhase.phaseId),
    });
  }, [
    activePhaseIndex,
    course.slug,
    trackEvent,
    activePhase.phaseId,
    activePhase.sourceView,
    activePhase.title,
    activePhase.mascotLine,
    mascotEnabled,
    incrementCourseMascotInteraction,
  ]);

  useEffect(() => {
    if (hasHydrated) setCourseActivePhase(course.slug, activePhaseIndex);
  }, [activePhaseIndex, course.slug, setCourseActivePhase, hasHydrated]);

  const resetFutureProgressFrom = (phaseIndex: number) => {
    course.phases
      .slice(phaseIndex)
      .forEach((phase) =>
        resetAlgorithmProgressTab(phase.sourceAlgorithmId || course.algorithmId, phase.sourceView),
      );
  };

  const handleJumpToPhase = (phaseIndex: number) => {
    if (!canOpenPhase(phaseIndex)) return;
    if (phaseIndex < activePhaseIndex) {
      setIsInternalReset(true);
      setModalMode('checkpoint');
      setPendingPhaseIndex(phaseIndex);
      setShowRestartModal(true);
      return;
    }
    setActivePhaseIndex(phaseIndex);
  };

  const applyAdvance = (level?: LegacyConfidenceLevel) => {
    if (!activePhase) return;
    const result = courseProgress[course.slug]?.phaseResults?.[activePhase.phaseId];
    const hasPointsForThisPhase = !!courseProgress[course.slug]?.phasePoints?.[activePhase.phaseId];
    const isFailure = activePhase.sourceView === 'quiz' && result === 'fail';

    if (!hasPointsForThisPhase) {
      if (isFailure) {
        setStreak(0);
        if ((level === 'very-sure' || level === 'high') && course.mascot.enabled) {
          setMascotMood('overconfident');
          setMascotMessage(getRandomMessage(course.mascot.overconfidentMessages));
          if (mascotEnabled) setMascotVisible(true);
          setMascotActions(false);
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

    const maxPoints = activePhase.maxPoints ?? 10;
    const progress = algorithmProgress[activePhase.sourceAlgorithmId || course.algorithmId] || {};
    let helpUsed = false;
    if (activePhase.sourceView === 'create') helpUsed = !!progress.createHelpUsed;
    if (activePhase.sourceView === 'alive' || activePhase.sourceView === 'final-challenge')
      helpUsed = !!progress.aliveHelpUsed;
    if (activePhase.sourceView === 'control') helpUsed = (progress.controlHintsUsed || 0) > 0;

    let earnedPoints = 0,
      isPartial = false;
    if (!hasPointsForThisPhase && !isFailure) {
      if (activePhase.sourceView === 'create') {
        const ratio =
          (progress.createBlanksTotal || 1) > 0
            ? (progress.createBlanksCorrectFirst || 0) / (progress.createBlanksTotal || 1)
            : 0;
        earnedPoints = Math.round(maxPoints * ratio);
        isPartial = ratio < 1 && ratio > 0;
      } else if (
        activePhase.sourceView === 'alive' ||
        activePhase.sourceView === 'final-challenge'
      ) {
        const ratio = (progress.aliveBestScore || 0) / 100;
        earnedPoints = Math.round(maxPoints * ratio);
        isPartial = ratio < 1 && ratio > 0;
      } else if (['quiz', 'match', 'order', 'debug', 'gap-fill'].includes(activePhase.sourceView)) {
        earnedPoints = result === 'success' ? maxPoints : 0;
      } else earnedPoints = maxPoints;
      setCoursePhasePoints(course.slug, activePhase.phaseId, {
        earned: earnedPoints,
        max: maxPoints,
        helpUsed,
        partial: isPartial,
      });
    } else if (isFailure)
      setCoursePhasePoints(course.slug, activePhase.phaseId, {
        earned: 0,
        max: maxPoints,
        helpUsed,
        partial: false,
      });

    if (level) setCourseConfidenceRating(course.slug, activePhase.phaseId, level);

    const elapsed = Date.now() - phaseStartTime.current;
    const isAutoSuccess = activePhase.sourceView === 'info' || activePhase.sourceView === 'video';
    const finalResult =
      courseProgress[course.slug]?.phaseResults?.[activePhase.phaseId] ||
      (isAutoSuccess ? 'success' : null);
    const isSuccess = finalResult === 'success';
    const improved = mascotHelpedCurrentPhase.current && isSuccess;

    updateCoursePhaseStats(course.slug, activePhase.phaseId, {
      timeSpentMs:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.timeSpentMs || 0) +
        elapsed,
      completed: true,
      result: isSuccess ? 'success' : 'fail',
      helpUsed,
      mascotHelpCount:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mascotHelpCount || 0) +
        phaseMascotHelpCount.current,
      improvedAfterMascot: improved,
      mistakes:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mistakes || 0) +
        phaseMistakesCount,
      mascotIntentionallyDisabled: !mascotEnabled,
    });
    updateCourseTotalTime(course.slug, elapsed);
    markCoursePhaseComplete(course.slug, activePhase.phaseId);
    trackEvent('course_phase_completed', {
      phaseId: activePhase.phaseId,
      durationMs: elapsed,
      mistakes: phaseMistakesCount,
      earnedPoints,
      maxPoints,
      confidence: level,
      mascotHelpCount: phaseMascotHelpCount.current,
      improvedAfterMascot: improved,
      helpUsed,
    });

    if (activePhaseIndex < course.phases.length - 1) setActivePhaseIndex((v) => v + 1);
    else {
      markCourseCompleted(course.slug);
      setIsFinished(true);
      promptShownRef.current = true;
      trackEvent('course_completed', { courseId: course.slug, totalTimeMs: elapsed });
    }
    setTimeout(() => syncProgress(), 0);
  };

  const handleContinue = () => {
    if (!activePhase || !phaseComplete) return;
    const nextPhaseIndex =
      activePhaseIndex < course.phases.length - 1 ? activePhaseIndex + 1 : null;
    if (nextPhaseIndex !== null && !canOpenPhase(nextPhaseIndex)) return;
    applyAdvance();
  };

  const handleResetCourse = () => {
    setIsInternalReset(true);
    setModalMode('restart');
    setShowRestartModal(true);
  };

  const savePartialPhaseProgress = useCallback(() => {
    if (!activePhase) return;
    const elapsed = Date.now() - phaseStartTime.current;
    if (elapsed < 500) return;
    const progress = algorithmProgress[activePhase.sourceAlgorithmId || course.algorithmId] || {};
    let helpUsed = false;
    if (activePhase.sourceView === 'create') helpUsed = !!progress.createHelpUsed;
    if (activePhase.sourceView === 'alive' || activePhase.sourceView === 'final-challenge')
      helpUsed = !!progress.aliveHelpUsed;
    if (activePhase.sourceView === 'control') helpUsed = (progress.controlHintsUsed || 0) > 0;

    updateCoursePhaseStats(course.slug, activePhase.phaseId, {
      timeSpentMs:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.timeSpentMs || 0) +
        elapsed,
      helpUsed,
      mascotHelpCount:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mascotHelpCount || 0) +
        phaseMascotHelpCount.current,
      mistakes:
        (courseProgress[course.slug]?.detailedStats?.[activePhase.phaseId]?.mistakes || 0) +
        phaseMistakesCount,
      mascotIntentionallyDisabled: !mascotEnabled,
    });
    updateCourseTotalTime(course.slug, elapsed);
    phaseStartTime.current = Date.now();
    setPhaseMistakesCount(0);
    phaseMascotHelpCount.current = 0;
    syncProgress();
  }, [
    activePhase,
    algorithmProgress,
    course.algorithmId,
    course.slug,
    courseProgress,
    mascotEnabled,
    phaseMistakesCount,
    updateCoursePhaseStats,
    updateCourseTotalTime,
    syncProgress,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        savePartialPhaseProgress();
        syncProgress();
      }
    };
    const handleBeforeUnload = () => {
      savePartialPhaseProgress();
      const {
        completedIds,
        visualizerProgress,
        algorithmProgress: ap,
        courseProgress: cp,
      } = useAlgorithmStore.getState();
      navigator.sendBeacon(
        '/api/account/progress',
        new Blob(
          [
            JSON.stringify({
              completedIds,
              visualizerProgress,
              algorithmProgress: ap,
              courseProgress: cp,
            }),
          ],
          { type: 'application/json' },
        ),
      );
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [savePartialPhaseProgress, syncProgress]);

  if (!activePhase) return null;

  return (
    <section className="relative w-full">
      <AnimatePresence>
        <RestartCourseModal
          isOpen={showRestartModal}
          onClose={handleCancelRestart}
          onConfirm={handleConfirmRestart}
          title={modalMode === 'restart' ? t('course.restart_title') : t('course.checkpoint_title')}
          message={
            modalMode === 'restart'
              ? courseProgress[course.slug]?.isCompleted && !isInternalReset
                ? t('course.restart_completed_message')
                : t('course.restart_message')
              : t('course.checkpoint_message')
          }
          confirmLabel={
            modalMode === 'restart' ? t('course.restart_confirm') : t('course.checkpoint_confirm')
          }
          cancelLabel={isInternalReset ? t('course.cancel_continue') : t('course.cancel_back')}
        />
        {isFinished && (
          <motion.div
            key="finish-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-[2.25rem] bg-white/90 p-8 backdrop-blur-md dark:bg-black/90 overflow-y-auto"
          >
            <div className="flex flex-col items-center text-center w-full max-w-2xl">
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
              <div className="mb-6 grid grid-cols-2 gap-4 w-full">
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/20 dark:bg-amber-900/10">
                  <div className="text-[10px] font-black uppercase tracking-tighter text-amber-600 dark:text-amber-500/70 mb-1">
                    {t('course.total_score')}
                  </div>
                  <div className="text-3xl font-black text-[#B45309] dark:text-amber-400 tabular-nums">
                    {courseProgress[course.slug]?.points || 0}
                    <span className="text-lg text-amber-600/40 dark:text-amber-500/40">
                      /{course.phases.reduce((sum, p) => sum + (p.maxPoints ?? 10), 0)}
                    </span>
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

              {/* Confidence & Mastery Profile Summary */}
              {(() => {
                const confSummary = computeCourseConfidenceSummary(
                  courseProgress[course.slug]?.confidenceResults,
                  courseProgress[course.slug]?.phaseResults,
                );
                if (confSummary.totalEvaluated === 0) return null;
                return (
                  <div className="w-full mb-6 p-5 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm text-left shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5 font-montserrat">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        {t('confidence.matrix_title') || 'Tudás & Magabiztosság Elemzés'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-montserrat">
                        {confSummary.masteryRate}% Mester arány
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-400 font-montserrat">
                          🟢 Mesterfok
                        </span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                          {confSummary.masteryCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tight text-teal-700 dark:text-teal-400 font-montserrat">
                          🟡 Megerősítve
                        </span>
                        <span className="text-xl font-black text-teal-700 dark:text-teal-300 tabular-nums mt-0.5">
                          {confSummary.luckyCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tight text-rose-700 dark:text-rose-400 font-montserrat">
                          🔴 Tévhitek
                        </span>
                        <span className="text-xl font-black text-rose-700 dark:text-rose-300 tabular-nums mt-0.5">
                          {confSummary.misconceptionCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-400 font-montserrat">
                          💡 Rávezetés
                        </span>
                        <span className="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
                          {confSummary.doubtCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Phase-by-phase breakdown */}
              <div className="w-full mb-8 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {t('course.phase')} {t('course.phase_details')}
                  </h4>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {course.phases.map((phase, idx) => {
                    const pp = courseProgress[course.slug]?.phasePoints?.[phase.phaseId];
                    const earned = pp?.earned ?? 0;
                    const max = pp?.max ?? phase.maxPoints ?? 10;
                    const helpUsed = pp?.helpUsed ?? false;
                    const isPartial = pp?.partial ?? false;
                    const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
                    return (
                      <div key={phase.phaseId} className="flex items-center gap-3 px-4 py-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 ${earned === max ? 'bg-[#269984]' : earned > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'}`}
                        >
                          {earned === max ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                            {phase.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-bold tabular-nums ${earned === max ? 'text-[#269984]' : earned > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}
                            >
                              {earned}/{max} pt
                            </span>
                            {isPartial && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                {t('course.score_partial')}
                              </span>
                            )}
                            {helpUsed && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                {t('course.score_help')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-16 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className={`h-full rounded-full ${earned === max ? 'bg-[#269984]' : earned > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#269984] px-8 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-[#269984]/30 transition-transform hover:-translate-y-1"
                >
                  {t('course.next_courses')} <ChevronRight className="h-5 w-5" />
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
      <div className="mx-auto max-w-[1500px] px-0 py-0 sm:px-4 lg:pt-0 lg:pb-6">
        <div className="relative rounded-[3rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 dark:border-white/5 dark:bg-[#111111]/80 dark:shadow-none backdrop-blur-xl overflow-hidden">
          <div className="relative pt-4 px-6 pb-0 lg:pt-6 lg:px-10 lg:pb-0 border-b border-gray-50 dark:border-white/5 overflow-hidden">
            <div
              className="absolute -top-32 -right-32 w-96 h-96 blur-[120px] opacity-10 pointer-events-none"
              style={{ backgroundColor: course.accentColor }}
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <Link
                  href="/courses"
                  className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
                >
                  <span className="transition-transform group-hover:-translate-x-1">←</span>{' '}
                  {t('courses.back_to_courses')}
                </Link>
                <div className="space-y-1.5">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em]"
                    style={{
                      backgroundColor: `${course.accentColor}15`,
                      color: course.accentColor,
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {t('course.playable_course')}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black text-black dark:text-white tracking-tighter leading-none">
                    {course.title}
                  </h2>
                  <p className="max-w-2xl text-base font-medium leading-relaxed text-gray-500 dark:text-gray-400/80">
                    {course.heroTagline}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 lg:self-center">
                <div className="flex flex-col items-start lg:items-end">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {t('course.points')}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-black dark:text-white">
                      {courseProgress[course.slug]?.points || 0}
                    </span>
                    <span
                      className="text-[11px] font-black text-[#269984] uppercase"
                      style={{ color: course.accentColor }}
                    >
                      pts
                    </span>
                  </div>
                </div>
                <div className="h-10 w-px bg-gray-100 dark:bg-white/10 hidden sm:block mx-2" />
                <div className="flex flex-col items-start lg:items-end">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {t('course.phase')}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-black dark:text-white">
                      {activePhaseIndex + 1}
                    </span>
                    <span className="text-sm font-black text-gray-300">
                      / {course.phases.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Navigator */}
            <div className="mt-6 mb-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                  {t('course.learning_path')}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500/60">
                  {Math.round(
                    (completedPhaseStatuses.filter(Boolean).length / course.phases.length) * 100,
                  )}
                  % {t('common.completed')}
                </div>
              </div>
              <div className="relative py-6">
                <div
                  ref={containerRef}
                  className="relative flex items-center z-20"
                  style={{ height: 48 }}
                >
                  {(() => {
                    const total = course.phases.length;
                    const ITEM_WIDTH = 48;
                    const capacity = Math.max(5, Math.floor(containerWidth / ITEM_WIDTH));
                    const showEllipsis = total > capacity;

                    const visibleIndices = new Set<number>();
                    if (!showEllipsis) course.phases.forEach((_, i) => visibleIndices.add(i));
                    else {
                      visibleIndices.add(0);
                      visibleIndices.add(total - 1);
                      visibleIndices.add(activePhaseIndex);
                      let radius = 1;
                      while (visibleIndices.size < capacity - 2 && radius < total) {
                        if (activePhaseIndex - radius > 0)
                          visibleIndices.add(activePhaseIndex - radius);
                        if (
                          visibleIndices.size < capacity - 2 &&
                          activePhaseIndex + radius < total - 1
                        )
                          visibleIndices.add(activePhaseIndex + radius);
                        radius++;
                      }
                    }

                    const renderedItems: {
                      type: 'checkpoint' | 'ellipsis';
                      index: number;
                      phases?: CoursePhase[];
                    }[] = [];
                    let lastIdx = -1;
                    course.phases.forEach((phase, index) => {
                      if (visibleIndices.has(index)) {
                        if (lastIdx !== -1 && index - lastIdx > 1)
                          renderedItems.push({
                            type: 'ellipsis',
                            index: lastIdx + 1,
                            phases: course.phases.slice(lastIdx + 1, index),
                          });
                        renderedItems.push({ type: 'checkpoint', index });
                        lastIdx = index;
                      }
                    });

                    const renderedTotal = renderedItems.length;

                    // Map each rendered checkpoint to its fractional position along the
                    // track so the fill can be aligned exactly with the node positions,
                    // interpolating through ellipsis gaps for a consistent look.
                    const anchors: { phaseIdx: number; frac: number }[] = [];
                    renderedItems.forEach((item, ri) => {
                      if (item.type === 'checkpoint') {
                        anchors.push({
                          phaseIdx: item.index,
                          frac: renderedTotal > 1 ? ri / (renderedTotal - 1) : 0.5,
                        });
                      }
                    });

                    const phaseToFrac = (targetIdx: number): number => {
                      if (anchors.length === 0) return 0;
                      if (targetIdx <= anchors[0].phaseIdx) return anchors[0].frac;
                      const last = anchors[anchors.length - 1];
                      if (targetIdx >= last.phaseIdx) return last.frac;
                      for (let i = 0; i < anchors.length - 1; i++) {
                        const a = anchors[i];
                        const b = anchors[i + 1];
                        if (targetIdx >= a.phaseIdx && targetIdx <= b.phaseIdx) {
                          const ratio = (targetIdx - a.phaseIdx) / (b.phaseIdx - a.phaseIdx);
                          return a.frac + ratio * (b.frac - a.frac);
                        }
                      }
                      return last.frac;
                    };

                    // Fill extends to the current active phase position. Completed
                    // phases fill solidly, while reaching the active (in-progress)
                    // phase ensures the bar visually tracks where the user is working.
                    const completedCount = completedPhaseStatuses.filter(Boolean).length;
                    const fillTargetIdx = Math.max(
                      completedCount > 0 ? completedCount - 1 : -1,
                      activePhaseIndex,
                    );
                    const fillFrac = fillTargetIdx >= 0 ? phaseToFrac(fillTargetIdx) : 0;
                    const fillWidth = Math.round(fillFrac * 100);

                    // Inset the track so it starts/ends at the center of the first/last node
                    const NODE_SIZE = 36; // px
                    const halfNode =
                      containerWidth > 0 ? (NODE_SIZE / 2 / containerWidth) * 100 : 2;

                    return (
                      <>
                        {/* Track background — inset to align with node centers */}
                        <div
                          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full pointer-events-none bg-gray-200/70 dark:bg-white/10"
                          style={{ left: `${halfNode}%`, right: `${halfNode}%` }}
                        />
                        {/* Filled portion of the track */}
                        <div
                          key="progress-fill"
                          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full z-10 origin-left pointer-events-none transition-[width] duration-700 ease-out"
                          style={{
                            left: `${halfNode}%`,
                            width: `${Math.max(0, fillWidth - halfNode * 2) * (100 / (100 - halfNode * 2))}%`,
                            maxWidth: `${100 - halfNode * 2}%`,
                            background: `linear-gradient(90deg, ${course.accentColor}, ${course.accentColor}dd)`,
                          }}
                        />
                        {renderedItems.map((item, renderIdx) => {
                          const posPct =
                            renderedTotal > 1 ? (renderIdx / (renderedTotal - 1)) * 100 : 50;

                          if (item.type === 'ellipsis') {
                            return (
                              <button
                                key={`ellipsis-${item.index}`}
                                style={{ left: `${posPct}%` }}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const cr = containerRef.current?.getBoundingClientRect();
                                  if (cr)
                                    setPopoverGap({
                                      index: item.index,
                                      phases: item.phases!,
                                      x: rect.left - cr.left + rect.width / 2,
                                    });
                                }}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group flex items-center justify-center hover:scale-125 transition-transform z-20"
                              >
                                <div className="flex gap-[3px]">
                                  {[1, 2, 3].map((i) => (
                                    <div
                                      key={i}
                                      className="w-[5px] h-[5px] rounded-full bg-gray-300 dark:bg-white/20 group-hover:bg-gray-400 dark:group-hover:bg-white/40 transition-colors"
                                      style={
                                        completedPhaseStatuses[item.index]
                                          ? { backgroundColor: course.accentColor }
                                          : {}
                                      }
                                    />
                                  ))}
                                </div>
                              </button>
                            );
                          }

                          const phase = course.phases[item.index];
                          const completed = completedPhaseStatuses[item.index];
                          const isActive = item.index === activePhaseIndex;
                          const locked = !canOpenPhase(item.index) && !completed;
                          const isBehindFill = item.index <= fillTargetIdx;

                          return (
                            <div
                              key={phase.phaseId}
                              style={{ left: `${posPct}%` }}
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
                            >
                              <motion.button
                                disabled={locked}
                                onClick={() => handleJumpToPhase(item.index)}
                                whileHover={!locked ? { scale: 1.15 } : {}}
                                whileTap={!locked ? { scale: 0.92 } : {}}
                                className={`relative flex items-center justify-center shrink-0 transition-all duration-300 ${
                                  locked
                                    ? 'w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 opacity-40 cursor-not-allowed'
                                    : completed
                                      ? 'w-9 h-9 rounded-full text-white cursor-pointer'
                                      : isActive
                                        ? 'w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1a] cursor-pointer'
                                        : 'w-8 h-8 rounded-full bg-white dark:bg-[#1a1a1a] cursor-pointer'
                                }`}
                                style={
                                  locked
                                    ? {}
                                    : completed
                                      ? {
                                          backgroundColor: course.accentColor,
                                          boxShadow: `0 2px 12px ${course.accentColor}44`,
                                          border: `2px solid ${course.accentColor}`,
                                        }
                                      : isActive
                                        ? {
                                            borderWidth: 3,
                                            borderStyle: 'solid',
                                            borderColor: course.accentColor,
                                            color: course.accentColor,
                                            boxShadow: `0 0 0 4px ${course.accentColor}22, 0 2px 12px ${course.accentColor}33`,
                                          }
                                        : {
                                            borderWidth: 2,
                                            borderStyle: 'solid',
                                            borderColor: isBehindFill
                                              ? course.accentColor
                                              : undefined,
                                            color: isBehindFill ? course.accentColor : undefined,
                                          }
                                }
                              >
                                {completed ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                  >
                                    <Check className="w-4 h-4 stroke-[3px]" />
                                  </motion.div>
                                ) : (
                                  <span
                                    className={`text-[11px] font-black ${locked ? 'text-gray-300 dark:text-white/20' : ''}`}
                                  >
                                    {item.index + 1}
                                  </span>
                                )}
                              </motion.button>
                              {/* Tooltip on hover */}
                              {!locked && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                                    {phase.title}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* Hidden phase modal */}
                <AnimatePresence>
                  {popoverGap && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setPopoverGap(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-white/5"
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">
                                {t('course.checkpoints')}
                              </h3>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                {popoverGap.phases.length} {t('course.hidden_phases')}
                              </p>
                            </div>
                            <button
                              onClick={() => setPopoverGap(null)}
                              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                            {popoverGap.phases.map((p) => {
                              const pIdx = course.phases.findIndex(
                                (cp) => cp.phaseId === p.phaseId,
                              );
                              const pCompleted = completedPhaseStatuses[pIdx];
                              const pLocked = !canOpenPhase(pIdx) && !pCompleted;
                              return (
                                <button
                                  key={p.phaseId}
                                  disabled={pLocked}
                                  onClick={() => {
                                    handleJumpToPhase(pIdx);
                                    setPopoverGap(null);
                                  }}
                                  className={`group flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${pLocked ? 'opacity-30 cursor-not-allowed bg-gray-50/50 dark:bg-white/[0.02]' : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm transition-transform group-hover:rotate-3 ${pCompleted ? 'text-white' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-white/5'}`}
                                    style={
                                      pCompleted
                                        ? {
                                            backgroundColor: course.accentColor,
                                            boxShadow: `0 8px 16px ${course.accentColor}33`,
                                          }
                                        : {}
                                    }
                                  >
                                    {pCompleted ? (
                                      <Check className="w-5 h-5 stroke-[4px]" />
                                    ) : (
                                      pIdx + 1
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-black text-gray-900 dark:text-white truncate">
                                      {p.title}
                                    </span>
                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                      {pLocked
                                        ? t('course.locked')
                                        : pCompleted
                                          ? t('course.completed')
                                          : t('course.next_up')}
                                    </span>
                                  </div>
                                  {!pLocked && (
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="pt-0 px-6 pb-6 lg:pt-0 lg:px-10 lg:pb-10 bg-gray-50/30 dark:bg-transparent">
            <div className="mb-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    style={{
                      backgroundColor: `${course.accentColor}10`,
                      color: course.accentColor,
                    }}
                  >
                    {t('course.current_phase')} {activePhaseIndex + 1}
                  </span>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    ★ {activePhase.maxPoints ?? 10}
                  </span>
                  {phaseComplete && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" /> {t('course.phase_complete')}
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-black text-black dark:text-white tracking-tight">
                  {activePhase.title}
                </h3>
                <p className="max-w-3xl text-base font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  {activePhase.summary}
                </p>
              </div>
            </div>
            <div key={`${activePhase.phaseId}-${phaseKey}`} className="relative">
              <PhaseBody
                phase={activePhase}
                course={course}
                accentColor={course.accentColor}
                onMistake={() => setPhaseMistakesCount((c) => c + 1)}
              />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={handleResetCourse}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" /> {t('course.reset_course')}
              </button>
              <button
                onClick={handleContinue}
                disabled={!phaseComplete}
                className="group relative inline-flex items-center gap-4 rounded-2xl px-10 py-5 text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 overflow-hidden"
                style={{
                  backgroundColor: course.accentColor,
                  boxShadow: `0 20px 40px ${course.accentColor}44`,
                }}
              >
                <span className="relative z-10">
                  {activePhaseIndex === course.phases.length - 1
                    ? t('course.finish_course')
                    : t('course.next_phase')}
                </span>
                <ChevronRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

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
            onDragEnd={(_, info) =>
              setMascotDragPos({
                x: mascotDragPos.x + info.offset.x,
                y: mascotDragPos.y + info.offset.y,
              })
            }
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
                      <div
                        className="absolute top-full left-6 w-3 h-3 bg-white dark:bg-gray-900 rotate-45 border-r border-b"
                        style={{ borderColor: `${course.accentColor}33` }}
                      />
                      {mascotMood === 'mistake' && (
                        <div className="mb-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                          <ShieldAlert className="w-3.5 h-3.5" /> {t('course.advice')}
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
                              setMascotMessage(
                                activePhase.idleHelp ||
                                  activePhase.hintCopy ||
                                  activePhase.mascotLine ||
                                  activePhase.summary,
                              );
                              setMascotActions(false);
                            }}
                            className="flex-1 py-1.5 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                            style={{ backgroundColor: course.accentColor }}
                          >
                            {t('course.help_yes')}
                          </button>
                          <button
                            onClick={() => setMascotVisible(false)}
                            className="flex-1 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          >
                            {t('course.help_no')}
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
                              className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors flex-shrink-0"
                              style={{
                                backgroundColor: `${course.accentColor}15`,
                                color: course.accentColor,
                              }}
                            >
                              {t('course.how_are_we')}
                            </button>
                            <button
                              onClick={() => setMascotMessage(course.summary)}
                              className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors flex-shrink-0"
                              style={{
                                backgroundColor: `${course.accentColor}15`,
                                color: course.accentColor,
                              }}
                            >
                              {t('course.summary_title')}
                            </button>
                          </div>
                          <button
                            onClick={() => setMascotVisible(false)}
                            className="block w-full text-center py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:text-white"
                            style={{
                              backgroundColor: `${course.accentColor}10`,
                              color: course.accentColor,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = course.accentColor)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = `${course.accentColor}10`)
                            }
                          >
                            {t('course.understand')}
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
                      <div
                        className="absolute inset-0 rounded-full blur-2xl transition-colors"
                        style={{ backgroundColor: `${course.accentColor}25` }}
                      />
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
                      setMascotMessage(
                        activePhase.mascotLine ||
                          t('course.currently_at').replace('{title}', activePhase.title),
                      );
                      setMascotActions(false);
                      setMascotVisible(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 group cursor-grab active:cursor-grabbing select-none"
                    style={{ borderColor: `${course.accentColor}33`, color: course.accentColor }}
                  >
                    <div
                      className="w-5 h-5 rounded-full overflow-hidden border pointer-events-none"
                      style={{ borderColor: `${course.accentColor}20` }}
                    >
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
      </div>
    </section>
  );
}
