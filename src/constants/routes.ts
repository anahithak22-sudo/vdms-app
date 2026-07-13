/** Centralized route paths. Used by the router, guards, and navigation. */
export const ROUTES = {
  LANDING: '/welcome',
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',

  DASHBOARD: '/',
  PLANNING: '/planning',
  ROADMAP: '/roadmap',
  PRIORITY_QUEUE: '/priority-queue',
  WEEKLY_PLANNING: '/weekly-planning',
  BUG_STATISTICS: '/bug-statistics',

  NOTIFICATIONS: '/notifications',

  IMPORT_CENTER: '/import',
  ARCHIVE: '/archive',
  USER_MANAGEMENT: '/users',
  MONITORING: '/monitoring',
  LOGS: '/logs',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
