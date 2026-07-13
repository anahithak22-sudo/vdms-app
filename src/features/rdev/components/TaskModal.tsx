import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Field, FieldGrid } from '@/components/common/FormDialog';
import { HistoryTab } from '@/components/common/DetailsDrawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PRIORITY_OPTIONS } from '@/constants/options';
import { toDateInputValue, formatDate } from '@/lib/format';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import { delayDays } from '../progress';
import { TagSelector } from './TagChips';
import { TaskComments } from './TaskComments';
import type { RdevStatus, RdevTag, RdevTask } from '../types';
import type { PriorityLevel } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export interface TaskFormValues {
  title: string;
  description: string | null;
  status_id: string;
  priority: PriorityLevel;
  assignee_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

export function TaskModal({
  open,
  task,
  statuses,
  tags,
  submitting,
  onClose,
  onCreateTag,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  task: RdevTask | null; // null → create
  statuses: RdevStatus[];
  tags: RdevTag[];
  submitting: boolean;
  onClose: () => void;
  onCreateTag: (label: string) => Promise<RdevTag | null>;
  onSubmit: (values: TaskFormValues, tagIds: string[]) => void;
  onDelete?: (task: RdevTask) => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [statusId, setStatusId] = useState(task?.status_id ?? statuses[0]?.id ?? '');
  const [priority, setPriority] = useState<PriorityLevel>(task?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(toDateInputValue(task?.start_date ?? null));
  const [endDate, setEndDate] = useState(toDateInputValue(task?.end_date ?? null));
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id ?? '');
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? []);
  const [error, setError] = useState<string | undefined>();

  const { data: users } = useAssignableUsers();
  const assigneeOptions = [{ value: '', label: ru.rdev.noAssignee }, ...userOptions(users)];
  const currentDelay = task ? delayDays(task) : 0;

  const statusOptions = statuses.map((s) => ({ value: s.id, label: s.name }));

  function toggleTag(id: string) {
    setTagIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  async function createTag(label: string) {
    const created = await onCreateTag(label);
    if (created) setTagIds((p) => (p.includes(created.id) ? p : [...p, created.id]));
  }

  function submit() {
    if (title.trim().length < 2) {
      setError(ru.common.required);
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('Дата окончания раньше начала');
      return;
    }
    setError(undefined);
    onSubmit(
      {
        title: title.trim(),
        description: description.trim() || null,
        status_id: statusId,
        priority,
        assignee_id: assigneeId || null,
        start_date: startDate || null,
        end_date: endDate || null,
      },
      tagIds,
    );
  }

  const fields = (
    <div className="space-y-4">
      <Field label={ru.rdev.taskTitle} required error={error}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <Field label={ru.rdev.description}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </Field>
      <FieldGrid>
        <Field label={ru.rdev.status} required>
          <Select value={statusId} onValueChange={setStatusId} options={statusOptions} />
        </Field>
        <Field label={ru.rdev.priority} required>
          <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label={ru.rdev.startDate}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label={ru.rdev.endDate}>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label={ru.rdev.assignee}>
          <Select value={assigneeId} onValueChange={setAssigneeId} options={assigneeOptions} />
        </Field>
        {isEdit && task?.planned_end && (
          <Field label={ru.rdev.delay}>
            <div className={currentDelay > 0 ? 'text-sm font-medium text-destructive' : 'text-sm text-emerald-600'}>
              {currentDelay > 0 ? `${currentDelay} ${ru.rdev.delayDays}` : ru.rdev.onTime}
              <span className="ml-2 text-xs text-muted-foreground">
                ({ru.rdev.plannedEnd}: {formatDate(task.planned_end)})
              </span>
            </div>
          </Field>
        )}
      </FieldGrid>
      <Field label={ru.rdev.tags}>
        <TagSelector allTags={tags} selectedIds={tagIds} onToggle={toggleTag} onCreate={createTag} />
      </Field>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? ru.rdev.editTask : ru.rdev.newTask}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">{ru.rdev.editTask}</TabsTrigger>
              <TabsTrigger value="comments">{ru.rdev.comments}</TabsTrigger>
              <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">{fields}</TabsContent>
            <TabsContent value="comments">
              <TaskComments taskId={task.id} />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTab table="rdev_tasks" entityId={task.id} />
            </TabsContent>
          </Tabs>
        ) : (
          fields
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit && onDelete ? (
            <Button variant="outline" className="text-destructive" onClick={() => onDelete(task)}>
              <Trash2 className="h-4 w-4" />
              {ru.rdev.delete}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              {ru.common.cancel}
            </Button>
            <Button onClick={submit} loading={submitting}>
              {ru.common.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
