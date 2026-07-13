import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Service-role client (bypasses RLS). Never expose this key to the browser. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
}

/**
 * Resolve the caller from the Authorization header and confirm they are an
 * active Super Administrator. Returns the caller's app_users id or throws.
 */
export async function requireSuperAdmin(req: Request): Promise<{ actorId: string }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) throw new Error('unauthorized');

  const svc = serviceClient();
  const { data: userData, error } = await svc.auth.getUser(token);
  if (error || !userData.user) throw new Error('unauthorized');

  const { data: profile } = await svc
    .from('app_users')
    .select('id, role, is_active, is_deleted')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (!profile || profile.is_deleted || !profile.is_active || profile.role !== 'super_admin') {
    throw new Error('forbidden');
  }
  return { actorId: profile.id as string };
}
