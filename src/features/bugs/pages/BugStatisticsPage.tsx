import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Bug as BugIcon } from 'lucide-react';
import { PageHeader, ConfirmDialog, StatusBadge } from '@/components/common/DisplayPrimitives';
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
import { bugService } from '@/features/bugs/service';
import { bugHooks } from '@/features/bugs/hooks';
import { bugStatus } from '@/features/bugs/status';
import { BugForm } from '@/features/bugs/components/BugForm';
import { BugDetails } from '@/features/bugs/components/BugDetails';
import { BugStats } from '@/features/bugs/components/BugStats';
import { statusSelectOptions } from '@/lib/status';
import { SEVERITY_OPTIONS, SEVERITY_LABELS } from '@/constants/options';
import { ROLES } from '@/constants/roles';
import type { Tables } from '@/lib/supabase/types';
import type { FilterSpec } from '@/lib/query/list-params';
import { ru } from '@/locales/ru';

type Row = Tables<'bugs'>;

export default function BugStatisticsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.MANAGER;
  const canEditRow = (r: Row) =>
    canManage || (role === ROLES.DEVELOPER && r.assigned_developer_id === user?.id);

  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const { data: users } = useAssignableUsers();
  const crud = useCrudController<Row>(bugHooks);

  const filters = useMemo<FilterSpec[]>(() => {
    const f: FilterSpec[] = [];
    if (statusFilter) f.push({ field: 'status', operator: 'eq', value: statusFilter });
    if (severityFilter) f.push({ field: 'severity', operator: 'eq', value: severityFilter });
    return f;
  }, [statusFilter, severityFilter]);

  const controller = useListController<Row>({
    keyBase: ['bugs'],
    getList: (params) => bugService.getList({ ...params, filters }),
    defaultSort: { field: 'updated_at', direction: 'desc' },
  });

  // Aggregate dataset for the statistics panel.
  const statsQuery = useQuery({
    queryKey: ['bugs', 'stats'],
    queryFn: async () => {
      const res = await bugService.getList({ pageSize: 1000 });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка');
      return res.data.items;
    },
  });

  const rows = controller.query.data?.items ?? [];

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'business_id', header: 'ID', sortField: 'business_id',
        cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
      { key: 'title', header: ru.common.title, sortField: 'title',
        cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
      { key: 'severity', header: ru.bugs.severity,
        cell: (r) => (
          <StatusBadge label={SEVERITY_LABELS[r.severity]}
            tone={r.severity === 'critical' ? 'danger' : r.severity === 'major' ? 'warning' : 'neutral'} />
        ) },
      { key: 'status', header: ru.common.status,
        cell: (r) => (
          <StatusControl config={bugStatus} status={r.status} canChange={canEditRow(r)}
            onChange={(next) => crud.changeStatus(r, { status: next })} />
        ) },
      { key: 'priority', header: ru.common.priority, cell: (r) => <PriorityBadge priority={r.priority} /> },
      { key: 'dev', header: ru.bugs.developer,
        cell: (r) => <span className="text-sm">{userNameOf(users, r.assigned_developer_id)}</span> },
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
        title={ru.bugs.title}
        description={ru.bugs.subtitle}
        actions={
          canManage && (
            <Button onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> {ru.bugs.create}
            </Button>
          )
        }
      />

      <BugStats bugs={statsQuery.data ?? []} />

      <DataTableToolbar
        search={controller.search}
        onSearchChange={controller.setSearch}
        filters={
          <>
            <div className="w-48">
              <Select value={statusFilter || undefined}
                onValueChange={(v) => { setStatusFilter(v); controller.setPage(1); }}
                options={[{ value: '', label: ru.common.all }, ...statusSelectOptions(bugStatus)]}
                placeholder={ru.common.status} />
            </div>
            <div className="w-44">
              <Select value={severityFilter || undefined}
                onValueChange={(v) => { setSeverityFilter(v); controller.setPage(1); }}
                options={[{ value: '', label: ru.common.all }, ...SEVERITY_OPTIONS]}
                placeholder={ru.bugs.severity} />
            </div>
          </>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
        loading={controller.query.isLoading} onRowClick={crud.setDetailsItem} actions={actions}
        sort={controller.sort} onSortChange={controller.setSort}
        emptyIcon={BugIcon} emptyTitle={ru.bugs.empty} />
      <DataTablePagination page={controller.page} data={controller.query.data} onPageChange={controller.setPage} />

      <BugForm open={crud.formOpen} onOpenChange={crud.setFormOpen} initial={crud.editing}
        submitting={crud.submitting} onSubmit={(v) => crud.submit(emptyToNull(v))} />
      <BugDetails open={!!crud.detailsItem} onOpenChange={(o) => !o && crud.setDetailsItem(null)}
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
