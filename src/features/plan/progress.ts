import type { PlanStatus, PlanTask } from './types';

/**
 * Progress follows the task's column position across the pipeline: the first
 * column is 0%, the last (or any terminal) column is 100%, evenly spaced.
 * Recomputes automatically when columns are added or removed.
 */
export function statusPercent(status: PlanStatus | undefined, ordered: PlanStatus[]): number {
  if (!status || ordered.length === 0) return 0;
  if (status.is_terminal) return 100;
  const idx = ordered.findIndex((s) => s.id === status.id);
  if (idx < 0) return 0;
  const span = Math.max(1, ordered.length - 1);
  return Math.round((idx / span) * 100);
}

/** Total board progress = average of every task's percent. */
export function totalPercent(tasks: PlanTask[], ordered: PlanStatus[]): number {
  if (tasks.length === 0) return 0;
  const byId = new Map(ordered.map((s) => [s.id, s]));
  const sum = tasks.reduce((acc, t) => acc + statusPercent(byId.get(t.status_id), ordered), 0);
  return Math.round(sum / tasks.length);
}

/** A task is overdue when its end date has passed and it is not yet terminal. */
export function isOverdue(task: PlanTask, status: PlanStatus | undefined): boolean {
  if (!task.end_date || status?.is_terminal) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.end_date) < today;
}
