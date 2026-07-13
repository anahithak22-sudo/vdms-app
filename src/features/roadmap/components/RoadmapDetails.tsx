import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DetailsDrawer, DetailField, HistoryTab } from '@/components/common/DetailsDrawer';
import { PriorityBadge } from '@/components/common/StatusControl';
import { roadmapStatus } from '@/features/roadmap/status';
import { statusLabel, statusTone } from '@/lib/status';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import { useReleases, useSprints } from '@/hooks/useReferenceData';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export function RoadmapDetails({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tables<'roadmap_items'> | null;
}) {
  const { data: users } = useAssignableUsers();
  const { data: releases } = useReleases();
  const { data: sprints } = useSprints();
  if (!item) return null;

  const releaseName = releases?.find((r) => r.id === item.release_id)?.name ?? '—';
  const sprintName = sprints?.find((s) => s.id === item.sprint_id)?.name ?? '—';

  return (
    <DetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      subtitle={item.business_id}
      statusLabel={statusLabel(roadmapStatus, item.status)}
      statusTone={statusTone(roadmapStatus, item.status)}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{ru.common.general}</TabsTrigger>
          <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <dl className="divide-y divide-border">
            <DetailField label={ru.common.priority}><PriorityBadge priority={item.priority} /></DetailField>
            <DetailField label={ru.roadmap.epic}>{item.epic ?? '—'}</DetailField>
            <DetailField label={ru.roadmap.feature}>{item.feature ?? '—'}</DetailField>
            <DetailField label={ru.roadmap.release}>{releaseName}</DetailField>
            <DetailField label={ru.roadmap.sprint}>{sprintName}</DetailField>
            <DetailField label={ru.common.owner}>{userNameOf(users, item.owner_id)}</DetailField>
            <DetailField label={ru.roadmap.developer}>{userNameOf(users, item.assigned_developer_id)}</DetailField>
            <DetailField label={ru.roadmap.storyPoints}>{item.story_points ?? '—'}</DetailField>
            <DetailField label={ru.roadmap.estimatedHours}>{formatNumber(item.estimated_hours)}</DetailField>
            <DetailField label={ru.common.progress}>{item.progress}%</DetailField>
            <DetailField label={ru.common.startDate}>{formatDate(item.start_date)}</DetailField>
            <DetailField label={ru.common.dueDate}>{formatDate(item.due_date)}</DetailField>
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
          <HistoryTab table="roadmap_items" entityId={item.id} />
        </TabsContent>
      </Tabs>
    </DetailsDrawer>
  );
}
