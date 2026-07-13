import { Eye, Pencil, Archive, RotateCcw, Trash2 } from 'lucide-react';
import type { RowAction } from '@/components/data/DataTable';
import { ru } from '@/locales/ru';

interface BaseRow {
  is_archived: boolean;
}

interface StandardActionsConfig<Row extends BaseRow> {
  onDetails: (row: Row) => void;
  onEdit?: (row: Row) => void;
  onArchive?: (row: Row) => void;
  onRestore?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  canEdit?: (row: Row) => boolean;
  canManage?: (row: Row) => boolean;
}

/**
 * Builds the conventional row-action menu (details / edit / archive / restore /
 * delete). Capability predicates hide actions a role may not perform; RLS
 * remains the authoritative guard.
 */
export function standardRowActions<Row extends BaseRow>(
  cfg: StandardActionsConfig<Row>,
): RowAction<Row>[] {
  const actions: RowAction<Row>[] = [
    { key: 'details', label: ru.common.details, icon: Eye, onSelect: cfg.onDetails },
  ];

  if (cfg.onEdit) {
    actions.push({
      key: 'edit',
      label: ru.common.edit,
      icon: Pencil,
      hidden: (r) => (cfg.canEdit ? !cfg.canEdit(r) : false),
      onSelect: cfg.onEdit,
    });
  }

  if (cfg.onArchive) {
    actions.push({
      key: 'archive',
      label: ru.common.archive,
      icon: Archive,
      separatorBefore: true,
      hidden: (r) => r.is_archived || (cfg.canManage ? !cfg.canManage(r) : false),
      onSelect: cfg.onArchive,
    });
  }
  if (cfg.onRestore) {
    actions.push({
      key: 'restore',
      label: ru.common.restore,
      icon: RotateCcw,
      separatorBefore: true,
      hidden: (r) => !r.is_archived || (cfg.canManage ? !cfg.canManage(r) : false),
      onSelect: cfg.onRestore,
    });
  }
  if (cfg.onDelete) {
    actions.push({
      key: 'delete',
      label: ru.common.delete,
      icon: Trash2,
      destructive: true,
      hidden: (r) => (cfg.canManage ? !cfg.canManage(r) : false),
      onSelect: cfg.onDelete,
    });
  }

  return actions;
}
