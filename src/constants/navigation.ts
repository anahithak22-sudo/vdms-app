import {
  LayoutDashboard,
  Map,
  ListChecks,
  CalendarRange,
  Bug,
  GanttChartSquare,
  Users,
  Activity,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { ru } from '@/locales/ru';
import type { UserRole } from '@/lib/supabase/types';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** Roles allowed to see the item. Empty = all authenticated roles. */
  roles: readonly UserRole[];
}

export interface NavSection {
  key: string;
  label?: string;
  items: NavItem[];
}

const { SUPER_ADMIN, ADMIN, MANAGER, DEVELOPER } = ROLES;
const ALL = [SUPER_ADMIN, ADMIN, MANAGER, DEVELOPER] as const;

/**
 * Navigation reflects the frozen permission matrix (PAD §6.3).
 * The sidebar hides items a role may not access; this is a usability aid,
 * not a security boundary — routes are guarded and RLS is authoritative.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    key: 'overview',
    items: [
      {
        key: 'dashboard',
        label: ru.nav.dashboard,
        path: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        roles: ALL,
      },
    ],
  },
  {
    key: 'artifacts',
    label: ru.nav.artifacts,
    items: [
      {
        key: 'planning',
        label: ru.nav.planning,
        path: ROUTES.PLANNING,
        icon: GanttChartSquare,
        roles: [SUPER_ADMIN, ADMIN],
      },
      {
        key: 'roadmap',
        label: ru.nav.roadmap,
        path: ROUTES.ROADMAP,
        icon: Map,
        roles: [SUPER_ADMIN, ADMIN],
      },
      {
        key: 'priority-queue',
        label: ru.nav.priorityQueue,
        path: ROUTES.PRIORITY_QUEUE,
        icon: ListChecks,
        roles: [SUPER_ADMIN, ADMIN],
      },
      {
        key: 'weekly-planning',
        label: ru.nav.weeklyPlanning,
        path: ROUTES.WEEKLY_PLANNING,
        icon: CalendarRange,
        roles: ALL,
      },
      {
        key: 'bug-statistics',
        label: ru.nav.bugStatistics,
        path: ROUTES.BUG_STATISTICS,
        icon: Bug,
        roles: ALL,
      },
    ],
  },
  {
    key: 'administration',
    label: 'Администрирование',
    items: [
      {
        key: 'users',
        label: ru.nav.userManagement,
        path: ROUTES.USER_MANAGEMENT,
        icon: Users,
        roles: [SUPER_ADMIN],
      },
      {
        key: 'monitoring',
        label: ru.nav.monitoring,
        path: ROUTES.MONITORING,
        icon: Activity,
        roles: [SUPER_ADMIN],
      },
      {
        key: 'logs',
        label: ru.nav.logs,
        path: ROUTES.LOGS,
        icon: ScrollText,
        roles: [SUPER_ADMIN],
      },
    ],
  },
];

/** Filter the navigation model down to what a role may see. */
export function visibleNavSections(role: UserRole | undefined): NavSection[] {
  if (!role) return [];
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.length === 0 || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
