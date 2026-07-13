import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { applyListParams, toPaginated, type ListParams } from '@/lib/query/list-params';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Paginated } from '@/types/common';
import type { Database } from '@/lib/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface CrudConfig<TName extends TableName> {
  /** Table name; also used as the argument to archive/restore/soft-delete RPCs. */
  table: TName;
  /** Columns selected for reads. Defaults to '*'. */
  select?: string;
  /** Fields the free-text search term is matched against. */
  searchFields?: string[];
  /** Default sort applied when the caller supplies none. */
  defaultSort?: ListParams['sort'];
}

type Row<TName extends TableName> = Database['public']['Tables'][TName]['Row'];
type Insert<TName extends TableName> = Database['public']['Tables'][TName]['Insert'];
type Update<TName extends TableName> = Database['public']['Tables'][TName]['Update'];

/**
 * Builds a service exposing the uniform CRUD interface (PAD §10.1):
 * getList, getById, create, update, archive, restore, softDelete.
 * Every method returns a typed ServiceResponse and never leaks raw DB errors.
 * Audit entries are written automatically by database triggers (PAD §7.3),
 * so the service does not duplicate audit logic.
 */
export function createCrudService<TName extends TableName>(config: CrudConfig<TName>) {
  const select = config.select ?? '*';

  async function getList(params: ListParams = {}): Promise<ServiceResponse<Paginated<Row<TName>>>> {
    try {
      const effective: ListParams = {
        ...params,
        searchFields: params.searchFields ?? config.searchFields,
        sort: params.sort ?? config.defaultSort,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = supabase.from(config.table).select(select, { count: 'exact' }) as any;
      const { data, error, count } = await applyListParams(base, effective);
      if (error) return fail(mapPostgrestError(error));
      return ok(toPaginated((data ?? []) as Row<TName>[], count ?? 0, effective));
    } catch (e) {
      return fail(mapUnknownError(e));
    }
  }

  async function getById(id: string): Promise<ServiceResponse<Row<TName>>> {
    try {
      const { data, error } = await supabase
        .from(config.table)
        .select(select)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id' as any, id)
        .maybeSingle();
      if (error) return fail(mapPostgrestError(error));
      if (!data) return fail({ code: 'not_found', message: 'Запись не найдена' });
      return ok(data as Row<TName>);
    } catch (e) {
      return fail(mapUnknownError(e));
    }
  }

  async function create(payload: Insert<TName>): Promise<ServiceResponse<Row<TName>>> {
    try {
      const { data, error } = await supabase
        .from(config.table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(payload as any)
        .select(select)
        .single();
      if (error) return fail(mapPostgrestError(error));
      return ok(data as Row<TName>);
    } catch (e) {
      return fail(mapUnknownError(e));
    }
  }

  /**
   * Update with optimistic concurrency (D-11): the caller passes the version
   * they read; if it no longer matches, no row updates and a conflict is
   * returned so the UI can prompt a reload — never a silent overwrite.
   */
  async function update(
    id: string,
    payload: Update<TName>,
    expectedVersion?: number,
  ): Promise<ServiceResponse<Row<TName>>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = supabase.from(config.table).update(payload as any).eq('id' as any, id);
      if (typeof expectedVersion === 'number') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q = q.eq('version' as any, expectedVersion);
      }
      const { data, error } = await q.select(select).maybeSingle();
      if (error) return fail(mapPostgrestError(error));
      if (!data) {
        return fail({
          code: 'conflict',
          message: 'Запись была изменена другим пользователем. Обновите данные и повторите.',
        });
      }
      return ok(data as Row<TName>);
    } catch (e) {
      return fail(mapUnknownError(e));
    }
  }

  async function softDelete(id: string): Promise<ServiceResponse<null>> {
    return rpcRecordOp('soft_delete_record', id);
  }
  async function archive(id: string): Promise<ServiceResponse<null>> {
    return rpcRecordOp('archive_record', id);
  }
  async function restore(id: string): Promise<ServiceResponse<null>> {
    return rpcRecordOp('restore_record', id);
  }

  async function rpcRecordOp(
    fn: 'soft_delete_record' | 'archive_record' | 'restore_record',
    id: string,
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase.rpc(fn, { p_table: config.table, p_id: id });
      if (error) return fail(mapPostgrestError(error));
      return ok(null);
    } catch (e) {
      return fail(mapUnknownError(e));
    }
  }

  return { table: config.table, getList, getById, create, update, softDelete, archive, restore };
}

export type CrudService<TName extends TableName> = ReturnType<typeof createCrudService<TName>>;
