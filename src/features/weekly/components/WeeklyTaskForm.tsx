import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PRIORITY_OPTIONS } from '@/constants/options';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import {
  weeklyTaskFormSchema, weeklyTaskDefaults, type WeeklyTaskFormValues,
  weekFormSchema, type WeekFormValues,
} from '@/features/weekly/validators';
import type { Tables } from '@/lib/supabase/types';
import { toDateInputValue } from '@/lib/format';
import { ru } from '@/locales/ru';

interface TaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tables<'weekly_tasks'> | null;
  submitting?: boolean;
  onSubmit: (values: WeeklyTaskFormValues) => void;
}

export function WeeklyTaskForm({ open, onOpenChange, initial, submitting, onSubmit }: TaskProps) {
  const { data: users } = useAssignableUsers();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<WeeklyTaskFormValues>({
    resolver: zodResolver(weeklyTaskFormSchema),
    defaultValues: weeklyTaskDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            description: initial.description ?? '',
            assigned_user_id: initial.assigned_user_id ?? '',
            manager_id: initial.manager_id ?? '',
            roadmap_item_id: initial.roadmap_item_id ?? '',
            priority: initial.priority,
            estimated_hours: initial.estimated_hours ?? undefined,
            actual_hours: initial.actual_hours ?? undefined,
            remaining_hours: initial.remaining_hours ?? undefined,
            sprint_id: initial.sprint_id ?? '',
            release_id: initial.release_id ?? '',
            due_date: toDateInputValue(initial.due_date),
          }
        : weeklyTaskDefaults,
    );
  }, [open, initial, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? ru.weekly.editTitle : ru.weekly.createTitle}
      submitting={submitting}
      onSubmit={handleSubmit(onSubmit)}
      wide
    >
      <Field label={ru.common.title} required error={errors.title?.message}>
        <Input {...register('title')} />
      </Field>
      <Field label={ru.common.description} error={errors.description?.message}>
        <Textarea rows={2} {...register('description')} />
      </Field>
      <FieldGrid>
        <Controller control={control} name="assigned_user_id" render={({ field }) => (
          <Field label={ru.weekly.assignee}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
        <Controller control={control} name="priority" render={({ field }) => (
          <Field label={ru.common.priority}>
            <Select value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
          </Field>
        )} />
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.weekly.estimatedHours} error={errors.estimated_hours?.message}>
          <Input type="number" min={0} step="0.5" {...register('estimated_hours')} />
        </Field>
        <Field label={ru.weekly.actualHours} error={errors.actual_hours?.message}>
          <Input type="number" min={0} step="0.5" {...register('actual_hours')} />
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.common.dueDate} error={errors.due_date?.message}>
          <Input type="date" {...register('due_date')} />
        </Field>
        <Controller control={control} name="manager_id" render={({ field }) => (
          <Field label={ru.roles.manager}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
      </FieldGrid>
    </FormDialog>
  );
}

interface WeekProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  onSubmit: (values: WeekFormValues) => void;
}

export function CreateWeekDialog({ open, onOpenChange, submitting, onSubmit }: WeekProps) {
  const now = new Date();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeekFormValues>({
    resolver: zodResolver(weekFormSchema),
    defaultValues: {
      week_number: isoWeek(now),
      year: now.getFullYear(),
      start_date: toDateInputValue(now.toISOString()),
      end_date: '',
    },
  });

  useEffect(() => {
    if (open) reset({ week_number: isoWeek(now), year: now.getFullYear(), start_date: toDateInputValue(now.toISOString()), end_date: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={ru.weekly.createWeek}
      submitting={submitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGrid>
        <Field label={ru.weekly.week} required error={errors.week_number?.message}>
          <Input type="number" min={1} max={53} {...register('week_number')} />
        </Field>
        <Field label="Год" required error={errors.year?.message}>
          <Input type="number" {...register('year')} />
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.common.startDate} required error={errors.start_date?.message}>
          <Input type="date" {...register('start_date')} />
        </Field>
        <Field label="Дата окончания" required error={errors.end_date?.message}>
          <Input type="date" {...register('end_date')} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}

/** ISO week number for a date. */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
