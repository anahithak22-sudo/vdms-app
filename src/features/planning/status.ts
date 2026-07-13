import type { StatusConfig } from '@/lib/status';
import type { PlanningStatus } from '@/lib/supabase/types';

/** Artifact 01 lifecycle (D-02). */
export const planningStatus: StatusConfig<PlanningStatus> = {
  order: ['draft', 'proposed', 'approved', 'planned', 'in_progress', 'on_hold', 'completed', 'archived'],
  labels: {
    draft: 'Черновик',
    proposed: 'Предложено',
    approved: 'Утверждено',
    planned: 'Запланировано',
    in_progress: 'В работе',
    on_hold: 'Приостановлено',
    completed: 'Завершено',
    archived: 'В архиве',
  },
  tones: {
    draft: 'neutral',
    proposed: 'info',
    approved: 'info',
    planned: 'info',
    in_progress: 'warning',
    on_hold: 'warning',
    completed: 'success',
    archived: 'neutral',
  },
  transitions: {
    draft: ['proposed'],
    proposed: ['approved', 'draft'],
    approved: ['planned', 'proposed'],
    planned: ['in_progress', 'on_hold'],
    in_progress: ['on_hold', 'completed'],
    on_hold: ['in_progress'],
    completed: ['archived'],
    archived: [],
  },
};
