import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { toPaginated, type ListParams } from '@/lib/query/list-params';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Paginated } from '@/types/common';
import type { Tables } from '@/lib/supabase/types';

type AuditLog = Tables<'audit_logs'>;

/**
 * Audit service (PAD §17.1). The trail is immutable and Super-Admin-only for
 * reads (RLS-enforced). Business changes are written automatically by database
 * triggers; explicit domain events use create_audit_entry inside SQL functions.
 */
async function list(params: ListParams = {}): Promise<ServiceResponse<Paginated<AuditLog>>> {
  try {
    const effective: ListParams = {
      ...params,
      sort: params.sort ?? [{ field: 'created_at', direction: 'desc' }],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = supabase.from('audit_logs').select('*', { count: 'exact' }) as any;
    for (const f of effective.filters ?? []) q = q.eq(f.field, f.value);
    if (effective.search) {
      const term = effective.search.replace(/[%,]/g, '');
      q = q.or(
        ['message', 'actor_username', 'entity_business_id', 'entity_table']
          .map((fl) => `${fl}.ilike.%${term}%`)
          .join(','),
      );
    }
    for (const s of effective.sort ?? []) q = q.order(s.field, { ascending: s.direction === 'asc' });
    const page = Math.max(1, effective.page ?? 1);
    const pageSize = Math.min(200, effective.pageSize ?? 25);
    q = q.range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);
    const { data, error, count } = await q;
    if (error) return fail(mapPostgrestError(error));
    return ok(toPaginated((data ?? []) as AuditLog[], count ?? 0, effective));
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/** History for a single entity (used by per-record History tabs). */
async function forEntity(
  table: string,
  entityId: string,
): Promise<ServiceResponse<AuditLog[]>> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_table', table)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as AuditLog[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const auditService = { list, forEntity };
