import { useMemo, useState } from 'react';
import { Plus, Map as MapIcon, LayoutGrid, Table2 } from 'lucide-react';
import { PageHeader, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { StatusControl, PriorityBadge } from '@/components/common/StatusControl';
import { DataTable, type Column } from '@/components/data/DataTable';
import { DataTableToolbar, DataTablePagination } from '@/components/data/DataTableControls';
import { standardRowActions } from '@/components/data/rowActions';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useListController } from '@/hooks/useListController';
import { useCrudController, emptyToNull } from '@/hooks/useCrudController';
import { useAuth } from '@/hooks/useAuth';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import { roadmapService } from '@/features/roadmap/service';
import { roadmapHooks } from '@/features/roadmap/hooks';
import { roadmapStatus } from '@/features/roadmap/status';
import { RoadmapForm } from '@/features/roadmap/components/RoadmapForm';
import { RoadmapDetails } from '@/features/roadmap/components/RoadmapDetails';
import { RoadmapBoard } from '@/features/roadmap/components/RoadmapBoard';
import { statusSelectOptions } from '@/lib/status';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/constants/roles';
import type { Tables } from '@/lib/supabase/types';
import type { FilterSpec } from '@/lib/query/list-params';
import { useQuery } from '@tanstack/react-query';
import { ru } from '@/locales/ru';

type Row = Tables<'roadmap_items'>;

export default function RoadmapPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.MANAGER;
  const canEditRow = (r: Row) =>
    canManage || (role === ROLES.DEVELOPER && r.assigned_developer_id === user?.id);

  const [view, setView] = useState<'table' | 'board'>('table');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: users } = useAssignableUsers();

  const crud = useCrudController<Row>(roadmapHooks);

  const controller = useListController<Row>({
    keyBase: ['roadmap_items'],
    getList: (params) => {
      const filters: FilterSpec[] = statusFilter
        ? [{ field: 'status', operator: 'eq', value: statusFilter }]
        : [];
      return roadmapService.getList({ ...params, filters });
    },
    defaultSort: { field: 'updated_at', direction: 'desc' },
  });

  // Board needs the full set (not a single page).
  const boardQuery = useQuery({
    queryKey: ['roadmap_items', 'board', statusFilter],
    queryFn: async () => {
      const res = await roadmapService.getList({
        pageSize: 200,
        filters: statusFilter ? [{ field: 'status', operator: 'eq', value: statusFilter }] : undefined,
      });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data.items;
    },
    enabled: view === 'board',
  });

  const rows = controller.query.data?.items ?? [];

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'business_id', header: 'ID', sortField: 'business_id',
        cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
      { key: 'title', header: ru.common.title, sortField: 'title',
        cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
      { key: 'status', header: ru.common.status,
        cell: (r) => (
          <StatusControl config={roadmapStatus} status={r.status} canChange={canEditRow(r)}
            onChange={(next) => crud.changeStatus(r, { status: next })} />
        ) },
      { key: 'priority', header: ru.common.priority, cell: (r) => <PriorityBadge priority={r.priority} /> },
      { key: 'dev', header: ru.roadmap.developer,
        cell: (r) => <span className="text-sm">{userNameOf(users, r.assigned_developer_id)}</span> },
      { key: 'due', header: ru.common.dueDate, sortField: 'due_date',
        cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.due_date)}</span> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, role],
  );

  const actions = standardRowActions<Row>({
    onDetails: crud.setDetailsItem,
    onEdit: crud.openEdit,
    canEdit: canEditRow,
    canManage: () => canManage,
    onArchive: canManage ? (r) => crud.setConfirm({ kind: 'archive', row: r }) : undefined,
    onRestore: canManage ? crud.runRestore : undefined,
    onDelete: canManage ? (r) => crud.setConfirm({ kind: 'delete', row: r }) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.roadmap.title}
        description={ru.roadmap.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm"
                onClick={() => setView('table')} className="h-8 gap-1">
                <Table2 className="h-4 w-4" /> {ru.roadmap.tableView}
              </Button>
              <Button variant={view === 'board' ? 'secondary' : 'ghost'} size="sm"
                onClick={() => setView('board')} className="h-8 gap-1">
                <LayoutGrid className="h-4 w-4" /> {ru.roadmap.boardView}
              </Button>
            </div>
            {canManage && (
              <Button onClick={crud.openCreate}>
                <Plus className="h-4 w-4" /> {ru.roadmap.create}
              </Button>
            )}
          </div>
        }
      />

      <DataTableToolbar
        search={controller.search}
        onSearchChange={controller.setSearch}
        filters={
          <div className="w-56">
            <Select value={statusFilter || undefined}
              onValueChange={(v) => { setStatusFilter(v); controller.setPage(1); }}
              options={[{ value: '', label: ru.common.all }, ...statusSelectOptions(roadmapStatus)]}
              placeholder={ru.common.status} />
          </div>
        }
      />

      {view === 'table' ? (
        <>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
            loading={controller.query.isLoading} onRowClick={crud.setDetailsItem} actions={actions}
            sort={controller.sort} onSortChange={controller.setSort}
            emptyIcon={MapIcon} emptyTitle={ru.roadmap.empty} />
          <DataTablePagination page={controller.page} data={controller.query.data} onPageChange={controller.setPage} />
        </>
      ) : (
        <RoadmapBoard
          items={boardQuery.data ?? []}
          onOpen={crud.setDetailsItem}
          onMove={(row, next) => canEditRow(row) && crud.changeStatus(row, { status: next })}
        />
      )}

      <RoadmapForm open={crud.formOpen} onOpenChange={crud.setFormOpen} initial={crud.editing}
        submitting={crud.submitting} onSubmit={(v) => crud.submit(emptyToNull(v))} />
      <RoadmapDetails open={!!crud.detailsItem} onOpenChange={(o) => !o && crud.setDetailsItem(null)}
        item={crud.detailsItem} />

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
