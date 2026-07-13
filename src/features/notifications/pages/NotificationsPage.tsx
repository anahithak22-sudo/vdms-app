import { useState } from 'react';
import { Bell, Check, Archive } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/common/DisplayPrimitives';
import { StatusBadge } from '@/components/common/DisplayPrimitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useNotifications,
  useNotificationMutations,
} from '@/features/notifications/hooks/useNotifications';
import { NOTIFICATION_PRIORITY_LABELS } from '@/constants/enums';
import { formatDateTime } from '@/lib/format';
import type { NotificationStatus, NotificationPriority } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

const PRIORITY_TONE: Record<NotificationPriority, 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral', normal: 'info', high: 'warning', critical: 'danger',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationStatus | undefined>(undefined);
  const { data: notifications, isLoading } = useNotifications(filter);
  const { markRead, markAllRead, archive } = useNotificationMutations();
  const items = notifications ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.notifications.title}
        description={ru.notifications.subtitle}
        actions={
          <Button variant="outline" onClick={() => markAllRead.mutate()}>
            <Check className="h-4 w-4" />
            {ru.notifications.markAllRead}
          </Button>
        }
      />

      <div className="flex gap-2">
        <Button variant={filter === undefined ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(undefined)}>
          {ru.notifications.all}
        </Button>
        <Button variant={filter === 'unread' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('unread')}>
          {ru.notifications.unread}
        </Button>
      </div>

      {!isLoading && items.length === 0 && (
        <Card><CardContent className="p-0"><EmptyState icon={Bell} title={ru.notifications.empty} /></CardContent></Card>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{n.title}</span>
                  <StatusBadge label={NOTIFICATION_PRIORITY_LABELS[n.priority]} tone={PRIORITY_TONE[n.priority]} />
                  {n.status === 'unread' && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {n.status === 'unread' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead.mutate(n.id)}
                    aria-label={ru.notifications.markRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {!n.is_immutable && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => archive.mutate(n.id)}
                    aria-label={ru.notifications.archive}>
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
