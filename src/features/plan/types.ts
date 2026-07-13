import type { Tables } from '@/lib/supabase/types';

export type PlanStatus = Tables<'plan_statuses'>;
export type PlanTag = Tables<'plan_tags'>;
export type PlanTaskRow = Tables<'plan_tasks'>;
export type PlanComment = Tables<'plan_task_comments'>;

/** A task enriched with its tag ids for the board/gantt. */
export interface PlanTask extends PlanTaskRow {
  tagIds: string[];
}

export type PlanView = 'gantt' | 'kanban';
