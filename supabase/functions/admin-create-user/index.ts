// Supabase Edge Function: admin-create-user
// Creates a Supabase Auth user and a matching app_users profile.
// Only an active Super Administrator may call it. Accounts are never
// self-registered (PAD §6.1). Returns the generated temporary password once.

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { serviceClient, requireSuperAdmin } from '../_shared/auth.ts';

interface CreateUserPayload {
  username: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'developer';
  department?: string | null;
}

const ROLES = ['super_admin', 'admin', 'manager', 'developer'];

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const pick = (set: string, b: number) => set[b % set.length];
  // Guarantee one of each class, then fill to 16.
  const chars = [pick(upper, bytes[0]), pick(lower, bytes[1]), pick(digits, bytes[2]), pick(special, bytes[3])];
  for (let i = 4; i < 16; i++) chars.push(pick(all, bytes[i]));
  return chars.sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 1 : -1)).join('');
}

// Internal, non-displayed email derived from the username (email is never shown in the UI).
function internalEmail(username: string): string {
  const domain = Deno.env.get('VDMS_INTERNAL_EMAIL_DOMAIN') ?? 'vdms.local';
  return `${username.toLowerCase()}@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  try {
    await requireSuperAdmin(req);

    const payload = (await req.json()) as CreateUserPayload;
    const username = payload.username?.trim();
    const displayName = payload.displayName?.trim();

    if (!username || username.length < 3) return jsonResponse({ error: 'invalid_username' }, 400);
    if (!displayName) return jsonResponse({ error: 'invalid_display_name' }, 400);
    if (!ROLES.includes(payload.role)) return jsonResponse({ error: 'invalid_role' }, 400);

    const svc = serviceClient();

    const { data: existing } = await svc
      .from('app_users')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
    if (existing) return jsonResponse({ error: 'username_taken' }, 409);

    const tempPassword = generateTempPassword();

    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email: internalEmail(username),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });
    if (createErr || !created.user) return jsonResponse({ error: 'auth_create_failed' }, 500);

    const { data: profile, error: profileErr } = await svc
      .from('app_users')
      .insert({
        auth_user_id: created.user.id,
        username,
        display_name: displayName,
        role: payload.role,
        department: payload.department ?? null,
        is_first_login: true,
        is_active: true,
      })
      .select('id, business_id, username, display_name, role')
      .single();

    if (profileErr || !profile) {
      // Roll back the orphaned auth user if the profile insert failed.
      await svc.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: 'profile_create_failed' }, 500);
    }

    return jsonResponse({
      user: profile,
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unexpected';
    const status = message === 'unauthorized' ? 401 : message === 'forbidden' ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
