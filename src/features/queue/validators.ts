import { z } from 'zod';

/** Admin create/edit schema for Artifact 05 priority queue items. */
export const queueFormSchema = z.object({
  title: z.string().min(3, 'Укажите название').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  external_task_id: z.string().optional().or(z.literal('')),
  source_system: z.string().min(1, 'Укажите источник'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  business_area: z.string().optional().or(z.literal('')),
  project: z.string().optional().or(z.literal('')),
  requester: z.string().optional().or(z.literal('')),
  estimated_hours: z.coerce.number().min(0).optional(),
  story_points: z.coerce.number().int().min(0).optional(),
  implementation_readiness: z.enum([
    'not_ready', 'analysis', 'ready', 'approved', 'selected', 'scheduled', 'completed',
  ]),
});

export type QueueFormValues = z.infer<typeof queueFormSchema>;

export const queueDefaults: QueueFormValues = {
  title: '', description: '', external_task_id: '', source_system: 'manual',
  priority: 'medium', business_area: '', project: '', requester: '',
  estimated_hours: undefined, story_points: undefined, implementation_readiness: 'not_ready',
};
