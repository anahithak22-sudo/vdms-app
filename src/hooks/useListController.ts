import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { ServiceResponse } from '@/types/api';
import type { Paginated } from '@/types/common';
import type { ListParams, SortSpec, FilterSpec } from '@/lib/query/list-params';

interface ListController {
  keyBase: readonly unknown[];
  getList: (params: ListParams) => Promise<ServiceResponse<Paginated<unknown>>>;
  pageSize?: number;
  defaultSort?: SortSpec;
}

/**
 * Drives a list view end-to-end: owns page/search/sort/filter state, debounces
 * search, builds ListParams, and runs the query. Every artifact list reuses it
 * so pagination, sorting, and search behave identically.
 */
export function useListController<T>(controller: ListController) {
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState('');
  const [sort, setSort] = useState<SortSpec | undefined>(controller.defaultSort);
  const [filters, setFilters] = useState<FilterSpec[]>([]);
  const debouncedSearch = useDebouncedValue(search, 300);

  const params: ListParams = useMemo(
    () => ({
      page,
      pageSize: controller.pageSize ?? 10,
      search: debouncedSearch || undefined,
      sort: sort ? [sort] : undefined,
      filters: filters.length ? filters : undefined,
    }),
    [page, controller.pageSize, debouncedSearch, sort, filters],
  );

  const query = useQuery({
    queryKey: [...controller.keyBase, 'list', params],
    queryFn: async () => {
      const res = await controller.getList(params);
      if (!res.success || !res.data) throw new Error(res.message ?? 'Ошибка загрузки');
      return res.data as Paginated<T>;
    },
    placeholderData: keepPreviousData,
  });

  function setSearch(value: string) {
    setSearchRaw(value);
    setPage(1);
  }
  function applyFilters(next: FilterSpec[]) {
    setFilters(next);
    setPage(1);
  }

  return {
    query,
    page,
    setPage,
    search,
    setSearch,
    sort,
    setSort,
    filters,
    setFilters: applyFilters,
  };
}
