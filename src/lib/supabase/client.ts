import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

/**
 * The single Supabase client for the application.
 * Per the architecture, UI components never import this directly — access
 * flows through the service layer only. Sessions persist and auto-refresh.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storageKey: 'vdms.auth',
  },
  global: {
    headers: { 'x-application-name': 'vdms', 'x-application-version': env.appVersion },
  },
});
