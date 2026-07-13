import { supabase } from '@/lib/supabase/client';
import { toAppUser, type AppUser } from '@/types/user';
import { APP } from '@/constants/app';
import { ru } from '@/locales/ru';
import { ok, fail, type ServiceResponse } from '@/types/api';
import type { LoginResult, LoginAttemptOutcome } from '@/features/auth/types/auth.types';
import type { LoginInput } from '@/features/auth/validators/auth.schema';

/**
 * Authentication service.
 *
 * Login flow (frozen D-01): the user submits a username. The email is resolved
 * server-side by a SECURITY DEFINER function and used only transiently to call
 * Supabase Auth — it is never surfaced to the UI. Account lockout after five
 * consecutive failures for thirty minutes (D-05) is tracked and enforced by the
 * database; the client only reflects the outcome.
 */

function minutesUntil(iso: string | null): number {
  if (!iso) return APP.lockoutMinutes;
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / 60_000));
}

async function recordLoginResult(
  username: string,
  success: boolean,
): Promise<LoginAttemptOutcome | null> {
  const { data, error } = await supabase.rpc('record_login_result', {
    p_username: username,
    p_success: success,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    locked: row.locked,
    lockedUntil: row.locked_until,
    attemptsRemaining: row.attempts_remaining,
  };
}

async function loadCurrentUser(): Promise<AppUser | null> {
  const { data, error } = await supabase.rpc('current_app_user');
  if (error || !data || data.length === 0) return null;
  return toAppUser(data[0]);
}

async function login(input: LoginInput): Promise<ServiceResponse<LoginResult>> {
  try {
    // 1. Resolve username -> email without exposing the address to the client UI.
    const { data: email, error: resolveError } = await supabase.rpc('resolve_username_to_email', {
      p_username: input.username,
    });

    // Do not reveal whether the username exists; treat as invalid credentials.
    if (resolveError || !email) {
      await recordLoginResult(input.username, false).catch(() => null);
      return fail({ code: 'authentication', message: ru.auth.invalidCredentials });
    }

    // 2. Authenticate with Supabase Auth using the resolved email.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError) {
      const outcome = await recordLoginResult(input.username, false).catch(() => null);
      if (outcome?.locked) {
        return fail({
          code: 'locked',
          message: ru.auth.accountLockedFor(minutesUntil(outcome.lockedUntil)),
        });
      }
      if (outcome && outcome.attemptsRemaining > 0) {
        return fail({
          code: 'authentication',
          message: `${ru.auth.invalidCredentials}. ${ru.auth.attemptsRemaining(outcome.attemptsRemaining)}`,
        });
      }
      return fail({ code: 'authentication', message: ru.auth.invalidCredentials });
    }

    // 3. Load the application profile (also confirms the account is active).
    const user = await loadCurrentUser();
    if (!user) {
      await supabase.auth.signOut();
      return fail({ code: 'authorization', message: ru.auth.genericError });
    }
    if (!user.isActive) {
      await supabase.auth.signOut();
      return fail({ code: 'authorization', message: ru.auth.accountInactive });
    }

    await recordLoginResult(input.username, true).catch(() => null);

    return ok<LoginResult>({ user, requiresPasswordChange: user.isFirstLogin });
  } catch {
    return fail({ code: 'unexpected', message: ru.auth.genericError });
  }
}

async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ServiceResponse<AppUser>> {
  try {
    const { data: sessionData } = await supabase.auth.getUser();
    const authUser = sessionData.user;
    if (!authUser?.email) {
      return fail({ code: 'authentication', message: ru.auth.sessionExpired });
    }
    const email = authUser.email;

    // Re-verify the current password before allowing the change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) {
      return fail({ code: 'authentication', message: ru.auth.invalidCredentials });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return fail({ code: 'unexpected', message: ru.auth.genericError });
    }

    // Clear the first-login flag once the mandatory change succeeds.
    const { error: flagError } = await supabase
      .from('app_users')
      .update({ is_first_login: false })
      .eq('auth_user_id', authUser.id);
    if (flagError) {
      return fail({ code: 'database', message: ru.auth.genericError });
    }

    const user = await loadCurrentUser();
    if (!user) return fail({ code: 'unexpected', message: ru.auth.genericError });
    return ok(user, ru.auth.passwordChanged);
  } catch {
    return fail({ code: 'unexpected', message: ru.auth.genericError });
  }
}

async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

async function getSessionUser(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return loadCurrentUser();
}

export const authService = {
  login,
  logout,
  changePassword,
  getSessionUser,
  loadCurrentUser,
};
