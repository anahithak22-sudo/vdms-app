import { useMemo } from 'react';
import { Hint } from './Hint';
import { statusPercent, totalPercent } from '../progress';
import type { RdevStatus, RdevTask } from '../types';
import { ru } from '@/locales/ru';

export function ProgressSummary({ tasks, statuses }: { tasks: RdevTask[]; statuses: RdevStatus[] }) {
  const total = useMemo(() => totalPercent(tasks, statuses), [tasks, statuses]);

  const perColumn = useMemo(() => {
    const byId = new Map(statuses.map((s) => [s.id, s]));
    return statuses.map((s) => {
      const count = tasks.filter((t) => t.status_id === s.id).length;
      return { status: s, count, pct: statusPercent(byId.get(s.id), statuses) };
    });
  }, [tasks, statuses]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{ru.rdev.totalProgress}</span>
        <span className="text-sm font-semibold text-foreground">{total}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${total}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {perColumn.map(({ status, count, pct }) => (
          <Hint key={status.id} label={`${status.name} — ${pct}%`}>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
              {status.name}: <span className="font-medium text-foreground">{count}</span>
            </span>
          </Hint>
        ))}
      </div>
    </div>
  );
}
