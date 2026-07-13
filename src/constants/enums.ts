import type {
  PriorityLevel,
  LogCategory,
  LogSeverity,
  NotificationCategory,
  NotificationPriority,
  AuditAction,
  AuditCategory,
} from '@/lib/supabase/types';

/**
 * Russian labels for stored enum keys. Values are stable English keys in the
 * database; these maps localize them for display only (PAD §13, §8.3).
 */
export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

export const LOG_CATEGORY_LABELS: Record<LogCategory, string> = {
  error: 'Ошибки',
  debug: 'Отладка',
  import: 'Импорт',
  export: 'Экспорт',
  notification: 'Уведомления',
  scheduler: 'Планировщик',
  performance: 'Производительность',
};

export const LOG_SEVERITY_LABELS: Record<LogSeverity, string> = {
  information: 'Информация',
  warning: 'Предупреждение',
  error: 'Ошибка',
  critical: 'Критическая',
  fatal: 'Фатальная',
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  business: 'Бизнес',
  reminder: 'Напоминание',
  system: 'Система',
  security: 'Безопасность',
  monitoring: 'Мониторинг',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  critical: 'Критический',
};

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  business: 'Бизнес-событие',
  security: 'Событие безопасности',
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  archive: 'Архивация',
  restore: 'Восстановление',
  status_change: 'Смена статуса',
  priority_change: 'Смена приоритета',
  assignment: 'Назначение',
  comment: 'Комментарий',
  attachment: 'Вложение',
  import: 'Импорт',
  export: 'Экспорт',
  role_change: 'Смена роли',
  permission_update: 'Изменение прав',
  login: 'Вход',
  logout: 'Выход',
  failed_login: 'Неудачный вход',
  password_change: 'Смена пароля',
  password_reset: 'Сброс пароля',
  permission_denied: 'Отказ в доступе',
  account_locked: 'Блокировка учётной записи',
  account_unlocked: 'Разблокировка учётной записи',
  session_expired: 'Истечение сессии',
};
