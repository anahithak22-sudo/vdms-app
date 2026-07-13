import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/types';

/**
 * Persists per-user UI preferences (D-16): filters, sorting, column visibility,
 * table layout, last-opened page, and general user preferences. Rows are
 * user-scoped and protected by RLS. Preferences are grouped by a "scope" key
 * (e.g. "app", "table:roadmap") so each module owns its own slice.
 */

export const PREFERENCE_SCOPE = {
  APP: 'app',
  /** Per-user interface preferences surfaced on the profile page (D-16). */
  USER_SETTINGS: 'user-settings',
  table: (module: string) => `table:${module}`,
} as const;

async function get<T>(scope: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('scope', scope)
    .maybeSingle();
  if (error || !data) return null;
  return data.preferences as T;
}

async function set(scope: string, preferences: unknown, userId: string): Promise<void> {
  await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, scope, preferences: preferences as Json },
      { onConflict: 'user_id,scope' },
    );
}

export const preferencesService = { get, set };
