/**
 * Application-wide constants and URLs
 */

export const APP_CONFIG = {
  NAME: 'AlgoRythmics',
  BASE_URL:
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  COOKIE_TOKEN_NAME: 'algorythmics-admin-token',
  TOKEN_EXPIRATION_REMEMBER_ME: 60 * 60 * 24 * 90, // 90 days
  TOKEN_EXPIRATION_DEFAULT: 60 * 60 * 24 * 1, // 1 day
  SYNC_INTERVAL_MS: 10000, // 10 seconds for analytics/progress batching
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',
  PROFILE: '/profil',
  ALGORITHMS: '/algorithms',
  COURSES: '/courses',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    SOCIAL_CALLBACK: '/api/auth/social-callback',
    VERIFY_ACCOUNT: '/api/verify-account',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/password-reset',
  },
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  DISCORD: 'discord',
  GITHUB: 'github',
} as const;

export interface Video {
  id: string;
  duration: string;
  views: string;
  categoryId: 'sorting' | 'searching' | 'backtracking' | 'fun';
  thumbnail: string;
  youtubeId: string;
}

export const VIDEOS: Video[] = [
  {
    id: 'bubble-sort-dance',
    duration: '4:32',
    views: '125K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_109.svg',
    youtubeId: 'lyZQPjUT5B4',
  },
  {
    id: 'insertion-sort-folk',
    duration: '5:18',
    views: '98K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_142.svg',
    youtubeId: 'ROalU379l3U',
  },
  {
    id: 'selection-sort-waltz',
    duration: '3:45',
    views: '87K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_119.svg',
    youtubeId: 'placeholder_selection',
  },
  {
    id: 'merge-sort-tango',
    duration: '6:12',
    views: '156K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_166.svg',
    youtubeId: 'placeholder_merge',
  },
  {
    id: 'quick-sort-salsa',
    duration: '5:55',
    views: '134K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_167.svg',
    youtubeId: 'placeholder_quick',
  },
  {
    id: 'heap-sort-ballet',
    duration: '7:08',
    views: '92K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_168.svg',
    youtubeId: 'placeholder_heap',
  },
  {
    id: 'shell-sort-flamenco',
    duration: '4:45',
    views: '78K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_132.svg',
    youtubeId: 'placeholder_shell',
  },
  {
    id: 'linear-search-hip-hop',
    duration: '3:22',
    views: '112K',
    categoryId: 'searching',
    thumbnail: 'algo_group_109.svg',
    youtubeId: 'placeholder_linear',
  },
  {
    id: 'binary-search-swing',
    duration: '4:15',
    views: '145K',
    categoryId: 'searching',
    thumbnail: 'algo_group_142.svg',
    youtubeId: 'placeholder_binary',
  },
  {
    id: 'n-queens-backtracking',
    duration: '6:50',
    views: '45K',
    categoryId: 'backtracking',
    thumbnail: 'algo_group_109.svg',
    youtubeId: '0DeznFqrgAI',
  },
];

export interface Algorithm {
  id: string;
  category: 'sorting' | 'searching' | 'backtracking' | 'fun';
  illAsset: string;
  complexity: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const ALGORITHMS: Algorithm[] = [
  {
    id: 'bubble-sort',
    category: 'sorting',
    illAsset: 'algo_group_109.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
  },
  {
    id: 'insertion-sort',
    category: 'sorting',
    illAsset: 'algo_group_142.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
  },
  {
    id: 'selection-sort',
    category: 'sorting',
    illAsset: 'algo_group_119.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
  },
  {
    id: 'shell-sort',
    category: 'sorting',
    illAsset: 'algo_group_132.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
  },
  {
    id: 'merge-sort',
    category: 'sorting',
    illAsset: 'algo_group_166.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
  },
  {
    id: 'quick-sort',
    category: 'sorting',
    illAsset: 'algo_group_167.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
  },
  {
    id: 'heap-sort',
    category: 'sorting',
    illAsset: 'algo_group_168.svg',
    complexity: 'O(n log n)',
    difficulty: 'Hard',
  },
  {
    id: 'linear-search',
    category: 'searching',
    illAsset: 'algo_group_109.svg',
    complexity: 'O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'binary-search',
    category: 'searching',
    illAsset: 'algo_group_142.svg',
    complexity: 'O(log n)',
    difficulty: 'Easy',
  },
  {
    id: 'n-queens',
    category: 'backtracking',
    illAsset: 'algo_group_109.svg',
    complexity: 'O(n!)',
    difficulty: 'Hard',
  },
  {
    id: 'bogosort',
    category: 'fun',
    illAsset: 'algo_group_119.svg',
    complexity: 'O(n! · n)',
    difficulty: 'Easy',
  },
];
