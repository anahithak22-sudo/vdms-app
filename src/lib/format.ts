import { APP } from '@/constants/app';

/**
 * Display formatting. Values are stored in UTC and displayed in the configured
 * timezone (Europe/Moscow by default, D-08). Locale is Russian.
 */
const LOCALE = 'ru-RU';

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP.timezone,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP.timezone,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

/** Convert a yyyy-mm-dd or ISO string to the value a date input expects. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(LOCALE).format(value);
}
