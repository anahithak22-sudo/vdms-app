import { z } from 'zod';

const optionalDate = z.string().optional().or(z.literal(''));
const optionalUuid = z.string().uuid().optional().or(z.literal(''));

/** Create/edit schema for Artifact 02 roadmap items. */
export const roadmapFormSchema = z.object({
  title: z.string().min(3, 'Укажите название').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  epic: z.string().optional().or(z.literal('')),
  feature: z.string().optional().or(z.literal('')),
  release_id: optionalUuid,
  sprint_id: optionalUuid,
  owner_id: optionalUuid,
  assigned_developer_id: optionalUuid,
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  story_points: z.coerce.number().int().optional(),
  estimated_hours: z.coerce.number().min(0).optional(),
  remaining_hours: z.coerce.number().min(0).optional(),
  progress: z.coerce.number().int().min(0).max(100),
  start_date: optionalDate,
  due_date: optionalDate,
});

export type RoadmapFormValues = z.infer<typeof roadmapFormSchema>;

export const roadmapDefaults: RoadmapFormValues = {
  title: '', description: '', epic: '', feature: '',
  release_id: '', sprint_id: '', owner_id: '', assigned_developer_id: '',
  priority: 'medium', risk: 'low', story_points: undefined,
  estimated_hours: undefined, remaining_hours: undefined, progress: 0,
  start_date: '', due_date: '',
};
