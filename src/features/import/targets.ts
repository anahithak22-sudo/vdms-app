import type { ZodType } from 'zod';
import { z } from 'zod';
import { planningService } from '@/features/planning/service';
import { roadmapService } from '@/features/roadmap/service';
import { bugService } from '@/features/bugs/service';
import { queueService } from '@/features/queue/service';
import type { ServiceResponse } from '@/types/api';

/**
 * An import target: the CSV column contract, a per-row validator, a mapper to
 * the service Insert shape, and the create call. Import runs each valid row
 * through the service so RLS, audit triggers, and constraints all apply.
 */
export interface ImportTarget {
  key: string;
  label: string;
  columns: string[];
  /** Roles allowed to import into this target (UI gate; RLS is authoritative). */
  adminOnly: boolean;
  parseRow: (row: Record<string, string>) => { ok: true; value: Record<string, unknown> } | { ok: false; error: string };
  create: (value: Record<string, unknown>) => Promise<ServiceResponse<unknown>>;
}

const priorityEnum = z.enum(['low', 'medium', 'high', 'critical']).default('medium');

function optionalNumber(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function validate<T>(schema: ZodType<T>, row: Record<string, string>) {
  const parsed = schema.safeParse(row);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Некорректная строка' };
  }
  return { ok: true as const, value: parsed.data as Record<string, unknown> };
}

const queueSchema = z.object({
  title: z.string().min(1, 'Пустой заголовок'),
  external_task_id: z.string().optional(),
  source_system: z.string().default('import'),
  priority: priorityEnum,
  business_area: z.string().optional(),
  project: z.string().optional(),
  requester: z.string().optional(),
});

const roadmapSchema = z.object({
  title: z.string().min(1, 'Пустой заголовок'),
  description: z.string().optional(),
  epic: z.string().optional(),
  feature: z.string().optional(),
  priority: priorityEnum,
});

const bugSchema = z.object({
  title: z.string().min(1, 'Пустой заголовок'),
  description: z.string().optional(),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']).default('major'),
  priority: priorityEnum,
  affected_module: z.string().optional(),
});

const planningSchema = z.object({
  title: z.string().min(1, 'Пустой заголовок'),
  short_description: z.string().optional(),
  business_area: z.string().optional(),
  priority: priorityEnum,
});

export const IMPORT_TARGETS: ImportTarget[] = [
  {
    key: 'priority_queue',
    label: 'Очередь задач',
    columns: ['title', 'external_task_id', 'source_system', 'priority', 'business_area', 'project', 'requester'],
    adminOnly: true,
    parseRow: (row) => {
      const r = validate(queueSchema, row);
      if (!r.ok) return r;
      return {
        ok: true,
        value: {
          ...r.value,
          estimated_hours: optionalNumber(row.estimated_hours),
          imported_at: new Date().toISOString(),
        },
      };
    },
    create: (v) => queueService.create(v as never),
  },
  {
    key: 'roadmap_items',
    label: 'Roadmap разработки',
    columns: ['title', 'description', 'epic', 'feature', 'priority'],
    adminOnly: false,
    parseRow: (row) => validate(roadmapSchema, row),
    create: (v) => roadmapService.create(v as never),
  },
  {
    key: 'bugs',
    label: 'Статистика багов',
    columns: ['title', 'description', 'severity', 'priority', 'affected_module'],
    adminOnly: false,
    parseRow: (row) => validate(bugSchema, row),
    create: (v) => bugService.create(v as never),
  },
  {
    key: 'planning_initiatives',
    label: 'План развития',
    columns: ['title', 'short_description', 'business_area', 'priority'],
    adminOnly: true,
    parseRow: (row) => validate(planningSchema, row),
    create: (v) => planningService.create(v as never),
  },
];
