import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/common/DisplayPrimitives';
import { Hint } from './Hint';
import type { RdevStatus, RdevTask } from '../types';
import { ru } from '@/locales/ru';

const COL_MIN = 46;
const ROW = 40;
const LABEL_W = 280;
const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

interface MonthCol { year: number; month: number; label: string }
function monthIndex(d: Date): number { return d.getFullYear() * 12 + d.getMonth(); }

export function RdevGantt({
  tasks, statuses, onSelect,
}: {
  tasks: RdevTask[];
  statuses: RdevStatus[];
  onSelect: (task: RdevTask) => void;
}) {
  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);
  const dated = tasks.filter((t) => t.start_date && t.end_date);

  const { columns, rangeStart } = useMemo(() => {
    if (dated.length === 0) return { columns: [] as MonthCol[], rangeStart: 0 };
    let min = Infinity, max = -Infinity;
    for (const t of dated) {
      min = Math.min(min, monthIndex(new Date(t.start_date as string)));
      max = Math.max(max, monthIndex(new Date(t.end_date as string)));
    }
    const cols: MonthCol[] = [];
    for (let i = min; i <= max; i++) cols.push({ year: Math.floor(i / 12), month: i % 12, label: MONTHS_RU[i % 12] });
    return { columns: cols, rangeStart: min };
  }, [dated]);

  if (dated.length === 0) {
    return <EmptyState icon={AlertTriangle} title={ru.rdev.unscheduled} description={ru.rdev.noDates} />;
  }

  const gridCols = `repeat(${columns.length}, minmax(${COL_MIN}px, 1fr))`;
  const yearSpans: { year: number; span: number }[] = [];
  for (const c of columns) {
    const last = yearSpans[yearSpans.length - 1];
    if (last && last.year === c.year) last.span += 1;
    else yearSpans.push({ year: c.year, span: 1 });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-card">
      <div className="min-w-full">
        <div className="flex border-b border-border">
          <div style={{ width: LABEL_W }} className="shrink-0 border-r border-border" />
          <div className="grid flex-1" style={{ gridTemplateColumns: gridCols }}>
            {yearSpans.map((y) => (
              <div key={y.year} className="border-r border-border py-1 text-center text-xs font-semibold text-foreground" style={{ gridColumn: `span ${y.span}` }}>
                {y.year}
              </div>
            ))}
          </div>
        </div>
        <div className="flex border-b border-border bg-muted/40">
          <div style={{ width: LABEL_W }} className="flex shrink-0 border-r border-border">
            <span className="w-9 border-r border-border/60 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">№</span>
            <span className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{ru.rdev.taskTitle}</span>
          </div>
          <div className="grid flex-1" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((c, i) => (
              <div key={i} className="border-r border-border py-1.5 text-center text-[11px] text-muted-foreground">{c.label}</div>
            ))}
          </div>
        </div>
        {dated.map((t, idx) => {
          const status = statusById.get(t.status_id);
          const s = monthIndex(new Date(t.start_date as string)) - rangeStart;
          const e = monthIndex(new Date(t.end_date as string)) - rangeStart;
          return (
            <div key={t.id} className="flex items-center border-b border-border" style={{ height: ROW }}>
              <div style={{ width: LABEL_W }} className="flex h-full shrink-0 items-center border-r border-border">
                <span className="w-9 shrink-0 border-r border-border/60 text-center text-xs font-medium text-muted-foreground">{idx + 1}</span>
                <div className="min-w-0 px-3">
                  <p className="truncate text-sm text-foreground" title={t.title}>{t.title}</p>
                  {t.description && <p className="truncate text-[11px] text-muted-foreground" title={t.description}>{t.description}</p>}
                </div>
              </div>
              <div className="grid h-full flex-1 items-center" style={{ gridTemplateColumns: gridCols }}>
                <Hint label={t.title}>
                  <button
                    type="button"
                    onClick={() => onSelect(t)}
                    className="h-5 rounded shadow-sm"
                    style={{ gridColumn: `${s + 1} / ${e + 2}`, backgroundColor: status?.color ?? '#64748b' }}
                  />
                </Hint>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
