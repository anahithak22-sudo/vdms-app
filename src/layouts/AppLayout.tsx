import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SessionTimeoutDialog } from '@/components/layout/SessionTimeoutDialog';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { usePreferences } from '@/hooks/usePreferences';

/**
 * The authenticated application shell. Persists the last-opened page per user
 * (D-16) and enforces the inactivity timeout (D-06) across the whole app.
 */
export function AppLayout() {
  const { status, logout } = useAuth();
  const location = useLocation();
  const { setLastPage } = usePreferences();

  const isAuthenticated = status === 'authenticated';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { showWarning, secondsRemaining, extend } = useSessionTimeout({
    enabled: isAuthenticated,
    onExpire: () => void logout('expired'),
  });

  // Remember the last opened page so it can be restored on next login.
  useEffect(() => {
    if (isAuthenticated) {
      setLastPage(location.pathname);
    }
  }, [isAuthenticated, location.pathname, setLastPage]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Collapsible sidebar on desktop */}
      {!sidebarCollapsed && (
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
          <Sidebar />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <SessionTimeoutDialog
        open={showWarning}
        secondsRemaining={secondsRemaining}
        onExtend={extend}
        onSignOut={() => void logout('user')}
      />
    </div>
  );
}
