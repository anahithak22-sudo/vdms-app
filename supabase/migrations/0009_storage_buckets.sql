-- =============================================================================
-- 0009_storage_buckets.sql
-- Storage buckets (PAD §20.2) matching the BUCKETS map in storage.service.ts.
-- All buckets are private; access is brokered through signed URLs. The 50 MB
-- default limit (D-07) is enforced per bucket.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars',     'avatars',     false, 52428800),
  ('attachments', 'attachments', false, 52428800),
  ('imports',     'imports',     false, 52428800),
  ('exports',     'exports',     false, 52428800),
  ('reports',     'reports',     false, 52428800),
  ('archives',    'archives',    false, 52428800),
  ('temporary',   'temporary',   false, 52428800)
on conflict (id) do nothing;

-- Authenticated users may read/write objects; RLS on the owning business tables
-- plus signed-URL brokering govern exposure. Tighten per-bucket in later phases.
do $$
declare b text;
begin
  foreach b in array array['avatars','attachments','imports','exports','reports','archives','temporary']
  loop
    execute format($p$
      drop policy if exists %I on storage.objects;
      create policy %I on storage.objects
        for all
        using (bucket_id = %L and auth.uid() is not null)
        with check (bucket_id = %L and auth.uid() is not null);
    $p$, 'storage_' || b || '_authenticated', 'storage_' || b || '_authenticated', b, b);
  end loop;
end $$;

-- =============================================================================
-- DOWN (manual): delete from storage.buckets where id in (...); drop policies.
-- =============================================================================
