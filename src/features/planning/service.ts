import { createCrudService } from '@/services/base/crud.service';

export const planningService = createCrudService({
  table: 'planning_initiatives',
  searchFields: ['title', 'description', 'business_area', 'business_id'],
  defaultSort: [{ field: 'updated_at', direction: 'desc' }],
});
