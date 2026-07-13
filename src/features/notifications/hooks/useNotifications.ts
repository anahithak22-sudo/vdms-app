import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { notificationsService } from '@/services/notifications.service';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationStatus } from '@/lib/supabase/types';

/** List notifications and keep the cache live via a realtime subscription. */
export function useNotifications(status?: NotificationStatus) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.list(status),
    queryFn: async () => {
      const res = await notificationsService.list({ status });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationsService.subscribe(user.id, () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    });
    return unsubscribe;
  }, [user, qc]);

  return query;
}

/** Unread badge count, refreshed by the realtime subscription above. */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const res = await notificationsService.unreadCount();
      return res.success && res.data !== null ? res.data : 0;
    },
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (id: string) => notificationsService.archive(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.softDelete(id),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead, archive, remove };
}
