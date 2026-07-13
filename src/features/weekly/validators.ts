import { z } from 'zod';

const optionalUuid = z.string().uuid().optional().or(z.literal(''));
const optionalDate = z.string().optional().or(z.literal(''));

/** Create/edit schema for Artifact 04 weekly tasks. */
export const weeklyTaskFormSchema = z.object({
  title: z.string().min(3, 'Укажите название').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  assigned_user_id: optionalUuid,
  manager_id: optionalUuid,
  roadmap_item_id: optionalUuid,
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimated_hours: z.coerce.number().min(0).optional(),
  actual_hours: z.coerce.number().min(0).optional(),
  remaining_hours: z.coerce.number().min(0).optional(),
  sprint_id: optionalUuid,
  release_id: optionalUuid,
  due_date: optionalDate,
});

export type WeeklyTaskFormValues = z.infer<typeof weeklyTaskFormSchema>;

export const weeklyTaskDefaults: WeeklyTaskFormValues = {
  title: '', description: '', assigned_user_id: '', manager_id: '', roadmap_item_id: '',
  priority: 'medium', estimated_hours: undefined, actual_hours: undefined,
  remaining_hours: undefined, sprint_id: '', release_id: '', due_date: '',
};

/** Schema for creating a planning week. */
export const weekFormSchema = z
  .object({
    week_number: z.coerce.number().int().min(1).max(53),
    year: z.coerce.number().int().min(2020).max(2100),
    start_date: z.string().min(1, 'Укажите дату начала'),
    end_date: z.string().min(1, 'Укажите дату окончания'),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['end_date'],
  });

export type WeekFormValues = z.infer<typeof weekFormSchema>;
