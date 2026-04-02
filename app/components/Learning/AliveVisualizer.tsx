'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, PanInfo } from 'framer-motion';
import { Play, Trash2, HelpCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useLocale } from '../../i18n/LocaleProvider';
import { getAlgorithmNodes, type AlgorithmNode } from '../../../lib/algorithms/nodeDefinitions';
import {
  getCodePatterns,
  analyzeCode,
  type CodeAnalysisResult,
} from '../../../lib/algorithms/codeAnalysis';
import { useAlgorithmStore, type AlgorithmProgress } from '../../store/useAlgorithmStore';

const DROP_THRESHOLD = 50; // pixels
const EMPTY_PROGRESS: Readonly<Partial<AlgorithmProgress>> = Object.freeze({});

interface AliveVisualizerProps {
  algorithmId: string;
}

type Mode = 'code' | 'nodes';

export default function AliveVisualizer({ algorithmId }: AliveVisualizerProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'alive');
  const progress = useAlgorithmStore(
    (state) => state.algorithmProgress[algorithmId] || EMPTY_PROGRESS,
  );

  const [mode, setMode] = useState<Mode>('code');
  const [helpUsed, setHelpUsed] = useState(false);
  const startTime = useMemo(() => Date.now(), []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {mode === 'code' ? (
        <CodeMode
          algorithmId={algorithmId}
          trackEvent={trackEvent}
          updateProgress={updateProgress}
          progress={progress}
          startTime={startTime}
          helpUsed={helpUsed}
          onSwitchToNodes={() => {
            setMode('nodes');
            setHelpUsed(true);
            trackEvent('alive_help_activated');
          }}
          t={t}
        />
      ) : (
        <NodeMode
          algorithmId={algorithmId}
          trackEvent={trackEvent}
          updateProgress={updateProgress}
          startTime={startTime}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Code Mode ─────────────────────────────────────────────────

interface CodeModeProps {
  algorithmId: string;
  trackEvent: (type: string, data?: Record<string, unknown>) => void;
  updateProgress: (updates: Partial<AlgorithmProgress>) => void;
  progress: Partial<AlgorithmProgress>;
  startTime: number;
  helpUsed: boolean;
  onSwitchToNodes: () => void;
  t: (key: string) => string;
}

function CodeMode({
  algorithmId,
  trackEvent,
  updateProgress,
  progress,
  startTime,
  helpUsed,
  onSwitchToNodes,
  t,
}: CodeModeProps) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CodeAnalysisResult | null>(null);
  const [submissions, setSubmissions] = useState(0);

  const patterns = useMemo(() => getCodePatterns(algorithmId), [algorithmId]);

  const handleRun = useCallback(() => {
    if (!patterns) return;

    const analysis = analyzeCode(code, patterns, algorithmId);
    setResult(analysis);
    setSubmissions((s) => s + 1);

    trackEvent('alive_code_submit', {
      code,
      score: analysis.score,
      isCorrect: analysis.isCorrect,
      matched: analysis.matched,
      missing: analysis.missing,
      attempt: submissions + 1,
    });

    const bestScore = Math.max(Number(result?.score || 0), analysis.score);

    if (analysis.isCorrect) {
      trackEvent('alive_code_success', {
        code,
        attempts: submissions + 1,
        timeMs: Date.now() - startTime,
      });
      updateProgress({
        aliveCompleted: true,
        aliveHelpUsed: helpUsed,
        aliveCodeSubmissions: submissions + 1,
        aliveLastCode: code,
        aliveBestScore: bestScore,
        aliveTotalTimeMs: Date.now() - startTime,
        aliveCompletedAt: new Date().toISOString(),
      });
    } else {
      trackEvent('alive_code_error', {
        missing: analysis.missing,
        score: analysis.score,
      });

      const isPartiallyCorrect = analysis.score > 0;
      const isNewlyCompleted = isPartiallyCorrect && !progress?.aliveCompleted;

      updateProgress({
        aliveCompleted: isPartiallyCorrect || (progress?.aliveCompleted ?? false),
        aliveLastCode: code,
        aliveBestScore: bestScore,
        aliveCodeSubmissions: submissions + 1,
        aliveLastActivityAt: new Date().toISOString(),
        ...(isNewlyCompleted ? { aliveCompletedAt: new Date().toISOString() } : {}),
      });
    }
  }, [
    code,
    patterns,
    algorithmId,
    submissions,
    startTime,
    helpUsed,
    trackEvent,
    updateProgress,
    result?.score,
    progress?.aliveCompleted,
  ]);

  const handleClear = () => {
    setCode('');
    setResult(null);
    trackEvent('alive_clear');

    // Explicitly reset completion in progress store
    updateProgress({
      aliveCompleted: false,
      aliveBestScore: 0,
      aliveCompletedAt: null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat font-bold text-lg text-black dark:text-white">
          {t('alive.title')}
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToNodes}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-montserrat font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            {t('alive.help')}
          </button>
        </div>
      </div>

      {/* Reference panel — what elements are needed */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
        <span className="font-montserrat font-bold text-xs text-gray-500 mr-2 self-center">
          {t('alive.reference')}:
        </span>
        {patterns?.map((p) => {
          const found = result?.details.find((d) => d.id === p.id);
          return (
            <span
              key={p.id}
              className={`px-3 py-1 rounded-lg font-montserrat text-xs font-bold transition-all ${
                found?.found
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : result
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    : 'bg-white dark:bg-[#1a1a1a] text-gray-500 border border-gray-200 dark:border-white/10'
              }`}
            >
              {found?.found && <CheckCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}
              {result && !found?.found && <XCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}
              {p.label}
            </span>
          );
        })}
      </div>

      {/* Code Editor */}
      <div className="rounded-2xl bg-[#1e1e2e] dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#181825] dark:bg-[#080808] border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs font-mono text-gray-500">JavaScript</span>
        </div>
        <div className="relative">
          {/* Line numbers */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1a1a2e] dark:bg-[#0a0a0a] border-r border-white/5 flex flex-col items-end pr-2 pt-4 pointer-events-none">
            {code.split('\n').map((_, i) => (
              <span key={i} className="text-xs font-mono text-gray-600 leading-6">
                {i + 1}
              </span>
            ))}
            {code === '' && <span className="text-xs font-mono text-gray-600 leading-6">1</span>}
          </div>
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setResult(null);
            }}
            placeholder={t('alive.placeholder')}
            spellCheck={false}
            className="w-full min-h-[300px] p-4 pl-14 bg-transparent text-gray-200 font-mono text-sm leading-6 resize-y outline-none placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={!code.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-[#269984] text-white shadow-lg shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" />
          {t('alive.run')}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-montserrat font-bold text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {t('alive.clear')}
        </button>
        {submissions > 0 && (
          <span className="ml-auto font-montserrat font-bold text-xs text-gray-500">
            {t('alive.score')}: {result?.score || 0}/100
          </span>
        )}
      </div>

      {/* Analysis Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-5 rounded-2xl border shadow-sm ${
              result.isCorrect
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {result.isCorrect ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-montserrat font-bold text-green-600 dark:text-green-400">
                    {t('alive.success')}
                  </h4>
                  <p className="font-montserrat text-sm text-green-600/70 dark:text-green-400/70 mt-1">
                    🎉 {submissions === 1 ? 'First try!' : `${submissions} attempts`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="font-montserrat font-bold text-sm text-gray-700 dark:text-gray-300">
                    {t('alive.score')}: {result.score}/100
                  </span>
                </div>
                {result.missing.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.missing.map((m) => (
                      <span
                        key={m}
                        className="px-3 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-montserrat text-xs font-bold border border-red-500/20"
                      >
                        {t('alive.missing').replace('{element}', m)}
                      </span>
                    ))}
                  </div>
                )}
                {/* Real Code Execution Feedback */}
                {result.executionPassed !== undefined && (
                  <div className="mt-2 pt-3 border-t border-red-500/10 dark:border-red-500/20">
                    <h5 className="font-montserrat font-bold text-xs text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Test Execution
                    </h5>
                    {result.executionPassed ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">
                          Passed (Array was sorted correctly)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-bold font-mono">{result.executionError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Node Mode ─────────────────────────────────────────────────

interface NodeModeProps {
  algorithmId: string;
  trackEvent: (type: string, data?: Record<string, unknown>) => void;
  updateProgress: (updates: Partial<AlgorithmProgress>) => void;
  startTime: number;
  t: (key: string) => string;
}

function NodeMode({ algorithmId, trackEvent, updateProgress, startTime, t }: NodeModeProps) {
  const allNodes = useMemo(() => getAlgorithmNodes(algorithmId) || [], [algorithmId]);

  // Palette: shuffled nodes
  const shuffledPalette = useMemo(() => [...allNodes].sort(() => Math.random() - 0.5), [allNodes]);

  const [palette, setPalette] = useState<AlgorithmNode[]>(shuffledPalette);
  const [program, setProgram] = useState<AlgorithmNode[]>([]);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const programRef = React.useRef<HTMLDivElement>(null);

  // Drag interaction states
  const [draggingNode, setDraggingNode] = useState<AlgorithmNode | null>(null);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  // Add node to program
  const addNode = useCallback(
    (node: AlgorithmNode, atIndex?: number) => {
      setPalette((p) => p.filter((n) => n.id !== node.id));
      setProgram((p) => {
        if (p.some((n) => n.id === node.id)) return p; // Prevent duplicates!
        const next = [...p];
        if (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= p.length) {
          next.splice(atIndex, 0, node);
        } else {
          next.push(node);
        }
        return next;
      });
      setResult(null);
      trackEvent('alive_node_place', { nodeId: node.id, position: atIndex ?? program.length });
    },
    [program.length, trackEvent],
  );

  // Handle Drag Move (to show preview)
  const onPaletteDrag = (_event: unknown, info: PanInfo) => {
    if (!programRef.current) return;

    const rect = programRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Page-relative coordinates for the container
    const pageRectTop = rect.top + scrollY;
    const pageRectBottom = rect.bottom + scrollY;
    const pageRectLeft = rect.left + scrollX;
    const pageRectRight = rect.right + scrollX;

    const x = info.point.x;
    const y = info.point.y;

    // Use a larger hit box for easier dropping (add DROP_THRESHOLD padding conceptually)
    const padding = DROP_THRESHOLD;
    const isOver =
      x >= pageRectLeft - padding &&
      x <= pageRectRight + padding &&
      y >= pageRectTop - padding &&
      y <= pageRectBottom + padding;

    if (isOver) {
      // Use pure mathematical index calculation to be completely immune to
      // DOM node layout animations and visual shifting during Framer Motion updates.
      // Container has p-6 (24px padding). Items are 56px height + space-y-2 (8px gap) = 64px stride.
      const offsetY = y - pageRectTop - 24;

      // Calculate which "slot" the pointer is hovering over.
      // Center of slot 0 is 28px. Threshold between slot 0 and 1 is 28px + 36px offset.
      let insertIndex = Math.max(0, Math.floor((offsetY + 36) / 64));

      if (insertIndex > program.length) {
        insertIndex = program.length;
      }

      setDragHoverIndex(insertIndex);
    } else {
      setDragHoverIndex(null);
    }
  };

  // Handle Drag End from Palette
  const onPaletteDragEnd = (_event: unknown, _info: unknown, node: AlgorithmNode) => {
    if (dragHoverIndex !== null) {
      addNode(node, dragHoverIndex);
    }
    setDraggingNode(null);
    setDragHoverIndex(null);
  };

  // Handle Drag End from Program (to remove/move back)
  const onProgramDragEnd = (_event: unknown, info: PanInfo, node: AlgorithmNode) => {
    if (!programRef.current) return;

    const rect = programRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    const pageRectTop = rect.top + scrollY;
    const pageRectBottom = rect.bottom + scrollY;
    const pageRectLeft = rect.left + scrollX;
    const pageRectRight = rect.right + scrollX;

    const x = info.point.x;
    const y = info.point.y;

    // If dragged outside the program area, remove it
    if (x < pageRectLeft || x > pageRectRight || y < pageRectTop || y > pageRectBottom) {
      removeNode(node);
    }
  };

  // Remove node from program
  const removeNode = (node: AlgorithmNode) => {
    setProgram((p) => p.filter((n) => n.id !== node.id));
    setPalette((p) => [...p, node].sort(() => Math.random() - 0.5));
    setResult(null);
    trackEvent('alive_node_remove', { nodeId: node.id });
  };

  // Run / check the order
  const handleRun = () => {
    setAttempts((a) => a + 1);

    // Check: no distractors, correct order
    const hasDistractor = program.some((n) => n.isDistractor);
    const correctNodes = allNodes.filter((n) => !n.isDistractor).sort((a, b) => a.order - b.order);
    const isCorrectOrder =
      !hasDistractor &&
      program.length === correctNodes.length &&
      program.every((n, i) => n.id === correctNodes[i].id);

    trackEvent('alive_node_run', {
      order: program.map((n) => n.id),
      isCorrect: isCorrectOrder,
      attempt: attempts + 1,
    });

    if (isCorrectOrder) {
      setResult('correct');
      trackEvent('alive_node_complete', {
        helpUsed: true,
        attempts: attempts + 1,
        timeMs: Date.now() - startTime,
      });
      updateProgress({
        aliveCompleted: true,
        aliveHelpUsed: true,
        aliveCodeSubmissions: attempts + 1,
        aliveBestScore: 100,
        aliveTotalTimeMs: Date.now() - startTime,
        aliveCompletedAt: new Date().toISOString(),
      });
    } else {
      setResult('incorrect');
      updateProgress({
        aliveLastActivityAt: new Date().toISOString(),
      });
    }
  };

  // Clear all
  const handleClear = () => {
    setProgram([]);
    setPalette([...allNodes].sort(() => Math.random() - 0.5));
    setResult(null);
    trackEvent('alive_clear');

    // Explicitly reset completion in progress store
    updateProgress({
      aliveCompleted: false,
      aliveBestScore: 0,
      aliveCompletedAt: null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat font-bold text-lg text-black dark:text-white">
          {t('alive.title')}
        </h3>
        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-montserrat text-xs font-bold">
          {t('alive.help_active')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Palette */}
        <div className="space-y-3">
          <h4 className="font-montserrat font-bold text-sm text-gray-500 uppercase tracking-widest">
            {t('alive.available_blocks')}
          </h4>
          <div className="space-y-2 min-h-[200px] p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10">
            {palette.length === 0 && (
              <p className="text-center text-gray-400 font-montserrat text-sm py-8">
                All blocks placed!
              </p>
            )}
            {palette.map((node) => (
              <motion.div
                key={node.id}
                drag
                dragSnapToOrigin
                onDragStart={() => setDraggingNode(node)}
                onDrag={(e, info) => onPaletteDrag(e, info)}
                onDragEnd={(e, info) => onPaletteDragEnd(e, info, node)}
                whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onTap={() => addNode(node)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-l-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow cursor-grab border-l-gray-300 dark:border-l-gray-700 ${
                  draggingNode?.id === node.id ? 'opacity-50' : ''
                }`}
              >
                <span className="text-xl pointer-events-none">{node.icon}</span>
                <span className="font-mono text-sm text-black dark:text-white font-bold pointer-events-none">
                  {node.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Program */}
        <div className="space-y-3">
          <h4 className="font-montserrat font-bold text-sm text-gray-500 uppercase tracking-widest">
            {t('alive.your_program')}
          </h4>
          <div
            ref={programRef}
            className="space-y-2 min-h-[300px] p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border-2 border-dashed border-[#269984]/20 shadow-[inner_0_2px_12px_rgba(0,0,0,0.05)] transition-colors hover:border-[#269984]/40"
          >
            {program.length === 0 && (
              <p className="text-center text-gray-400 font-montserrat text-sm py-8">
                {t('alive.help_active')}
              </p>
            )}
            <Reorder.Group
              axis="y"
              values={program}
              onReorder={(newOrder) => {
                setProgram(newOrder);
                setResult(null);
                trackEvent('alive_node_reorder', {
                  order: newOrder.map((n) => n.id),
                });
              }}
              className="space-y-2"
            >
              {program.map((node, idx) => {
                const correctNodes = allNodes
                  .filter((n) => !n.isDistractor)
                  .sort((a, b) => a.order - b.order);
                const isCorrectAtPos =
                  result && correctNodes[idx] && node.id === correctNodes[idx].id;

                let statusColor = 'border-l-gray-300 dark:border-l-gray-700';
                if (result) {
                  statusColor = isCorrectAtPos ? 'border-l-green-500' : 'border-l-red-500';
                }

                return (
                  <React.Fragment key={`frag-${node.id}`}>
                    {dragHoverIndex === idx && (
                      <motion.div
                        key={`placeholder-${idx}`}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 56 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border-2 border-dashed border-[#269984]/50 bg-[#269984]/10"
                      />
                    )}
                    <Reorder.Item
                      value={node}
                      data-node-wrapper
                      drag
                      dragSnapToOrigin
                      onDragEnd={(e, info) => onProgramDragEnd(e, info, node)}
                    >
                      <motion.div
                        layout
                        data-node-id={node.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-white/5 shadow-sm cursor-grab active:cursor-grabbing ${statusColor}`}
                        whileDrag={{ scale: 1.05, zIndex: 60 }}
                      >
                        <span className="text-gray-400 font-mono text-xs w-5 text-right flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xl">{node.icon}</span>
                        <span className="font-mono text-sm text-black dark:text-white font-bold flex-1">
                          {node.label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNode(node);
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </Reorder.Item>
                  </React.Fragment>
                );
              })}
              {dragHoverIndex === program.length && (
                <motion.div
                  key="placeholder-end"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 56 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border-2 border-dashed border-[#269984]/50 bg-[#269984]/10"
                />
              )}
            </Reorder.Group>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={program.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-montserrat font-bold text-sm bg-[#269984] text-white shadow-lg shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" />
          {t('alive.run')}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-montserrat font-bold text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {t('alive.clear')}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-5 rounded-2xl border shadow-sm ${
              result === 'correct'
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {result === 'correct' ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-montserrat font-bold text-green-600 dark:text-green-400">
                    {t('alive.success')}
                  </h4>
                  <p className="font-montserrat text-sm text-green-600/70 dark:text-green-400/70 mt-1">
                    {t('alive.used_help')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <p className="font-montserrat font-bold text-sm text-red-600 dark:text-red-400">
                  {t('alive.error') ||
                    'Something went wrong — check the order and remove wrong blocks'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
