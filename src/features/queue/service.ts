import { supabase } from '@/lib/supabase/client';
import { createCrudService } from '@/services/base/crud.service';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';

export const queueService = createCrudService({
  table: 'priority_queue',
  searchFields: ['title', 'description', 'external_task_id', 'business_area', 'business_id'],
  defaultSort: [{ field: 'priority', direction: 'asc' }],
});

/** Copy a queue item into a week's plan (queue item stays unchanged). */
async function selectForWeek(
  queueId: string,
  weekId: string,
  assignee?: string,
): Promise<ServiceResponse<string>> {
  try {
    const { data, error } = await supabase.rpc('select_queue_item_for_week', {
      p_queue_id: queueId,
      p_week_id: weekId,
      p_assignee: assignee ?? null,
    });
    if (error) return fail(mapPostgrestError(error));
    return ok(data as string);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const priorityQueueService = { ...queueService, selectForWeek };
