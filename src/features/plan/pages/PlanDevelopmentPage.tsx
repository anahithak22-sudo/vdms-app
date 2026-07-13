import { useMemo, useState } from 'react';
import { Plus, Columns3, GanttChartSquare, KanbanSquare, Loader2, Upload } from 'lucide-react';
import { PageHeader, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/constants/roles';
import { exportToExcel } from '@/lib/export-excel';
import { formatDate } from '@/lib/format';
import { usePlanTasks, usePlanStatuses, usePlanTags, usePlanMutations } from '../hooks';
import { ProgressSummary } from '../components/ProgressSummary';
import { PlanBoard } from '../components/PlanBoard';
import { PlanGantt } from '../components/PlanGantt';
import { TaskModal, type TaskFormValues } from '../components/TaskModal';
import { StatusManager } from '../components/StatusManager';
import type { PlanTask, PlanTag, PlanView } from '../types';
import { ru } from '@/locales/ru';

export default function PlanDevelopmentPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data: tasks, isLoading: loadingTasks } = usePlanTasks();
  const { data: statuses, isLoading: loadingStatuses } = usePlanStatuses();
  const { data: tags } = usePlanTags();
  const m = usePlanMutations();

  const [view, setView] = useState<PlanView>('gantt');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanTask | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanTask | null>(null);

  const taskList = useMemo(() => tasks ?? [], [tasks]);
  const statusList = useMemo(() => statuses ?? [], [statuses]);
  const tagList = useMemo(() => tags ?? [], [tags]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(task: PlanTask) {
    setEditing(task);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function exportTasks() {
    const statusName = (id: string) => statusList.find((s) => s.id === id)?.name ?? '';
    const tagLabel = (ids: string[]) => ids.map((id) => tagList.find((t) => t.id === id)?.label).filter(Boolean).join(', ');
    exportToExcel('plan_razvitiya', ru.plan.title, taskList.map((t) => ({
      [ru.plan.taskTitle]: t.title,
      [ru.plan.description]: t.description ?? '',
      [ru.plan.status]: statusName(t.status_id),
      [ru.plan.priority]: t.priority,
      [ru.plan.startDate]: t.start_date ? formatDate(t.start_date) : '',
      [ru.plan.endDate]: t.end_date ? formatDate(t.end_date) : '',
      [ru.plan.tags]: tagLabel(t.tagIds),
    })));
  }

  async function createTag(label: string): Promise<PlanTag | null> {
    const existing = tagList.find((t) => t.label.toLowerCase() === label.trim().toLowerCase());
    if (existing) return existing;
    const res = await m.createTag.mutateAsync({ label: label.trim(), color: '#334155' });
    return res.success && res.data ? (res.data as PlanTag) : null;
  }

  async function submitForm(values: TaskFormValues, tagIds: string[]) {
    if (editing) {
      const res = await m.updateTask.mutateAsync({
        id: editing.id,
        payload: values,
        expectedVersion: editing.version,
      });
      if (!res.success) {
        toast.error(res.message ?? 'Ошибка');
        return;
      }
      const tagRes = await m.setTags.mutateAsync({ taskId: editing.id, tagIds });
      if (!tagRes.success) {
        toast.error(tagRes.message ?? 'Ошибка сохранения тегов');
        return;
      }
      toast.success(ru.plan.savedOk);
      closeModal();
    } else {
      const res = await m.createTask.mutateAsync(values as unknown as Record<string, unknown>);
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Ошибка');
        return;
      }
      const created = res.data as PlanTask;
      if (tagIds.length) {
        const tagRes = await m.setTags.mutateAsync({ taskId: created.id, tagIds });
        if (!tagRes.success) {
          toast.error(tagRes.message ?? 'Ошибка сохранения тегов');
          return;
        }
      }
      toast.success(ru.plan.createdOk);
      closeModal();
    }
  }

  async function moveTask(task: PlanTask, statusId: string) {
    await m.setStatus.mutateAsync({ taskId: task.id, statusId });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await m.deleteTask.mutateAsync(deleteTarget.id);
    if (toast.fromResult(res, ru.plan.deletedOk)) {
      setDeleteTarget(null);
      closeModal();
    }
  }

  const loading = loadingTasks || loadingStatuses;

  return (
    <div className="space-y-5">
      <PageHeader
        title={ru.plan.title}
        description={ru.plan.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportTasks}>
              <Upload className="h-4 w-4" />
              {ru.common.exportExcel}
            </Button>
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setColumnsOpen(true)}>
                <Columns3 className="h-4 w-4" />
                {ru.plan.manageColumns}
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {ru.plan.newTask}
            </Button>
          </div>
        }
      />

      <ProgressSummary tasks={taskList} statuses={statusList} />

      <div className="inline-flex rounded-md border border-border p-0.5">
        <button
          type="button"
          onClick={() => setView('gantt')}
          className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'gantt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          <GanttChartSquare className="h-4 w-4" />
          {ru.plan.gantt}
        </button>
        <button
          type="button"
          onClick={() => setView('kanban')}
          className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          <KanbanSquare className="h-4 w-4" />
          {ru.plan.kanban}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === 'gantt' ? (
        <PlanGantt tasks={taskList} statuses={statusList} onSelect={openEdit} />
      ) : (
        <PlanBoard
          tasks={taskList}
          statuses={statusList}
          tags={tagList}
          onSelect={openEdit}
          onMove={moveTask}
        />
      )}

      {modalOpen && (
        <TaskModal
          key={editing?.id ?? 'new'}
          open={modalOpen}
          task={editing}
          statuses={statusList}
          tags={tagList}
          submitting={m.createTask.isPending || m.updateTask.isPending}
          onClose={closeModal}
          onCreateTag={createTag}
          onSubmit={submitForm}
          onDelete={setDeleteTarget}
        />
      )}

      {isSuperAdmin && (
        <StatusManager open={columnsOpen} onOpenChange={setColumnsOpen} statuses={statusList} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={ru.plan.confirmDeleteTaskTitle}
        description={ru.plan.confirmDeleteTask}
        confirmLabel={ru.plan.delete}
        destructive
        loading={m.deleteTask.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
