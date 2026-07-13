import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import { nextWeek, isoWeek, type WeekRef } from '@/lib/week';
import type { Tables, QueuePage } from '@/lib/supabase/types';

export type QueueItem = Tables<'queue_items'>;
export type QueueItemInsert = Tables<'queue_items'>['Insert'];
export type QueueItemUpdate = Tables<'queue_items'>['Update'];

/** The four statuses and the side effects they trigger on change. */
export type QueueFixedStatus = 'not_fixed' | 'fixed_test' | 'fixed_preprod' | 'fixed_prod';

/** A task parsed from an imported Excel row (before it becomes a DB row). */
export interface QueueImportRow {
  external_task_id: string | null;
  status: string | null;
  description: string;
  priority: string | null;
  task_link: string | null;
  fixed_status: string | null;
  comment: string | null;
}

async function list(page: QueuePage, week: WeekRef | null, archived: boolean): Promise<ServiceResponse<QueueItem[]>> {
  try {
    let q = supabase
      .from('queue_items')
      .select('*')
      .eq('page', page)
      .eq('is_archived', archived)
      .eq('is_deleted', false);
    if (week) q = q.eq('week_year', week.year).eq('week_number', week.week);
    const { data, error } = await q.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as QueueItem[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function create(page: QueuePage, week: WeekRef, input: Omit<QueueItemInsert, 'page' | 'week_tag' | 'week_year' | 'week_number'>): Promise<ServiceResponse<QueueItem>> {
  try {
    const { data, error } = await supabase
      .from('queue_items')
      .insert({ ...input, page, week_tag: week.tag, week_year: week.year, week_number: week.week })
      .select('*')
      .single();
    if (error) return fail(mapPostgrestError(error));
    return ok(data as QueueItem);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function update(id: string, patch: QueueItemUpdate): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase.from('queue_items').update(patch).eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function softDelete(id: string): Promise<ServiceResponse<true>> {
  try {
    const { error } = await supabase
      .from('queue_items')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() } as QueueItemUpdate)
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(true);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

function bumpWeekPatch(item: QueueItem): QueueItemUpdate {
  const ref = item.week_year && item.week_number
    ? nextWeek({ year: item.week_year, week: item.week_number, tag: item.week_tag ?? '' })
    : nextWeek(isoWeek(new Date()));
  return { week_tag: ref.tag, week_year: ref.year, week_number: ref.week };
}

/**
 * Apply a status change and its side effect:
 *   not_fixed / fixed_preprod → move to next week
 *   fixed_prod → archive
 *   fixed_test → status only
 */
async function setFixedStatus(item: QueueItem, status: QueueFixedStatus): Promise<ServiceResponse<true>> {
  let patch: QueueItemUpdate = { fixed_status: status };
  if (status === 'not_fixed' || status === 'fixed_preprod') {
    patch = { ...patch, environment: status === 'fixed_preprod' ? 'preprod' : item.environment, ...bumpWeekPatch(item) };
  } else if (status === 'fixed_prod') {
    patch = { ...patch, environment: 'prod', is_archived: true, archived_at: new Date().toISOString() };
  }
  return update(item.id, patch);
}

async function restore(id: string): Promise<ServiceResponse<true>> {
  const w = isoWeek(new Date());
  return update(id, {
    is_archived: false,
    archived_at: null,
    fixed_status: 'not_fixed',
    week_tag: w.tag,
    week_year: w.year,
    week_number: w.week,
  });
}

/**
 * Import rows into a page/week. Existing tasks are preserved; a row is skipped
 * when a task with the same id + description + link already exists on that page.
 */
async function importItems(page: QueuePage, week: WeekRef, rows: QueueImportRow[]): Promise<ServiceResponse<{ added: number; skipped: number }>> {
  try {
    const { data: existingRaw, error: exErr } = await supabase
      .from('queue_items')
      .select('external_task_id, description, task_link')
      .eq('page', page)
      .eq('is_deleted', false);
    if (exErr) return fail(mapPostgrestError(exErr));
    const key = (r: { external_task_id: string | null; description: string | null; task_link: string | null }) =>
      `${(r.external_task_id ?? '').trim()}||${(r.description ?? '').trim()}||${(r.task_link ?? '').trim()}`;
    const seen = new Set((existingRaw ?? []).map(key));

    const toInsert: QueueItemInsert[] = [];
    let skipped = 0;
    for (const r of rows) {
      const k = key(r);
      if (seen.has(k)) { skipped += 1; continue; }
      seen.add(k);
      toInsert.push({
        page,
        week_tag: week.tag, week_year: week.year, week_number: week.week,
        external_task_id: r.external_task_id,
        status: r.status,
        description: r.description,
        priority: r.priority,
        task_link: r.task_link,
        fixed_status: r.fixed_status,
        comment: r.comment,
      });
    }
    if (toInsert.length > 0) {
      const { error } = await supabase.from('queue_items').insert(toInsert);
      if (error) return fail(mapPostgrestError(error));
    }
    return ok({ added: toInsert.length, skipped });
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const taskQueueService = {
  list,
  create,
  update,
  softDelete,
  setFixedStatus,
  restore,
  importItems,
};
