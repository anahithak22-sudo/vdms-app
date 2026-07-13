import { supabase } from '@/lib/supabase/client';
import { createCrudService } from '@/services/base/crud.service';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { PlanStatus, PlanTag, PlanTask, PlanTaskRow, PlanComment } from './types';

/** Tasks use the shared CRUD engine (soft-delete/archive/version-aware). */
export const planTaskService = createCrudService({
  table: 'plan_tasks',
  searchFields: ['title', 'description', 'business_id'],
  defaultSort: [{ field: 'sort_order', direction: 'asc' }],
});

// ---- Statuses (Kanban columns) --------------------------------------------
async function listStatuses(): Promise<ServiceResponse<PlanStatus[]>> {
  try {
    const { data, error } = await supabase
      .from('plan_statuses')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as PlanStatus[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function createStatus(input: {
  name: string;
  color: string;
  sort_order: number;
  is_terminal: boolean;
}): Promise<ServiceResponse<PlanStatus>> {
  try {
    const { data, error } = await supabase.from('plan_statuses').insert(input).select('*').single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as PlanStatus);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function updateStatus(
  id: string,
  patch: Partial<Pick<PlanStatus, 'name' | 'color' | 'sort_order' | 'is_terminal'>>,
): Promise<ServiceResponse<PlanStatus>> {
  try {
    const { data, error } = await supabase
      .from('plan_statuses')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as PlanStatus);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** Delete is blocked by the FK when tasks still reference the column. */
async function deleteStatus(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('plan_statuses').delete().eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

// ---- Tags ------------------------------------------------------------------
async function listTags(): Promise<ServiceResponse<PlanTag[]>> {
  try {
    const { data, error } = await supabase
      .from('plan_tags')
      .select('*')
      .order('label', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as PlanTag[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function createTag(label: string, color: string): Promise<ServiceResponse<PlanTag>> {
  try {
    const { data, error } = await supabase
      .from('plan_tags')
      .insert({ label, color })
      .select('*')
      .single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as PlanTag);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function updateTag(
  id: string,
  patch: Partial<Pick<PlanTag, 'label' | 'color'>>,
): Promise<ServiceResponse<PlanTag>> {
  try {
    const { data, error } = await supabase.from('plan_tags').update(patch).eq('id', id).select('*').single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as PlanTag);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function deleteTag(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('plan_tags').delete().eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

// ---- Tasks list with tag ids ----------------------------------------------
async function listTasks(): Promise<ServiceResponse<PlanTask[]>> {
  try {
    const { data, error } = await supabase
      .from('plan_tasks')
      .select('*, plan_task_tags(tag_id)')
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    type JoinRow = PlanTaskRow & { plan_task_tags: { tag_id: string }[] | null };
    const tasks: PlanTask[] = ((data ?? []) as JoinRow[]).map((r) => {
      const { plan_task_tags, ...rest } = r;
      return { ...(rest as PlanTaskRow), tagIds: (plan_task_tags ?? []).map((t) => t.tag_id) };
    });
    return ok(tasks);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function setTaskStatus(taskId: string, statusId: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('plan_tasks').update({ status_id: statusId }).eq('id', taskId);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function setTaskTags(taskId: string, tagIds: string[]): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.rpc('set_plan_task_tags', { p_task_id: taskId, p_tag_ids: tagIds });
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

// ---- Comments --------------------------------------------------------------
async function listComments(taskId: string): Promise<ServiceResponse<PlanComment[]>> {
  try {
    const { data, error } = await supabase
      .from('plan_task_comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as PlanComment[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function addComment(taskId: string, body: string): Promise<ServiceResponse<PlanComment>> {
  try {
    const { data, error } = await supabase
      .from('plan_task_comments')
      .insert({ task_id: taskId, body })
      .select('*')
      .single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as PlanComment);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function updateComment(id: string, body: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('plan_task_comments').update({ body }).eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function deleteComment(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from('plan_task_comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const planService = {
  tasks: planTaskService,
  listTasks,
  setTaskStatus,
  setTaskTags,
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  listComments,
  addComment,
  updateComment,
  deleteComment,
};
