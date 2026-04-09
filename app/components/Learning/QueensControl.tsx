'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

interface QueensControlProps {
  n: number;
  algorithmId: string;
}

function isSafe(board: number[], row: number, col: number): boolean {
  for (let r = 0; r < row; r++) {
    if (board[r] === col) return false;
    if (Math.abs(board[r] - col) === Math.abs(r - row)) return false;
  }
  return true;
}

function safeCols(board: number[], row: number, n: number): number[] {
  return Array.from({ length: n }, (_, c) => c).filter((c) => isSafe(board, row, c));
}

export default function QueensControl({ n, algorithmId }: QueensControlProps) {
  const { t } = useLocale();
  const { trackEvent, updateProgress } = useAnalytics(algorithmId, 'control');
  const { resetAlgorithmProgressTab } = useAlgorithmStore();

  // board[r] = col where queen is placed, or -1 if no queen in that row yet
  const [board, setBoard] = useState<number[]>(Array(n).fill(-1));
  const [currentRow, setCurrentRow] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flashCell, setFlashCell] = useState<{ row: number; col: number; ok: boolean } | null>(
    null,
  );
  const [hintMode, setHintMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const startTime = useRef(Date.now());

  const progress = useAlgorithmStore((state) => state.algorithmProgress[algorithmId]);
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const queensPlaced = board.filter((c) => c !== -1).length;
  const safe = useMemo(() => safeCols(board, currentRow, n), [board, currentRow, n]);
  const noMoveLeft = !gameWon && !gameOver && currentRow < n && safe.length === 0;

  // Auto end when stuck
  useEffect(() => {
    if (noMoveLeft) {
      setGameOver(true);
      trackEvent('control_stuck', { queensPlaced });

      const partialScore = Math.round((queensPlaced / (n + mistakes)) * 100);
      updateProgress(
        {
          controlMistakes: mistakes,
          controlBestScore: partialScore,
          controlCompleted: true, // we reached an end-state
          controlCompletedAt: new Date().toISOString(),
        },
        true,
      );

      // Force immediate sync on stuck
      const store = useAlgorithmStore.getState();
      fetch('/api/account/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedIds: store.completedIds,
          visualizerProgress: store.visualizerProgress,
          algorithmProgress: {
            [algorithmId]: store.algorithmProgress[algorithmId],
          },
        }),
      }).catch((err) => console.error('[QueensControl] Failed to sync stuck:', err));
    }
  }, [noMoveLeft, n, queensPlaced, mistakes, trackEvent, updateProgress, algorithmId]);

  // Track time on unmount
  useEffect(() => {
    return () => {
      const spentMs = Date.now() - startTime.current;
      const currentTotal = progressRef.current?.controlTotalTimeMs || 0;
      updateProgress({
        controlTotalTimeMs: currentTotal + spentMs,
      });
    };
  }, [algorithmId, updateProgress]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameOver || gameWon) return;
      if (row !== currentRow) return; // only allow clicking current row

      const ok = isSafe(board, row, col);
      setFlashCell({ row, col, ok });
      setTimeout(() => setFlashCell(null), ok ? 300 : 700);

      if (ok) {
        const newBoard = [...board];
        newBoard[row] = col;
        setBoard(newBoard);
        trackEvent('control_place_queen', { row, col });

        const nextRow = row + 1;
        if (nextRow === n) {
          // All queens placed!
          setGameWon(true);
          setCurrentRow(n);
          // Score formula: (n placed queens / (n + mistakes)) * 100
          // If perfect, Score = (8/8)*100 = 100. If 1 mistake, (8/9)*100 = 89.
          const finalScore = Math.round((n / (n + mistakes)) * 100);

          trackEvent('control_complete', { mistakes, queensPlaced: n, score: finalScore });
          updateProgress(
            {
              controlCompleted: true,
              controlBestScore: finalScore,
              controlMistakes: mistakes,
              controlCompletedAt: new Date().toISOString(),
            },
            true,
          );

          // Force immediate sync on finish
          const store = useAlgorithmStore.getState();
          fetch('/api/account/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              completedIds: store.completedIds,
              visualizerProgress: store.visualizerProgress,
              algorithmProgress: {
                [algorithmId]: store.algorithmProgress[algorithmId],
              },
            }),
          }).catch((err) => console.error('[QueensControl] Failed to sync win:', err));

          setHintMode(false);
        } else {
          setCurrentRow(nextRow);
          setHintMode(false);
        }
      } else {
        setMistakes((m) => m + 1);
        trackEvent('control_wrong_cell', { row, col });
      }
    },
    [board, currentRow, gameOver, gameWon, n, mistakes, trackEvent, updateProgress, algorithmId],
  );

  const handleReset = useCallback(() => {
    setBoard(Array(n).fill(-1));
    setCurrentRow(0);
    setMistakes(0);
    setFlashCell(null);
    setHintMode(false);
    setGameOver(false);
    setGameWon(false);
    trackEvent('control_reset');

    // 1. Accumulate time before reset
    const spentMs = Date.now() - startTime.current;
    const currentTotal = progress?.controlTotalTimeMs || 0;

    // 2. Clear local and store state
    resetAlgorithmProgressTab(algorithmId, 'control');
    updateProgress(
      {
        controlCompleted: false,
        controlBestScore: 0,
        controlMistakes: 0,
        controlTotalTimeMs: currentTotal + spentMs,
        controlCompletedAt: null,
      },
      true,
    );

    // 3. Force manual sync if possible (standard pattern for resets)
    const store = useAlgorithmStore.getState();
    fetch('/api/account/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedIds: store.completedIds,
        visualizerProgress: store.visualizerProgress,
        algorithmProgress: {
          [algorithmId]: store.algorithmProgress[algorithmId],
        },
      }),
    }).catch((err) => console.error('[QueensControl] Failed to sync reset:', err));

    startTime.current = Date.now();
  }, [
    n,
    algorithmId,
    trackEvent,
    resetAlgorithmProgressTab,
    updateProgress,
    progress?.controlTotalTimeMs,
  ]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderBoard = () => {
    const cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const isDark = (r + c) % 2 === 1;
        const hasQueen = board[r] === c;
        const isCurrentRow = r === currentRow && !gameOver && !gameWon;
        const isHintCell = hintMode && isCurrentRow && safe.includes(c);
        const isFlashing = flashCell && flashCell.row === r && flashCell.col === c;

        // Colors
        let bgClass = isDark ? 'bg-gray-400 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800';

        if (isHintCell) bgClass = 'bg-emerald-200 dark:bg-emerald-900/60';
        if (isCurrentRow && !isHintCell && !hasQueen)
          bgClass += ' ring-1 ring-inset ring-[#269984]/30';
        if (isFlashing) {
          bgClass = flashCell!.ok
            ? 'bg-emerald-400 dark:bg-emerald-600'
            : 'bg-red-400 dark:bg-red-700';
        }

        const isClickable = isCurrentRow && !gameOver && !gameWon;
        const queenColor =
          board.filter((v) => v !== -1).indexOf(board[r]) !== -1 && board[r] === c && r < currentRow
            ? gameWon
              ? 'text-green-400'
              : 'text-amber-400'
            : 'text-amber-400';

        cells.push(
          <motion.div
            key={`${r}-${c}`}
            onClick={() => handleCellClick(r, c)}
            className={`relative flex items-center justify-center rounded-sm transition-colors duration-150 overflow-hidden 
              ${bgClass}
              ${isClickable ? 'cursor-pointer hover:brightness-110' : ''}`}
            whileTap={isClickable ? { scale: 0.92 } : {}}
          >
            <AnimatePresence>
              {hasQueen && (
                <motion.div
                  key={`queen-${r}-${c}`}
                  initial={{ opacity: 0, scale: 0.3, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <Crown className={`w-4/5 h-4/5 ${queenColor} drop-shadow`} />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Threatened indicator (X) for invalid flash */}
            {isFlashing && !flashCell!.ok && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <XCircle className="w-2/3 h-2/3 text-white" />
              </motion.div>
            )}
            {/* Row label */}
            {c === 0 && (
              <span className="absolute left-0.5 top-0.5 text-[8px] opacity-30 pointer-events-none select-none">
                {r}
              </span>
            )}
          </motion.div>,
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      {/* Status bar */}
      <div className="w-full max-w-[400px] flex items-center justify-between px-2 h-6">
        <span className="font-montserrat text-sm text-gray-500 dark:text-gray-400">
          👑 {queensPlaced} / {n}
        </span>
        <span className="font-montserrat text-sm text-red-400">✗ {mistakes}</span>
      </div>

      {/* Board */}
      <div
        className="grid gap-0.5 p-2 bg-gray-300 dark:bg-white/10 rounded-xl shadow-inner w-full max-w-[400px] aspect-square mx-auto overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
        }}
      >
        {renderBoard()}
      </div>

      {/* Row indicator / Messages */}
      <div className="h-10 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {!gameOver && !gameWon ? (
            <motion.p
              key="picking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-montserrat text-sm text-gray-500 dark:text-gray-400"
            >
              {t('control.select_next_queen')} —{' '}
              <span className="font-bold text-[#269984]">
                {t('control.row', { row: currentRow })}
              </span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Game over / won */}
      <AnimatePresence>
        {(gameOver || gameWon) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`w-full max-w-sm p-5 rounded-2xl text-white text-center shadow-2xl ${
              gameWon
                ? 'bg-gradient-to-br from-[#269984] to-[#1f7a6a]'
                : 'bg-gradient-to-br from-red-500 to-red-700'
            }`}
          >
            <div className="text-4xl mb-2">{gameWon ? '🎉' : '😔'}</div>
            <h3 className="font-montserrat font-bold text-lg mb-1">
              {gameWon ? t('control.queens_placed') : t('control.stuck')}
            </h3>
            <p className="font-montserrat text-sm opacity-80">
              {gameWon
                ? t('control.game_won_message', { n, mistakes })
                : t('control.game_over_message', { queensPlaced, n, mistakes })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        {!gameOver && !gameWon && (
          <button
            onClick={() => setHintMode((h) => !h)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-montserrat font-bold text-sm transition-all active:scale-95 ${
              hintMode
                ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            {hintMode ? t('control.hint_on') : t('control.hint')}
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-montserrat font-bold text-sm bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          {t('control.reset')}
        </button>
      </div>

      {/* Hint explainer */}
      {hintMode && !gameOver && !gameWon && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-montserrat text-xs text-emerald-600 dark:text-emerald-400 text-center"
        >
          💡 {t('control.hint_explainer')}
        </motion.p>
      )}
    </div>
  );
}
