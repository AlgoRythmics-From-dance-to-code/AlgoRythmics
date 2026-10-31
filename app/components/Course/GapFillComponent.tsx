'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, FileCode, CheckCircle2 } from 'lucide-react';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { useLocale } from '../../i18n/LocaleProvider';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { CoursePhase } from '../../../lib/courses/courseCatalog';
import {
  evaluateConfidence,
  type ConfidenceLevel,
  type ConfidenceEvaluationResult,
} from '../../../lib/courses/confidenceEngine';
import ConfidenceSelector from './ConfidenceSelector';
import AdaptiveFeedbackCard from './AdaptiveFeedbackCard';
import { useReportMascotScreen } from './MascotScreenContext';

interface GapFillComponentProps {
  phase: CoursePhase;
  courseId: string;
  onMistake?: () => void;
}

/**
 * Reconstructs proper newlines and indentation for YAML manifests or code snippets
 * that might have been stored or serialized as a single collapsed line.
 */
function formatYamlOrCode(raw: string): string {
  let text = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  // Replace pipe delimiters with clean newlines
  if (text.includes('|')) {
    text = text.replace(/\s*\|\s*/g, '\n');
  }

  // If text already contains genuine line breaks, preserve its formatting
  if (text.includes('\n')) {
    return text.trim();
  }

  // Single-line YAML manifest recovery: insert newlines before known YAML structural keys
  const indentMap: Record<string, number> = {
    'apiversion:': 0,
    'kind:': 0,
    'metadata:': 0,
    'name:': 2,
    'labels:': 2,
    'spec:': 0,
    'replicas:': 2,
    'selector:': 2,
    'matchlabels:': 4,
    'app:': 6,
    'template:': 2,
    'containers:': 6,
    '- name:': 8,
    'image:': 10,
    'ports:': 10,
    '- containerport:': 12,
    'data:': 0,
    'rules:': 0,
    'type:': 2,
  };

  const yamlBreakpoints = [
    'apiVersion:',
    'kind:',
    'metadata:',
    'name:',
    'labels:',
    'spec:',
    'replicas:',
    'selector:',
    'matchLabels:',
    'app:',
    'template:',
    'containers:',
    '- name:',
    'image:',
    'ports:',
    '- containerPort:',
    'data:',
    'rules:',
    'type:',
  ];

  let formatted = text;
  for (const bp of yamlBreakpoints) {
    const escaped = bp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(^|\\s+)(${escaped})`, 'gi');
    const indentCount = indentMap[bp.toLowerCase()] ?? 2;
    const indentSpaces = ' '.repeat(indentCount);
    formatted = formatted.replace(regex, `\n${indentSpaces}$2`);
  }

  return formatted.trim();
}

export default function GapFillComponent({ phase, courseId, onMistake }: GapFillComponentProps) {
  const { t } = useLocale();
  const { markCoursePhaseComplete, setCoursePhaseResult, setCoursePhasePoints, syncProgress } =
    useAlgorithmStore();
  const isDone = useAlgorithmStore((state) =>
    state.courseProgress[courseId]?.completedPhases?.includes(phase.phaseId),
  );

  const { trackEvent } = useAnalytics(undefined, 'gap-fill', courseId);

  const rawContent = phase.gapFillContent || '';
  const rawOptions = phase.gapFillOptions || [];
  const rawSolutions = phase.gapFillSolutions || [];

  // Detect whether this gap-fill is code / YAML manifest vs prose text
  const isCodeOrYaml = useMemo(() => {
    const lower = rawContent.toLowerCase();
    const titleLower = (phase.title || '').toLowerCase();
    return (
      lower.includes('apiversion') ||
      lower.includes('kind:') ||
      lower.includes('spec:') ||
      lower.includes('metadata:') ||
      lower.includes('containers:') ||
      lower.includes('def ') ||
      lower.includes('class ') ||
      lower.includes('function ') ||
      lower.includes('import ') ||
      lower.includes('return ') ||
      titleLower.includes('kód') ||
      titleLower.includes('yaml') ||
      titleLower.includes('manifest') ||
      titleLower.includes('code')
    );
  }, [rawContent, phase.title]);

  // Format content with proper line structure
  const formattedContent = useMemo(() => {
    if (isCodeOrYaml) {
      return formatYamlOrCode(rawContent);
    }
    return rawContent.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\s*\|\s*/g, '\n\n');
  }, [rawContent, isCodeOrYaml]);

  // Normalize markers to [blank]
  const normalizedWithBlanks = useMemo(() => {
    return formattedContent.replace(/\{\{gap\}\}/g, '[blank]');
  }, [formattedContent]);

  // Prepare line-by-line structure for code editor or paragraph structure for prose
  const lines = useMemo(() => {
    return normalizedWithBlanks.split('\n');
  }, [normalizedWithBlanks]);

  // Count total blanks
  const blankCount = useMemo(() => {
    const matches = normalizedWithBlanks.match(/\[blank\]/g);
    return matches ? matches.length : 0;
  }, [normalizedWithBlanks]);

  // Populate options bank, ensuring solutions are always present and meaningful alternatives exist
  const effectiveOptions = useMemo(() => {
    const optsSet = new Set<string>();
    rawOptions.forEach((o) => {
      if (typeof o === 'string' && o.trim()) optsSet.add(o.trim());
    });
    rawSolutions.forEach((s) => {
      if (typeof s === 'string' && s.trim()) optsSet.add(s.trim());
    });

    // If options are still sparse for a YAML/code phase, provide reasonable common distractors
    if (optsSet.size < 4 && isCodeOrYaml) {
      ['apps/v1', 'v1', 'Deployment', 'Pod', 'Service', '3', '80', 'nginx:alpine', 'ClusterIP'].forEach(
        (cand) => optsSet.add(cand),
      );
    }

    return Array.from(optsSet);
  }, [rawOptions, rawSolutions, isCodeOrYaml]);

  const [choices, setChoices] = useState<string[]>(() => new Array(blankCount).fill(''));
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [evaluation, setEvaluation] = useState<ConfidenceEvaluationResult | null>(null);

  useReportMascotScreen(
    'gap-fill',
    useMemo(
      () => ({
        blankCount,
        choices,
        options: effectiveOptions,
        confidence,
        isEvaluated: !!evaluation,
        isCorrect:
          evaluation ? evaluation.category === 'mastery' || evaluation.category === 'lucky' : undefined,
        isCompleted: !!isDone,
      }),
      [blankCount, choices, effectiveOptions, confidence, evaluation, isDone],
    ),
  );

  const { setCourseConfidenceRating } = useAlgorithmStore();

  const handleSelect = (blankIdx: number, val: string) => {
    if (isDone || showFeedback || evaluation) return;
    const newChoices = [...choices];
    newChoices[blankIdx] = val;
    setChoices(newChoices);
    trackEvent('gap_fill_selected', { blankIndex: blankIdx, value: val });
  };

  const checkGaps = () => {
    const allFilled = choices.every((c) => c !== '');
    if (!allFilled) return;

    let correct = 0;
    if (rawSolutions.length > 0) {
      choices.forEach((c, i) => {
        if (c === rawSolutions[i]) correct++;
      });
    } else {
      correct = blankCount;
    }

    setShowFeedback(true);

    const allCorrect = correct === blankCount;
    if (!allCorrect) onMistake?.();

    const maxPoints = phase.maxPoints ?? 10;
    const evalResult = evaluateConfidence({
      isCorrect: allCorrect,
      confidence,
      basePoints: maxPoints,
      hintCopy: phase.hintCopy,
      summary: phase.summary,
    });
    setEvaluation(evalResult);

    trackEvent('gap_fill_checked', {
      phaseId: phase.phaseId,
      allCorrect,
      correctCount: correct,
      totalCount: blankCount,
      confidence,
      choices: choices.map((c, i) => ({
        index: i,
        value: c,
        isCorrect: rawSolutions.length > 0 ? c === rawSolutions[i] : true,
      })),
    });

    const baseEarned = blankCount === 0 ? 0 : Math.round((correct / blankCount) * maxPoints);
    const earnedPoints = allCorrect
      ? Math.min(
          maxPoints + evalResult.bonusPoints,
          Math.round(baseEarned * evalResult.scoreMultiplier) + evalResult.bonusPoints,
        )
      : Math.round(baseEarned * evalResult.scoreMultiplier);

    setCoursePhasePoints(courseId, phase.phaseId, {
      earned: earnedPoints,
      max: maxPoints,
      helpUsed: false,
      partial: correct > 0 && correct < blankCount,
    });

    setCoursePhaseResult(courseId, phase.phaseId, allCorrect ? 'success' : 'fail');
    setCourseConfidenceRating(courseId, phase.phaseId, confidence);

    if (allCorrect || !evalResult.canRetry) {
      markCoursePhaseComplete(courseId, phase.phaseId);
    }

    setTimeout(() => syncProgress(), 0);
  };

  const handleRetry = () => {
    if (rawSolutions.length > 0) {
      setChoices((prev) => prev.map((c, i) => (c === rawSolutions[i] ? c : '')));
    }
    setShowFeedback(false);
    setEvaluation(null);
  };

  const isConfidenceEnabled = phase.askConfidence !== false;

  // Global tracker for blank indices across all lines
  let globalBlankCounter = 0;

  return (
    <div className="flex flex-col items-center gap-8 p-2 sm:p-4 w-full">
      <div
        data-mascot-anchor="gap-box"
        className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0c0d14]"
      >
        {isCodeOrYaml ? (
          /* --- CODE / YAML EDITOR VIEW --- */
          <div>
            {/* Editor Header Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-100 dark:bg-[#141622] border-b border-gray-200 dark:border-white/10 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 flex items-center gap-1.5 text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                  <FileCode className="w-4 h-4 text-[#269984]" />
                  deployment.yaml
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#269984]/15 text-[#269984] dark:text-[#36D6BA] border border-[#269984]/30 font-montserrat">
                  YAML MANIFEST
                </span>
                {isDone && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" /> KÉSZ
                  </span>
                )}
              </div>
            </div>

            {/* Editor Code Lines */}
            <div className="p-4 sm:p-6 bg-[#0a0b12] text-gray-100 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
              <div className="min-w-max space-y-1">
                {lines.map((line, lineIdx) => {
                  const parts = line.split(/(\[blank\])/);
                  return (
                    <div key={lineIdx} className="flex items-center min-h-[30px] group">
                      {/* Line Number Gutter */}
                      <span className="select-none text-gray-600 font-mono text-xs w-7 pr-3 text-right flex-shrink-0 group-hover:text-gray-400">
                        {lineIdx + 1}
                      </span>
                      {/* Code Content & Dropdowns */}
                      <div className="flex items-center flex-wrap">
                        {parts.map((part, partIdx) => {
                          if (part === '[blank]') {
                            const curIdx = globalBlankCounter++;
                            const isFilled = !!choices[curIdx];
                            return (
                              <div
                                key={partIdx}
                                data-mascot-anchor={`gap-blank-${curIdx}`}
                                className="relative inline-flex items-center mx-1.5 my-0.5"
                              >
                                <select
                                  disabled={isDone || showFeedback || !!evaluation}
                                  value={choices[curIdx] || ''}
                                  onChange={(e) => handleSelect(curIdx, e.target.value)}
                                  className={`appearance-none px-3 py-1 pr-7 rounded-lg border-2 font-mono text-xs font-bold transition-all cursor-pointer outline-none ${
                                    isFilled
                                      ? 'border-[#269984] bg-[#269984]/20 text-[#36D6BA] ring-1 ring-[#269984]/40 font-black'
                                      : 'border-white/20 bg-[#191c2b] text-amber-300 hover:border-amber-400/50'
                                  } focus:ring-2 focus:ring-[#269984]/50`}
                                  style={{ minWidth: '125px' }}
                                >
                                  <option value="" className="bg-[#141622] text-gray-400 font-normal">
                                    ··· [{curIdx + 1}] ···
                                  </option>
                                  {effectiveOptions.map((opt, oIdx) => (
                                    <option
                                      key={oIdx}
                                      value={opt}
                                      className="bg-[#141622] text-gray-100 font-mono py-1 font-semibold"
                                    >
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-gray-400" />
                              </div>
                            );
                          }
                          return (
                            <span key={partIdx} className="whitespace-pre text-gray-200">
                              {part}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* --- PROSE / READING GAP-FILL VIEW --- */
          <div className="p-6 sm:p-10 space-y-4">
            {lines.map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-2" />;
              const parts = line.split(/(\[blank\])/);
              return (
                <div
                  key={lineIdx}
                  className="flex flex-wrap items-center gap-x-2 gap-y-3 text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-100"
                >
                  {parts.map((part, partIdx) => {
                    if (part === '[blank]') {
                      const curIdx = globalBlankCounter++;
                      const isFilled = !!choices[curIdx];
                      return (
                        <div
                          key={partIdx}
                          data-mascot-anchor={`gap-blank-${curIdx}`}
                          className="relative inline-flex items-center min-w-[130px]"
                        >
                          <select
                            disabled={isDone || showFeedback || !!evaluation}
                            value={choices[curIdx] || ''}
                            onChange={(e) => handleSelect(curIdx, e.target.value)}
                            className={`w-full appearance-none px-4 py-2 pr-8 rounded-xl border-2 font-bold text-sm bg-white dark:bg-[#181824] dark:text-gray-100 cursor-pointer transition-all ${
                              isFilled
                                ? 'border-[#269984] text-[#269984] dark:text-[#36D6BA] ring-1 ring-[#269984]/20'
                                : 'border-gray-200 dark:border-white/15 text-gray-400 dark:text-gray-500'
                            } focus:ring-2 focus:ring-[#269984]/20 outline-none`}
                          >
                            <option value="">...</option>
                            {effectiveOptions.map((opt, oIdx) => (
                              <option
                                key={oIdx}
                                value={opt}
                                className="bg-white dark:bg-[#181824] text-gray-800 dark:text-gray-100"
                              >
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-2.5 pointer-events-none text-gray-400" />
                        </div>
                      );
                    }
                    return (
                      <span key={partIdx} className="font-medium">
                        {part}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!showFeedback && !isDone && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xl">
          {isConfidenceEnabled && (
            <ConfidenceSelector
              data-mascot-anchor="confidence-selector"
              selected={confidence}
              onChange={(lvl) => setConfidence(lvl)}
              className="w-full"
            />
          )}

          <button
            data-mascot-anchor="gap-submit-btn"
            type="button"
            disabled={choices.some((c) => c === '')}
            onClick={checkGaps}
            className="w-full sm:w-auto px-10 py-4 bg-[#269984] hover:bg-[#208270] text-white rounded-2xl font-montserrat font-black uppercase tracking-widest shadow-xl shadow-[#269984]/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
          >
            {t('course.quiz.check') || 'Kitöltés ellenőrzése'}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="w-full max-w-xl">
          <AdaptiveFeedbackCard evaluation={evaluation} onRetry={handleRetry} />
        </div>
      )}
    </div>
  );
}
