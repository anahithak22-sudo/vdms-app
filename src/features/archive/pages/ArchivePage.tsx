import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive as ArchiveIcon, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/DisplayPrimitives';
import { DataTable, type Column } from '@/components/data/DataTable';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import { planningService } from '@/features/planning/service';
import { roadmapService } from '@/features/roadmap/service';
import { bugService } from '@/features/bugs/service';
import { queueService } from '@/features/queue/service';
import { weeklyTaskService } from '@/features/weekly/service';
import { formatDateTime } from '@/lib/format';
import type { CrudService } from '@/services/base/crud.service';
import type { Database } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

interface ArchiveSource {
  key: string;
  label: string;
  adminOnly: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: CrudService<keyof Database['public']['Tables']> | any;
}

const SOURCES: ArchiveSource[] = [
  { key: 'roadmap_items', label: ru.nav.roadmap, adminOnly: false, service: roadmapService },
  { key: 'bugs', label: ru.nav.bugStatistics, adminOnly: false, service: bugService },
  { key: 'weekly_tasks', label: ru.nav.weeklyPlanning, adminOnly: false, service: weeklyTaskService },
  { key: 'priority_queue', label: ru.nav.priorityQueue, adminOnly: true, service: queueService },
  { key: 'planning_initiatives', label: ru.nav.planning, adminOnly: true, service: planningService },
];

interface ArchivedRow {
  id: string;
  business_id: string;
  title: string;
  archived_at: string | null;
}

export default function ArchivePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

  const sources = useMemo(() => SOURCES.filter((s) => !s.adminOnly || isAdmin), [isAdmin]);
  const [sourceKey, setSourceKey] = useState(sources[0]?.key ?? '');
  const source = SOURCES.find((s) => s.key === sourceKey);

  const query = useQuery({
    queryKey: ['archive', sourceKey],
    queryFn: async () => {
      if (!source) return [];
      const res = await source.service.getList({
        pageSize: 200,
        includeArchived: true,
        filters: [{ field: 'is_archived', operator: 'eq', value: true }],
      });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data.items as ArchivedRow[];
    },
    enabled: !!source,
  });

  async function restore(row: ArchivedRow) {
    if (!source) return;
    const res = await source.service.restore(row.id);
    if (res.success) {
      toast.success(ru.archive.restored);
      void qc.invalidateQueries({ queryKey: ['archive', sourceKey] });
      void qc.invalidateQueries({ queryKey: [sourceKey] });
    } else {
      toast.error(res.message ?? '');
    }
  }

  const columns: Column<ArchivedRow>[] = [
    { key: 'business_id', header: 'ID',
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
    { key: 'title', header: ru.common.title,
      cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: 'archived_at', header: 'Дата архивации',
      cell: (r) => <span className="text-sm text-muted-foreground">{formatDateTime(r.archived_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={ru.archive.title} description={ru.archive.subtitle} />

      <div className="w-64">
        <Select value={sourceKey || undefined} onValueChange={setSourceKey}
          options={sources.map((s) => ({ value: s.key, label: s.label }))}
          placeholder={ru.archive.module} />
      </div>

      <DataTable
        columns={columns}
        rows={query.data ?? []}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        emptyIcon={ArchiveIcon}
        emptyTitle={ru.archive.empty}
        actions={[
          { key: 'restore', label: ru.archive.restore, icon: RotateCcw, onSelect: restore },
        ]}
      />
    </div>
  );
}
