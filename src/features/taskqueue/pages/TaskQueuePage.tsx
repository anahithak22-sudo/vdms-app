import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ListChecks, Plus, RotateCcw, ExternalLink, Trash2, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, StatusBadge, ConfirmDialog } from '@/components/common/DisplayPrimitives';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/constants/roles';
import { currentWeek, nextWeek, prevWeek, type WeekRef } from '@/lib/week';
import { exportToExcel } from '@/lib/export-excel';
import { useQueueItems, useQueueMutations } from '../hooks';
import { taskQueueService, type QueueItem, type QueueFixedStatus } from '../service';
import { parseQueueWorkbook } from '../import';
import type { QueuePage } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

const PAGES: { value: QueuePage; label: string }[] = [
  { value: 'v_rabote', label: ru.queue.pageInWork },
  { value: 'priemka', label: ru.queue.pagePriemka },
  { value: 'i_support', label: ru.queue.pageISupport },
];

const STATUS_OPTIONS: { value: QueueFixedStatus; label: string }[] = [
  { value: 'not_fixed', label: ru.queue.statusNotFixed },
  { value: 'fixed_test', label: ru.queue.statusFixedTest },
  { value: 'fixed_preprod', label: ru.queue.statusFixedPreprod },
  { value: 'fixed_prod', label: ru.queue.statusFixedProd },
];
const STATUS_SELECT = [{ value: '', label: ru.queue.statusPlaceholder }, ...STATUS_OPTIONS];
const statusLabel = (v: string | null) => STATUS_OPTIONS.find((s) => s.value === v)?.label ?? '—';

