import type { ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, EmptyState, type Tone } from '@/components/common/DisplayPrimitives';
import { History } from 'lucide-react';
import { useEntityHistory } from '@/hooks/useAuditLog';
import { AUDIT_ACTION_LABELS } from '@/constants/enums';
import { formatDateTime } from '@/lib/format';

/** Centered details modal used by every artifact's "open record" flow. */
export function DetailsDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  statusLabel,
  statusTone,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: Tone;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/** Field row for details panels. */
export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Audit-backed history list for a single record. Reused by every artifact's
 * History tab (data comes from audit_logs via useEntityHistory).
 */
export function HistoryTab({ table, entityId }: { table: string; entityId: string | undefined }) {
  const { data, isLoading } = useEntityHistory(table, entityId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={History} title="История изменений пуста" />;
  }

  return (
    <ol className="space-y-3">
      {data.map((entry) => (
        <li key={entry.id} className="rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {AUDIT_ACTION_LABELS[entry.action]}
            </span>
            <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
          </div>
          {entry.actor_username && (
            <p className="mt-1 text-xs text-muted-foreground">{entry.actor_username}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
