import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { UserRole } from '@/lib/supabase/types';

export interface AssignableUser {
  id: string;
  display_name: string;
  role: UserRole;
}

/** Minimal user directory for owner/assignee selects (no sensitive fields). */
async function assignableUsers(): Promise<ServiceResponse<AssignableUser[]>> {
  try {
    const { data, error } = await supabase.rpc('list_assignable_users');
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as AssignableUser[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const directoryService = { assignableUsers };
