import { useMemo, useState } from 'react';
import { Plus, Columns3, GanttChartSquare, KanbanSquare, Loader2, Upload } from 'lucide-react';
import { PageHeader, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/constants/roles';
import { exportToExcel } from '@/lib/export-excel';
import { formatDate } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import { useRdevTasks, useRdevStatuses, useRdevTags, useRdevMutations } from '../hooks';
import { ProgressSummary } from '../components/ProgressSummary';
import { RdevBoard } from '../components/RdevBoard';
import { RdevGantt } from '../components/RdevGantt';
import { TaskModal, type TaskFormValues } from '../components/TaskModal';
import { StatusManager } from '../components/StatusManager';
import type { RdevTask, RdevTag, RdevView } from '../types';
import { ru } from '@/locales/ru';

export default function RoadmapDevPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data: tasks, isLoading: loadingTasks } = useRdevTasks();
  const { data: statuses, isLoading: loadingStatuses } = useRdevStatuses();
  const { data: tags } = useRdevTags();
  const { data: users } = useAssignableUsers();
  const m = useRdevMutations();

  const [view, setView] = useState<RdevView>('gantt');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RdevTask | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RdevTask | null>(null);

  const taskList = useMemo(() => tasks ?? [], [tasks]);
  const statusList = useMemo(() => statuses ?? [], [statuses]);
  const tagList = useMemo(() => tags ?? [], [tags]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(task: RdevTask) {
    setEditing(task);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function exportTasks() {
    const statusName = (id: string) => statusList.find((s) => s.id === id)?.name ?? '';
    const delay = (t: { end_date: string | null; planned_end: string | null }) => {
      if (!t.end_date || !t.planned_end) return 0;
      const d = Math.round((new Date(t.end_date).getTime() - new Date(t.planned_end).getTime()) / 86400000);
      return d > 0 ? d : 0;
    };
    exportToExcel('roadmap_razrabotki', ru.rdev.title, taskList.map((t) => ({
      [ru.rdev.taskTitle]: t.title,
      [ru.rdev.description]: t.description ?? '',
      [ru.rdev.status]: statusName(t.status_id),
      [ru.rdev.priority]: t.priority,
      [ru.rdev.assignee]: userNameOf(users, t.assignee_id),
      [ru.rdev.startDate]: t.start_date ? formatDate(t.start_date) : '',
      [ru.rdev.endDate]: t.end_date ? formatDate(t.end_date) : '',
      [ru.rdev.delay]: delay(t),
    })));
  }

  async function createTag(label: string): Promise<RdevTag | null> {
    const existing = tagList.find((t) => t.label.toLowerCase() === label.trim().toLowerCase());
    if (existing) return existing;
    const res = await m.createTag.mutateAsync({ label: label.trim(), color: '#334155' });
    return res.success && res.data ? (res.data as RdevTag) : null;
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
      toast.success(ru.rdev.savedOk);
      closeModal();
    } else {
      const res = await m.createTask.mutateAsync(values as unknown as Record<string, unknown>);
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Ошибка');
        return;
      }
      const created = res.data as RdevTask;
      if (tagIds.length) {
        const tagRes = await m.setTags.mutateAsync({ taskId: created.id, tagIds });
        if (!tagRes.success) {
          toast.error(tagRes.message ?? 'Ошибка сохранения тегов');
          return;
        }
      }
      toast.success(ru.rdev.createdOk);
      closeModal();
    }
  }

  async function moveTask(task: RdevTask, statusId: string) {
    await m.setStatus.mutateAsync({ taskId: task.id, statusId });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await m.deleteTask.mutateAsync(deleteTarget.id);
    if (toast.fromResult(res, ru.rdev.deletedOk)) {
      setDeleteTarget(null);
      closeModal();
    }
  }

  const loading = loadingTasks || loadingStatuses;

  return (
    <div className="space-y-5">
      <PageHeader
        title={ru.rdev.title}
        description={ru.rdev.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportTasks}>
              <Upload className="h-4 w-4" />
              {ru.common.exportExcel}
            </Button>
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setColumnsOpen(true)}>
                <Columns3 className="h-4 w-4" />
                {ru.rdev.manageColumns}
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {ru.rdev.newTask}
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
          {ru.rdev.gantt}
        </button>
        <button
          type="button"
          onClick={() => setView('kanban')}
          className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          <KanbanSquare className="h-4 w-4" />
          {ru.rdev.kanban}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === 'gantt' ? (
        <RdevGantt tasks={taskList} statuses={statusList} onSelect={openEdit} />
      ) : (
        <RdevBoard
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
        title={ru.rdev.confirmDeleteTaskTitle}
        description={ru.rdev.confirmDeleteTask}
        confirmLabel={ru.rdev.delete}
        destructive
        loading={m.deleteTask.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
