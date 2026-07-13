import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ROUTES } from '@/constants/routes';

/** Redirects already-authenticated users away from public (login) routes. */
export function PublicRoute() {
  const { status, user } = useAuth();

  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'authenticated' && user) {
    return <Navigate to={user.isFirstLogin ? ROUTES.CHANGE_PASSWORD : ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
