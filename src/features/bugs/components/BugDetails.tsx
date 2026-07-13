import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DetailsDrawer, DetailField, HistoryTab } from '@/components/common/DetailsDrawer';
import { PriorityBadge } from '@/components/common/StatusControl';
import { StatusBadge } from '@/components/common/DisplayPrimitives';
import { bugStatus } from '@/features/bugs/status';
import { statusLabel, statusTone } from '@/lib/status';
import { SEVERITY_LABELS, ROOT_CAUSE_LABELS, RESOLUTION_LABELS } from '@/constants/options';
import { formatDateTime } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export function BugDetails({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tables<'bugs'> | null;
}) {
  const { data: users } = useAssignableUsers();
  if (!item) return null;

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      subtitle={item.business_id}
      statusLabel={statusLabel(bugStatus, item.status)}
      statusTone={statusTone(bugStatus, item.status)}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{ru.common.general}</TabsTrigger>
          <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <dl className="divide-y divide-border">
            <DetailField label={ru.bugs.severity}>
              <StatusBadge label={SEVERITY_LABELS[item.severity]}
                tone={item.severity === 'critical' ? 'danger' : item.severity === 'major' ? 'warning' : 'neutral'} />
            </DetailField>
            <DetailField label={ru.common.priority}><PriorityBadge priority={item.priority} /></DetailField>
            <DetailField label={ru.bugs.module}>{item.affected_module ?? '—'}</DetailField>
            <DetailField label={ru.bugs.environment}>{item.environment ?? '—'}</DetailField>
            <DetailField label={ru.bugs.appVersion}>{item.app_version ?? '—'}</DetailField>
            <DetailField label={ru.bugs.reporter}>{userNameOf(users, item.reporter_id)}</DetailField>
            <DetailField label={ru.bugs.developer}>{userNameOf(users, item.assigned_developer_id)}</DetailField>
            <DetailField label={ru.bugs.rootCause}>
              {item.root_cause ? ROOT_CAUSE_LABELS[item.root_cause] : '—'}
            </DetailField>
            <DetailField label={ru.bugs.resolution}>
              {item.resolution ? RESOLUTION_LABELS[item.resolution] : '—'}
            </DetailField>
            <DetailField label={ru.bugs.reopenCount}>{item.reopen_count}</DetailField>
            <DetailField label={ru.common.updated}>{formatDateTime(item.updated_at)}</DetailField>
          </dl>
          {item.steps_to_reproduce && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-foreground">{ru.bugs.stepsToReproduce}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.steps_to_reproduce}</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab table="bugs" entityId={item.id} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}
