import * as XLSX from 'xlsx';

/**
 * Export an array of plain records to a downloadable .xlsx file.
 * Column order follows the keys of the first row (or an explicit header list).
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number | null>[],
  headers?: string[],
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows, headers ? { header: headers } : undefined);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filename}_${stamp}.xlsx`);
}
