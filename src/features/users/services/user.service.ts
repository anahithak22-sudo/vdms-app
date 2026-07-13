import { supabase } from '@/lib/supabase/client';
import { mapPostgrestError, mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import { toAppUser, type AppUser } from '@/types/user';
import type { UserRole, Tables } from '@/lib/supabase/types';
import type {
  CreateUserInput,
  CreatedUser,
  PasswordResetResult,
} from '@/features/users/types/user-management.types';

/**
 * User-management service (PAD §10 User Service). List/lifecycle operations use
 * SECURITY DEFINER RPCs guarded for Super Admin; account creation and password
 * reset use Edge Functions because they touch auth.users with the service role.
 */

async function list(search?: string, includeArchived = false): Promise<ServiceResponse<AppUser[]>> {
  try {
    const { data, error } = await supabase.rpc('admin_list_users', {
      p_search: search ?? undefined,
      p_include_archived: includeArchived,
    });
    if (error) return fail(mapPostgrestError(error));
    return ok(((data ?? []) as Tables<'app_users'>[]).map(toAppUser));
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function getById(id: string): Promise<ServiceResponse<AppUser>> {
  try {
    const { data, error } = await supabase.from('app_users').select('*').eq('id', id).maybeSingle();
    if (error) return fail(mapPostgrestError(error));
    if (!data) return fail({ code: 'not_found', message: 'Пользователь не найден' });
    return ok(toAppUser(data as Tables<'app_users'>));
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function create(input: CreateUserInput): Promise<ServiceResponse<CreatedUser>> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        username: input.username,
        displayName: input.displayName,
        role: input.role,
        department: input.department ?? null,
      },
    });
    if (error) return fail({ code: 'unexpected', message: 'Не удалось создать пользователя', details: error });
    const body = data as { user: Omit<CreatedUser, 'temporaryPassword'>; temporaryPassword: string } | { error: string };
    if ('error' in body) return fail(mapCreateError(body.error));
    return ok({ ...body.user, temporaryPassword: body.temporaryPassword });
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function resetPassword(userId: string): Promise<ServiceResponse<PasswordResetResult>> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { userId },
    });
    if (error) return fail({ code: 'unexpected', message: 'Не удалось сбросить пароль', details: error });
    const body = data as PasswordResetResult | { error: string };
    if ('error' in body) return fail({ code: 'unexpected', message: 'Не удалось сбросить пароль' });
    return ok(body);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function setRole(userId: string, role: UserRole): Promise<ServiceResponse<null>> {
  return rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
}
async function setActive(userId: string, active: boolean): Promise<ServiceResponse<null>> {
  return rpc('admin_set_user_active', { p_user_id: userId, p_active: active });
}
async function archive(userId: string): Promise<ServiceResponse<null>> {
  return rpc('admin_archive_user', { p_user_id: userId });
}
async function restore(userId: string): Promise<ServiceResponse<null>> {
  return rpc('admin_restore_user', { p_user_id: userId });
}
async function unlock(userId: string): Promise<ServiceResponse<null>> {
  return rpc('unlock_account', { p_user_id: userId });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpc(fn: any, args: any): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.rpc(fn, args);
    if (error) return fail(mapPostgrestError(error));
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

function mapCreateError(code: string): { code: 'conflict' | 'validation' | 'authorization' | 'unexpected'; message: string } {
  switch (code) {
    case 'username_taken':
      return { code: 'conflict', message: 'Имя пользователя уже занято' };
    case 'invalid_username':
      return { code: 'validation', message: 'Некорректное имя пользователя' };
    case 'invalid_display_name':
      return { code: 'validation', message: 'Укажите отображаемое имя' };
    case 'invalid_role':
      return { code: 'validation', message: 'Некорректная роль' };
    case 'forbidden':
    case 'unauthorized':
      return { code: 'authorization', message: 'Недостаточно прав' };
    default:
      return { code: 'unexpected', message: 'Не удалось создать пользователя' };
  }
}

export const userService = {
  list,
  getById,
  create,
  resetPassword,
  setRole,
  setActive,
  archive,
  restore,
  unlock,
};
