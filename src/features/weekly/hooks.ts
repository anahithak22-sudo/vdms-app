import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCrudHooks } from '@/hooks/createCrudHooks';
import { weeklyTaskService, weekService, weeklyService } from '@/features/weekly/service';
import type { WeeklyTaskStatus } from '@/lib/supabase/types';

export const weeklyTaskHooks = createCrudHooks('weekly_tasks', weeklyTaskService);
export const weekHooks = createCrudHooks('planning_weeks', weekService);

export function useWeeks() {
  return useQuery({
    queryKey: ['planning_weeks', 'select'],
    queryFn: async () => {
      const res = await weeklyService.listWeeks();
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
  });
}

export function useWeekTasks(weekId: string | undefined) {
  return useQuery({
    queryKey: ['weekly_tasks', 'by-week', weekId ?? ''],
    queryFn: async () => {
      const res = await weeklyService.tasksForWeek(weekId as string);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
    enabled: !!weekId,
  });
}

export function useWeeklyStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; status: WeeklyTaskStatus }) =>
      weeklyService.setStatus(vars.taskId, vars.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_tasks'] }),
  });
}
