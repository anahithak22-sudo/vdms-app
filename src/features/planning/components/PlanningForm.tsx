import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PRIORITY_OPTIONS, RISK_OPTIONS } from '@/constants/options';
import { useBusinessAreas, useDepartments } from '@/hooks/useReferenceData';
import { useAssignableUsers, userOptions } from '@/hooks/useDirectory';
import { planningFormSchema, planningDefaults, type PlanningFormValues } from '@/features/planning/validators';
import type { Tables } from '@/lib/supabase/types';
import { toDateInputValue } from '@/lib/format';
import { ru } from '@/locales/ru';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tables<'planning_initiatives'> | null;
  submitting?: boolean;
  onSubmit: (values: PlanningFormValues) => void;
}

export function PlanningForm({ open, onOpenChange, initial, submitting, onSubmit }: Props) {
  const { data: areas } = useBusinessAreas();
  const { data: departments } = useDepartments();
  const { data: users } = useAssignableUsers();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlanningFormValues>({
    resolver: zodResolver(planningFormSchema),
    defaultValues: planningDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        title: initial.title,
        short_description: initial.short_description ?? '',
        description: initial.description ?? '',
        business_area: initial.business_area ?? '',
        department: initial.department ?? '',
        owner_id: initial.owner_id ?? '',
        priority: initial.priority,
        risk_level: initial.risk_level,
        start_date: toDateInputValue(initial.start_date),
        target_finish_date: toDateInputValue(initial.target_finish_date),
        estimated_duration_days: initial.estimated_duration_days ?? undefined,
        progress: initial.progress,
        budget: initial.budget ?? undefined,
      });
    } else {
      reset(planningDefaults);
    }
  }, [open, initial, reset]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? ru.planning.editTitle : ru.planning.createTitle}
      submitting={submitting}
      onSubmit={handleSubmit(onSubmit)}
      wide
    >
      <Field label={ru.planning.name} required error={errors.title?.message}>
        <Input {...register('title')} />
      </Field>

      <Field label={ru.common.description} error={errors.short_description?.message}>
        <Textarea rows={2} {...register('short_description')} />
      </Field>

      <FieldGrid>
        <Controller
          control={control}
          name="business_area"
          render={({ field }) => (
            <Field label={ru.planning.businessArea}>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                options={(areas ?? []).map((a) => ({ value: a.key, label: a.name }))}
                placeholder={ru.common.none}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="department"
          render={({ field }) => (
            <Field label={ru.planning.department}>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                options={(departments ?? []).map((d) => ({ value: d.key, label: d.name }))}
                placeholder={ru.common.none}
              />
            </Field>
          )}
        />
      </FieldGrid>

      <FieldGrid>
        <Controller
          control={control}
          name="owner_id"
          render={({ field }) => (
            <Field label={ru.common.owner}>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                options={userOptions(users)}
                placeholder={ru.common.unassigned}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Field label={ru.common.priority}>
              <Select value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
            </Field>
          )}
        />
      </FieldGrid>

      <FieldGrid>
        <Controller
          control={control}
          name="risk_level"
          render={({ field }) => (
            <Field label={ru.planning.risk}>
              <Select value={field.value} onValueChange={field.onChange} options={RISK_OPTIONS} />
            </Field>
          )}
        />
        <Field label={ru.planning.duration} error={errors.estimated_duration_days?.message}>
          <Input type="number" min={0} {...register('estimated_duration_days')} />
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field label={ru.common.startDate} error={errors.start_date?.message}>
          <Input type="date" {...register('start_date')} />
        </Field>
        <Field label={ru.planning.targetFinish} error={errors.target_finish_date?.message}>
          <Input type="date" {...register('target_finish_date')} />
        </Field>
      </FieldGrid>

      <FieldGrid>
        <Field label={ru.common.progress} error={errors.progress?.message}>
          <Input type="number" min={0} max={100} {...register('progress')} />
        </Field>
        <Field label={ru.planning.budget} error={errors.budget?.message}>
          <Input type="number" min={0} step="0.01" {...register('budget')} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}
