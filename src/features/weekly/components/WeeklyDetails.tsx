import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DetailsDrawer, DetailField, HistoryTab } from '@/components/common/DetailsDrawer';
import { PriorityBadge } from '@/components/common/StatusControl';
import { weeklyStatus } from '@/features/weekly/status';
import { statusLabel, statusTone } from '@/lib/status';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export function WeeklyDetails({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tables<'weekly_tasks'> | null;
}) {
  const { data: users } = useAssignableUsers();
  if (!item) return null;
  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      subtitle={item.business_id}
      statusLabel={statusLabel(weeklyStatus, item.status)}
      statusTone={statusTone(weeklyStatus, item.status)}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{ru.common.general}</TabsTrigger>
          <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <dl className="divide-y divide-border">
            <DetailField label={ru.common.priority}><PriorityBadge priority={item.priority} /></DetailField>
            <DetailField label={ru.weekly.assignee}>{userNameOf(users, item.assigned_user_id)}</DetailField>
            <DetailField label={ru.weekly.estimatedHours}>{formatNumber(item.estimated_hours)}</DetailField>
            <DetailField label={ru.weekly.actualHours}>{formatNumber(item.actual_hours)}</DetailField>
            <DetailField label={ru.common.dueDate}>{formatDate(item.due_date)}</DetailField>
            {item.rollover_count > 0 && (
              <DetailField label="Переносов">{item.rollover_count}</DetailField>
            )}
            <DetailField label={ru.common.updated}>{formatDateTime(item.updated_at)}</DetailField>
          </dl>
          {item.description && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-foreground">{ru.common.description}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab table="weekly_tasks" entityId={item.id} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}
