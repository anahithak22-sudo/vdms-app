import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader, StatusBadge, type Tone } from '@/components/common/DisplayPrimitives';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/data/DataTable';
import { DataTablePagination } from '@/components/data/DataTableControls';
import { ExportMenu } from '@/components/data/ExportMenu';
import { useSystemLogs, useAuditLog } from '@/hooks/useAuditLog';
import {
  LOG_CATEGORY_LABELS, LOG_SEVERITY_LABELS, AUDIT_ACTION_LABELS, AUDIT_CATEGORY_LABELS,
} from '@/constants/enums';
import { formatDateTime } from '@/lib/format';
import type { Tables, LogSeverity, LogCategory } from '@/lib/supabase/types';
import type { FilterSpec } from '@/lib/query/list-params';
import { ru } from '@/locales/ru';

const SEVERITY_TONE: Record<LogSeverity, Tone> = {
  information: 'info', warning: 'warning', error: 'danger', critical: 'danger', fatal: 'danger',
};

type SysLog = Tables<'system_logs'>;
type Audit = Tables<'audit_logs'>;

function SystemLogsTab() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const filters: FilterSpec[] = category ? [{ field: 'category', operator: 'eq', value: category }] : [];
  const { data, isLoading } = useSystemLogs({ page, pageSize: 20, filters });

  const columns: Column<SysLog>[] = [
    { key: 'time', header: ru.logs.time,
      cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span> },
    { key: 'category', header: ru.logs.category,
      cell: (r) => <span className="text-sm">{LOG_CATEGORY_LABELS[r.category]}</span> },
    { key: 'severity', header: ru.logs.severity,
      cell: (r) => <StatusBadge label={LOG_SEVERITY_LABELS[r.severity]} tone={SEVERITY_TONE[r.severity]} /> },
    { key: 'module', header: ru.logs.module, cell: (r) => <span className="text-sm">{r.module ?? '—'}</span> },
    { key: 'message', header: ru.logs.message,
      cell: (r) => <span className="text-sm text-foreground">{r.message}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="w-56">
          <Select value={category || undefined} onValueChange={(v) => { setCategory(v); setPage(1); }}
            options={[{ value: '', label: ru.common.all },
              ...(Object.keys(LOG_CATEGORY_LABELS) as LogCategory[]).map((c) => ({ value: c, label: LOG_CATEGORY_LABELS[c] }))]}
            placeholder={ru.logs.category} />
        </div>
        <ExportMenu filename="system-logs" rows={data?.items ?? []}
          columns={[
            { header: 'time', value: (r: SysLog) => formatDateTime(r.created_at) },
            { header: 'category', value: (r: SysLog) => r.category },
            { header: 'severity', value: (r: SysLog) => r.severity },
            { header: 'module', value: (r: SysLog) => r.module ?? '' },
            { header: 'message', value: (r: SysLog) => r.message },
          ]} />
      </div>
      <DataTable columns={columns} rows={data?.items ?? []} rowKey={(r) => r.id}
        loading={isLoading} emptyIcon={ScrollText} emptyTitle={ru.logs.empty} />
      <DataTablePagination page={page} data={data} onPageChange={setPage} />
    </div>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLog({ page, pageSize: 20 });

  const columns: Column<Audit>[] = [
    { key: 'time', header: ru.logs.time,
      cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span> },
    { key: 'action', header: ru.logs.action,
      cell: (r) => <span className="text-sm">{AUDIT_ACTION_LABELS[r.action]}</span> },
    { key: 'category', header: ru.logs.category,
      cell: (r) => (
        <StatusBadge label={AUDIT_CATEGORY_LABELS[r.category]} tone={r.category === 'security' ? 'warning' : 'neutral'} />
      ) },
    { key: 'actor', header: ru.logs.actor, cell: (r) => <span className="text-sm">{r.actor_username ?? '—'}</span> },
    { key: 'entity', header: ru.logs.entity,
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.entity_business_id ?? r.entity_table ?? '—'}</span> },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={data?.items ?? []} rowKey={(r) => r.id}
        loading={isLoading} emptyIcon={ScrollText} emptyTitle={ru.logs.empty} />
      <DataTablePagination page={page} data={data} onPageChange={setPage} />
    </div>
  );
}

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title={ru.logs.title} description={ru.logs.subtitle} />
      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">{ru.logs.system}</TabsTrigger>
          <TabsTrigger value="audit">{ru.logs.audit}</TabsTrigger>
        </TabsList>
        <TabsContent value="system"><SystemLogsTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}
