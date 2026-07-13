import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import type { ListParams } from '@/lib/query/list-params';
import type { CrudService } from '@/services/base/crud.service';
import type { ServiceResponse } from '@/types/api';
import type { Paginated } from '@/types/common';
import type { Database } from '@/lib/supabase/types';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];

function unwrap<T>(res: ServiceResponse<T>): T {
  if (!res.success || res.data === null) {
    throw new Error(res.message ?? 'Операция не выполнена');
  }
  return res.data;
}

/**
 * Builds a set of React Query hooks bound to a CRUD service. Every artifact
 * module reuses this instead of hand-writing query/mutation wiring (PAD §9.3).
 */
export function createCrudHooks<TName extends TableName>(
  name: string,
  service: CrudService<TName>,
) {
  const keys = queryKeys.entity(name);

  function useList(
    params: ListParams = {},
  ): UseQueryResult<Paginated<Row<TName>>> {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => service.getList(params).then(unwrap),
      placeholderData: keepPreviousData,
    });
  }

  function useDetail(id: string | undefined): UseQueryResult<Row<TName>> {
    return useQuery({
      queryKey: keys.detail(id ?? ''),
      queryFn: () => service.getById(id as string).then(unwrap),
      enabled: !!id,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: Insert<TName>) => service.create(payload).then(unwrap),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (vars: { id: string; payload: Update<TName>; expectedVersion?: number }) =>
        service.update(vars.id, vars.payload, vars.expectedVersion).then(unwrap),
      onSuccess: (_data, vars) => {
        void qc.invalidateQueries({ queryKey: keys.all });
        void qc.invalidateQueries({ queryKey: keys.detail(vars.id) });
      },
    });
  }

  function useArchive() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => service.archive(id).then(unwrap),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useRestore() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => service.restore(id).then(unwrap),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useSoftDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => service.softDelete(id).then(unwrap),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  }

  return { keys, useList, useDetail, useCreate, useUpdate, useArchive, useRestore, useSoftDelete };
}
