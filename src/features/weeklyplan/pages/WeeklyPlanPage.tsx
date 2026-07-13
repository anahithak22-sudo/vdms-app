import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, CalendarDays, Upload } from 'lucide-react';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/constants/roles';
import { useAssignableUsers, userOptions, userNameOf } from '@/hooks/useDirectory';
import { currentWeek, nextWeek, prevWeek, type WeekRef } from '@/lib/week';
import { formatDate } from '@/lib/format';
import { exportToExcel } from '@/lib/export-excel';
import { useWeekTasks, useWeeklyMutations } from '../hooks';
import type { WpTask } from '../service';
import { ru } from '@/locales/ru';

export default function WeeklyPlanPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

  const [week, setWeek] = useState<WeekRef>(currentWeek());
  const { data: users } = useAssignableUsers();
  const { data: tasks, isLoading } = useWeekTasks(week.year, week.week);
  const m = useWeeklyMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WpTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WpTask | null>(null);

  const rows = useMemo(() => tasks ?? [], [tasks]);

  function canToggle(t: WpTask): boolean {
    return isAdmin || t.assignee_id === user?.id;
  }

  async function toggle(t: WpTask) {
    if (!canToggle(t)) {
      toast.error(ru.weekly.onlyOwn);
      return;
    }
    await m.toggleDone.mutateAsync({ id: t.id, done: !t.is_done });
  }

  return (
    <div className="space-y-5">
      <PageHeader title={ru.weekly.title} description={ru.weekly.subtitle} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeek(prevWeek(week))} aria-label={ru.weekly.prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-foreground">
            {week.tag} · {week.year}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeek(nextWeek(week))} aria-label={ru.weekly.nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeek(currentWeek())}>
            {ru.weekly.currentWeek}
          </Button>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() =>
              exportToExcel(`weekly_${week.tag}`, ru.weekly.title, rows.map((t) => ({
                [ru.weekly.who]: userNameOf(users, t.assignee_id),
                [ru.weekly.what]: t.title,
                [ru.weekly.when]: t.due_date ? formatDate(t.due_date) : '',
                [ru.weekly.done]: t.is_done ? '✓' : '',
              })))
            }>
              <Upload className="h-4 w-4" />
              {ru.common.exportExcel}
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              {ru.weekly.add}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{ru.common.loading}</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title={ru.weekly.empty} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                checked={t.is_done}
                disabled={!canToggle(t)}
                onChange={() => toggle(t)}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${t.is_done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userNameOf(users, t.assignee_id)}
                  {t.due_date && <> · {formatDate(t.due_date)}</>}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(t); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <WeeklyForm week={week} editing={editing} users={userOptions(users)} onClose={() => setFormOpen(false)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={ru.weekly.confirmDeleteTitle}
        description={ru.weekly.confirmDelete}
        confirmLabel={ru.weekly.delete}
        destructive
        loading={m.remove.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (toast.fromResult(await m.remove.mutateAsync(deleteTarget.id), ru.weekly.deletedOk)) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function WeeklyForm({
  week, editing, users, onClose,
}: {
  week: WeekRef;
  editing: WpTask | null;
  users: { value: string; label: string }[];
  onClose: () => void;
}) {
  const toast = useToast();
  const m = useWeeklyMutations();
  const [assignee, setAssignee] = useState(editing?.assignee_id ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [due, setDue] = useState(editing?.due_date ?? '');
  const [error, setError] = useState<string | undefined>();

  const assigneeOptions = [{ value: '', label: ru.weekly.assignee }, ...users];

  async function submit() {
    if (title.trim().length < 2) {
      setError(ru.common.required);
      return;
    }
    if (editing) {
      const res = await m.update.mutateAsync({
        id: editing.id,
        patch: { assignee_id: assignee || null, title: title.trim(), due_date: due || null },
      });
      if (toast.fromResult(res, ru.weekly.savedOk)) onClose();
    } else {
      const res = await m.create.mutateAsync({
        week_tag: week.tag,
        week_year: week.year,
        week_number: week.week,
        assignee_id: assignee || null,
        title: title.trim(),
        due_date: due || null,
      });
      if (toast.fromResult(res, ru.weekly.createdOk)) onClose();
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={editing ? ru.weekly.edit : ru.weekly.add}
      description={`${week.tag} · ${week.year}`}
      onSubmit={submit}
      submitting={m.create.isPending || m.update.isPending}
    >
      <Field label={ru.weekly.what} required error={error}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <FieldGrid>
        <Field label={ru.weekly.who}>
          <Select value={assignee} onValueChange={setAssignee} options={assigneeOptions} />
        </Field>
        <Field label={ru.weekly.when}>
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}
