import * as XLSX from 'xlsx';
import { isoWeek, type WeekRef } from '@/lib/week';
import type { QueuePage } from '@/lib/supabase/types';
import type { QueueImportRow } from './service';

export interface ParsedSheet {
  page: QueuePage;
  week: WeekRef;
  rows: QueueImportRow[];
}

const SHEET_TO_PAGE: { match: RegExp; page: QueuePage }[] = [
  { match: /в\s*работе/i, page: 'v_rabote' },
  { match: /приемка|приёмка/i, page: 'priemka' },
  { match: /i\s*support/i, page: 'i_support' },
];

function pageForSheet(name: string): QueuePage | null {
  return SHEET_TO_PAGE.find((s) => s.match.test(name))?.page ?? null;
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).replace(/\\n/g, ' ').trim();
}

/** Map the imported "Fixed / Not fixed" text to one of our status keys. */
function mapFixed(v: string): string | null {
  if (!v) return null;
  if (/not/i.test(v)) return 'not_fixed';
  if (/prod/i.test(v)) return 'fixed_prod';
  if (/preprod|препрод/i.test(v)) return 'fixed_preprod';
  if (/test|тест/i.test(v)) return 'fixed_test';
  if (/fix/i.test(v)) return 'fixed_test';
  return null;
}

function weekFromCells(grid: unknown[][]): WeekRef {
  for (const row of grid) {
    for (const cell of row) {
      const m = /^W\s*(\d{1,2})$/i.exec(str(cell));
      if (m) {
        const week = parseInt(m[1], 10);
        return { year: new Date().getFullYear(), week, tag: `W${week}` };
      }
    }
  }
  return isoWeek(new Date());
}

/** Parse an uploaded queue workbook into per-page, per-week task rows. */
export async function parseQueueWorkbook(file: File): Promise<ParsedSheet[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const result: ParsedSheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const page = pageForSheet(sheetName);
    if (!page) continue;
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false });
    if (grid.length === 0) continue;

    const header = (grid[0] as unknown[]).map((c) => str(c).toLowerCase());
    const idx = {
      id: header.findIndex((h) => h.includes('задача')),
      status: header.findIndex((h) => h.includes('статус')),
      description: header.findIndex((h) => h.includes('тема')),
      priority: header.findIndex((h) => h.includes('приоритет')),
      link: header.findIndex((h) => h.includes('ссылка')),
      fixed: header.findIndex((h) => h.includes('fixed') || h.includes('not fixed')),
    };
    const known = Object.values(idx).filter((i) => i >= 0);
    const maxKnown = known.length ? Math.max(...known) : 0;
    const week = weekFromCells(grid);

    const rows: QueueImportRow[] = [];
    for (let r = 1; r < grid.length; r++) {
      const row = grid[r] as unknown[];
      const description = idx.description >= 0 ? str(row[idx.description]) : '';
      const id = idx.id >= 0 ? str(row[idx.id]) : '';
      if (!description && !id) continue; // week-marker or empty row
      if (!description) continue;
      // Comment = anything to the right of the last known column.
      const commentParts: string[] = [];
      for (let c = maxKnown + 1; c < row.length; c++) {
        const v = str(row[c]);
        if (v) commentParts.push(v);
      }
      rows.push({
        external_task_id: id ? id.replace(/\.0$/, '') : null,
        status: idx.status >= 0 ? str(row[idx.status]) || null : null,
        description,
        priority: idx.priority >= 0 ? str(row[idx.priority]) || null : null,
        task_link: idx.link >= 0 ? str(row[idx.link]) || null : null,
        fixed_status: idx.fixed >= 0 ? mapFixed(str(row[idx.fixed])) : null,
        comment: commentParts.join(' · ') || null,
      });
    }
    result.push({ page, week, rows });
  }
  return result;
}
