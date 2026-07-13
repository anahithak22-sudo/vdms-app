import type { StatusConfig } from '@/lib/status';
import type { WeeklyTaskStatus } from '@/lib/supabase/types';

const order: readonly WeeklyTaskStatus[] = [
  'planned', 'in_progress', 'blocked', 'ready_for_testing', 'testing',
  'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'done',
];

/** Artifact 04 lifecycle. */
export const weeklyStatus: StatusConfig<WeeklyTaskStatus> = {
  order,
  labels: {
    planned: 'Запланировано',
    in_progress: 'В работе',
    blocked: 'Заблокировано',
    ready_for_testing: 'Готово к тестированию',
    testing: 'Тестирование',
    fixed_on_test: 'Исправлено на Test',
    fixed_on_preprod: 'Исправлено на PreProd',
    fixed_on_production: 'Исправлено на Production',
    done: 'Готово',
  },
  tones: {
    planned: 'neutral',
    in_progress: 'warning',
    blocked: 'danger',
    ready_for_testing: 'info',
    testing: 'warning',
    fixed_on_test: 'info',
    fixed_on_preprod: 'info',
    fixed_on_production: 'success',
    done: 'success',
  },
  transitions: {
    planned: ['in_progress', 'blocked'],
    in_progress: ['blocked', 'ready_for_testing'],
    blocked: ['in_progress'],
    ready_for_testing: ['testing'],
    testing: ['fixed_on_test'],
    fixed_on_test: ['fixed_on_preprod'],
    fixed_on_preprod: ['fixed_on_production'],
    fixed_on_production: ['done'],
    done: [],
  },
};
