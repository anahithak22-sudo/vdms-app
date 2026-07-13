import { useCallback, useRef } from 'react';
import { preferencesService, PREFERENCE_SCOPE } from '@/services/preferences.service';
import { useAuth } from '@/hooks/useAuth';

interface AppPreferences {
  lastPage?: string;
  [key: string]: unknown;
}

/**
 * App-level UI preferences (D-16). Writes are debounced and deduplicated so
 * frequent navigation does not spam the backend. Table-level preferences are
 * handled by the DataTable engine in Phase 2 using PREFERENCE_SCOPE.table().
 */
export function usePreferences() {
  const { user } = useAuth();
  const lastWritten = useRef<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLastPage = useCallback(
    (path: string) => {
      if (!user || lastWritten.current === path) return;
      lastWritten.current = path;

      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        void preferencesService.set(PREFERENCE_SCOPE.APP, { lastPage: path }, user.id);
      }, 800);
    },
    [user],
  );

  const getAppPreferences = useCallback(async (): Promise<AppPreferences | null> => {
    return preferencesService.get<AppPreferences>(PREFERENCE_SCOPE.APP);
  }, []);

  return { setLastPage, getAppPreferences };
}
