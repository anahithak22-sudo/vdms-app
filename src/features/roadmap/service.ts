import { createCrudService } from '@/services/base/crud.service';

export const roadmapService = createCrudService({
  table: 'roadmap_items',
  searchFields: ['title', 'description', 'epic', 'feature', 'business_id'],
  defaultSort: [{ field: 'updated_at', direction: 'desc' }],
});
