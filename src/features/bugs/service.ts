import { createCrudService } from '@/services/base/crud.service';

export const bugService = createCrudService({
  table: 'bugs',
  searchFields: ['title', 'description', 'affected_module', 'business_id'],
  defaultSort: [{ field: 'updated_at', direction: 'desc' }],
});
