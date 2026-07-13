import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { referenceService } from '@/services/reference.service';

const STALE = 10 * 60_000; // reference data changes rarely

function unwrapList<T>(fn: () => Promise<{ success: boolean; data: T[] | null; message: string | null }>) {
  return fn().then((r) => (r.success && r.data ? r.data : []));
}

export function useBusinessAreas() {
  return useQuery({
    queryKey: queryKeys.reference.businessAreas,
    queryFn: () => unwrapList(referenceService.businessAreas),
    staleTime: STALE,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.reference.departments,
    queryFn: () => unwrapList(referenceService.departments),
    staleTime: STALE,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.reference.projects,
    queryFn: () => unwrapList(referenceService.projects),
    staleTime: STALE,
  });
}

export function usePriorities() {
  return useQuery({
    queryKey: queryKeys.reference.priorities,
    queryFn: () => unwrapList(referenceService.priorities),
    staleTime: STALE,
  });
}

export function useReleases() {
  return useQuery({
    queryKey: queryKeys.reference.releases,
    queryFn: () => unwrapList(referenceService.releases),
    staleTime: STALE,
  });
}

export function useSprints(releaseId?: string) {
  return useQuery({
    queryKey: queryKeys.reference.sprints(releaseId),
    queryFn: () => unwrapList(() => referenceService.sprints(releaseId)),
    staleTime: STALE,
  });
}
