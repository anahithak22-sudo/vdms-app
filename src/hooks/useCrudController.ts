import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { ru } from '@/locales/ru';

interface BaseRow {
  id: string;
  version: number;
  is_archived: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlled boundary: the generic hooks bundle is consumed structurally here.
// Payload types are erased to `any` so concrete per-table hooks remain
// assignable under strictFunctionTypes; callers pass validated payloads.
interface CrudHooksLike<Row> {
  useCreate: () => {
    mutateAsync: (payload: any) => Promise<Row>;
    isPending: boolean;
  };
  useUpdate: () => {
    mutateAsync: (vars: { id: string; payload: any; expectedVersion?: number }) => Promise<Row>;
    isPending: boolean;
  };
  useArchive: () => { mutateAsync: (id: string) => Promise<unknown>; isPending: boolean };
  useRestore: () => { mutateAsync: (id: string) => Promise<unknown>; isPending: boolean };
  useSoftDelete: () => { mutateAsync: (id: string) => Promise<unknown>; isPending: boolean };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Blank strings → null, so optional DB columns clear rather than store ''. */
export function emptyToNull<T extends object>(v: T): T {
  const out = { ...v } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === '') out[k] = null;
  return out as T;
}

/**
 * Encapsulates the create/edit/details/confirm state and the standard mutation
 * handlers shared by every artifact list page. Pages supply columns, filters,
 * and form/detail components; this owns the orchestration.
 */
export function useCrudController<Row extends BaseRow>(hooks: CrudHooksLike<Row>) {
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [detailsItem, setDetailsItem] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'archive' | 'delete'; row: Row } | null>(null);

  const create = hooks.useCreate();
  const update = hooks.useUpdate();
  const archive = hooks.useArchive();
  const restore = hooks.useRestore();
  const softDelete = hooks.useSoftDelete();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    setFormOpen(true);
  }
  function closeForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditing(null);
  }

  async function submit(payload: Record<string, unknown>): Promise<boolean> {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload, expectedVersion: editing.version });
        toast.success(ru.common.saved);
      } else {
        await create.mutateAsync(payload);
        toast.success(ru.common.createdOk);
      }
      setFormOpen(false);
      setEditing(null);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }

  async function changeStatus(row: Row, statusPayload: Record<string, unknown>) {
    try {
      await update.mutateAsync({ id: row.id, payload: statusPayload, expectedVersion: row.version });
      toast.success(ru.common.saved);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function runRestore(row: Row) {
    try {
      await restore.mutateAsync(row.id);
      toast.success(ru.common.restored);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.kind === 'delete') {
        await softDelete.mutateAsync(confirm.row.id);
        toast.success(ru.common.deleted);
      } else {
        await archive.mutateAsync(confirm.row.id);
        toast.success(ru.common.archived);
      }
      setConfirm(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return {
    toast,
    formOpen, setFormOpen: closeForm, editing, openCreate, openEdit,
    detailsItem, setDetailsItem,
    confirm, setConfirm,
    create, update, archive, restore, softDelete,
    submit, changeStatus, runRestore, runConfirm,
    submitting: create.isPending || update.isPending,
    confirming: archive.isPending || softDelete.isPending,
  };
}
