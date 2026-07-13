import { useMemo, useRef, useState } from 'react';
import { Upload, FileCheck2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/common/DisplayPrimitives';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { parseCsv } from '@/lib/import/csv';
import { IMPORT_TARGETS } from '@/features/import/targets';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import { ru } from '@/locales/ru';

interface PreviewRow {
  index: number;
  raw: Record<string, string>;
  ok: boolean;
  error?: string;
  value?: Record<string, unknown>;
}

export default function ImportCenterPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;
  const fileRef = useRef<HTMLInputElement>(null);

  const targets = useMemo(
    () => IMPORT_TARGETS.filter((t) => !t.adminOnly || isAdmin),
    [isAdmin],
  );
  const [targetKey, setTargetKey] = useState(targets[0]?.key ?? '');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [applying, setApplying] = useState(false);

  const target = IMPORT_TARGETS.find((t) => t.key === targetKey);
  const validRows = preview?.filter((r) => r.ok) ?? [];
  const invalidRows = preview?.filter((r) => !r.ok) ?? [];

  function onFile(file: File) {
    if (!target) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result));
        const rows: PreviewRow[] = parsed.rows.map((raw, i) => {
          const res = target.parseRow(raw);
          return res.ok
            ? { index: i + 1, raw, ok: true, value: res.value }
            : { index: i + 1, raw, ok: false, error: res.error };
        });
        setPreview(rows);
      } catch {
        toast.error(ru.importer.parseError);
      }
    };
    reader.readAsText(file);
  }

  async function apply() {
    if (!target || validRows.length === 0) {
      toast.info(ru.importer.noValid);
      return;
    }
    setApplying(true);
    let ok = 0;
    for (const row of validRows) {
      const res = await target.create(row.value as Record<string, unknown>);
      if (res.success) ok++;
    }
    setApplying(false);
    toast.success(ru.importer.applied(ok));
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <PageHeader title={ru.importer.title} description={ru.importer.subtitle} />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{ru.importer.target}</label>
              <Select
                value={targetKey || undefined}
                onValueChange={(v) => { setTargetKey(v); setPreview(null); }}
                options={targets.map((t) => ({ value: t.key, label: t.label }))}
                placeholder={ru.importer.target}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{ru.importer.selectFile}</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
          {target && (
            <p className="text-xs text-muted-foreground">
              {ru.importer.columnsHint}: {target.columns.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {preview && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {ru.importer.validRows}: {validRows.length}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <AlertTriangle className="h-4 w-4 text-warning" />
              {ru.importer.invalidRows}: {invalidRows.length}
            </span>
            <div className="flex-1" />
            <Button onClick={apply} loading={applying} disabled={validRows.length === 0}>
              <FileCheck2 className="h-4 w-4" />
              {ru.importer.apply}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">{ru.importer.row}</TableHead>
                  <TableHead className="w-24">{ru.common.status}</TableHead>
                  {(target?.columns ?? []).map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 100).map((r) => (
                  <TableRow key={r.index}>
                    <TableCell className="text-muted-foreground">{r.index}</TableCell>
                    <TableCell>
                      {r.ok ? (
                        <span className="text-xs text-success">OK</span>
                      ) : (
                        <span className="text-xs text-destructive" title={r.error}>{r.error}</span>
                      )}
                    </TableCell>
                    {(target?.columns ?? []).map((c) => (
                      <TableCell key={c} className="max-w-[200px] truncate text-sm">
                        {r.raw[c] ?? ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!preview && (
        <EmptyState icon={Upload} title={ru.importer.dropHint} />
      )}
    </div>
  );
}
