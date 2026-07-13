import type { SelectOption } from '@/components/ui/select';
import {
  PRIORITY_LABELS,
} from '@/constants/enums';
import type {
  PriorityLevel,
  RiskLevel,
  BugSeverity,
  BugRootCause,
  BugResolution,
  ImplementationReadiness,
} from '@/lib/supabase/types';

export const PRIORITY_OPTIONS: SelectOption[] = (
  ['low', 'medium', 'high', 'critical'] as PriorityLevel[]
).map((v) => ({ value: v, label: PRIORITY_LABELS[v] }));

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};
export const RISK_OPTIONS: SelectOption[] = (
  ['low', 'medium', 'high', 'critical'] as RiskLevel[]
).map((v) => ({ value: v, label: RISK_LABELS[v] }));

export const SEVERITY_LABELS: Record<BugSeverity, string> = {
  critical: 'Критическая', major: 'Высокая', minor: 'Низкая', trivial: 'Тривиальная',
};
export const SEVERITY_OPTIONS: SelectOption[] = (
  ['critical', 'major', 'minor', 'trivial'] as BugSeverity[]
).map((v) => ({ value: v, label: SEVERITY_LABELS[v] }));

export const ROOT_CAUSE_LABELS: Record<BugRootCause, string> = {
  requirements: 'Требования', backend: 'Backend', frontend: 'Frontend', database: 'База данных',
  integration: 'Интеграция', infrastructure: 'Инфраструктура', performance: 'Производительность',
  security: 'Безопасность', configuration: 'Конфигурация', unknown: 'Неизвестно',
};
export const ROOT_CAUSE_OPTIONS: SelectOption[] = (
  Object.keys(ROOT_CAUSE_LABELS) as BugRootCause[]
).map((v) => ({ value: v, label: ROOT_CAUSE_LABELS[v] }));

export const RESOLUTION_LABELS: Record<BugResolution, string> = {
  fixed: 'Исправлено', cannot_reproduce: 'Не воспроизводится', duplicate: 'Дубликат',
  wont_fix: 'Не будет исправлено', by_design: 'Так задумано', configuration_issue: 'Проблема конфигурации',
  third_party: 'Стороннее ПО', deferred: 'Отложено',
};
export const RESOLUTION_OPTIONS: SelectOption[] = (
  Object.keys(RESOLUTION_LABELS) as BugResolution[]
).map((v) => ({ value: v, label: RESOLUTION_LABELS[v] }));

export const READINESS_OPTIONS: SelectOption[] = (
  ['not_ready', 'analysis', 'ready', 'approved', 'selected', 'scheduled', 'completed'] as ImplementationReadiness[]
).map((v) => ({
  value: v,
  label: {
    not_ready: 'Не готово', analysis: 'Анализ', ready: 'Готово', approved: 'Утверждено',
    selected: 'Выбрано', scheduled: 'Запланировано', completed: 'Завершено',
  }[v],
}));
