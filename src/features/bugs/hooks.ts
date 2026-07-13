import { createCrudHooks } from '@/hooks/createCrudHooks';
import { bugService } from '@/features/bugs/service';

export const bugHooks = createCrudHooks('bugs', bugService);
