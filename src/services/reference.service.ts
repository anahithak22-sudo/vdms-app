import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { Tables } from '@/lib/supabase/types';

type BusinessArea = Tables<'business_areas'>;
type Department = Tables<'departments'>;
type Project = Tables<'projects'>;
type PriorityDefinition = Tables<'priority_definitions'>;
type Release = Tables<'releases'>;
type Sprint = Tables<'sprints'>;

async function fetchLookup<T>(
  table: 'business_areas' | 'departments' | 'projects' | 'priority_definitions',
): Promise<ServiceResponse<T[]>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as T[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function releases(): Promise<ServiceResponse<Release[]>> {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('target_date', { ascending: true, nullsFirst: false });
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as Release[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function sprints(releaseId?: string): Promise<ServiceResponse<Sprint[]>> {
  try {
    let q = supabase
      .from('sprints')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('start_date', { ascending: false, nullsFirst: false });
    if (releaseId) q = q.eq('release_id', releaseId);
    const { data, error } = await q;
    if (error) return fail(mapPostgrestError(error));
    return ok((data ?? []) as Sprint[]);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

/**
 * Shared reference data (PAD §11). Lookups are cached aggressively by the
 * hooks layer since they change rarely.
 */
export const referenceService = {
  businessAreas: () => fetchLookup<BusinessArea>('business_areas'),
  departments: () => fetchLookup<Department>('departments'),
  projects: () => fetchLookup<Project>('projects'),
  priorities: () => fetchLookup<PriorityDefinition>('priority_definitions'),
  releases,
  sprints,
};
