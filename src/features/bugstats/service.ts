import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Tables } from '@/lib/supabase/types';

export type BugStat = Tables<'bug_stats'>;
export type BugStatInsert = Tables<'bug_stats'>['Insert'];
export type BugStatUpdate = Tables<'bug_stats'>['Update'];

async function list(): Promise<ServiceResponse<BugStat[]>> {
  try {
    const { data, error } = await supabase
      .from('bug_stats')
      .select('*')
      .eq('is_deleted', false)
      .order('stat_date', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as BugStat[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function create(input: BugStatInsert): Promise<ServiceResponse<BugStat>> {
  try {
    const { data, error } = await supabase.from('bug_stats').insert(input).select('*').single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as BugStat);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function update(id: string, patch: BugStatUpdate): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('bug_stats').update(patch).eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function softDelete(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from('bug_stats')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const bugStatsService = { list, create, update, softDelete };
