import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesService, PREFERENCE_SCOPE } from '@/services/preferences.service';
import { useAuth } from '@/hooks/useAuth';

/** Per-user interface preferences (D-16). */
export interface UserSettings {
  defaultView: 'table' | 'board';
  pageSize: number;
  notifyAssignments: boolean;
  notifyComments: boolean;
  notifyReminders: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultView: 'table',
  pageSize: 25,
  notifyAssignments: true,
  notifyComments: true,
  notifyReminders: true,
};

const KEY = ['preferences', 'user-settings'] as const;

export function useUserSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<UserSettings> => {
      const stored = await preferencesService.get<Partial<UserSettings>>(
        PREFERENCE_SCOPE.USER_SETTINGS,
      );
      return { ...DEFAULT_USER_SETTINGS, ...(stored ?? {}) };
    },
  });

  const mutation = useMutation({
    mutationFn: async (next: UserSettings) => {
      if (!user) return;
      await preferencesService.set(PREFERENCE_SCOPE.USER_SETTINGS, next, user.id);
    },
    onSuccess: (_data, next) => {
      qc.setQueryData(KEY, next);
    },
  });

  return {
    settings: query.data ?? DEFAULT_USER_SETTINGS,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}
