import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PRIORITY_OPTIONS, READINESS_OPTIONS } from '@/constants/options';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import { queueFormSchema, queueDefaults, type QueueFormValues } from '@/features/queue/validators';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

interface FormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tables<'priority_queue'> | null;
  submitting?: boolean;
  onSubmit: (values: QueueFormValues) => void;
}

export function QueueForm({ open, onOpenChange, initial, submitting, onSubmit }: FormProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<QueueFormValues>({
    resolver: zodResolver(queueFormSchema),
    defaultValues: queueDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            description: initial.description ?? '',
            external_task_id: initial.external_task_id ?? '',
            source_system: initial.source_system,
            priority: initial.priority,
            business_area: initial.business_area ?? '',
            project: initial.project ?? '',
            requester: initial.requester ?? '',
            estimated_hours: initial.estimated_hours ?? undefined,
            story_points: initial.story_points ?? undefined,
            implementation_readiness: initial.implementation_readiness,
          }
        : queueDefaults,
    );
  }, [open, initial, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? 'Редактирование записи' : 'Новая запись очереди'}
      submitting={submitting}
      onSubmit={handleSubmit(onSubmit)}
      wide
    >
      <Field label={ru.common.title} required error={errors.title?.message}>
        <Input {...register('title')} />
      </Field>
      <Field label={ru.common.description}><Textarea rows={2} {...register('description')} /></Field>
      <FieldGrid>
        <Field label={ru.queue.externalId}><Input {...register('external_task_id')} /></Field>
        <Field label={ru.queue.source} required error={errors.source_system?.message}>
          <Input {...register('source_system')} />
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Controller control={control} name="priority" render={({ field }) => (
          <Field label={ru.common.priority}>
            <Select value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
          </Field>
        )} />
        <Controller control={control} name="implementation_readiness" render={({ field }) => (
          <Field label={ru.queue.readiness}>
            <Select value={field.value} onValueChange={field.onChange} options={READINESS_OPTIONS} />
          </Field>
        )} />
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.planning.businessArea}><Input {...register('business_area')} /></Field>
        <Field label={ru.queue.project}><Input {...register('project')} /></Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.queue.requester}><Input {...register('requester')} /></Field>
        <Field label={ru.roadmap.estimatedHours}>
          <Input type="number" min={0} step="0.5" {...register('estimated_hours')} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}

interface SelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekOptions: { value: string; label: string }[];
  submitting?: boolean;
  onConfirm: (weekId: string, assignee?: string) => void;
}

export function SelectForWeekDialog({ open, onOpenChange, weekOptions, submitting, onConfirm }: SelectProps) {
  const { data: users } = useAssignableUsers();
  const [weekId, setWeekId] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    if (open) { setWeekId(''); setAssignee(''); }
  }, [open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={ru.queue.selectTitle}
      submitting={submitting}
      submitLabel={ru.queue.selectForWeek}
      onSubmit={() => weekId && onConfirm(weekId, assignee || undefined)}
    >
      <Field label={ru.weekly.selectWeek} required>
        <Select value={weekId || undefined} onValueChange={setWeekId}
          options={weekOptions} placeholder={ru.weekly.selectWeek} />
      </Field>
      <Field label={ru.weekly.assignee}>
        <Select value={assignee || undefined} onValueChange={setAssignee}
          options={userOptions(users)} placeholder={ru.common.unassigned} />
      </Field>
    </FormDialog>
  );
}
