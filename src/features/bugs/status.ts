import type { StatusConfig } from '@/lib/status';
import type { BugStatus } from '@/lib/supabase/types';

const order: readonly BugStatus[] = [
  'open', 'assigned', 'in_progress', 'ready_for_testing', 'testing',
  'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'closed', 'archived',
];

/** Artifact 03 lifecycle. Reopening a closed bug returns it to "assigned". */
export const bugStatus: StatusConfig<BugStatus> = {
  order,
  labels: {
    open: 'Открыт',
    assigned: 'Назначен',
    in_progress: 'В работе',
    ready_for_testing: 'Готов к тестированию',
    testing: 'Тестирование',
    fixed_on_test: 'Исправлен на Test',
    fixed_on_preprod: 'Исправлен на PreProd',
    fixed_on_production: 'Исправлен на Production',
    closed: 'Закрыт',
    archived: 'В архиве',
  },
  tones: {
    open: 'danger',
    assigned: 'warning',
    in_progress: 'warning',
    ready_for_testing: 'info',
    testing: 'warning',
    fixed_on_test: 'info',
    fixed_on_preprod: 'info',
    fixed_on_production: 'success',
    closed: 'success',
    archived: 'neutral',
  },
  transitions: {
    open: ['assigned'],
    assigned: ['in_progress'],
    in_progress: ['ready_for_testing'],
    ready_for_testing: ['testing'],
    testing: ['fixed_on_test'],
    fixed_on_test: ['fixed_on_preprod'],
    fixed_on_preprod: ['fixed_on_production'],
    fixed_on_production: ['closed'],
    closed: ['assigned', 'archived'],
    archived: [],
  },
};
