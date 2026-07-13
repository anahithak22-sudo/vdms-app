import { createCrudHooks } from '@/hooks/createCrudHooks';
import { roadmapService } from '@/features/roadmap/service';

export const roadmapHooks = createCrudHooks('roadmap_items', roadmapService);
