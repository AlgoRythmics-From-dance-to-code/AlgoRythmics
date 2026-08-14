'use client';

import React, { useState, useEffect } from 'react';
import {
  Shuffle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Copy,
  Sliders,
  Check,
  Search,
  Grid3X3,
} from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';

interface CustomInputBarProps {
  algorithmId: string;
  category: 'sorting' | 'searching' | 'backtracking' | 'fun';
  defaultArray: number[];
  currentArray: number[];
  currentTarget?: number;
  onApplyArray: (newArray: number[], newTarget?: number) => void;
  className?: string;
}

export default function CustomInputBar({
  category,
  currentArray,
  currentTarget,
  onApplyArray,
  className = '',
}: CustomInputBarProps) {
  const { t } = useLocale();

  const [inputVal, setInputVal] = useState(currentArray.join(', '));
  const [targetVal, setTargetVal] = useState(
    currentTarget !== undefined ? String(currentTarget) : '',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Sync internal input string when external currentArray changes
  useEffect(() => {
    setInputVal(currentArray.join(', '));
  }, [currentArray]);

  useEffect(() => {
    if (currentTarget !== undefined) {
      setTargetVal(String(currentTarget));
    }
  }, [currentTarget]);

  const isSearch = category === 'searching';
  const isBacktracking = category === 'backtracking';

  // Preset Generators
  const applyRandom = () => {
    const len = 8;
    const randArr = Array.from({ length: len }, () => Math.floor(Math.random() * 85) + 10);
    const randTarget = isSearch ? randArr[Math.floor(Math.random() * randArr.length)] : undefined;
    setErrorMsg(null);
    onApplyArray(randArr, randTarget);
  };

  const applySorted = () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80];
    const target = isSearch ? 50 : undefined;
    setErrorMsg(null);
    onApplyArray(sorted, target);
  };

  const applyReverse = () => {
    const reverse = [80, 70, 60, 50, 40, 30, 20, 10];
    const target = isSearch ? 30 : undefined;
    setErrorMsg(null);
    onApplyArray(reverse, target);
  };

  const applyNearlySorted = () => {
    const nearly = [10, 20, 40, 30, 50, 60, 80, 70];
    const target = isSearch ? 40 : undefined;
    setErrorMsg(null);
    onApplyArray(nearly, target);
  };

  const applyDuplicates = () => {
    const dupes = [15, 30, 15, 60, 45, 30, 75, 45];
    const target = isSearch ? 30 : undefined;
    setErrorMsg(null);
    onApplyArray(dupes, target);
  };

  const applyNQueensSize = (n: number) => {
    onApplyArray([n]);
  };

  // Custom Input Submission
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parts = inputVal
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10));

    if (parts.some(isNaN)) {
      setErrorMsg(
        t('visualizer.invalid_input') || 'Please enter only valid numbers (3–15 items, 1–99)!',
      );
      return;
    }

    if (parts.length < 3 || parts.length > 15) {
      setErrorMsg(t('visualizer.invalid_input') || 'Please provide 3–15 numbers between 1 and 99!');
      return;
    }

    if (parts.some((n) => n < 1 || n > 99)) {
      setErrorMsg(t('visualizer.invalid_input') || 'Numbers must be between 1 and 99!');
      return;
    }

    let parsedTarget = currentTarget;
    if (isSearch && targetVal.trim()) {
      const numTarget = parseInt(targetVal.trim(), 10);
      if (!isNaN(numTarget)) {
        parsedTarget = numTarget;
      }
    }

    onApplyArray(parts, parsedTarget);
    setIsCustomOpen(false);
  };

  return (
    <div
      className={`w-full rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 p-3 sm:p-4 shadow-sm flex flex-col gap-3 ${className}`}
    >
      {/* Top preset bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-gray-400">
            {t('visualizer.presets') || 'Presets'}:
          </span>

          {isBacktracking ? (
            // N-Queens presets (board size N)
            <div className="flex items-center gap-1.5">
              {[4, 5, 6, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => applyNQueensSize(size)}
                  className={`px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs transition-all flex items-center gap-1.5 ${
                    currentArray[0] === size
                      ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  {size}x{size}
                </button>
              ))}
            </div>
          ) : (
            // Sorting & Searching presets
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={applyRandom}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#269984] transition-all flex items-center gap-1.5"
                title={t('visualizer.preset_random') || 'Random array'}
              >
                <Shuffle className="w-3.5 h-3.5 text-[#269984]" />
                <span className="hidden sm:inline">
                  {t('visualizer.preset_random') || 'Random'}
                </span>
              </button>

              <button
                type="button"
                onClick={applySorted}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#269984] transition-all flex items-center gap-1.5"
                title={t('visualizer.preset_sorted') || 'Sorted (Ascending)'}
              >
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="hidden sm:inline">
                  {t('visualizer.preset_sorted') || 'Sorted'}
                </span>
              </button>

              <button
                type="button"
                onClick={applyReverse}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#269984] transition-all flex items-center gap-1.5"
                title={t('visualizer.preset_reverse') || 'Reverse sorted'}
              >
                <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">
                  {t('visualizer.preset_reverse') || 'Reverse'}
                </span>
              </button>

              <button
                type="button"
                onClick={applyNearlySorted}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#269984] transition-all flex items-center gap-1.5"
                title={t('visualizer.preset_nearly_sorted') || 'Nearly sorted'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">
                  {t('visualizer.preset_nearly_sorted') || 'Nearly Sorted'}
                </span>
              </button>

              <button
                type="button"
                onClick={applyDuplicates}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#269984] transition-all flex items-center gap-1.5"
                title={t('visualizer.preset_duplicates') || 'With duplicates'}
              >
                <Copy className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">
                  {t('visualizer.preset_duplicates') || 'Duplicates'}
                </span>
              </button>
            </div>
          )}
        </div>

        {!isBacktracking && (
          <button
            type="button"
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className={`px-3 py-1.5 rounded-xl font-montserrat font-bold text-xs transition-all flex items-center gap-1.5 ${
              isCustomOpen
                ? 'bg-[#269984] text-white shadow-md shadow-[#269984]/20'
                : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('visualizer.custom_input') || 'Custom Input'}</span>
          </button>
        )}
      </div>

      {/* Expandable custom input form */}
      {!isBacktracking && isCustomOpen && (
        <form
          onSubmit={handleCustomSubmit}
          className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-[11px] font-montserrat font-bold text-gray-400">
              {t('visualizer.input_array') || 'Array values (comma or space separated)'}:
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 45, 12, 89, 34, 67, 23"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm font-mono text-black dark:text-white outline-none focus:border-[#269984] transition-colors"
            />
          </div>

          {isSearch && (
            <div className="w-full sm:w-36 flex flex-col gap-1">
              <label className="text-[11px] font-montserrat font-bold text-gray-400">
                {t('visualizer.search_target') || 'Target'}:
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetVal}
                  onChange={(e) => setTargetVal(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 pl-7 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm font-mono text-black dark:text-white outline-none focus:border-[#269984] transition-colors"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="w-full sm:w-auto self-end pt-1">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-xl font-montserrat font-bold text-xs sm:text-sm bg-[#269984] text-white shadow-md shadow-[#269984]/20 hover:bg-[#1f7a6a] transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {t('visualizer.apply') || 'Apply'}
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <p className="text-xs font-montserrat font-bold text-red-500 animate-in fade-in">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
