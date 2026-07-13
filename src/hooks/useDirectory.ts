import { useQuery } from '@tanstack/react-query';
import { directoryService, type AssignableUser } from '@/services/directory.service';
import type { SelectOption } from '@/components/ui/select';

/** Active users for assignment selects, cached for the session. */
export function useAssignableUsers() {
  return useQuery({
    queryKey: ['directory', 'assignable-users'],
    queryFn: async () => {
      const res = await directoryService.assignableUsers();
      return res.success && res.data ? res.data : [];
    },
    staleTime: 5 * 60_000,
  });
}

export function userOptions(users: AssignableUser[] | undefined): SelectOption[] {
  return (users ?? []).map((u) => ({ value: u.id, label: u.display_name }));
}

export function userNameOf(users: AssignableUser[] | undefined, id: string | null | undefined): string {
  if (!id) return '—';
  return users?.find((u) => u.id === id)?.display_name ?? '—';
}
