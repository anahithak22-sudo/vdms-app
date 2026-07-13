import { useMemo, useState, useEffect } from 'react';
import { Plus, CalendarRange, CalendarPlus, LayoutGrid, Table2 } from 'lucide-react';
import { PageHeader, ConfirmDialog, EmptyState } from '@/components/common/DisplayPrimitives';
import { StatusControl, PriorityBadge } from '@/components/common/StatusControl';
import { DataTable, type Column } from '@/components/data/DataTable';
import { standardRowActions } from '@/components/data/rowActions';
import { WeeklyBoard } from '@/features/weekly/components/WeeklyBoard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useCrudController, emptyToNull } from '@/hooks/useCrudController';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import {
  weeklyTaskHooks, weekHooks, useWeeks, useWeekTasks, useWeeklyStatusMutation,
} from '@/features/weekly/hooks';
import { weeklyStatus } from '@/features/weekly/status';
import { WeeklyTaskForm, CreateWeekDialog } from '@/features/weekly/components/WeeklyTaskForm';
import { WeeklyDetails } from '@/features/weekly/components/WeeklyDetails';
import type { WeeklyTaskFormValues, WeekFormValues } from '@/features/weekly/validators';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/constants/roles';
import type { Tables, WeeklyTaskStatus } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

type Row = Tables<'weekly_tasks'>;

export default function WeeklyPlanningPage() {
  const toast = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.MANAGER;
  const canChangeStatus = (r: Row) => canManage || r.assigned_user_id === user?.id;

  const [weekId, setWeekId] = useState<string>('');
  const [view, setView] = useState<'table' | 'board'>('board');
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);

  const { data: weeks } = useWeeks();
  const { data: users } = useAssignableUsers();
  const tasksQuery = useWeekTasks(weekId || undefined);
  const statusMutation = useWeeklyStatusMutation();
  const createWeek = weekHooks.useCreate();
  const crud = useCrudController<Row>(weeklyTaskHooks);

  // Default to the most recent week once loaded.
  useEffect(() => {
    if (!weekId && weeks && weeks.length > 0) setWeekId(weeks[0].id);
  }, [weeks, weekId]);

  const weekOptions = useMemo(
    () => (weeks ?? []).map((w) => ({ value: w.id, label: ru.weekly.weekLabel(w.week_number, w.year) })),
    [weeks],
  );

  const tasks = tasksQuery.data ?? [];

  async function changeStatus(row: Row, next: WeeklyTaskStatus) {
    const res = await statusMutation.mutateAsync({ taskId: row.id, status: next });
    if (res.success) toast.success(ru.common.saved);
    else toast.error(res.message ?? '');
  }

  async function submitTask(values: WeeklyTaskFormValues) {
    const base = emptyToNull(values) as Record<string, unknown>;
    const payload = crud.editing ? base : { ...base, week_id: weekId };
    await crud.submit(payload);
  }

  async function submitWeek(values: WeekFormValues) {
    try {
      await createWeek.mutateAsync(values);
      toast.success(ru.common.createdOk);
      setWeekDialogOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: 'business_id', header: 'ID',
        cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
      { key: 'title', header: ru.common.title,
        cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
      { key: 'status', header: ru.common.status,
        cell: (r) => (
          <StatusControl config={weeklyStatus} status={r.status} canChange={canChangeStatus(r)}
            onChange={(next) => changeStatus(r, next)} />
        ) },
      { key: 'priority', header: ru.common.priority, cell: (r) => <PriorityBadge priority={r.priority} /> },
      { key: 'assignee', header: ru.weekly.assignee,
        cell: (r) => <span className="text-sm">{userNameOf(users, r.assigned_user_id)}</span> },
      { key: 'due', header: ru.common.dueDate,
        cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.due_date)}</span> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, role],
  );

  const actions = standardRowActions<Row>({
    onDetails: crud.setDetailsItem,
    onEdit: canManage ? crud.openEdit : undefined,
    canEdit: () => canManage,
    canManage: () => canManage,
    onArchive: canManage ? (r) => crud.setConfirm({ kind: 'archive', row: r }) : undefined,
    onRestore: canManage ? crud.runRestore : undefined,
    onDelete: canManage ? (r) => crud.setConfirm({ kind: 'delete', row: r }) : undefined,
  });

  const hasWeeks = (weeks?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.weekly.title}
        description={ru.weekly.subtitle}
        actions={
          <div className="flex items-center gap-2">
            {hasWeeks && (
              <div className="flex rounded-md border border-border p-0.5">
                <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm"
                  onClick={() => setView('table')} className="h-8 gap-1">
                  <Table2 className="h-4 w-4" /> {ru.weekly.tableView}
                </Button>
                <Button variant={view === 'board' ? 'secondary' : 'ghost'} size="sm"
                  onClick={() => setView('board')} className="h-8 gap-1">
                  <LayoutGrid className="h-4 w-4" /> {ru.weekly.boardView}
                </Button>
              </div>
            )}
            {canManage && (
              <Button variant="outline" onClick={() => setWeekDialogOpen(true)}>
                <CalendarPlus className="h-4 w-4" /> {ru.weekly.createWeek}
              </Button>
            )}
            {canManage && hasWeeks && (
              <Button onClick={crud.openCreate} disabled={!weekId}>
                <Plus className="h-4 w-4" /> {ru.weekly.create}
              </Button>
            )}
          </div>
        }
      />

      {!hasWeeks ? (
        <EmptyState icon={CalendarRange} title={ru.weekly.noWeek} description={ru.weekly.noWeekHint}
          action={canManage ? (
            <Button onClick={() => setWeekDialogOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> {ru.weekly.createWeek}
            </Button>
          ) : undefined} />
      ) : (
        <>
          <div className="w-64">
            <Select value={weekId || undefined} onValueChange={setWeekId}
              options={weekOptions} placeholder={ru.weekly.selectWeek} />
          </div>

          {view === 'table' ? (
            <DataTable columns={columns} rows={tasks} rowKey={(r) => r.id}
              loading={tasksQuery.isLoading} onRowClick={crud.setDetailsItem} actions={actions}
              emptyIcon={CalendarRange} emptyTitle={ru.weekly.empty} />
          ) : (
            <WeeklyBoard items={tasks} onOpen={crud.setDetailsItem}
              canMove={canChangeStatus} onMove={changeStatus} />
          )}
        </>
      )}

      <WeeklyTaskForm open={crud.formOpen} onOpenChange={crud.setFormOpen} initial={crud.editing}
        submitting={crud.submitting} onSubmit={submitTask} />
      <CreateWeekDialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}
        submitting={createWeek.isPending} onSubmit={submitWeek} />
      <WeeklyDetails open={!!crud.detailsItem} onOpenChange={(o) => !o && crud.setDetailsItem(null)}
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
