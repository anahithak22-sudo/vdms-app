import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { userService } from '@/features/users/services/user.service';
import type { UserRole } from '@/lib/supabase/types';
import type { CreateUserInput } from '@/features/users/types/user-management.types';

export function useUsers(search?: string, includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.users.list(search, includeArchived),
    queryFn: async () => {
      const res = await userService.list(search, includeArchived);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ''),
    queryFn: async () => {
      const res = await userService.getById(id as string);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
    enabled: !!id,
  });
}

/** Lifecycle + creation mutations. Each invalidates the user list on success. */
export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.users.all });

  const create = useMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    onSuccess: invalidate,
  });
  const resetPassword = useMutation({
    mutationFn: (userId: string) => userService.resetPassword(userId),
  });
  const setRole = useMutation({
    mutationFn: (vars: { userId: string; role: UserRole }) =>
      userService.setRole(vars.userId, vars.role),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: (vars: { userId: string; active: boolean }) =>
      userService.setActive(vars.userId, vars.active),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (userId: string) => userService.archive(userId),
    onSuccess: invalidate,
  });
  const restore = useMutation({
    mutationFn: (userId: string) => userService.restore(userId),
    onSuccess: invalidate,
  });
  const unlock = useMutation({
    mutationFn: (userId: string) => userService.unlock(userId),
    onSuccess: invalidate,
  });

  return { create, resetPassword, setRole, setActive, archive, restore, unlock };
}
