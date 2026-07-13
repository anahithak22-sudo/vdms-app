import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface KanbanColumn {
  id: string;
  title: string;
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn[];
  items: T[];
  itemKey: (item: T) => string;
  columnOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (item: T, toColumn: string) => void;
  canMove?: (item: T, toColumn: string) => boolean;
}

/**
 * Dependency-free Kanban engine using native drag-and-drop. Reused by the
 * Roadmap and Weekly Planning boards. Moving a card invokes onMove, which the
 * feature maps to a status transition (validated server-side).
 */
export function KanbanBoard<T>({
  columns,
  items,
  itemKey,
  columnOf,
  renderCard,
  onMove,
  canMove,
}: KanbanBoardProps<T>) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const byColumn = (colId: string) => items.filter((i) => columnOf(i) === colId);
  const findItem = (key: string) => items.find((i) => itemKey(i) === key);

  function handleDrop(colId: string) {
    const item = dragKey ? findItem(dragKey) : undefined;
    setDragKey(null);
    setOverColumn(null);
    if (!item) return;
    if (columnOf(item) === colId) return;
    if (canMove && !canMove(item, colId)) return;
    onMove(item, colId);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((col) => {
        const colItems = byColumn(col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.id);
            }}
            onDragLeave={() => setOverColumn((c) => (c === col.id ? null : c))}
            onDrop={() => handleDrop(col.id)}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40',
              overColumn === col.id && 'ring-2 ring-primary',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-medium text-foreground">{col.title}</span>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {colItems.map((item) => (
                <div
                  key={itemKey(item)}
                  draggable
                  onDragStart={() => setDragKey(itemKey(item))}
                  onDragEnd={() => {
                    setDragKey(null);
                    setOverColumn(null);
                  }}
                  className={cn(
                    'cursor-grab rounded-md border border-border bg-card p-3 shadow-sm active:cursor-grabbing',
                    dragKey === itemKey(item) && 'opacity-50',
                  )}
                >
                  {renderCard(item)}
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                  Нет задач
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
