import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { RdevTag } from '../types';

/** Read-only colored tag chips (with hover showing the full label). */
export function TagChips({ tags }: { tags: RdevTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t.id}
          title={t.label}
          className="inline-flex max-w-[160px] items-center truncate rounded-full px-2 py-0.5 text-xs text-white"
          style={{ backgroundColor: t.color }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Editable tag selector: toggle existing tags, or type a new one and press
 * Enter to create it (created tags are saved for reuse). Deletion of saved
 * tags happens in the Tag manager, not here.
 */
export function TagSelector({
  allTags,
  selectedIds,
  onToggle,
  onCreate,
}: {
  allTags: RdevTag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreate: (label: string) => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const label = draft.trim();
    if (!label) return;
    const existing = allTags.find((t) => t.label.toLowerCase() === label.toLowerCase());
    if (existing) onToggle(existing.id);
    else onCreate(label);
    setDraft('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((t) => {
          const active = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={() => onToggle(t.id)}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition"
              style={
                active
                  ? { backgroundColor: t.color, borderColor: t.color, color: '#fff' }
                  : { borderColor: t.color, color: t.color }
              }
            >
              {active && <X className="h-3 w-3" />}
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Введите тег и нажмите Enter"
          className="h-8"
        />
        <button
          type="button"
          onClick={commit}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
