import { useMemo, useState } from 'react';
import {
  Users, Plus, KeyRound, ShieldCheck, Lock, Unlock, Archive, RotateCcw, Copy,
} from 'lucide-react';
import { PageHeader, StatusBadge, ConfirmDialog, type Tone } from '@/components/common/DisplayPrimitives';
import { FormDialog, Field, FieldGrid } from '@/components/common/FormDialog';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { DataTableToolbar } from '@/components/data/DataTableControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useUsers, useUserMutations } from '@/features/users/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ALL_ROLES } from '@/constants/roles';
import { formatDateTime } from '@/lib/format';
import type { AppUser } from '@/types/user';
import type { UserRole } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

const ROLE_OPTIONS = ALL_ROLES.map((r) => ({ value: r, label: ru.roles[r] }));

function statusTone(u: AppUser): Tone {
  if (!u.isActive) return 'danger';
  return 'success';
}
function statusLabel(u: AppUser): string {
  return u.isActive ? ru.users.active : ru.users.inactive;
}

interface Credential {
  username: string;
  password: string;
}

export default function UserManagementPage() {
  const toast = useToast();
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch, 300);
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useUsers(search || undefined, includeArchived);
  const mutations = useUserMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AppUser | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AppUser | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);

  const rows = data ?? [];

  const columns: Column<AppUser>[] = useMemo(
    () => [
      {
        key: 'businessId',
        header: ru.users.businessId,
        cell: (u) => <span className="font-mono text-xs text-muted-foreground">{u.businessId}</span>,
      },
      {
        key: 'username',
        header: ru.users.username,
        cell: (u) => <span className="text-sm font-medium text-foreground">{u.username}</span>,
      },
      {
        key: 'displayName',
        header: ru.users.displayName,
        cell: (u) => <span className="text-sm">{u.displayName}</span>,
      },
      {
        key: 'role',
        header: ru.users.role,
        cell: (u) => <StatusBadge label={ru.roles[u.role]} tone="info" />,
      },
      {
        key: 'department',
        header: ru.users.department,
        cell: (u) => <span className="text-sm text-muted-foreground">{u.department ?? '—'}</span>,
      },
      {
        key: 'status',
        header: ru.users.status,
        cell: (u) => <StatusBadge label={statusLabel(u)} tone={statusTone(u)} />,
      },
      {
        key: 'lastLogin',
        header: ru.users.lastLogin,
        cell: (u) => (
          <span className="text-xs text-muted-foreground">
            {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : ru.users.never}
          </span>
        ),
      },
    ],
    [],
  );

  async function runReset(u: AppUser) {
    const res = await mutations.resetPassword.mutateAsync(u.id);
    if (res.success && res.data) {
      setCredential({ username: u.username, password: res.data.temporaryPassword });
      toast.success(ru.users.passwordReset);
    } else {
      toast.error(res.message ?? 'Ошибка');
    }
  }

  async function runSetActive(u: AppUser, active: boolean) {
    const res = await mutations.setActive.mutateAsync({ userId: u.id, active });
    toast.fromResult(res, ru.users.statusChanged);
  }

  async function runUnlock(u: AppUser) {
    const res = await mutations.unlock.mutateAsync(u.id);
    toast.fromResult(res, ru.users.unlockedOk);
  }

  async function runRestore(u: AppUser) {
    const res = await mutations.restore.mutateAsync(u.id);
    toast.fromResult(res, ru.users.restoredOk);
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    const res = await mutations.archive.mutateAsync(archiveTarget.id);
    if (toast.fromResult(res, ru.users.archivedOk)) setArchiveTarget(null);
  }

  const actions: RowAction<AppUser>[] = [
    { key: 'reset', label: ru.users.resetPassword, icon: KeyRound, onSelect: runReset },
    { key: 'role', label: ru.users.changeRole, icon: ShieldCheck, onSelect: setRoleTarget },
    {
      key: 'deactivate',
      label: ru.users.deactivate,
      icon: Lock,
      onSelect: (u) => runSetActive(u, false),
      hidden: (u) => !u.isActive,
    },
    {
      key: 'activate',
      label: ru.users.activate,
      icon: Unlock,
      onSelect: (u) => runSetActive(u, true),
      hidden: (u) => u.isActive,
    },
    { key: 'unlock', label: ru.users.unlock, icon: Unlock, onSelect: runUnlock },
    {
      key: 'archive',
      label: ru.users.archive,
      icon: Archive,
      onSelect: setArchiveTarget,
      destructive: true,
      separatorBefore: true,
    },
    { key: 'restore', label: ru.users.restore, icon: RotateCcw, onSelect: runRestore },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ru.users.title}
        description={ru.users.subtitle}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {ru.users.create}
          </Button>
        }
      />

      <DataTableToolbar
        search={rawSearch}
        onSearchChange={setRawSearch}
        searchPlaceholder={ru.users.search}
        filters={
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            {ru.users.includeArchived}
          </label>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        actions={actions}
        emptyIcon={Users}
        emptyTitle={ru.users.empty}
      />

      {createOpen && (
        <CreateUserDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(cred) => {
            setCreateOpen(false);
            setCredential(cred);
          }}
        />
      )}

      {roleTarget && (
        <ChangeRoleDialog
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title={ru.users.confirmArchiveTitle}
        description={ru.users.confirmArchive}
        confirmLabel={ru.users.archive}
        destructive
        loading={mutations.archive.isPending}
        onConfirm={confirmArchive}
      />

      {credential && (
        <CredentialDialog credential={credential} onClose={() => setCredential(null)} />
      )}
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (cred: Credential) => void;
}) {
  const toast = useToast();
  const { create } = useUserMutations();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [department, setDepartment] = useState('');
  const [errors, setErrors] = useState<{ username?: string; displayName?: string }>({});

  function validate(): boolean {
    const next: { username?: string; displayName?: string } = {};
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(username.trim())) next.username = ru.users.usernameHint;
    if (displayName.trim().length < 2) next.displayName = ru.common.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    const res = await create.mutateAsync({
      username: username.trim(),
      displayName: displayName.trim(),
      role,
      department: department.trim() || null,
    });
    if (res.success && res.data) {
      toast.success(ru.users.created);
      onCreated({ username: res.data.username, password: res.data.temporaryPassword });
    } else {
      toast.error(res.message ?? 'Ошибка');
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={ru.users.createTitle}
      description={ru.users.createSubtitle}
      onSubmit={submit}
      submitting={create.isPending}
      submitLabel={ru.users.create}
    >
      <FieldGrid>
        <Field label={ru.users.username} required error={errors.username}>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </Field>
        <Field label={ru.users.displayName} required error={errors.displayName}>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label={ru.users.role} required>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)} options={ROLE_OPTIONS} />
        </Field>
        <Field label={ru.users.department}>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </Field>
      </FieldGrid>
    </FormDialog>
  );
}

