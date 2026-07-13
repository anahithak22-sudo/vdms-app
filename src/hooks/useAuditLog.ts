import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { auditService } from '@/services/audit.service';
import { loggingService } from '@/services/logging.service';
import type { ListParams } from '@/lib/query/list-params';

/** Audit trail list (Super Admin). */
export function useAuditLog(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: async () => {
      const res = await auditService.list(params);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/** History for a single record (per-entity History tab). */
export function useEntityHistory(table: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['audit', 'entity', table, entityId ?? ''],
    queryFn: async () => {
      const res = await auditService.forEntity(table, entityId as string);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
    enabled: !!entityId,
  });
}

/** Operational logs list (Super Admin). */
export function useSystemLogs(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.logs.list(params),
    queryFn: async () => {
      const res = await loggingService.list(params);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
