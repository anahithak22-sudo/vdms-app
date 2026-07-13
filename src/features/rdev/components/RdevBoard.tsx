import { useMemo } from 'react';
import { AlertTriangle, User, Clock } from 'lucide-react';
import { KanbanBoard, type KanbanColumn } from '@/components/kanban/KanbanBoard';
import { PriorityBadge } from '@/components/common/StatusControl';
import { PRIORITY_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/format';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import { Hint } from './Hint';
import { TagChips } from './TagChips';
import { statusPercent, isOverdue, delayDays } from '../progress';
import type { RdevStatus, RdevTag, RdevTask } from '../types';
import { ru } from '@/locales/ru';

export function RdevBoard({
  tasks,
  statuses,
  tags,
  onSelect,
  onMove,
}: {
  tasks: RdevTask[];
  statuses: RdevStatus[];
  tags: RdevTag[];
  onSelect: (task: RdevTask) => void;
  onMove: (task: RdevTask, statusId: string) => void;
}) {
  const { data: users } = useAssignableUsers();
  const columns: KanbanColumn[] = useMemo(
    () => statuses.map((s) => ({ id: s.id, title: s.name })),
    [statuses],
  );
  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  return (
    <KanbanBoard<RdevTask>
      columns={columns}
      items={tasks}
      itemKey={(t) => t.id}
      columnOf={(t) => t.status_id}
      onMove={(t, col) => onMove(t, col)}
      renderCard={(t) => {
        const status = statusById.get(t.status_id);
        const pct = statusPercent(status, statuses);
        const overdue = isOverdue(t, status);
        const delay = delayDays(t);
        const taskTags = t.tagIds.map((id) => tagById.get(id)).filter(Boolean) as RdevTag[];
        return (
          <button
            type="button"
            onClick={() => onSelect(t)}
            className="w-full space-y-2 rounded-md border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{t.title}</span>
              <Hint label={PRIORITY_LABELS[t.priority]}>
                <PriorityBadge priority={t.priority} />
              </Hint>
            </div>
            {taskTags.length > 0 && <TagChips tags={taskTags} />}
            {t.assignee_id && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" />
                {userNameOf(users, t.assignee_id)}
              </p>
            )}
            {(t.start_date || t.end_date) && (
              <p className="text-[11px] text-muted-foreground">
                {t.start_date ? formatDate(t.start_date) : '—'} — {t.end_date ? formatDate(t.end_date) : '—'}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">{t.business_id}</span>
              <div className="flex items-center gap-1">
                {delay > 0 && (
                  <Hint label={`${ru.rdev.delay}: ${delay} ${ru.rdev.delayDays}`}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      <Clock className="h-3 w-3" />
                      +{delay}
                    </span>
                  </Hint>
                )}
                {overdue && (
                  <Hint label={ru.rdev.overdueHint}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {ru.rdev.overdue}
                    </span>
                  </Hint>
                )}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: status?.color ?? '#64748b' }} />
            </div>
          </button>
        );
      }}
    />
  );
}
