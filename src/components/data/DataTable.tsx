import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/DisplayPrimitives';
import { cn } from '@/lib/utils';
import type { SortSpec } from '@/lib/query/list-params';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Sortable column maps to this DB field. */
  sortField?: string;
  className?: string;
  headerClassName?: string;
}

export interface RowAction<T> {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: (row: T) => void;
  destructive?: boolean;
  hidden?: (row: T) => boolean;
  separatorBefore?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: RowAction<T>[];
  sort?: SortSpec;
  onSortChange?: (sort: SortSpec) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}

/**
 * The shared table engine reused by every artifact list view (PAD §12 Tables).
 * Sorting is server-driven via onSortChange; the parent owns pagination and
 * data fetching. Loading renders skeleton rows; no data renders an empty state.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  onRowClick,
  actions,
  sort,
  onSortChange,
  emptyIcon = Inbox,
  emptyTitle = 'Нет данных',
  emptyDescription,
  pageSize = 10,
}: DataTableProps<T>) {
  const hasActions = actions && actions.length > 0;

  function toggleSort(field: string) {
    if (!onSortChange) return;
    const direction: SortSpec['direction'] =
      sort?.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const sortable = !!col.sortField && !!onSortChange;
              const active = sort?.field === col.sortField;
              return (
                <TableHead key={col.key} className={col.headerClassName}>
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.sortField as string)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {active ? (
                        sort?.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
            {hasActions && <TableHead className="w-12 text-right" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading &&
            Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </TableCell>
                ))}
                {hasActions && <TableCell />}
              </TableRow>
            ))}

          {!loading &&
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu row={row} actions={actions as RowAction<T>[]} />
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {!loading && rows.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function RowActionsMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Действия">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visible.map((action) => (
          <div key={action.key}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => action.onSelect(row)}
              className={cn(action.destructive && 'text-destructive focus:text-destructive')}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
