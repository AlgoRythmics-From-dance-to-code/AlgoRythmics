/**
 * Application-wide constants and URLs
 */

export const APP_CONFIG = {
  NAME: 'AlgoRythmics',
  BASE_URL: process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  COOKIE_TOKEN_NAME: 'payload-token',
  TOKEN_EXPIRATION: 60 * 60 * 24 * 90, // 90 days in seconds (default for "Remember Me")
  SESSION_EXPIRATION: 60 * 60 * 24 * 1, // 1 day if NOT remembered
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
