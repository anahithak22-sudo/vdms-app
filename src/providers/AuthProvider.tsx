import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/features/auth/services/auth.service';
import type { AppUser } from '@/types/user';
import type { AuthStatus, LoginResult } from '@/features/auth/types/auth.types';
import type { LoginInput } from '@/features/auth/validators/auth.schema';
import type { ServiceResponse } from '@/types/api';

interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  login: (input: LoginInput) => Promise<ServiceResponse<LoginResult>>;
  logout: (reason?: 'user' | 'expired') => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AppUser) => void;
  /** Set when the last logout was triggered by session expiry, for UI messaging. */
  expiredNotice: boolean;
  clearExpiredNotice: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUserState] = useState<AppUser | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const mounted = useRef(true);

  const applyUser = useCallback((next: AppUser | null) => {
    if (!mounted.current) return;
    setUserState(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await authService.loadCurrentUser();
    applyUser(current);
  }, [applyUser]);

  const logout = useCallback(
    async (reason: 'user' | 'expired' = 'user') => {
      await authService.logout();
      if (!mounted.current) return;
      setExpiredNotice(reason === 'expired');
      applyUser(null);
    },
    [applyUser],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authService.login(input);
      if (result.success && result.data) {
        applyUser(result.data.user);
      }
      return result;
    },
    [applyUser],
  );

  const setUser = useCallback(
    (next: AppUser) => {
      applyUser(next);
    },
    [applyUser],
  );

  // Restore session on mount and keep the profile in sync with auth events.
  useEffect(() => {
    mounted.current = true;

    void (async () => {
      const sessionUser = await authService.getSessionUser();
      applyUser(sessionUser);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        applyUser(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void authService.loadCurrentUser().then(applyUser);
      }
    });

    return () => {
      mounted.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      refreshUser,
      setUser,
      expiredNotice,
      clearExpiredNotice: () => setExpiredNotice(false),
    }),
    [status, user, login, logout, refreshUser, setUser, expiredNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
