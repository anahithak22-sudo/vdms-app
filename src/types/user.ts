import type { Tables, UserRole } from '@/lib/supabase/types';

/** Application-facing user profile (never exposes the underlying email). */
export interface AppUser {
  id: string;
  businessId: string;
  username: string;
  displayName: string;
  role: UserRole;
  department: string | null;
  avatarUrl: string | null;
  isFirstLogin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

/** Map a raw database row to the application user model. */
export function toAppUser(row: Tables<'app_users'>): AppUser {
  return {
    id: row.id,
    businessId: row.business_id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    department: row.department,
    avatarUrl: row.avatar_url,
    isFirstLogin: row.is_first_login,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
  };
}

export type { UserRole };
