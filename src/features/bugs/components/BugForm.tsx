import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  PRIORITY_OPTIONS, SEVERITY_OPTIONS, ROOT_CAUSE_OPTIONS, RESOLUTION_OPTIONS,
} from '@/constants/options';
import { useReleases, useSprints } from '@/hooks/useReferenceData';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import { bugFormSchema, bugDefaults, type BugFormValues } from '@/features/bugs/validators';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tables<'bugs'> | null;
  submitting?: boolean;
  onSubmit: (values: BugFormValues) => void;
}

export function BugForm({ open, onOpenChange, initial, submitting, onSubmit }: Props) {
  const { data: releases } = useReleases();
  const { data: sprints } = useSprints();
  const { data: users } = useAssignableUsers();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<BugFormValues>({
    resolver: zodResolver(bugFormSchema),
    defaultValues: bugDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            title: initial.title,
            description: initial.description ?? '',
            steps_to_reproduce: initial.steps_to_reproduce ?? '',
            expected_result: initial.expected_result ?? '',
            actual_result: initial.actual_result ?? '',
            severity: initial.severity,
            priority: initial.priority,
            environment: initial.environment ?? '',
            app_version: initial.app_version ?? '',
            affected_module: initial.affected_module ?? '',
            reporter_id: initial.reporter_id ?? '',
            assigned_developer_id: initial.assigned_developer_id ?? '',
            manager_id: initial.manager_id ?? '',
            release_id: initial.release_id ?? '',
            sprint_id: initial.sprint_id ?? '',
            root_cause: initial.root_cause ?? '',
            resolution: initial.resolution ?? '',
          }
        : bugDefaults,
    );
  }, [open, initial, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? ru.bugs.editTitle : ru.bugs.createTitle}
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
        <Controller control={control} name="severity" render={({ field }) => (
          <Field label={ru.bugs.severity}>
            <Select value={field.value} onValueChange={field.onChange} options={SEVERITY_OPTIONS} />
          </Field>
        )} />
        <Controller control={control} name="priority" render={({ field }) => (
          <Field label={ru.common.priority}>
            <Select value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
          </Field>
        )} />
      </FieldGrid>

      <Field label={ru.bugs.stepsToReproduce}><Textarea rows={2} {...register('steps_to_reproduce')} /></Field>
      <FieldGrid>
        <Field label={ru.bugs.expectedResult}><Textarea rows={2} {...register('expected_result')} /></Field>
        <Field label={ru.bugs.actualResult}><Textarea rows={2} {...register('actual_result')} /></Field>
      </FieldGrid>

      <FieldGrid>
        <Field label={ru.bugs.module}><Input {...register('affected_module')} /></Field>
        <Field label={ru.bugs.environment}><Input {...register('environment')} /></Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ru.bugs.appVersion}><Input {...register('app_version')} /></Field>
        <Controller control={control} name="assigned_developer_id" render={({ field }) => (
          <Field label={ru.bugs.developer}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
      </FieldGrid>

      <FieldGrid>
        <Controller control={control} name="reporter_id" render={({ field }) => (
          <Field label={ru.bugs.reporter}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
        <Controller control={control} name="manager_id" render={({ field }) => (
          <Field label={ru.roles.manager}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={userOptions(users)} placeholder={ru.common.unassigned} />
          </Field>
        )} />
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
        <Controller control={control} name="root_cause" render={({ field }) => (
          <Field label={ru.bugs.rootCause}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={ROOT_CAUSE_OPTIONS} placeholder={ru.common.none} />
          </Field>
        )} />
        <Controller control={control} name="resolution" render={({ field }) => (
          <Field label={ru.bugs.resolution}>
            <Select value={field.value || undefined} onValueChange={field.onChange}
              options={RESOLUTION_OPTIONS} placeholder={ru.common.none} />
          </Field>
        )} />
      </FieldGrid>
    </FormDialog>
  );
}
