import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DetailsDrawer, DetailField, HistoryTab } from '@/components/common/DetailsDrawer';
import { PriorityBadge } from '@/components/common/StatusControl';
import { StatusBadge } from '@/components/common/DisplayPrimitives';
import { READINESS_LABELS, READINESS_TONES } from '@/features/queue/readiness';
import { formatDateTime, formatNumber } from '@/lib/format';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export function QueueDetails({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tables<'priority_queue'> | null;
}) {
  if (!item) return null;
  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      subtitle={item.business_id}
      statusLabel={READINESS_LABELS[item.implementation_readiness]}
      statusTone={READINESS_TONES[item.implementation_readiness]}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{ru.common.general}</TabsTrigger>
          <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <dl className="divide-y divide-border">
            <DetailField label={ru.common.priority}><PriorityBadge priority={item.priority} /></DetailField>
            <DetailField label={ru.queue.readiness}>
              <StatusBadge label={READINESS_LABELS[item.implementation_readiness]}
                tone={READINESS_TONES[item.implementation_readiness]} />
            </DetailField>
            <DetailField label={ru.queue.externalId}>{item.external_task_id ?? '—'}</DetailField>
            <DetailField label={ru.queue.source}>{item.source_system}</DetailField>
            <DetailField label={ru.planning.businessArea}>{item.business_area ?? '—'}</DetailField>
            <DetailField label={ru.queue.project}>{item.project ?? '—'}</DetailField>
            <DetailField label={ru.queue.requester}>{item.requester ?? '—'}</DetailField>
            <DetailField label={ru.roadmap.estimatedHours}>{formatNumber(item.estimated_hours)}</DetailField>
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
          <HistoryTab table="priority_queue" entityId={item.id} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}
