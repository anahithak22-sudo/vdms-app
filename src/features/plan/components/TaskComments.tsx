import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { useTaskComments, useCommentMutations } from '../hooks';
import { ru } from '@/locales/ru';

export function TaskComments({ taskId }: { taskId: string }) {
  const { data: comments, isLoading } = useTaskComments(taskId);
  const m = useCommentMutations(taskId);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  async function add() {
    const body = draft.trim();
    if (!body) return;
    await m.add.mutateAsync(body);
    setDraft('');
  }
  async function saveEdit(id: string) {
    const body = editBody.trim();
    if (!body) return;
    await m.update.mutateAsync({ id, body });
    setEditingId(null);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={ru.plan.commentPlaceholder}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={add} loading={m.add.isPending} disabled={!draft.trim()}>
            {ru.plan.addComment}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{ru.common.loading}</p>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{ru.plan.noComments}</p>
      ) : (
        <ul className="space-y-2">
          {(comments ?? []).map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-muted/30 p-2.5">
              {editingId === c.id ? (
                <div className="space-y-2">
                  <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} />
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(c.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(c.created_at)}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditBody(c.body);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={ru.plan.edit}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => m.remove.mutate(c.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={ru.plan.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
