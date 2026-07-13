import { useState } from 'react';
import { Trash2, Plus, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlanMutations } from '../hooks';
import { useToast } from '@/hooks/useToast';
import type { PlanStatus } from '../types';
import { ru } from '@/locales/ru';

export function StatusManager({
  open,
  onOpenChange,
  statuses,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  statuses: PlanStatus[];
}) {
  const toast = useToast();
  const m = usePlanMutations();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#64748b');

  async function rename(s: PlanStatus, name: string) {
    if (name.trim() && name !== s.name) {
      const res = await m.updateStatus.mutateAsync({ id: s.id, patch: { name: name.trim() } });
      toast.fromResult(res, ru.plan.savedOk);
    }
  }
  async function recolor(s: PlanStatus, color: string) {
    const res = await m.updateStatus.mutateAsync({ id: s.id, patch: { color } });
    toast.fromResult(res, ru.plan.savedOk);
  }
  async function toggleTerminal(s: PlanStatus, is_terminal: boolean) {
    const res = await m.updateStatus.mutateAsync({ id: s.id, patch: { is_terminal } });
    toast.fromResult(res, ru.plan.savedOk);
  }
  async function remove(s: PlanStatus) {
    const res = await m.deleteStatus.mutateAsync(s.id);
    if (!res.success) toast.error(ru.plan.deleteColumnBlocked);
    else toast.success(ru.plan.savedOk);
  }
  async function add() {
    if (!newName.trim()) return;
    const res = await m.createStatus.mutateAsync({
      name: newName.trim(),
      color: newColor,
      sort_order: statuses.length,
      is_terminal: false,
    });
    if (res.success) {
      setNewName('');
      toast.success(ru.plan.savedOk);
    } else toast.error(res.message ?? 'Ошибка');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ru.plan.manageColumns}</DialogTitle>
          <DialogDescription>{ru.plan.columns}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {statuses.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-border p-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => recolor(s, e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border border-border"
                aria-label={ru.plan.color}
              />
              <Input
                defaultValue={s.name}
                onBlur={(e) => rename(s, e.target.value)}
                className="h-8 flex-1"
              />
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Checkbox
                  checked={s.is_terminal}
                  onChange={(e) => toggleTerminal(s, e.target.checked)}
                />
                {ru.plan.terminal}
              </label>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(s)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-border"
            aria-label={ru.plan.color}
          />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={ru.plan.columnName}
            className="h-8 flex-1"
          />
          <Button size="sm" onClick={add} loading={m.createStatus.isPending}>
            <Plus className="h-4 w-4" />
            {ru.plan.addColumn}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Check className="h-4 w-4" />
            {ru.common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
