import type { Tone } from '@/components/common/DisplayPrimitives';
import type { ImplementationReadiness } from '@/lib/supabase/types';

/** Artifact 05 implementation readiness (independent of development status). */
export const READINESS_LABELS: Record<ImplementationReadiness, string> = {
  not_ready: 'Не готово',
  analysis: 'Анализ',
  ready: 'Готово',
  approved: 'Утверждено',
  selected: 'Выбрано',
  scheduled: 'Запланировано',
  completed: 'Завершено',
};

export const READINESS_TONES: Record<ImplementationReadiness, Tone> = {
  not_ready: 'neutral',
  analysis: 'info',
  ready: 'info',
  approved: 'success',
  selected: 'warning',
  scheduled: 'info',
  completed: 'success',
};
