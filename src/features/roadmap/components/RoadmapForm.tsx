import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PRIORITY_OPTIONS, RISK_OPTIONS } from '@/constants/options';
import { useReleases, useSprints } from '@/hooks/useReferenceData';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import { roadmapFormSchema, roadmapDefaults, type RoadmapFormValues } from '@/features/roadmap/validators';
import type { Tables } from '@/lib/supabase/types';
import { toDateInputValue } from '@/lib/format';
import { ru } from '@/locales/ru';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tables<'roadmap_items'> | null;
  submitting?: boolean;
  onSubmit: (values: RoadmapFormValues) => void;
}

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21, 34].map((n) => ({ value: String(n), label: String(n) }));

export function RoadmapForm({ open, onOpenChange, initial, submitting, onSubmit }: Props) {
  const { data: releases } = useReleases();
  const { data: sprints } = useSprints();
  const { data: users } = useAssignableUsers();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapFormSchema),
    defaultValues: roadmapDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            description: initial.description ?? '',
            epic: initial.epic ?? '',
            feature: initial.feature ?? '',
            release_id: initial.release_id ?? '',
            sprint_id: initial.sprint_id ?? '',
            owner_id: initial.owner_id ?? '',
            assigned_developer_id: initial.assigned_developer_id ?? '',
            priority: initial.priority,
            risk: initial.risk,
            story_points: initial.story_points ?? undefined,
            estimated_hours: initial.estimated_hours ?? undefined,
            remaining_hours: initial.remaining_hours ?? undefined,
            progress: initial.progress,
            start_date: toDateInputValue(initial.start_date),
            due_date: toDateInputValue(initial.due_date),
          }
        : roadmapDefaults,
    );
  }, [open, initial, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? ru.roadmap.editTitle : ru.roadmap.createTitle}
      submitting={submitting}
      onSubmit={handleSubmit(onSubmit)}
      wide
    >
      <Field label={ru.common.title} required error={errors.title?.message}>
        <Input {...register('title')} />
      </Field>
      <Field label={ru.common.description} error={errors.description?.message}>
        <Textarea rows={3} {...register('description')} />
      </Field>

      <FieldGrid>
        <Field label={ru.roadmap.epic}><Input {...register('epic')} /></Field>
        <Field label={ru.roadmap.feature}><Input {...register('feature')} /></Field>
      </FieldGrid>

      <FieldGrid>
        <Controller control={control} name="release_id" render={({ field }) => (
          <Field label={ru.roadmap.release}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={(releases ?? []).map((r) => ({ value: r.id, label: r.name }))}
              placeholder={ru.common.none} />
          </Field>
        )} />
        <Controller control={control} name="sprint_id" render={({ field }) => (
          <Field label={ru.roadmap.sprint}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={(sprints ?? []).map((s) => ({ value: s.id, label: s.name }))}
              placeholder={ru.common.none} />
          </Field>
        )} />
      </FieldGrid>

      <FieldGrid>
        <Controller control={control} name="owner_id" render={({ field }) => (
          <Field label={ru.common.owner}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
        <Controller control={control} name="assigned_developer_id" render={({ field }) => (
          <Field label={ru.roadmap.developer}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
      </FieldGrid>

      <FieldGrid>
        <Controller control={control} name="priority" render={({ field }) => (
          <Field label={ru.common.priority}>
            <Select value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
          </Field>
        )} />
        <Controller control={control} name="risk" render={({ field }) => (
          <Field label={ru.planning.risk}>
            <Select value={field.value} onValueChange={field.onChange} options={RISK_OPTIONS} />
          </Field>
        )} />
      </FieldGrid>

      <FieldGrid>
        <Controller control={control} name="story_points" render={({ field }) => (
          <Field label={ru.roadmap.storyPoints}>
            <Select value={field.value ? String(field.value) : undefined}
              onValueChange={(v) => field.onChange(Number(v))}
              options={STORY_POINTS} placeholder={ru.common.none} />
          </Field>
        )} />
        <Field label={ru.common.progress} error={errors.progress?.message}>
          <Input type="number" min={0} max={100} {...register('progress')} />
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field label={ru.roadmap.estimatedHours} error={errors.estimated_hours?.message}>
          <Input type="number" min={0} step="0.5" {...register('estimated_hours')} />
        </Field>
        <Field label={ru.roadmap.remainingHours} error={errors.remaining_hours?.message}>
          <Input type="number" min={0} step="0.5" {...register('remaining_hours')} />
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field label={ru.common.startDate} error={errors.start_date?.message}>
          <Input type="date" {...register('start_date')} />
        </Field>
        <Field label={ru.common.dueDate} error={errors.due_date?.message}>
          <Input type="date" {...register('due_date')} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}
