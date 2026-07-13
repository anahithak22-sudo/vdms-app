import { z } from 'zod';

const optionalDate = z.string().optional().or(z.literal(''));

/** Create/edit schema for Artifact 01 planning initiatives. */
export const planningFormSchema = z.object({
  title: z.string().min(3, 'Укажите название (не менее 3 символов)').max(300),
  short_description: z.string().max(500).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  business_area: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  start_date: optionalDate,
  target_finish_date: optionalDate,
  estimated_duration_days: z.coerce.number().int().min(0).optional(),
  progress: z.coerce.number().int().min(0).max(100),
  budget: z.coerce.number().min(0).optional(),
});

export type PlanningFormValues = z.infer<typeof planningFormSchema>;

export const planningDefaults: PlanningFormValues = {
  title: '',
  short_description: '',
  description: '',
  business_area: '',
  department: '',
  owner_id: '',
  priority: 'medium',
  risk_level: 'low',
  start_date: '',
  target_finish_date: '',
  estimated_duration_days: undefined,
  progress: 0,
  budget: undefined,
};
