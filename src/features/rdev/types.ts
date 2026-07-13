import type { Tables } from '@/lib/supabase/types';

export type RdevStatus = Tables<'rdev_statuses'>;
export type RdevTag = Tables<'rdev_tags'>;
export type RdevTaskRow = Tables<'rdev_tasks'>;
export type RdevComment = Tables<'rdev_task_comments'>;

/** A task enriched with its tag ids for the board/gantt. */
export interface RdevTask extends RdevTaskRow {
  tagIds: string[];
}

export type RdevView = 'gantt' | 'kanban';
