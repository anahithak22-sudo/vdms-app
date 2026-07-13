import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weeklyPlanService } from './service';

function unwrap<T>(res: { success: boolean; data: T | null; message: string | null }): T {
  if (!res.success || res.data == null) throw new Error(res.message ?? 'Ошибка');
  return res.data;
}

export function useWeekTasks(year: number, week: number) {
  return useQuery({
    queryKey: ['weeklyplan', year, week],
    queryFn: async () => unwrap(await weeklyPlanService.listByWeek(year, week)),
  });
}

export function useWeeklyMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['weeklyplan'] });
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof weeklyPlanService.create>[0]) => weeklyPlanService.create(input),
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; patch: Parameters<typeof weeklyPlanService.update>[1] }) =>
        weeklyPlanService.update(vars.id, vars.patch),
      onSuccess: inv,
    }),
    remove: useMutation({ mutationFn: (id: string) => weeklyPlanService.softDelete(id), onSuccess: inv }),
    toggleDone: useMutation({
      mutationFn: (vars: { id: string; done: boolean }) => weeklyPlanService.toggleDone(vars.id, vars.done),
      onSuccess: inv,
    }),
  };
}