function ChangeRoleDialog({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const toast = useToast();
  const { setRole } = useUserMutations();
  const [role, setRoleValue] = useState<UserRole>(user.role);

  async function submit() {
    const res = await setRole.mutateAsync({ userId: user.id, role });
    if (toast.fromResult(res, ru.users.roleChanged)) onClose();
  }

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={ru.users.changeRole}
      description={user.displayName}
      onSubmit={submit}
      submitting={setRole.isPending}
    >
      <Field label={ru.users.role} required>
        <Select value={role} onValueChange={(v) => setRoleValue(v as UserRole)} options={ROLE_OPTIONS} />
      </Field>
    </FormDialog>
  );
}

function CredentialDialog({ credential, onClose }: { credential: Credential; onClose: () => void }) {
  const toast = useToast();
  function copy() {
    void navigator.clipboard?.writeText(credential.password).then(
      () => toast.success(ru.common.saved),
      () => undefined,
    );
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ru.users.tempPasswordTitle}</DialogTitle>
          <DialogDescription>{ru.users.tempPasswordHint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">{ru.users.username}</span>
            <span className="font-mono text-sm text-foreground">{credential.username}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="font-mono text-sm text-foreground">{credential.password}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copy} aria-label={ru.common.save}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{ru.users.tempPasswordCopyHint}</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{ru.common.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
