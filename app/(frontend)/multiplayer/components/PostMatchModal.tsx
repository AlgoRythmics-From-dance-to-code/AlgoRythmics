'use client';

import React, { useState } from 'react';
import type { MatchStatistics } from '../../../../types/multiplayer';
import { useLocale } from '../../../i18n/LocaleProvider';
import {
  Trophy,
  Award,
  Clock,
  Activity,
  CheckCircle,
  RotateCcw,
  ListOrdered,
  TrendingUp,
  Share2,
  Check,
} from 'lucide-react';

interface PostMatchModalProps {
  stats: MatchStatistics;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export default function PostMatchModal({ stats, onRestart, onBackToLobby }: PostMatchModalProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'steps'>('overview');
  const [copied, setCopied] = useState(false);

  const durationSec = Math.round(stats.durationMs / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const timeFormatted = `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;

  const modeName = t(`multiplayer.modes.${stats.mode}.name`) || stats.mode;
  const controlName =
    stats.controlStyle === 'spatial'
      ? t('multiplayer.controls.spatial.title')
      : stats.controlStyle === 'physical'
        ? t('multiplayer.controls.physical.title')
        : t('multiplayer.controls.discrete.title');

  const copyReport = () => {
    const text = `🏆 AlgoRythmics Multiplayer:
${modeName} (${controlName})
${t('multiplayer.post_match.time')}: ${timeFormatted}
${t('multiplayer.post_match.accuracy')}: ${stats.accuracyPercentage}%
${t('multiplayer.post_match.choreography')}: ${stats.choreographyScore}%
${t('multiplayer.post_match.total_steps', { count: stats.actualSteps })} (${stats.theoreticalComplexity})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find MVP (Highest contribution score)
  const mvp = [...stats.playerStats].sort((a, b) => b.contributionScore - a.contributionScore)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#269984] via-teal-600 to-emerald-600 p-6 text-center relative text-white">
          <div className="inline-flex p-3 rounded-full bg-white/15 backdrop-blur border border-white/20 mb-2">
            <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-montserrat">
            {t('multiplayer.post_match.title') || 'Algoritmus Sikeresen Teljesítve!'}
          </h2>
          <p className="text-sm text-emerald-100 mt-1 font-medium">
            {t('multiplayer.post_match.subtitle', {
              mode: modeName,
              teamSize: stats.teamSize,
              control: controlName,
            }) || `${modeName} • ${stats.teamSize} Players • ${controlName}`}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a0a] px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all font-montserrat ${
              activeTab === 'overview'
                ? 'border-[#269984] text-[#269984]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t('multiplayer.post_match.tab_overview') || 'Összegzés & Statisztika'}
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all font-montserrat ${
              activeTab === 'players'
                ? 'border-[#269984] text-[#269984]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            {t('multiplayer.post_match.tab_players', { count: stats.playerStats.length }) ||
              `Játékosok (${stats.playerStats.length})`}
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all font-montserrat ${
              activeTab === 'steps'
                ? 'border-[#269984] text-[#269984]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            {t('multiplayer.post_match.tab_steps', { count: stats.stepLogs.length }) ||
              `Lépés Napló (${stats.stepLogs.length})`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#269984]" />
                    {t('multiplayer.post_match.time') || 'Idő'}
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {timeFormatted}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    {t('multiplayer.post_match.accuracy') || 'Pontosság'}
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {stats.accuracyPercentage}%
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-1">
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    {t('multiplayer.post_match.choreography') || 'Koreográfia'}
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-300">
                    {stats.choreographyScore}%
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    {t('multiplayer.post_match.complexity') || 'Bonyolultság'}
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-300">
                    {stats.theoreticalComplexity}
                  </div>
                </div>
              </div>

              {/* Big-O Complexity Comparison Card */}
              <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-4 rounded-xl space-y-3 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between font-montserrat">
                  <span>
                    {t('multiplayer.post_match.analysis_title') ||
                      '🧠 Algoritmus Elemzés & Hatékonyság'}
                  </span>
                  <span className="text-xs font-mono text-[#269984] bg-[#269984]/10 border border-[#269984]/20 px-2 py-0.5 rounded">
                    {t('multiplayer.post_match.total_steps', { count: stats.actualSteps }) ||
                      `Összes Lépés: ${stats.actualSteps}`}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('multiplayer.post_match.analysis_text', {
                    comparisons: stats.totalComparisons,
                    swaps: stats.totalSwaps,
                    complexity: stats.theoreticalComplexity,
                  }) ||
                    `A csapat összesen ${stats.totalComparisons} összehasonlítást és ${stats.totalSwaps} cserét hajtott végre.`}
                </p>

                {/* Visual Bar Comparison */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {t('multiplayer.post_match.success_ratio') || 'Sikeres lépések aránya'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {stats.actualSteps - stats.totalErrors} / {stats.actualSteps}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.accuracyPercentage}%` }}
                      className="h-full bg-gradient-to-r from-[#269984] to-emerald-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* MVP Player Highlight */}
              {mvp && (
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-lg">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 font-montserrat">
                        {t('multiplayer.post_match.mvp_badge') || 'Csapat MVP (Legaktívabb)'}
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {mvp.playerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('multiplayer.post_match.contribution_points') || 'Hozzájárulási pont'}
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-300">
                      {mvp.contributionScore} pts
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-3">
              {stats.playerStats.map((p, idx) => (
                <div
                  key={p.playerId}
                  className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-3.5 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold font-mono text-slate-400 w-5">#{idx + 1}</div>
                    <div
                      style={{ backgroundColor: p.color }}
                      className="w-4 h-4 rounded-full shadow-sm"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {p.playerName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.swapsCount} cserék • {p.comparisonsCount} összehasonlítás
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {t('multiplayer.post_match.accuracy_label', { accuracy: p.accuracy }) ||
                        `${p.accuracy}% pontosság`}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('multiplayer.post_match.points_label', { points: p.contributionScore }) ||
                        `${p.contributionScore} pont`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-2">
              {stats.stepLogs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                  {t('multiplayer.post_match.no_steps') || 'Nincsenek rögzített lépések.'}
                </p>
              ) : (
                stats.stepLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      log.isSuccess
                        ? 'bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400">
                        [{Math.round(log.timestamp / 100) / 10}s]
                      </span>
                      <span className="font-semibold text-[#269984] dark:text-cyan-400">
                        {log.playerName}:
                      </span>
                      <span>{log.message}</span>
                    </div>
                    {log.codeSnippet && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 hidden sm:block truncate ml-2">
                        {log.codeSnippet}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-[#0a0a0a] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={copyReport}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors font-montserrat"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {copied
              ? t('multiplayer.copied') || 'Másolva!'
              : t('multiplayer.copy_result') || 'Eredmény Másolása'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLobby}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors font-montserrat"
            >
              {t('multiplayer.post_match.back_to_lobby') || 'Vissza a Lobbyba'}
            </button>
            <button
              onClick={onRestart}
              className="px-5 py-2 bg-[#269984] hover:bg-[#208270] text-white rounded-xl text-xs font-bold shadow-md shadow-[#269984]/20 transition-all flex items-center gap-1.5 font-montserrat active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              {t('multiplayer.post_match.play_again') || 'Újra Játék'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
