import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PriorityBadge } from '@/components/common/StatusControl';
import { roadmapStatus } from '@/features/roadmap/status';
import { nextStatuses } from '@/lib/status';
import type { Tables, RoadmapStatus } from '@/lib/supabase/types';

type Row = Tables<'roadmap_items'>;

/** Kanban board for the roadmap; columns are the lifecycle statuses. */
export function RoadmapBoard({
  items,
  onOpen,
  onMove,
}: {
  items: Row[];
  onOpen: (row: Row) => void;
  onMove: (row: Row, next: RoadmapStatus) => void;
}) {
  const columns = roadmapStatus.order.map((s) => ({ id: s, title: roadmapStatus.labels[s] }));
  return (
    <KanbanBoard<Row>
      columns={columns}
      items={items}
      itemKey={(i) => i.id}
      columnOf={(i) => i.status}
      canMove={(item, col) => nextStatuses(roadmapStatus, item.status).includes(col as RoadmapStatus)}
      onMove={(item, col) => onMove(item, col as RoadmapStatus)}
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
