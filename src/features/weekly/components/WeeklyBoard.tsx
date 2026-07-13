import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PriorityBadge } from '@/components/common/StatusControl';
import { weeklyStatus } from '@/features/weekly/status';
import { nextStatuses } from '@/lib/status';
import type { Tables, WeeklyTaskStatus } from '@/lib/supabase/types';

type Row = Tables<'weekly_tasks'>;

/** Weekly board; moving a card triggers a status change (RPC-backed). */
export function WeeklyBoard({
  items, onOpen, onMove, canMove,
}: {
  items: Row[];
  onOpen: (row: Row) => void;
  onMove: (row: Row, next: WeeklyTaskStatus) => void;
  canMove: (row: Row) => boolean;
}) {
  const columns = weeklyStatus.order.map((s) => ({ id: s, title: weeklyStatus.labels[s] }));
  return (
    <KanbanBoard<Row>
      columns={columns}
      items={items}
      itemKey={(i) => i.id}
      columnOf={(i) => i.status}
      canMove={(item, col) =>
        canMove(item) && nextStatuses(weeklyStatus, item.status).includes(col as WeeklyTaskStatus)}
      onMove={(item, col) => onMove(item, col as WeeklyTaskStatus)}
      renderCard={(item) => (
        <button type="button" onClick={() => onOpen(item)} className="w-full text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">{item.business_id}</span>
            <PriorityBadge priority={item.priority} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
        </button>
      )}
    />
  );
}
