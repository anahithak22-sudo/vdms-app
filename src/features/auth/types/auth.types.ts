import type { AppUser } from '@/types/user';

/** Result of a login attempt surfaced to the UI (never contains the email). */
export interface LoginResult {
  user: AppUser;
  requiresPasswordChange: boolean;
}

/** Lockout feedback returned by the login-attempt tracking RPC. */
export interface LoginAttemptOutcome {
  locked: boolean;
  lockedUntil: string | null;
  attemptsRemaining: number;
}

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';
