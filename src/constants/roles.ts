import type { UserRole } from '@/lib/supabase/types';

/** Canonical role keys (English keys; Russian labels live in the locale). */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
} as const satisfies Record<string, UserRole>;

export const ALL_ROLES: readonly UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DEVELOPER,
];

/**
 * Privilege ranking, highest first. Used only for coarse UI gating.
 * Authoritative enforcement is Row Level Security in the database.
 */
const RANK: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  developer: 1,
};

export function hasRole(role: UserRole | undefined, allowed: readonly UserRole[]): boolean {
  return role !== undefined && allowed.includes(role);
}

export function atLeast(role: UserRole | undefined, minimum: UserRole): boolean {
  return role !== undefined && RANK[role] >= RANK[minimum];
}

export function isAdminTier(role: UserRole | undefined): boolean {
  return atLeast(role, ROLES.ADMIN);
}
