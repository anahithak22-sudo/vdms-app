import type { UserRole } from '@/lib/supabase/types';

export interface CreateUserInput {
  username: string;
  displayName: string;
  role: UserRole;
  department?: string | null;
}

export interface CreatedUser {
  id: string;
  businessId: string;
  username: string;
  displayName: string;
  role: UserRole;
  /** Shown once so the Super Admin can hand it to the new user. */
  temporaryPassword: string;
}

export interface PasswordResetResult {
  temporaryPassword: string;
}
