import type { Paginated } from '@/types/common';

/** Composable list query parameters supported by every list service (PAD §10.2). */
export interface SortSpec {
  field: string;
  direction: 'asc' | 'desc';
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'ilike';

export interface FilterSpec {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | Array<string | number>;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: SortSpec[];
  filters?: FilterSpec[];
  /** Full-text-ish search term applied across searchFields (see service config). */
  search?: string;
  searchFields?: string[];
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

export const DEFAULT_PAGE_SIZE = 25;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Postgrest's builder generics are intentionally loosened here; this is the one
// controlled boundary where the query shape is dynamic. A minimal structural
// interface avoids depending on postgrest-js internals (which can duplicate
// across the dependency tree) while keeping the chainable calls type-checked.
interface AnyBuilder {
  eq(column: string, value: unknown): AnyBuilder;
  in(column: string, values: readonly unknown[]): AnyBuilder;
  ilike(column: string, pattern: string): AnyBuilder;
  filter(column: string, operator: string, value: unknown): AnyBuilder;
  or(filters: string): AnyBuilder;
  order(column: string, options: { ascending: boolean }): AnyBuilder;
  range(from: number, to: number): AnyBuilder;
}

/** Apply filters, search, soft-delete/archive guards, sorting, and range. */
export function applyListParams<T extends AnyBuilder>(builder: T, params: ListParams): T {
  let q = builder as AnyBuilder;

  if (!params.includeDeleted) {
    q = q.eq('is_deleted', false);
  }
  if (!params.includeArchived) {
    q = q.eq('is_archived', false);
  }

  for (const f of params.filters ?? []) {
    switch (f.operator) {
      case 'in':
        q = q.in(f.field, f.value as Array<string | number>);
        break;
      case 'ilike':
        q = q.ilike(f.field, `%${String(f.value)}%`);
        break;
      default:
        q = q.filter(f.field, f.operator, f.value as string | number | boolean);
    }
  }

  if (params.search && params.searchFields && params.searchFields.length > 0) {
    const term = params.search.replace(/[%,]/g, '');
    const ors = params.searchFields.map((field) => `${field}.ilike.%${term}%`).join(',');
    q = q.or(ors);
  }

  for (const s of params.sort ?? []) {
    q = q.order(s.field, { ascending: s.direction === 'asc' });
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);

  return q as T;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Build a Paginated<T> envelope from a Supabase count + rows. */
export function toPaginated<T>(
  items: T[],
  totalItems: number,
  params: ListParams,
): Paginated<T> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
