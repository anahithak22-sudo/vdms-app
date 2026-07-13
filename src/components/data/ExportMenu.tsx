import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { exportCsv, exportXlsx, type ExportColumn } from '@/lib/export/exporters';
import { useToast } from '@/hooks/useToast';
import { ru } from '@/locales/ru';

/**
 * Reusable export control. Exports the provided rows (already reflecting the
 * current filters/sort) to CSV or Excel, or opens the print dialog for PDF.
 */
export function ExportMenu<T>({
  filename,
  columns,
  rows,
}: {
  filename: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const toast = useToast();

  function guard(action: () => void) {
    if (rows.length === 0) {
      toast.info(ru.exporter.empty);
      return;
    }
    action();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          {ru.exporter.export}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => guard(() => exportCsv(filename, columns, rows))}>
          <FileText className="mr-2 h-4 w-4" />
          {ru.exporter.csv}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => guard(() => exportXlsx(filename, columns, rows))}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {ru.exporter.xlsx}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          {ru.exporter.print}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
