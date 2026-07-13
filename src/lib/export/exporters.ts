import * as XLSX from 'xlsx';

/** A column definition for export: a header and a value accessor. */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function toMatrix<T>(columns: ExportColumn<T>[], rows: T[]): (string | number)[][] {
  const head = columns.map((c) => c.header);
  const body = rows.map((r) => columns.map((c) => {
    const v = c.value(r);
    return v === null || v === undefined ? '' : v;
  }));
  return [head, ...body];
}

/** RFC-4180 CSV with UTF-8 BOM so Excel opens Cyrillic correctly. */
export function exportCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  const matrix = toMatrix(columns, rows);
  const csv = matrix
    .map((line) =>
      line
        .map((cell) => {
          const s = String(cell);
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/** XLSX export via SheetJS. */
export function exportXlsx<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  const matrix = toMatrix(columns, rows);
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
