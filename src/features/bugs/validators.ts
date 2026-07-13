import { z } from 'zod';

const optionalUuid = z.string().uuid().optional().or(z.literal(''));

/** Create/edit schema for Artifact 03 bugs. */
export const bugFormSchema = z.object({
  title: z.string().min(3, 'Укажите заголовок').max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  steps_to_reproduce: z.string().max(5000).optional().or(z.literal('')),
  expected_result: z.string().max(2000).optional().or(z.literal('')),
  actual_result: z.string().max(2000).optional().or(z.literal('')),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  environment: z.string().optional().or(z.literal('')),
  app_version: z.string().optional().or(z.literal('')),
  affected_module: z.string().optional().or(z.literal('')),
  reporter_id: optionalUuid,
  assigned_developer_id: optionalUuid,
  manager_id: optionalUuid,
  release_id: optionalUuid,
  sprint_id: optionalUuid,
  root_cause: z
    .enum([
      'requirements', 'backend', 'frontend', 'database', 'integration',
      'infrastructure', 'performance', 'security', 'configuration', 'unknown',
    ])
    .optional()
    .or(z.literal('')),
  resolution: z
    .enum([
      'fixed', 'cannot_reproduce', 'duplicate', 'wont_fix',
      'by_design', 'configuration_issue', 'third_party', 'deferred',
    ])
    .optional()
    .or(z.literal('')),
});

export type BugFormValues = z.infer<typeof bugFormSchema>;

export const bugDefaults: BugFormValues = {
  title: '', description: '', steps_to_reproduce: '', expected_result: '', actual_result: '',
  severity: 'major', priority: 'medium', environment: '', app_version: '', affected_module: '',
  reporter_id: '', assigned_developer_id: '', manager_id: '', release_id: '', sprint_id: '',
  root_cause: '', resolution: '',
};
