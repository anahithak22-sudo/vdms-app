import { useMemo, useState } from 'react';
import { Plus, ListChecks, CalendarPlus } from 'lucide-react';
import { PageHeader, ConfirmDialog, StatusBadge } from '@/components/common/DisplayPrimitives';
import { PriorityBadge } from '@/components/common/StatusControl';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { DataTableToolbar, DataTablePagination } from '@/components/data/DataTableControls';
import { standardRowActions } from '@/components/data/rowActions';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useListController } from '@/hooks/useListController';
import { useCrudController, emptyToNull } from '@/hooks/useCrudController';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { queueService } from '@/features/queue/service';
import { queueHooks, useSelectForWeek } from '@/features/queue/hooks';
import { useWeeks } from '@/features/weekly/hooks';
import { QueueForm, SelectForWeekDialog } from '@/features/queue/components/QueueForm';
import { QueueDetails } from '@/features/queue/components/QueueDetails';
import { READINESS_LABELS, READINESS_TONES } from '@/features/queue/readiness';
import { READINESS_OPTIONS } from '@/constants/options';
import { ROLES } from '@/constants/roles';
import type { Tables } from '@/lib/supabase/types';
import type { FilterSpec } from '@/lib/query/list-params';
import { ru } from '@/locales/ru';

type Row = Tables<'priority_queue'>;

export default function PriorityQueuePage() {
  const toast = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
  const canSelect = canManage || role === ROLES.MANAGER;

  const [readinessFilter, setReadinessFilter] = useState('');
  const [selectItem, setSelectItem] = useState<Row | null>(null);
  const { data: weeks } = useWeeks();
  const selectForWeek = useSelectForWeek();
  const crud = useCrudController<Row>(queueHooks);

  const controller = useListController<Row>({
    keyBase: ['priority_queue'],
    getList: (params) => {
      const filters: FilterSpec[] = readinessFilter
        ? [{ field: 'implementation_readiness', operator: 'eq', value: readinessFilter }]
        : [];
      return queueService.getList({ ...params, filters });
    },
    defaultSort: { field: 'priority', direction: 'asc' },
  });

  const rows = controller.query.data?.items ?? [];
  const weekOptions = (weeks ?? []).map((w) => ({
    value: w.id,
    label: ru.weekly.weekLabel(w.week_number, w.year),
  }));

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'external', header: ru.queue.externalId,
        cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.external_task_id ?? r.business_id}</span> },
      { key: 'title', header: ru.common.title, sortField: 'title',
        cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
      { key: 'priority', header: ru.common.priority, sortField: 'priority',
        cell: (r) => <PriorityBadge priority={r.priority} /> },
      { key: 'readiness', header: ru.queue.readiness,
        cell: (r) => (
          <StatusBadge label={READINESS_LABELS[r.implementation_readiness]}
            tone={READINESS_TONES[r.implementation_readiness]} />
        ) },
      { key: 'area', header: ru.planning.businessArea,
        cell: (r) => <span className="text-sm text-muted-foreground">{r.business_area ?? '—'}</span> },
      { key: 'source', header: ru.queue.source,
        cell: (r) => <span className="text-sm text-muted-foreground">{r.source_system}</span> },
    ],
    [],
  );

  // Base actions vary by role: managers get "select for week"; admins get CRUD.
  const actions: RowAction<Row>[] = [
    ...(canSelect
      ? [{
          key: 'select',
          label: ru.queue.selectForWeek,
          icon: CalendarPlus,
          onSelect: (r: Row) => setSelectItem(r),
        } as RowAction<Row>]
      : []),
    ...standardRowActions<Row>({
      onDetails: crud.setDetailsItem,
      onEdit: canManage ? crud.openEdit : undefined,
      canEdit: () => canManage,
      canManage: () => canManage,
      onArchive: canManage ? (r) => crud.setConfirm({ kind: 'archive', row: r }) : undefined,
      onRestore: canManage ? crud.runRestore : undefined,
      onDelete: canManage ? (r) => crud.setConfirm({ kind: 'delete', row: r }) : undefined,
    }),
  ];

  async function confirmSelect(weekId: string, assignee?: string) {
    if (!selectItem) return;
    const res = await selectForWeek.mutateAsync({ queueId: selectItem.id, weekId, assignee });
    if (res.success) {
      toast.success('Задача добавлена в план недели');
      setSelectItem(null);
    } else {
      toast.error(res.message ?? '');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.queue.title}
        description={ru.queue.subtitle}
        actions={
          canManage && (
            <Button onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> {ru.common.create}
            </Button>
          )
        }
      />

      {!canManage && (
        <p className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {ru.queue.readOnlyNote}
        </p>
      )}

      <DataTableToolbar
        search={controller.search}
        onSearchChange={controller.setSearch}
        filters={
          <div className="w-56">
            <Select value={readinessFilter || undefined}
              onValueChange={(v) => { setReadinessFilter(v); controller.setPage(1); }}
              options={[{ value: '', label: ru.common.all }, ...READINESS_OPTIONS]}
              placeholder={ru.queue.readiness} />
          </div>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={controller.query.isLoading} onRowClick={crud.setDetailsItem} actions={actions}
        sort={controller.sort} onSortChange={controller.setSort}
        emptyIcon={ListChecks} emptyTitle={ru.queue.empty} />
      <DataTablePagination page={controller.page} data={controller.query.data} onPageChange={controller.setPage} />

      <QueueForm open={crud.formOpen} onOpenChange={crud.setFormOpen} initial={crud.editing}
        submitting={crud.submitting} onSubmit={(v) => crud.submit(emptyToNull(v))} />
      <QueueDetails open={!!crud.detailsItem} onOpenChange={(o) => !o && crud.setDetailsItem(null)}
        item={crud.detailsItem} />
      <SelectForWeekDialog open={!!selectItem} onOpenChange={(o) => !o && setSelectItem(null)}
        weekOptions={weekOptions} submitting={selectForWeek.isPending} onConfirm={confirmSelect} />

      <ConfirmDialog
        open={!!crud.confirm}
        onOpenChange={(o) => !o && crud.setConfirm(null)}
        title={crud.confirm?.kind === 'delete' ? ru.common.delete : ru.common.archive}
        description={crud.confirm?.row.title}
        destructive={crud.confirm?.kind === 'delete'}
        confirmLabel={crud.confirm?.kind === 'delete' ? ru.common.delete : ru.common.archive}
        loading={crud.confirming}
        onConfirm={crud.runConfirm}
      />
    </div>
  );
}
