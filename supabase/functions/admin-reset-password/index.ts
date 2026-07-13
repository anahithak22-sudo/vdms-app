// Supabase Edge Function: admin-reset-password
// Super Administrator resets a user's password to a new temporary one and
// re-arms the first-login flag so the user must change it on next sign-in.

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { serviceClient, requireSuperAdmin } from '../_shared/auth.ts';

interface ResetPayload {
  userId: string;
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const pick = (set: string, b: number) => set[b % set.length];
  const chars = [pick(upper, bytes[0]), pick(lower, bytes[1]), pick(digits, bytes[2]), pick(special, bytes[3])];
  for (let i = 4; i < 16; i++) chars.push(pick(all, bytes[i]));
  return chars.sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 1 : -1)).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  try {
    await requireSuperAdmin(req);

    const { userId } = (await req.json()) as ResetPayload;
    if (!userId) return jsonResponse({ error: 'invalid_user' }, 400);

    const svc = serviceClient();

    const { data: profile } = await svc
      .from('app_users')
      .select('auth_user_id')
      .eq('id', userId)
      .maybeSingle();
    if (!profile) return jsonResponse({ error: 'user_not_found' }, 404);

    const tempPassword = generateTempPassword();

    const { error: updateErr } = await svc.auth.admin.updateUserById(profile.auth_user_id, {
      password: tempPassword,
    });
    if (updateErr) return jsonResponse({ error: 'reset_failed' }, 500);

    await svc
      .from('app_users')
      .update({ is_first_login: true, failed_login_attempts: 0, is_locked: false, locked_until: null })
      .eq('id', userId);

    return jsonResponse({ temporaryPassword: tempPassword });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unexpected';
    const status = message === 'unauthorized' ? 401 : message === 'forbidden' ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
