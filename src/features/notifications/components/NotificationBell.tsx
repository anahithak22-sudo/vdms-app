import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadCount,
  useNotificationMutations,
} from '@/features/notifications/hooks/useNotifications';
import { formatDateTime } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { ru } from '@/locales/ru';

/** Header notification bell with unread badge and a recent-items dropdown. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const { data: unread } = useUnreadCount();
  const { markRead, markAllRead } = useNotificationMutations();
  const recent = (notifications ?? []).slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={ru.notifications.title}>
          <Bell className="h-5 w-5" />
          {!!unread && unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">{ru.notifications.title}</DropdownMenuLabel>
          {!!unread && unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {ru.notifications.markAllRead}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {recent.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {ru.notifications.empty}
          </p>
        )}

        {recent.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onSelect={() => {
              if (n.status === 'unread') markRead.mutate(n.id);
              if (n.action_url) navigate(n.action_url);
            }}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{n.title}</span>
              {n.status === 'unread' && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </div>
            {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
            <span className="text-[11px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(ROUTES.NOTIFICATIONS)} className="justify-center text-sm text-primary">
          {ru.notifications.all}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
