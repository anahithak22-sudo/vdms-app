import { supabase } from '@/lib/supabase/client';
import { createCrudService } from '@/services/base/crud.service';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Tables, WeeklyTaskStatus } from '@/lib/supabase/types';

export const weeklyTaskService = createCrudService({
  table: 'weekly_tasks',
  searchFields: ['title', 'description', 'business_id'],
  defaultSort: [{ field: 'created_at', direction: 'desc' }],
});

export const weekService = createCrudService({
  table: 'planning_weeks',
  searchFields: [],
  defaultSort: [{ field: 'start_date', direction: 'desc' }],
});

/** List weeks (most recent first) for the week selector. */
async function listWeeks(): Promise<ServiceResponse<Tables<'planning_weeks'>[]>> {
  try {
    const { data, error } = await supabase
      .from('planning_weeks')
      .select('*')
      .eq('is_deleted', false)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as Tables<'planning_weeks'>[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** All non-archived tasks for a week (board + table share this dataset). */
async function tasksForWeek(weekId: string): Promise<ServiceResponse<Tables<'weekly_tasks'>[]>> {
  try {
    const { data, error } = await supabase
      .from('weekly_tasks')
      .select('*')
      .eq('week_id', weekId)
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as Tables<'weekly_tasks'>[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** Status change routed through the RPC (developers may change only own tasks). */
async function setStatus(taskId: string, status: WeeklyTaskStatus): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.rpc('set_weekly_task_status', {
      p_task_id: taskId,
      p_status: status,
    });
    if (error) return fail(mapPostgrestError(error));
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** Roll unfinished tasks from one week into another (scheduler / manual). */
async function rollover(sourceWeek: string, targetWeek: string): Promise<ServiceResponse<number>> {
  try {
    const { data, error } = await supabase.rpc('rollover_weekly_tasks', {
      p_source_week: sourceWeek,
      p_target_week: targetWeek,
    });
    if (error) return fail(mapPostgrestError(error));
    return ok((data as number) ?? 0);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const weeklyService = {
  tasks: weeklyTaskService,
  weeks: weekService,
  listWeeks,
  tasksForWeek,
  setStatus,
  rollover,
};
