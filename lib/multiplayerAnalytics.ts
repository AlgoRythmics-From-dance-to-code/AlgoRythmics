import type { MatchStatistics, StepActionLog } from '../types/multiplayer';

const STORAGE_KEY = 'algorythmics_multiplayer_history';

/**
 * Save a completed multiplayer match locally and transmit to the analytics endpoint.
 */
export async function trackAndSaveMultiplayerMatch(stats: MatchStatistics) {
  if (typeof window === 'undefined') return;

  // 1. Save to local storage history
  try {
    const existing = getMultiplayerHistory();
    const updated = [stats, ...existing].slice(0, 50); // Keep last 50 matches
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[MultiplayerAnalytics] Failed to save local match history:', err);
  }

  // 2. Transmit to backend learning-events API
  try {
    const events = [
      {
        eventType: 'multiplayer_match_complete',
        eventData: {
          matchId: stats.matchId,
          roomId: stats.roomId,
          mode: stats.mode,
          controlStyle: stats.controlStyle,
          teamSize: stats.teamSize,
          durationMs: stats.durationMs,
          totalComparisons: stats.totalComparisons,
          totalSwaps: stats.totalSwaps,
          totalErrors: stats.totalErrors,
          accuracyPercentage: stats.accuracyPercentage,
          choreographyScore: stats.choreographyScore,
          actualSteps: stats.actualSteps,
          theoreticalComplexity: stats.theoreticalComplexity,
          playerStats: stats.playerStats,
        },
        sessionId: `mp-${stats.roomId}-${stats.startTime}`,
        durationMs: stats.durationMs,
      },
    ];

    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
  } catch (err) {
    // Non-critical: analytics failure shouldn't break the user experience
    console.warn('[MultiplayerAnalytics] Remote tracking failed:', err);
  }
}

/**
 * Log an individual atomic step action (compare, swap, invalid attempt) during match
 */
export function trackMultiplayerStep(stepLog: StepActionLog, roomId: string) {
  if (typeof window === 'undefined') return;

  // Fire and forget atomic event
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          eventType: `multiplayer_${stepLog.actionType}`,
          eventData: {
            roomId,
            playerId: stepLog.playerId,
            playerName: stepLog.playerName,
            indices: stepLog.indices,
            values: stepLog.values,
            isSuccess: stepLog.isSuccess,
            message: stepLog.message,
            codeSnippet: stepLog.codeSnippet,
          },
          sessionId: `mp-${roomId}`,
          durationMs: 0,
        },
      ],
    }),
  }).catch(() => {
    // ignore
  });
}

/**
 * Get all historical matches saved in this browser
 */
export function getMultiplayerHistory(): MatchStatistics[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchStatistics[];
  } catch {
    return [];
  }
}

/**
 * Calculate aggregate summary stats across all games played
 */
export function getMultiplayerAggregateStats() {
  const history = getMultiplayerHistory();
  if (history.length === 0) {
    return {
      totalGames: 0,
      totalDurationSeconds: 0,
      averageAccuracy: 0,
      averageChoreography: 0,
      totalSwaps: 0,
      totalComparisons: 0,
      favoriteMode: 'bubble_sort',
    };
  }

  const totalGames = history.length;
  const totalDurationMs = history.reduce((acc, m) => acc + m.durationMs, 0);
  const avgAccuracy = Math.round(
    history.reduce((acc, m) => acc + m.accuracyPercentage, 0) / totalGames,
  );
  const avgChoreography = Math.round(
    history.reduce((acc, m) => acc + m.choreographyScore, 0) / totalGames,
  );
  const totalSwaps = history.reduce((acc, m) => acc + m.totalSwaps, 0);
  const totalComparisons = history.reduce((acc, m) => acc + m.totalComparisons, 0);

  // Count favorite mode
  const modeCounts: Record<string, number> = {};
  for (const m of history) {
    modeCounts[m.mode] = (modeCounts[m.mode] || 0) + 1;
  }
  let favoriteMode = 'bubble_sort';
  let maxCount = 0;
  for (const [mode, count] of Object.entries(modeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteMode = mode;
    }
  }

  return {
    totalGames,
    totalDurationSeconds: Math.round(totalDurationMs / 1000),
    averageAccuracy: avgAccuracy,
    averageChoreography: avgChoreography,
    totalSwaps,
    totalComparisons,
    favoriteMode,
  };
}
