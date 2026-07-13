import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasRole } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import type { UserRole } from '@/lib/supabase/types';

interface RoleGuardProps {
  allow: readonly UserRole[];
}

/**
 * Restricts a route subtree to specific roles. Unauthorized access renders the
 * Forbidden page. This mirrors the permission matrix; RLS remains authoritative.
 */
export function RoleGuard({ allow }: RoleGuardProps) {
  const { user } = useAuth();
  if (!hasRole(user?.role, allow)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }
  return <Outlet />;
}
