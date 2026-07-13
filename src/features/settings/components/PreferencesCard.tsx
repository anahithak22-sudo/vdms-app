import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserSettings, type UserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/useToast';
import { ru } from '@/locales/ru';

const VIEW_OPTIONS = [
  { value: 'table', label: ru.preferences.table },
  { value: 'board', label: ru.preferences.board },
];
const PAGE_SIZES = [10, 25, 50, 100].map((n) => ({ value: String(n), label: String(n) }));

export function PreferencesCard() {
  const toast = useToast();
  const { settings, isLoading, save, saving } = useUserSettings();
  const [draft, setDraft] = useState<UserSettings>(settings);

  useEffect(() => {
    if (!isLoading) setDraft(settings);
  }, [isLoading, settings]);

  function toggle(key: keyof UserSettings, value: boolean) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submit() {
    await save(draft);
    toast.success(ru.preferences.saved);
  }

  const toggles: [keyof UserSettings, string][] = [
    ['notifyAssignments', ru.preferences.notifyAssignments],
    ['notifyComments', ru.preferences.notifyComments],
    ['notifyReminders', ru.preferences.notifyReminders],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ru.preferences.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{ru.preferences.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{ru.preferences.defaultView}</label>
            <Select
              value={draft.defaultView}
              onValueChange={(v) => setDraft((d) => ({ ...d, defaultView: v as UserSettings['defaultView'] }))}
              options={VIEW_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{ru.preferences.pageSize}</label>
            <Select
              value={String(draft.pageSize)}
              onValueChange={(v) => setDraft((d) => ({ ...d, pageSize: Number(v) }))}
              options={PAGE_SIZES}
            />
          </div>
        </div>

        <div className="space-y-2">
          {toggles.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={draft[key] as boolean}
                onChange={(e) => toggle(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} loading={saving} disabled={isLoading}>
            {ru.common.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
