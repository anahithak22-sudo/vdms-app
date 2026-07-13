import { createCrudHooks } from '@/hooks/createCrudHooks';
import { planningService } from '@/features/planning/service';

export const planningHooks = createCrudHooks('planning_initiatives', planningService);
