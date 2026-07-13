import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ru } from '@/locales/ru';
import type { Paginated } from '@/types/common';

/** List toolbar: debounced-free search input, a filter slot, and action buttons. */
export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = ru.common.search,
  filters,
  actions,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Server-driven pagination footer. */
export function DataTablePagination<T>({
  page,
  data,
  onPageChange,
}: {
  page: number;
  data: Paginated<T> | undefined;
  onPageChange: (page: number) => void;
}) {
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        Всего записей: {totalItems}
        {totalPages > 1 && ` · Страница ${page} из ${totalPages}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!data?.hasPreviousPage}
        >
          {ru.common.back}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!data?.hasNextPage}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
