import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ROUTES } from '@/constants/routes';

/**
 * Gates authenticated routes. While the session is being restored a loading
 * screen is shown. First-login users are forced to the change-password page
 * and blocked from every other route until the password is changed.
 */
export function ProtectedRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'initializing') return <LoadingScreen />;
  if (status === 'unauthenticated' || !user) {
    return <Navigate to={ROUTES.LANDING} replace state={{ from: location.pathname }} />;
  }
  if (user.isFirstLogin && location.pathname !== ROUTES.CHANGE_PASSWORD) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  return <Outlet />;
}
