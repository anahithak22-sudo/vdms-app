import { createCrudService } from '@/services/base/crud.service';

/**
 * Write-capable services for managed reference entities, built from the shared
 * CRUD factory. Read paths use referenceService; these back the (deferred)
 * reference-data management UI and any admin tooling.
 */
export const releaseService = createCrudService({
  table: 'releases',
  searchFields: ['name', 'version', 'business_id'],
  defaultSort: [{ field: 'target_date', direction: 'asc' }],
});

export const sprintService = createCrudService({
  table: 'sprints',
  searchFields: ['name', 'business_id'],
  defaultSort: [{ field: 'start_date', direction: 'desc' }],
});
