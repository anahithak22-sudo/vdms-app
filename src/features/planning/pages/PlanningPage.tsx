import { useMemo, useState } from 'react';
import { Plus, GanttChartSquare, Pencil, Eye, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { PageHeader, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { StatusControl, PriorityBadge } from '@/components/common/StatusControl';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { DataTableToolbar, DataTablePagination } from '@/components/data/DataTableControls';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useListController } from '@/hooks/useListController';
import { useToast } from '@/hooks/useToast';
import { planningService } from '@/features/planning/service';
import { planningHooks } from '@/features/planning/hooks';
import { planningStatus } from '@/features/planning/status';
import { PlanningForm } from '@/features/planning/components/PlanningForm';
import { PlanningDetails } from '@/features/planning/components/PlanningDetails';
import type { PlanningFormValues } from '@/features/planning/validators';
import { statusSelectOptions } from '@/lib/status';
import { formatDate } from '@/lib/format';
import type { Tables, PlanningStatus } from '@/lib/supabase/types';
import type { FilterSpec } from '@/lib/query/list-params';
import { ru } from '@/locales/ru';

type Row = Tables<'planning_initiatives'>;

function emptyToNull<T extends object>(v: T): T {
  const out = { ...v } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === '') out[k] = null;
  return out as T;
}

export default function PlanningPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [detailsItem, setDetailsItem] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'archive' | 'delete'; row: Row } | null>(null);

  const controller = useListController<Row>({
    keyBase: ['planning_initiatives'],
    getList: (params) => {
      const filters: FilterSpec[] = statusFilter
        ? [{ field: 'status', operator: 'eq', value: statusFilter }]
        : [];
      return planningService.getList({ ...params, filters });
    },
    defaultSort: { field: 'updated_at', direction: 'desc' },
  });

  const create = planningHooks.useCreate();
  const update = planningHooks.useUpdate();
  const archive = planningHooks.useArchive();
  const restore = planningHooks.useRestore();
  const softDelete = planningHooks.useSoftDelete();

  const rows = controller.query.data?.items ?? [];

  async function submitForm(values: PlanningFormValues) {
    const payload = emptyToNull(values);
    if (editing) {
      const res = await update.mutateAsync({ id: editing.id, payload, expectedVersion: editing.version }).then(
        () => ({ ok: true as const }),
        (e: Error) => ({ ok: false as const, message: e.message }),
      );
      if (res.ok) {
        toast.success(ru.common.saved);
        setFormOpen(false);
        setEditing(null);
      } else toast.error(res.message ?? '');
    } else {
      const res = await create.mutateAsync(payload).then(
        () => ({ ok: true as const }),
        (e: Error) => ({ ok: false as const, message: e.message }),
      );
      if (res.ok) {
        toast.success(ru.common.createdOk);
        setFormOpen(false);
      } else toast.error(res.message ?? '');
    }
  }

  async function changeStatus(row: Row, next: PlanningStatus) {
    try {
      await update.mutateAsync({
        id: row.id,
        payload: { status: next },
        expectedVersion: row.version,
      });
      toast.success(ru.common.saved);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'business_id', header: 'ID', sortField: 'business_id', cell: (r) => (
          <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span>
        ) },
      { key: 'title', header: ru.common.title, sortField: 'title', cell: (r) => (
          <span className="font-medium text-foreground">{r.title}</span>
        ) },
      { key: 'status', header: ru.common.status, cell: (r) => (
          <StatusControl
            config={planningStatus}
            status={r.status}
            canChange
            onChange={(next) => changeStatus(r, next)}
          />
        ) },
      { key: 'priority', header: ru.common.priority, cell: (r) => <PriorityBadge priority={r.priority} /> },
      { key: 'target', header: ru.planning.targetFinish, sortField: 'target_finish_date', cell: (r) => (
          <span className="text-sm text-muted-foreground">{formatDate(r.target_finish_date)}</span>
        ) },
      { key: 'progress', header: ru.common.progress, cell: (r) => `${r.progress}%` },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const actions: RowAction<Row>[] = [
    { key: 'details', label: ru.common.details, icon: Eye, onSelect: (r) => setDetailsItem(r) },
    { key: 'edit', label: ru.common.edit, icon: Pencil, onSelect: (r) => { setEditing(r); setFormOpen(true); } },
    {
      key: 'archive',
      label: ru.common.archive,
      icon: Archive,
      separatorBefore: true,
      hidden: (r) => r.is_archived,
      onSelect: (r) => setConfirm({ kind: 'archive', row: r }),
    },
    {
      key: 'restore',
      label: ru.common.restore,
      icon: RotateCcw,
      separatorBefore: true,
      hidden: (r) => !r.is_archived,
      onSelect: (r) => restore.mutateAsync(r.id).then(() => toast.success(ru.common.restored)),
    },
    { key: 'delete', label: ru.common.delete, icon: Trash2, destructive: true, onSelect: (r) => setConfirm({ kind: 'delete', row: r }) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.planning.title}
        description={ru.planning.subtitle}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            {ru.planning.create}
          </Button>
        }
      />

      <DataTableToolbar
        search={controller.search}
        onSearchChange={controller.setSearch}
        filters={
          <div className="w-56">
            <Select
              value={statusFilter || undefined}
              onValueChange={(v) => { setStatusFilter(v); controller.setPage(1); }}
              options={[{ value: '', label: ru.common.all }, ...statusSelectOptions(planningStatus)]}
              placeholder={ru.common.status}
            />
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={controller.query.isLoading}
        onRowClick={(r) => setDetailsItem(r)}
        actions={actions}
        sort={controller.sort}
        onSortChange={controller.setSort}
        emptyIcon={GanttChartSquare}
        emptyTitle={ru.planning.empty}
        emptyDescription={ru.planning.emptyHint}
      />

      <DataTablePagination page={controller.page} data={controller.query.data} onPageChange={controller.setPage} />

      <PlanningForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        submitting={create.isPending || update.isPending}
        onSubmit={submitForm}
      />

      <PlanningDetails open={!!detailsItem} onOpenChange={(o) => !o && setDetailsItem(null)} item={detailsItem} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.kind === 'delete' ? ru.common.delete : ru.common.archive}
        description={confirm?.row.title}
        destructive={confirm?.kind === 'delete'}
        confirmLabel={confirm?.kind === 'delete' ? ru.common.delete : ru.common.archive}
        loading={archive.isPending || softDelete.isPending}
        onConfirm={async () => {
          if (!confirm) return;
          try {
            if (confirm.kind === 'delete') {
              await softDelete.mutateAsync(confirm.row.id);
              toast.success(ru.common.deleted);
            } else {
              await archive.mutateAsync(confirm.row.id);
              toast.success(ru.common.archived);
            }
            setConfirm(null);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}
