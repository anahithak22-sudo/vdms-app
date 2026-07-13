import { supabase } from '@/lib/supabase/client';
import { mapUnknownError } from '@/lib/supabase/errors';
import { ok, fail, type ServiceResponse } from '@/types/api';
import { APP } from '@/constants/app';

/** Supabase Storage buckets (PAD §20.2). */
export const BUCKETS = {
  avatars: 'avatars',
  attachments: 'attachments',
  imports: 'imports',
  exports: 'exports',
  reports: 'reports',
  archives: 'archives',
  temporary: 'temporary',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * File service (PAD §10 File Service). Enforces the 50 MB default limit (D-07)
 * client-side; storage bucket policies enforce it authoritatively.
 */
async function upload(
  bucket: BucketName,
  path: string,
  file: File,
): Promise<ServiceResponse<{ path: string }>> {
  if (file.size > APP.maxUploadBytes) {
    return fail({
      code: 'validation',
      message: `Файл превышает максимальный размер ${Math.round(APP.maxUploadBytes / 1024 / 1024)} МБ`,
    });
  }
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) return fail({ code: 'unexpected', message: 'Не удалось загрузить файл', details: error });
    return ok({ path: data.path });
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function createSignedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 300,
): Promise<ServiceResponse<{ url: string }>> {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data) return fail({ code: 'unexpected', message: 'Не удалось получить ссылку', details: error });
    return ok({ url: data.signedUrl });
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

async function remove(bucket: BucketName, path: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return fail({ code: 'unexpected', message: 'Не удалось удалить файл', details: error });
    return ok(null);
  } catch (e) {
    return fail(mapUnknownError(e));
  }
}

export const storageService = { upload, createSignedUrl, remove };
