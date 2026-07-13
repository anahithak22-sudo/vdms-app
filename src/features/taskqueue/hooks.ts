import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskQueueService, type QueueItem, type QueueItemInsert, type QueueItemUpdate, type QueueFixedStatus, type QueueImportRow } from './service';
import type { QueuePage } from '@/lib/supabase/types';
import type { WeekRef } from '@/lib/week';

function unwrap<T>(res: { success: boolean; data: T | null; message: string | null }): T {
  if (!res.success || res.data == null) throw new Error(res.message ?? 'Ошибка');
  return res.data;
}

export function useQueueItems(page: QueuePage, week: WeekRef | null, archived: boolean) {
  return useQuery({
    queryKey: ['taskqueue', page, week ? `${week.year}-${week.week}` : 'all', archived ? 'archived' : 'active'],
    queryFn: async () => unwrap(await taskQueueService.list(page, week, archived)),
  });
}

export function useQueueMutations(page: QueuePage) {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['taskqueue'] });

  return {
    create: useMutation({
      mutationFn: (vars: { week: WeekRef; input: Omit<QueueItemInsert, 'page' | 'week_tag' | 'week_year' | 'week_number'> }) =>
        taskQueueService.create(page, vars.week, vars.input),
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; patch: QueueItemUpdate }) => taskQueueService.update(vars.id, vars.patch),
      onSuccess: inv,
    }),
    remove: useMutation({ mutationFn: (id: string) => taskQueueService.softDelete(id), onSuccess: inv }),
    setStatus: useMutation({
      mutationFn: (vars: { item: QueueItem; status: QueueFixedStatus }) => taskQueueService.setFixedStatus(vars.item, vars.status),
      onSuccess: inv,
    }),
    restore: useMutation({ mutationFn: (id: string) => taskQueueService.restore(id), onSuccess: inv }),
    importItems: useMutation({
      mutationFn: (vars: { page: QueuePage; week: WeekRef; rows: QueueImportRow[] }) =>
        taskQueueService.importItems(vars.page, vars.week, vars.rows),
      onSuccess: inv,
    }),
  };
}
