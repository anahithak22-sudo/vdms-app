import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planService } from './service';
import type { PlanTaskRow } from './types';

const KEYS = {
  tasks: ['plan', 'tasks'] as const,
  statuses: ['plan', 'statuses'] as const,
  tags: ['plan', 'tags'] as const,
  comments: (taskId: string) => ['plan', 'comments', taskId] as const,
};

function unwrap<T>(res: { success: boolean; data: T | null; message: string | null }): T {
  if (!res.success || res.data == null) throw new Error(res.message ?? 'Ошибка');
  return res.data;
}

export function usePlanTasks() {
  return useQuery({ queryKey: KEYS.tasks, queryFn: async () => unwrap(await planService.listTasks()) });
}

export function usePlanStatuses() {
  return useQuery({ queryKey: KEYS.statuses, queryFn: async () => unwrap(await planService.listStatuses()) });
}

export function usePlanTags() {
  return useQuery({ queryKey: KEYS.tags, queryFn: async () => unwrap(await planService.listTags()) });
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: KEYS.comments(taskId ?? 'none'),
    queryFn: async () => unwrap(await planService.listComments(taskId as string)),
    enabled: !!taskId,
  });
}

export function usePlanMutations() {
  const qc = useQueryClient();
  const invTasks = () => qc.invalidateQueries({ queryKey: KEYS.tasks });
  const invStatuses = () => qc.invalidateQueries({ queryKey: KEYS.statuses });
  const invTags = () => qc.invalidateQueries({ queryKey: KEYS.tags });

  return {
    createTask: useMutation({
      mutationFn: (payload: PlanTaskRow extends never ? never : Record<string, unknown>) =>
        planService.tasks.create(payload as never),
      onSuccess: invTasks,
    }),
    updateTask: useMutation({
      mutationFn: (vars: { id: string; payload: Record<string, unknown>; expectedVersion: number }) =>
        planService.tasks.update(vars.id, vars.payload as never, vars.expectedVersion),
      onSuccess: invTasks,
    }),
    deleteTask: useMutation({
      mutationFn: (id: string) => planService.tasks.softDelete(id),
      onSuccess: invTasks,
    }),
    setStatus: useMutation({
      mutationFn: (vars: { taskId: string; statusId: string }) =>
        planService.setTaskStatus(vars.taskId, vars.statusId),
      onSuccess: invTasks,
    }),
    setTags: useMutation({
      mutationFn: (vars: { taskId: string; tagIds: string[] }) =>
        planService.setTaskTags(vars.taskId, vars.tagIds),
      onSuccess: invTasks,
    }),
    createStatus: useMutation({
      mutationFn: (input: { name: string; color: string; sort_order: number; is_terminal: boolean }) =>
        planService.createStatus(input),
      onSuccess: invStatuses,
    }),
    updateStatus: useMutation({
      mutationFn: (vars: { id: string; patch: Record<string, unknown> }) =>
        planService.updateStatus(vars.id, vars.patch),
      onSuccess: invStatuses,
    }),
    deleteStatus: useMutation({
      mutationFn: (id: string) => planService.deleteStatus(id),
      onSuccess: invStatuses,
    }),
    createTag: useMutation({
      mutationFn: (vars: { label: string; color: string }) => planService.createTag(vars.label, vars.color),
      onSuccess: invTags,
    }),
    updateTag: useMutation({
      mutationFn: (vars: { id: string; patch: Record<string, unknown> }) =>
        planService.updateTag(vars.id, vars.patch),
      onSuccess: invTags,
    }),
    deleteTag: useMutation({
      mutationFn: (id: string) => planService.deleteTag(id),
      onSuccess: () => {
        invTags();
        invTasks();
      },
    }),
  };
}

export function useCommentMutations(taskId: string) {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: KEYS.comments(taskId) });
  return {
    add: useMutation({ mutationFn: (body: string) => planService.addComment(taskId, body), onSuccess: inv }),
    update: useMutation({
      mutationFn: (vars: { id: string; body: string }) => planService.updateComment(vars.id, vars.body),
      onSuccess: inv,
    }),
    remove: useMutation({ mutationFn: (id: string) => planService.deleteComment(id), onSuccess: inv }),
  };
}
