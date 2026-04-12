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
  LOCALES: ['en', 'hu', 'ro'],
  DEFAULT_LOCALE: 'hu',
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
  EDITOR: 'editor',
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
    id: 'bubble-sort',
    duration: '4:32',
    views: '125K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_109.svg',
    youtubeId: 'lyZQPjUT5B4',
  },
  {
    id: 'insertion-sort',
    duration: '5:18',
    views: '98K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_142.svg',
    youtubeId: 'ROalU379l3U',
  },
  {
    id: 'selection-sort',
    duration: '3:45',
    views: '87K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_119.svg',
    youtubeId: 'Ns4TPTC8whw',
  },
  {
    id: 'merge-sort',
    duration: '6:12',
    views: '156K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_166.svg',
    youtubeId: 'XaqR3G_NVoo',
  },
  {
    id: 'quick-sort',
    duration: '5:55',
    views: '134K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_167.svg',
    youtubeId: 'ywWBy6J5gz8',
  },
  {
    id: 'heap-sort',
    duration: '7:08',
    views: '92K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_168.svg',
    youtubeId: 'Xw2D9aJRBY4',
  },
  {
    id: 'shell-sort',
    duration: '4:45',
    views: '78K',
    categoryId: 'sorting',
    thumbnail: 'algo_group_132.svg',
    youtubeId: 'CmPA7zE8mx0',
  },
  {
    id: 'linear-search',
    duration: '3:22',
    views: '112K',
    categoryId: 'searching',
    thumbnail: 'algo_linear_search.svg',
    youtubeId: '-PuqKbu9K3U',
  },
  {
    id: 'binary-search',
    duration: '4:15',
    views: '145K',
    categoryId: 'searching',
    thumbnail: 'algo_binary_search.svg',
    youtubeId: 'iP897Z5Nerk',
  },
  {
    id: 'n-queens',
    duration: '6:50',
    views: '45K',
    categoryId: 'backtracking',
    thumbnail: 'algo_n_queens.svg',
    youtubeId: 'R8bM6pxlrLY',
  },
];

export interface Algorithm {
  id: string;
  category: 'sorting' | 'searching' | 'backtracking' | 'fun';
  illAsset: string;
  complexity: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  steps: string[];
}

export const ALGORITHMS: Algorithm[] = [
  {
    id: 'bubble-sort',
    category: 'sorting',
    illAsset: 'algo_group_109.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
    steps: [
      'Compare adjacent elements',
      'Swap if they are in the wrong order',
      'Move to the next pair',
      'Repeat until no swaps are needed',
      'The list is now sorted',
    ],
  },
  {
    id: 'insertion-sort',
    category: 'sorting',
    illAsset: 'algo_group_142.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
    steps: [
      'Start with the second element',
      'Compare with elements to its left',
      'Shift larger elements right',
      'Insert the element in its correct position',
      'Repeat for all remaining elements',
    ],
  },
  {
    id: 'selection-sort',
    category: 'sorting',
    illAsset: 'algo_group_119.svg',
    complexity: 'O(n²)',
    difficulty: 'Easy',
    steps: [
      'Find the minimum element in the unsorted region',
      'Swap it with the first unsorted element',
      'Expand the sorted region by one',
      'Repeat until the entire array is sorted',
    ],
  },
  {
    id: 'shell-sort',
    category: 'sorting',
    illAsset: 'algo_group_132.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
    steps: [
      'Choose a gap sequence',
      'Sort elements separated by the gap using insertion sort',
      'Reduce the gap',
      'Repeat until the gap is 1',
      'Perform final insertion sort pass',
    ],
  },
  {
    id: 'merge-sort',
    category: 'sorting',
    illAsset: 'algo_group_166.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
    steps: [
      'Divide the array into two halves',
      'Recursively sort each half',
      'Merge the sorted halves',
      'Compare elements from each half',
      'Place the smaller element into the result',
    ],
  },
  {
    id: 'quick-sort',
    category: 'sorting',
    illAsset: 'algo_group_167.svg',
    complexity: 'O(n log n)',
    difficulty: 'Medium',
    steps: [
      'Choose a pivot element',
      'Partition: elements < pivot go left, > pivot go right',
      'Recursively sort the left partition',
      'Recursively sort the right partition',
      'Combine the results',
    ],
  },
  {
    id: 'heap-sort',
    category: 'sorting',
    illAsset: 'algo_group_168.svg',
    complexity: 'O(n log n)',
    difficulty: 'Hard',
    steps: [
      'Build a max-heap from the array',
      'Extract the root (maximum) element',
      'Move it to the end of the array',
      'Heapify the reduced heap',
      'Repeat until all elements are sorted',
    ],
  },
  {
    id: 'linear-search',
    category: 'searching',
    illAsset: 'algo_linear_search.svg',
    complexity: 'O(n)',
    difficulty: 'Easy',
    steps: [
      'Start from the first element',
      'Compare with the target',
      'If match, return position',
      'If no match, move to the next element',
      'If end of list, target not found',
    ],
  },
  {
    id: 'binary-search',
    category: 'searching',
    illAsset: 'algo_binary_search.svg',
    complexity: 'O(log n)',
    difficulty: 'Easy',
    steps: [
      'Ensure the array is sorted',
      'Find the middle element',
      'Compare with the target',
      'If target is smaller, search the left half',
      'If target is larger, search the right half',
    ],
  },
  {
    id: 'n-queens',
    category: 'backtracking',
    illAsset: 'algo_n_queens.svg',
    complexity: 'O(n!)',
    difficulty: 'Hard',
    steps: [
      'Place a queen in the first row',
      'Move to the next row and try each column',
      'Check if placement is safe (no conflicts)',
      'If no safe column exists, backtrack',
      'Repeat until all queens are placed',
    ],
  },
  {
    id: 'bogosort',
    category: 'fun',
    illAsset: 'algo_bogosort.svg',
    complexity: 'O(n! · n)',
    difficulty: 'Easy',
    steps: [
      'Check if the list is sorted',
      'If not sorted, shuffle the list randomly',
      'Repeat until the list is sorted by chance',
    ],
  },
];
