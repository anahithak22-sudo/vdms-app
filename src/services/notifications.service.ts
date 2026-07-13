import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Tables, NotificationStatus } from '@/lib/supabase/types';

type Notification = Tables<'notifications'>;

interface ListNotificationsParams {
  status?: NotificationStatus;
  limit?: number;
  before?: string; // created_at cursor for lazy loading
}

/**
 * Notification service (PAD §16). Reads/writes are owner-scoped by RLS.
 * Delivery is realtime via Supabase channels; the unread badge reads the
 * denormalized counter so it stays instant at scale.
 */
async function list(params: ListNotificationsParams = {}): Promise<ServiceResponse<Notification[]>> {
  try {
    let q = supabase
      .from('notifications')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 30);
    if (params.status) q = q.eq('status', params.status);
    if (params.before) q = q.lt('created_at', params.before);
    const { data, error } = await q;
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as Notification[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function unreadCount(): Promise<ServiceResponse<number>> {
  try {
    const { data, error } = await supabase.rpc('unread_notification_count');
    if (error) return fail(mapPostgrestError(error));
    return ok((data as number) ?? 0);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function markRead(id: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.rpc('mark_notification_read', { p_id: id });
    if (error) return fail(mapPostgrestError(error));
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function markAllRead(): Promise<ServiceResponse<number>> {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');
    if (error) return fail(mapPostgrestError(error));
    return ok((data as number) ?? 0);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function archive(id: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function softDelete(id: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(mapPostgrestError(error));
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/**
 * Subscribe to the current user's notification inserts in realtime.
 * Returns an unsubscribe function. RLS ensures only the user's rows arrive.
 */
function subscribe(userId: string, onInsert: (n: Notification) => void): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as Notification),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export const notificationsService = {
  list,
  unreadCount,
  markRead,
  markAllRead,
  archive,
  softDelete,
  subscribe,
};
