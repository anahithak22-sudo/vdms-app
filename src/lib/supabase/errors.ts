import type { PostgrestError } from '@supabase/supabase-js';
import type { ServiceError, ServiceErrorCode } from '@/types/api';
import { ru } from '@/locales/ru';

/**
 * Normalize a Supabase/Postgrest error into a friendly ServiceError.
 * Internal messages and stack traces never reach the UI (PAD §21); the
 * original is preserved in `details` for the logging subsystem only.
 */
export function mapPostgrestError(error: PostgrestError | null): ServiceError {
  if (!error) {
    return { code: 'unexpected', message: ru.states.errorBody };
  }

  // Postgres SQLSTATE codes → coarse categories.
  const byCode: Record<string, { code: ServiceErrorCode; message: string }> = {
    '23505': { code: 'conflict', message: 'Запись с такими данными уже существует' },
    '23503': { code: 'validation', message: 'Нарушена связанность данных' },
    '23514': { code: 'validation', message: 'Значение не прошло проверку' },
    '42501': { code: 'authorization', message: ru.states.forbiddenBody },
    P0001: { code: 'validation', message: 'Операция отклонена бизнес-правилом' },
  };

  if (error.code && byCode[error.code]) {
    return { ...byCode[error.code], details: error };
  }

  if (error.message?.toLowerCase().includes('insufficient_privilege')) {
    return { code: 'authorization', message: ru.states.forbiddenBody, details: error };
  }

  return { code: 'database', message: ru.states.errorBody, details: error };
}

/** Map an arbitrary thrown value to a ServiceError. */
export function mapUnknownError(error: unknown): ServiceError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return mapPostgrestError(error as PostgrestError);
  }
  return { code: 'unexpected', message: ru.states.errorBody, details: error };
}
