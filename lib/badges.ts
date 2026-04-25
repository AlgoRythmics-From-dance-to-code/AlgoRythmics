export interface UserStats {
  totalTimeSpentMs?: number;
  totalPoints?: number;
  totalAlgorithmsStarted?: number;
  totalAlgorithmsCompleted?: number;
  totalCoursesStarted?: number;
  totalCoursesCompleted?: number;
  totalControlAttempts?: number;
  totalCreateAttempts?: number;
  totalAliveAttempts?: number;
  totalMistakes?: number;
  totalHintsUsed?: number;
  averageScore?: number;
  currentStreak?: number;
  longestStreak?: number;
}

export interface Badge {
  id: string;
  icon: string;
  color: string;
  translationKey: string;
  condition: (stats: UserStats) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'perfect_coder',
    icon: '🎯',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    translationKey: 'badges.perfect_coder',
    condition: (stats) =>
      (stats.totalAlgorithmsCompleted || 0) > 0 && (stats.totalMistakes || 0) === 0,
  },
  {
    id: 'experienced',
    icon: '⭐',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    translationKey: 'badges.experienced',
    condition: (stats) => (stats.totalPoints || 0) >= 1000,
  },
  {
    id: 'persistent',
    icon: '🔥',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    translationKey: 'badges.persistent',
    condition: (stats) => (stats.longestStreak || 0) >= 5,
  },
  {
    id: 'master',
    icon: '👑',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    translationKey: 'badges.master',
    condition: (stats) => (stats.totalAlgorithmsCompleted || 0) >= 5,
  },
];

export const getUserBadges = (stats?: UserStats): Badge[] => {
  if (!stats) return [];
  return BADGES.filter((badge) => badge.condition(stats));
};
