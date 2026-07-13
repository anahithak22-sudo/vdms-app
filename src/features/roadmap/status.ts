import { linearTransitions, type StatusConfig } from '@/lib/status';
import type { RoadmapStatus } from '@/lib/supabase/types';

const order: readonly RoadmapStatus[] = [
  'backlog', 'ready', 'in_development', 'code_review', 'ready_for_testing',
  'testing', 'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'closed',
];

/** Artifact 02 lifecycle. */
export const roadmapStatus: StatusConfig<RoadmapStatus> = {
  order,
  labels: {
    backlog: 'Бэклог',
    ready: 'Готово к работе',
    in_development: 'В разработке',
    code_review: 'Код-ревью',
    ready_for_testing: 'Готово к тестированию',
    testing: 'Тестирование',
    fixed_on_test: 'Исправлено на Test',
    fixed_on_preprod: 'Исправлено на PreProd',
    fixed_on_production: 'Исправлено на Production',
    closed: 'Закрыто',
  },
  tones: {
    backlog: 'neutral',
    ready: 'info',
    in_development: 'warning',
    code_review: 'warning',
    ready_for_testing: 'info',
    testing: 'warning',
    fixed_on_test: 'info',
    fixed_on_preprod: 'info',
    fixed_on_production: 'success',
    closed: 'success',
  },
  transitions: linearTransitions(order),
};
