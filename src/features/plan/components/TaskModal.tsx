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
import { toDateInputValue } from '@/lib/format';
import { TagSelector } from './TagChips';
import { TaskComments } from './TaskComments';
import type { PlanStatus, PlanTag, PlanTask } from '../types';
import type { PriorityLevel } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

export interface TaskFormValues {
  title: string;
  description: string | null;
  status_id: string;
  priority: PriorityLevel;
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
  task: PlanTask | null; // null → create
  statuses: PlanStatus[];
  tags: PlanTag[];
  submitting: boolean;
  onClose: () => void;
  onCreateTag: (label: string) => Promise<PlanTag | null>;
  onSubmit: (values: TaskFormValues, tagIds: string[]) => void;
  onDelete?: (task: PlanTask) => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [statusId, setStatusId] = useState(task?.status_id ?? statuses[0]?.id ?? '');
  const [priority, setPriority] = useState<PriorityLevel>(task?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(toDateInputValue(task?.start_date ?? null));
  const [endDate, setEndDate] = useState(toDateInputValue(task?.end_date ?? null));
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? []);
  const [error, setError] = useState<string | undefined>();

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
        start_date: startDate || null,
        end_date: endDate || null,
      },
      tagIds,
    );
  }

  const fields = (
    <div className="space-y-4">
      <Field label={ru.plan.taskTitle} required error={error}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <Field label={ru.plan.description}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </Field>
      <FieldGrid>
        <Field label={ru.plan.status} required>
          <Select value={statusId} onValueChange={setStatusId} options={statusOptions} />
        </Field>
        <Field label={ru.plan.priority} required>
          <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label={ru.plan.startDate}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label={ru.plan.endDate}>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ru.plan.tags}>
        <TagSelector allTags={tags} selectedIds={tagIds} onToggle={toggleTag} onCreate={createTag} />
      </Field>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? ru.plan.editTask : ru.plan.newTask}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">{ru.plan.editTask}</TabsTrigger>
              <TabsTrigger value="comments">{ru.plan.comments}</TabsTrigger>
              <TabsTrigger value="history">{ru.common.history}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">{fields}</TabsContent>
            <TabsContent value="comments">
              <TaskComments taskId={task.id} />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTab table="plan_tasks" entityId={task.id} />
            </TabsContent>
          </Tabs>
        ) : (
          fields
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit && onDelete ? (
            <Button variant="outline" className="text-destructive" onClick={() => onDelete(task)}>
              <Trash2 className="h-4 w-4" />
              {ru.plan.delete}
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
