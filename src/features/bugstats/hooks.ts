import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bugStatsService, type BugStatInsert, type BugStatUpdate } from './service';

function unwrap<T>(res: { success: boolean; data: T | null; message: string | null }): T {
  if (!res.success || res.data == null) throw new Error(res.message ?? 'Ошибка');
  return res.data;
}

export function useBugStats() {
  return useQuery({ queryKey: ['bugstats'], queryFn: async () => unwrap(await bugStatsService.list()) });
}

export function useBugStatsMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['bugstats'] });
  return {
    create: useMutation({ mutationFn: (input: BugStatInsert) => bugStatsService.create(input), onSuccess: inv }),
    update: useMutation({
      mutationFn: (vars: { id: string; patch: BugStatUpdate }) => bugStatsService.update(vars.id, vars.patch),
      onSuccess: inv,
    }),
    remove: useMutation({ mutationFn: (id: string) => bugStatsService.softDelete(id), onSuccess: inv }),
  };
}