export default function TaskQueuePage() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const [tab, setTab] = useState<string>('v_rabote');
  const [week, setWeek] = useState<WeekRef>(currentWeek());
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const sheets = await parseQueueWorkbook(file);
      let added = 0;
      let skipped = 0;
      for (const sh of sheets) {
        const res = await taskQueueService.importItems(sh.page, sh.week, sh.rows);
        if (res.success && res.data) { added += res.data.added; skipped += res.data.skipped; }
      }
      await qc.invalidateQueries({ queryKey: ['taskqueue'] });
      toast.success(`${ru.queue.importedOk}: +${added}${skipped ? ` · ${skipped}✕` : ''}`);
    } catch {
      toast.error(ru.queue.uploadError);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={ru.queue.title}
        description={ru.queue.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImport} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} loading={importing}>
              <Download className="h-4 w-4" />
              {ru.common.importExcel}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setWeek(prevWeek(week))} aria-label={ru.queue.prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[120px] text-center text-sm font-semibold text-foreground">{week.tag} · {week.year}</span>
        <Button variant="outline" size="icon" onClick={() => setWeek(nextWeek(week))} aria-label={ru.queue.nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeek(currentWeek())}>{ru.queue.currentWeek}</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {PAGES.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
          ))}
          {isSuperAdmin && <TabsTrigger value="archived">{ru.queue.archived}</TabsTrigger>}
        </TabsList>
        {PAGES.map((p) => (
          <TabsContent key={p.value} value={p.value}>
            <QueueList page={p.value} week={week} />
          </TabsContent>
        ))}
        {isSuperAdmin && (
          <TabsContent value="archived">
            <ArchivedList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function AttachmentCols(page: QueuePage, withStatusControl: boolean): Column<QueueItem>[] {
  return [
    { key: 'ext', header: ru.queue.taskId, cell: (r) => <span className="font-mono text-xs">{r.external_task_id ?? r.business_id}</span> },
    { key: 'week', header: ru.queue.week, cell: (r) => (r.week_tag ? <StatusBadge label={r.week_tag} tone="info" /> : '—') },
    { key: 'desc', header: ru.queue.description, cell: (r) => <span className="text-sm">{r.description}</span> },
    { key: 'priority', header: ru.queue.priority, cell: (r) => <span className="text-sm text-muted-foreground">{r.priority ?? '—'}</span> },
    {
      key: 'status', header: ru.queue.fixed,
      cell: (r) =>
        withStatusControl ? (
          <div onClick={(e) => e.stopPropagation()}><StatusSelect item={r} page={page} /></div>
        ) : (
          <span className="text-sm text-muted-foreground">{statusLabel(r.fixed_status)}</span>
        ),
    },
    {
      key: 'link', header: ru.queue.link,
      cell: (r) =>
        r.task_link ? (
          <a href={r.task_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : '—',
    },
    { key: 'comment', header: ru.queue.comment, cell: (r) => <span className="text-xs text-muted-foreground">{r.comment ?? ''}</span> },
  ];
}

function StatusSelect({ item, page }: { item: QueueItem; page: QueuePage }) {
  const toast = useToast();
  const m = useQueueMutations(page);
  return (
    <Select
      value={(item.fixed_status as string) ?? ''}
      onValueChange={async (v) => {
        if (!v) return;
        const res = await m.setStatus.mutateAsync({ item, status: v as QueueFixedStatus });
        const msg = v === 'fixed_prod' ? ru.queue.archivedOk : (v === 'fixed_preprod' || v === 'not_fixed') ? ru.queue.movedNextWeek : ru.queue.savedOk;
        toast.fromResult(res, msg);
      }}
      options={STATUS_SELECT}
      className="h-8 min-w-[190px]"
    />
  );
}

function exportRows(page: QueuePage, week: WeekRef, rows: QueueItem[]) {
  const label = PAGES.find((p) => p.value === page)?.label ?? 'queue';
  exportToExcel(`queue_${label}_${week.tag}`, label, rows.map((r) => ({
    [ru.queue.taskId]: r.external_task_id ?? r.business_id,
    [ru.queue.week]: r.week_tag ?? '',
    [ru.queue.description]: r.description,
    [ru.queue.priority]: r.priority ?? '',
    [ru.queue.fixed]: statusLabel(r.fixed_status),
    [ru.queue.link]: r.task_link ?? '',
    [ru.queue.comment]: r.comment ?? '',
  })));
}

function QueueList({ page, week }: { page: QueuePage; week: WeekRef }) {
  const toast = useToast();
  const { data, isLoading } = useQueueItems(page, week, false);
  const m = useQueueMutations(page);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QueueItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QueueItem | null>(null);
  const rows = data ?? [];

  const actions: RowAction<QueueItem>[] = [
    { key: 'edit', label: ru.queue.edit, onSelect: (r) => { setEditing(r); setFormOpen(true); } },
    { key: 'delete', label: ru.common.delete, icon: Trash2, destructive: true, separatorBefore: true, onSelect: setDeleteTarget },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => exportRows(page, week, rows)}>
          <Upload className="h-4 w-4" />
          {ru.common.exportExcel}
        </Button>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          {ru.queue.add}
        </Button>
      </div>
      <DataTable columns={AttachmentCols(page, true)} rows={rows} rowKey={(r) => r.id} loading={isLoading} actions={actions} emptyIcon={ListChecks} emptyTitle={ru.queue.empty} />

      {formOpen && <QueueForm page={page} week={week} editing={editing} onClose={() => setFormOpen(false)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={ru.queue.confirmDeleteTitle}
        description={ru.queue.confirmDelete}
        confirmLabel={ru.common.delete}
        destructive
        loading={m.remove.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (toast.fromResult(await m.remove.mutateAsync(deleteTarget.id), ru.common.saved)) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function ArchivedList() {
  return (
    <div className="space-y-6">
      {PAGES.map((p) => (
        <ArchivedPageList key={p.value} page={p.value} label={p.label} />
      ))}
    </div>
  );
}

function ArchivedPageList({ page, label }: { page: QueuePage; label: string }) {
  const toast = useToast();
  const { data, isLoading } = useQueueItems(page, null, true);
  const m = useQueueMutations(page);
  const rows = data ?? [];
  if (!isLoading && rows.length === 0) return null;
  const actions: RowAction<QueueItem>[] = [
    { key: 'restore', label: ru.queue.restore, icon: RotateCcw, onSelect: async (r) => { toast.fromResult(await m.restore.mutateAsync(r.id), ru.queue.restoredOk); } },
  ];
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{label}</h3>
      <DataTable columns={AttachmentCols(page, false)} rows={rows} rowKey={(r) => r.id} loading={isLoading} actions={actions} emptyIcon={ListChecks} emptyTitle={ru.queue.empty} />
    </div>
  );
}

function QueueForm({ page, week, editing, onClose }: { page: QueuePage; week: WeekRef; editing: QueueItem | null; onClose: () => void }) {
  const toast = useToast();
  const m = useQueueMutations(page);
  const [ext, setExt] = useState(editing?.external_task_id ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [priority, setPriority] = useState(editing?.priority ?? '');
  const [link, setLink] = useState(editing?.task_link ?? '');
  const [fixed, setFixed] = useState<string>(editing?.fixed_status ?? '');
  const [comment, setComment] = useState(editing?.comment ?? '');
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (description.trim().length < 2) {
      setError(ru.common.required);
      return;
    }
    const payload = {
      external_task_id: ext.trim() || null,
      description: description.trim(),
      priority: priority.trim() || null,
      task_link: link.trim() || null,
      fixed_status: fixed || null,
      comment: comment.trim() || null,
    };
    if (editing) {
      if (toast.fromResult(await m.update.mutateAsync({ id: editing.id, patch: payload }), ru.queue.savedOk)) onClose();
    } else {
      if (toast.fromResult(await m.create.mutateAsync({ week, input: payload }), ru.queue.createdOk)) onClose();
    }
  }

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={editing ? ru.queue.edit : ru.queue.add} onSubmit={submit} submitting={m.create.isPending || m.update.isPending} wide>
      <FieldGrid>
        <Field label={ru.queue.taskId}>
          <Input value={ext} onChange={(e) => setExt(e.target.value)} />
        </Field>
        <Field label={ru.queue.priority}>
          <Input value={priority} onChange={(e) => setPriority(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ru.queue.description} required error={error}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      <FieldGrid>
        <Field label={ru.queue.fixed}>
          <Select value={fixed} onValueChange={setFixed} options={STATUS_SELECT} />
        </Field>
        <Field label={ru.queue.link}>
          <Input value={link} onChange={(e) => setLink(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ru.queue.comment}>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
      </Field>
    </FormDialog>
  );
}
