import { env } from '@/lib/env';

/** Static application metadata and frozen operational constants. */
export const APP = {
  name: 'VDMS',
  fullName: 'VTB Development Management System',
  version: env.appVersion,
  timezone: env.timezone,
  /** Frozen: 5 consecutive failures lock the account (see D-05). */
  maxFailedLoginAttempts: 5,
  /** Frozen: lockout duration in minutes (see D-05). */
  lockoutMinutes: 30,
  /** Frozen: inactivity timeout & warning lead-time in minutes (see D-06). */
  sessionTimeoutMinutes: env.sessionTimeoutMinutes,
  sessionWarningMinutes: env.sessionWarningMinutes,
  /** Frozen: default maximum upload size in bytes — 50 MB (see D-07). */
  maxUploadBytes: 50 * 1024 * 1024,
  /** Frozen: minimum password length (see Security Principles). */
  minPasswordLength: 12,
} as const;
