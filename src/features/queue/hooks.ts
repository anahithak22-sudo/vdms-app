import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCrudHooks } from '@/hooks/createCrudHooks';
import { queueService, priorityQueueService } from '@/features/queue/service';

export const queueHooks = createCrudHooks('priority_queue', queueService);

export function useSelectForWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { queueId: string; weekId: string; assignee?: string }) =>
      priorityQueueService.selectForWeek(vars.queueId, vars.weekId, vars.assignee),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_tasks'] }),
  });
}
