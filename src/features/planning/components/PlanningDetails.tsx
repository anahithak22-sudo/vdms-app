import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DetailsDrawer, DetailField, HistoryTab } from '@/components/common/DetailsDrawer';
import { PriorityBadge } from '@/components/common/StatusControl';
import { planningStatus } from '@/features/planning/status';
import { statusLabel, statusTone } from '@/lib/status';
import { formatDate, formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export function PlanningDetails({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tables<'planning_initiatives'> | null;
}) {
  const { data: users } = useAssignableUsers();
  if (!item) return null;

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      subtitle={item.business_id}
      statusLabel={statusLabel(planningStatus, item.status)}
      statusTone={statusTone(planningStatus, item.status)}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{ru.common.general}</TabsTrigger>
          <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <dl className="divide-y divide-border">
            {item.short_description && (
              <DetailField label={ru.common.description}>{item.short_description}</DetailField>
            )}
            <DetailField label={ru.common.priority}>
              <PriorityBadge priority={item.priority} />
            </DetailField>
            <DetailField label={ru.planning.businessArea}>{item.business_area ?? '—'}</DetailField>
            <DetailField label={ru.planning.department}>{item.department ?? '—'}</DetailField>
            <DetailField label={ru.common.owner}>{userNameOf(users, item.owner_id)}</DetailField>
            <DetailField label={ru.common.startDate}>{formatDate(item.start_date)}</DetailField>
            <DetailField label={ru.planning.targetFinish}>
              {formatDate(item.target_finish_date)}
            </DetailField>
            <DetailField label={ru.common.progress}>{formatPercent(item.progress)}</DetailField>
            {item.budget !== null && (
              <DetailField label={ru.planning.budget}>{formatNumber(item.budget)}</DetailField>
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
          <HistoryTab table="planning_initiatives" entityId={item.id} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}
