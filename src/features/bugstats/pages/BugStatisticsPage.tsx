import { useMemo, useState } from 'react';
import { Bug, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/constants/roles';
import { formatDate } from '@/lib/format';
import { exportToExcel } from '@/lib/export-excel';
import { useBugStats, useBugStatsMutations } from '../hooks';
import type { BugStat } from '../service';
import { ru } from '@/locales/ru';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function BugStatisticsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

  const { data, isLoading } = useBugStats();
  const m = useBugStatsMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BugStat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BugStat | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const totals = useMemo(() => {
    const opened = rows.reduce((a, r) => a + r.opened, 0);
    const closed = rows.reduce((a, r) => a + r.closed, 0);
    const rstyle = rows.reduce((a, r) => a + r.in_progress_rstyle, 0);
    const vtba = rows.reduce((a, r) => a + r.in_progress_vtba, 0);
    const pct = (n: number) => (opened > 0 ? `${((n / opened) * 100).toFixed(1)}%` : '—');
    const closeRate = opened > 0 ? `${((closed / opened) * 100).toFixed(1)}%` : '—';
    return { opened, closed, rstyle, vtba, inProgress: rstyle + vtba, rstylePct: pct(rstyle), vtbaPct: pct(vtba), closeRate };
  }, [rows]);

  const chartData = useMemo(
    () => rows.map((r) => ({ date: formatDate(r.stat_date), Открыто: r.opened, Закрыто: r.closed })),
    [rows],
  );

  const columns: Column<BugStat>[] = [
    { key: 'date', header: ru.bugstats.date, cell: (r) => <span className="text-sm font-medium">{formatDate(r.stat_date)}</span> },
    { key: 'opened', header: ru.bugstats.opened, cell: (r) => r.opened },
    { key: 'rstyle', header: ru.bugstats.inProgressRstyle, cell: (r) => r.in_progress_rstyle },
    { key: 'vtba', header: ru.bugstats.inProgressVtba, cell: (r) => r.in_progress_vtba },
    { key: 'closed', header: ru.bugstats.closed, cell: (r) => r.closed },
    { key: 'comment', header: ru.bugstats.comment, cell: (r) => <span className="text-xs text-muted-foreground">{r.comment ?? ''}</span> },
  ];

  const actions: RowAction<BugStat>[] | undefined = isAdmin
    ? [
        { key: 'edit', label: ru.bugstats.edit, icon: Pencil, onSelect: (r) => { setEditing(r); setFormOpen(true); } },
        { key: 'delete', label: ru.bugstats.delete, icon: Trash2, destructive: true, separatorBefore: true, onSelect: setDeleteTarget },
      ]
    : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title={ru.bugstats.title}
        description={ru.bugstats.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportToExcel('bug_stats', ru.bugstats.title, rows.map((r) => ({
                  [ru.bugstats.date]: r.stat_date,
                  [ru.bugstats.opened]: r.opened,
                  [ru.bugstats.inProgressRstyle]: r.in_progress_rstyle,
                  [ru.bugstats.inProgressVtba]: r.in_progress_vtba,
                  [ru.bugstats.closed]: r.closed,
                  [ru.bugstats.comment]: r.comment ?? '',
                })))
              }
            >
              <Upload className="h-4 w-4" />
              {ru.common.exportExcel}
            </Button>
            {isAdmin && (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />
                {ru.bugstats.add}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={ru.bugstats.totalOpened} value={totals.opened} hint={`${ru.bugstats.closed}: ${totals.closeRate}`} />
        <Stat label={ru.bugstats.totalClosed} value={totals.closed} />
        <Stat label={ru.bugstats.rstyleShare} value={totals.rstyle} hint={totals.rstylePct} />
        <Stat label={ru.bugstats.vtbaShare} value={totals.vtba} hint={totals.vtbaPct} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-foreground">{ru.bugstats.trend}</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ left: -10, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Открыто" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Закрыто" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{ru.common.loading}</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Bug} title={ru.bugstats.empty} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} actions={actions} />
      )}

      {formOpen && <BugForm editing={editing} onClose={() => setFormOpen(false)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={ru.bugstats.confirmDeleteTitle}
        description={ru.bugstats.confirmDelete}
        confirmLabel={ru.bugstats.delete}
        destructive
        loading={m.remove.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (toast.fromResult(await m.remove.mutateAsync(deleteTarget.id), ru.bugstats.deletedOk)) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function numOr0(v: string): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function BugForm({ editing, onClose }: { editing: BugStat | null; onClose: () => void }) {
  const toast = useToast();
  const m = useBugStatsMutations();
  const [date, setDate] = useState(editing?.stat_date ?? new Date().toISOString().slice(0, 10));
  const [opened, setOpened] = useState(String(editing?.opened ?? 0));
  const [rstyle, setRstyle] = useState(String(editing?.in_progress_rstyle ?? 0));
  const [vtba, setVtba] = useState(String(editing?.in_progress_vtba ?? 0));
  const [closed, setClosed] = useState(String(editing?.closed ?? 0));
  const [comment, setComment] = useState(editing?.comment ?? '');
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (!date) {
      setError(ru.common.required);
      return;
    }
    const payload = {
      stat_date: date,
      opened: numOr0(opened),
      in_progress_rstyle: numOr0(rstyle),
      in_progress_vtba: numOr0(vtba),
      closed: numOr0(closed),
      comment: comment.trim() || null,
    };
    if (editing) {
      if (toast.fromResult(await m.update.mutateAsync({ id: editing.id, patch: payload }), ru.bugstats.savedOk)) onClose();
    } else {
      if (toast.fromResult(await m.create.mutateAsync(payload), ru.bugstats.createdOk)) onClose();
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={editing ? ru.bugstats.edit : ru.bugstats.add}
      onSubmit={submit}
      submitting={m.create.isPending || m.update.isPending}
      wide
    >
      <Field label={ru.bugstats.date} required error={error}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <FieldGrid>
        <Field label={ru.bugstats.opened}>
          <Input type="number" min={0} value={opened} onChange={(e) => setOpened(e.target.value)} />
        </Field>
        <Field label={ru.bugstats.closed}>
          <Input type="number" min={0} value={closed} onChange={(e) => setClosed(e.target.value)} />
        </Field>
        <Field label={ru.bugstats.inProgressRstyle}>
          <Input type="number" min={0} value={rstyle} onChange={(e) => setRstyle(e.target.value)} />
        </Field>
        <Field label={ru.bugstats.inProgressVtba}>
          <Input type="number" min={0} value={vtba} onChange={(e) => setVtba(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ru.bugstats.comment}>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
      </Field>
    </FormDialog>
  );
}
