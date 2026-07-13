import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Tables } from '@/lib/supabase/types';

export type WpTask = Tables<'wp_tasks'>;

async function listByWeek(year: number, week: number): Promise<ServiceResponse<WpTask[]>> {
  try {
    const { data, error } = await supabase
      .from('wp_tasks')
      .select('*')
      .eq('week_year', year)
      .eq('week_number', week)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as WpTask[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function create(input: {
  week_tag: string;
  week_year: number;
  week_number: number;
  assignee_id: string | null;
  title: string;
  due_date: string | null;
}): Promise<ServiceResponse<WpTask>> {
  try {
    const { data, error } = await supabase.from('wp_tasks').insert(input).select('*').single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as WpTask);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function update(id: string, patch: Partial<{ assignee_id: string | null; title: string; due_date: string | null }>): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('wp_tasks').update(patch).eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function softDelete(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from('wp_tasks')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** Toggle done via SECURITY DEFINER RPC (assignee or admin/super only). */
async function toggleDone(id: string, done: boolean): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.rpc('wp_toggle_done', { p_id: id, p_done: done });
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const weeklyPlanService = { listByWeek, create, update, softDelete, toggleDone };
