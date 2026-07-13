import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { toPaginated, type ListParams } from '@/lib/query/list-params';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Paginated } from '@/types/common';
import type { Tables, LogCategory, LogSeverity, Json } from '@/lib/supabase/types';

type SystemLog = Tables<'system_logs'>;

interface LogInput {
  category: LogCategory;
  message: string;
  severity?: LogSeverity;
  module?: string;
  operation?: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  durationMs?: number;
  errorCode?: string;
  stackTrace?: string;
}

/**
 * Logging service (PAD §17). Writes go through the log_event SECURITY DEFINER
 * function; reads are Super-Admin-only (enforced by RLS). Logging never throws
 * into caller flow — a failed log is swallowed after a best-effort console note.
 */
async function write(input: LogInput): Promise<void> {
  try {
    await supabase.rpc('log_event', {
      p_category: input.category,
      p_message: input.message,
      p_severity: input.severity ?? 'information',
      p_module: input.module ?? null,
      p_operation: input.operation ?? null,
      p_context: (input.context ?? {}) as Json,
      p_correlation_id: input.correlationId ?? null,
      p_duration_ms: input.durationMs ?? null,
      p_error_code: input.errorCode ?? null,
      p_stack_trace: input.stackTrace ?? null,
    });
  } catch {
    // Fallback: never let logging failure break the operation (PAD §17 principle).
  }
}

async function list(params: ListParams = {}): Promise<ServiceResponse<Paginated<SystemLog>>> {
  try {
    const effective: ListParams = {
      ...params,
      includeArchived: true,
      includeDeleted: true,
      sort: params.sort ?? [{ field: 'created_at', direction: 'desc' }],
      searchFields: params.searchFields ?? ['message', 'module', 'operation'],
    };
    // system_logs has no is_deleted/is_archived columns; skip those guards.
    const base = supabase.from('system_logs').select('*', { count: 'exact' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = base as any;
    for (const f of effective.filters ?? []) q = q.eq(f.field, f.value);
    if (effective.search) {
      const term = effective.search.replace(/[%,]/g, '');
      q = q.or((effective.searchFields ?? []).map((fl) => `${fl}.ilike.%${term}%`).join(','));
    }
    for (const s of effective.sort ?? []) q = q.order(s.field, { ascending: s.direction === 'asc' });
    const page = Math.max(1, effective.page ?? 1);
    const pageSize = Math.min(200, effective.pageSize ?? 25);
    q = q.range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);
    const { data, error, count } = await q;
    if (error) return fail(mapPostgrestError(error));
    return ok(toPaginated((data ?? []) as SystemLog[], count ?? 0, effective));
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const loggingService = {
  write,
  list,
  error: (message: string, extra: Partial<LogInput> = {}) =>
    write({ category: 'error', severity: 'error', message, ...extra }),
  debug: (message: string, extra: Partial<LogInput> = {}) =>
    write({ category: 'debug', message, ...extra }),
  performance: (message: string, durationMs: number, extra: Partial<LogInput> = {}) =>
    write({ category: 'performance', message, durationMs, ...extra }),
};
