import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RoleGuard } from '@/routes/RoleGuard';
import { AppLayout } from '@/layouts/AppLayout';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';

// Pages are lazily loaded (all use default exports) to keep the initial bundle small.
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const ChangePasswordPage = lazy(() => import('@/features/auth/pages/ChangePasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const PlanningPage = lazy(() => import('@/pages/modules/PlanningPage'));
const RoadmapPage = lazy(() => import('@/pages/modules/RoadmapPage'));
const PriorityQueuePage = lazy(() => import('@/pages/modules/PriorityQueuePage'));
const WeeklyPlanningPage = lazy(() => import('@/pages/modules/WeeklyPlanningPage'));
const BugStatisticsPage = lazy(() => import('@/pages/modules/BugStatisticsPage'));
const UserManagementPage = lazy(() => import('@/pages/modules/UserManagementPage'));
const MonitoringPage = lazy(() => import('@/pages/modules/MonitoringPage'));
const LogsPage = lazy(() => import('@/pages/modules/LogsPage'));

const { SUPER_ADMIN, ADMIN } = ROLES;

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute />}>
          {/* Change password is reachable while first-login is pending (no shell). */}
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />

          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />

            {/* Artifact 01 — Planning: Super Admin / Admin only (permission matrix). */}
            <Route element={<RoleGuard allow={[SUPER_ADMIN, ADMIN]} />}>
              <Route path={ROUTES.PLANNING} element={<PlanningPage />} />
            </Route>

            {/* Roadmap разработки + Очередь задач: Super Admin / Admin only. */}
            <Route element={<RoleGuard allow={[SUPER_ADMIN, ADMIN]} />}>
              <Route path={ROUTES.ROADMAP} element={<RoadmapPage />} />
              <Route path={ROUTES.PRIORITY_QUEUE} element={<PriorityQueuePage />} />
            </Route>

            {/* Планирование недели: all roles (own-done + admin override). */}
            <Route path={ROUTES.WEEKLY_PLANNING} element={<WeeklyPlanningPage />} />
            <Route path={ROUTES.BUG_STATISTICS} element={<BugStatisticsPage />} />


            {/* Administration: Super Admin only. */}
            <Route element={<RoleGuard allow={[SUPER_ADMIN]} />}>
              <Route path={ROUTES.USER_MANAGEMENT} element={<UserManagementPage />} />
              <Route path={ROUTES.MONITORING} element={<MonitoringPage />} />
              <Route path={ROUTES.LOGS} element={<LogsPage />} />
            </Route>

            <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
