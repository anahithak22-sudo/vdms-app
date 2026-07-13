import type { RdevStatus, RdevTask } from './types';

/**
 * Progress follows the task's column position across the pipeline: the first
 * column is 0%, the last (or any terminal) column is 100%, evenly spaced.
 * Recomputes automatically when columns are added or removed.
 */
export function statusPercent(status: RdevStatus | undefined, ordered: RdevStatus[]): number {
  if (!status || ordered.length === 0) return 0;
  if (status.is_terminal) return 100;
  const idx = ordered.findIndex((s) => s.id === status.id);
  if (idx < 0) return 0;
  const span = Math.max(1, ordered.length - 1);
  return Math.round((idx / span) * 100);
}

/** Total board progress = average of every task's percent. */
export function totalPercent(tasks: RdevTask[], ordered: RdevStatus[]): number {
  if (tasks.length === 0) return 0;
  const byId = new Map(ordered.map((s) => [s.id, s]));
  const sum = tasks.reduce((acc, t) => acc + statusPercent(byId.get(t.status_id), ordered), 0);
  return Math.round(sum / tasks.length);
}

/** A task is overdue when its end date has passed and it is not yet terminal. */
export function isOverdue(task: RdevTask, status: RdevStatus | undefined): boolean {
  if (!task.end_date || status?.is_terminal) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.end_date) < today;
}

/**
 * Delay in days: how much later the current finish is than the frozen
 * baseline (planned_end). Zero when on time or when either date is missing.
 */
export function delayDays(task: { end_date: string | null; planned_end: string | null }): number {
  if (!task.end_date || !task.planned_end) return 0;
  const end = new Date(task.end_date).getTime();
  const base = new Date(task.planned_end).getTime();
  const diff = Math.round((end - base) / 86400000);
  return diff > 0 ? diff : 0;
}
