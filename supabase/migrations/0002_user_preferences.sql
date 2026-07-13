-- =============================================================================
-- 0002_user_preferences.sql
-- Per-user UI preferences (D-16): filters, sorting, column visibility, table
-- layout, last-opened page, and general preferences. One row per (user, scope).
-- User-scoped and protected by RLS: a user reads/writes only their own rows.
-- =============================================================================

create table if not exists public.user_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users (id) on delete cascade,
  scope       text not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint user_preferences_user_scope_uk unique (user_id, scope)
);

create index if not exists idx_user_preferences_user on public.user_preferences (user_id);

-- user_preferences has no `version` column, so use a lightweight updated_at
-- touch rather than the shared tg_touch_row() used by versioned entities.
create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_preferences_touch on public.user_preferences;
create trigger trg_user_preferences_touch
  before update on public.user_preferences
  for each row execute function public.tg_touch_updated_at();

alter table public.user_preferences enable row level security;

-- Owner-only access, matched by the caller's app_users.id.
drop policy if exists user_preferences_owner on public.user_preferences;
create policy user_preferences_owner on public.user_preferences
  for all
  using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  )
  with check (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  );

-- =============================================================================
-- DOWN (manual):
--   drop table if exists public.user_preferences cascade;
--   drop function if exists public.tg_touch_updated_at();
-- =============================================================================
