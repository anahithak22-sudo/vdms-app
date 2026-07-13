import type { ListParams } from '@/lib/query/list-params';

/**
 * Query-key factory. Every cache entry derives its key here so invalidation
 * stays consistent across the app (PAD §10 caching).
 */
export const queryKeys = {
  currentUser: ['auth', 'current-user'] as const,

  users: {
    all: ['users'] as const,
    list: (search?: string, includeArchived?: boolean) =>
      ['users', 'list', { search: search ?? '', includeArchived: !!includeArchived }] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (status?: string) => ['notifications', 'list', status ?? 'all'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },

  reference: {
    businessAreas: ['reference', 'business-areas'] as const,
    departments: ['reference', 'departments'] as const,
    projects: ['reference', 'projects'] as const,
    priorities: ['reference', 'priorities'] as const,
    releases: ['reference', 'releases'] as const,
    sprints: (releaseId?: string) => ['reference', 'sprints', releaseId ?? 'all'] as const,
  },

  audit: {
    list: (params: ListParams) => ['audit', 'list', params] as const,
  },

  logs: {
    list: (params: ListParams) => ['logs', 'list', params] as const,
  },

  /** Generic entity keys used by the CRUD factory. */
  entity: (name: string) => ({
    all: [name] as const,
    list: (params: ListParams) => [name, 'list', params] as const,
    detail: (id: string) => [name, 'detail', id] as const,
    statistics: [name, 'statistics'] as const,
  }),
} as const;
