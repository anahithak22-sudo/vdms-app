import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rdevService } from './service';
import type { RdevTaskRow } from './types';

const KEYS = {
  tasks: ['rdev', 'tasks'] as const,
  statuses: ['rdev', 'statuses'] as const,
  tags: ['rdev', 'tags'] as const,
  comments: (taskId: string) => ['rdev', 'comments', taskId] as const,
};

function unwrap<T>(res: { success: boolean; data: T | null; message: string | null }): T {
  if (!res.success || res.data == null) throw new Error(res.message ?? 'Ошибка');
  return res.data;
}

export function useRdevTasks() {
  return useQuery({ queryKey: KEYS.tasks, queryFn: async () => unwrap(await rdevService.listTasks()) });
}

export function useRdevStatuses() {
  return useQuery({ queryKey: KEYS.statuses, queryFn: async () => unwrap(await rdevService.listStatuses()) });
}

export function useRdevTags() {
  return useQuery({ queryKey: KEYS.tags, queryFn: async () => unwrap(await rdevService.listTags()) });
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: KEYS.comments(taskId ?? 'none'),
    queryFn: async () => unwrap(await rdevService.listComments(taskId as string)),
    enabled: !!taskId,
  });
}

export function useRdevMutations() {
  const qc = useQueryClient();
  const invTasks = () => qc.invalidateQueries({ queryKey: KEYS.tasks });
  const invStatuses = () => qc.invalidateQueries({ queryKey: KEYS.statuses });
  const invTags = () => qc.invalidateQueries({ queryKey: KEYS.tags });

  return {
    createTask: useMutation({
      mutationFn: (payload: RdevTaskRow extends never ? never : Record<string, unknown>) =>
        rdevService.tasks.create(payload as never),
      onSuccess: invTasks,
    }),
    updateTask: useMutation({
      mutationFn: (vars: { id: string; payload: Record<string, unknown>; expectedVersion: number }) =>
        rdevService.tasks.update(vars.id, vars.payload as never, vars.expectedVersion),
      onSuccess: invTasks,
    }),
    deleteTask: useMutation({
      mutationFn: (id: string) => rdevService.tasks.softDelete(id),
      onSuccess: invTasks,
    }),
    setStatus: useMutation({
      mutationFn: (vars: { taskId: string; statusId: string }) =>
        rdevService.setTaskStatus(vars.taskId, vars.statusId),
      onSuccess: invTasks,
    }),
    setTags: useMutation({
      mutationFn: (vars: { taskId: string; tagIds: string[] }) =>
        rdevService.setTaskTags(vars.taskId, vars.tagIds),
      onSuccess: invTasks,
    }),
    createStatus: useMutation({
      mutationFn: (input: { name: string; color: string; sort_order: number; is_terminal: boolean }) =>
        rdevService.createStatus(input),
      onSuccess: invStatuses,
    }),
    updateStatus: useMutation({
      mutationFn: (vars: { id: string; patch: Record<string, unknown> }) =>
        rdevService.updateStatus(vars.id, vars.patch),
      onSuccess: invStatuses,
    }),
    deleteStatus: useMutation({
      mutationFn: (id: string) => rdevService.deleteStatus(id),
      onSuccess: invStatuses,
    }),
    createTag: useMutation({
      mutationFn: (vars: { label: string; color: string }) => rdevService.createTag(vars.label, vars.color),
      onSuccess: invTags,
    }),
    updateTag: useMutation({
      mutationFn: (vars: { id: string; patch: Record<string, unknown> }) =>
        rdevService.updateTag(vars.id, vars.patch),
      onSuccess: invTags,
    }),
    deleteTag: useMutation({
      mutationFn: (id: string) => rdevService.deleteTag(id),
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
    add: useMutation({ mutationFn: (body: string) => rdevService.addComment(taskId, body), onSuccess: inv }),
    update: useMutation({
      mutationFn: (vars: { id: string; body: string }) => rdevService.updateComment(vars.id, vars.body),
      onSuccess: inv,
    }),
    remove: useMutation({ mutationFn: (id: string) => rdevService.deleteComment(id), onSuccess: inv }),
  };
}
