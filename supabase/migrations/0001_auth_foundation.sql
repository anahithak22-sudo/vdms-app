-- =============================================================================
-- 0001_auth_foundation.sql
-- Phase 1 authentication & authorization foundation.
--   * app_users profile table (auditable-entity columns)
--   * human-readable Business IDs (USR-000001)  [D-09]
--   * username -> email resolution (SECURITY DEFINER, no email exposure)  [D-01]
--   * account lockout: 5 failures / 30 minutes  [D-05]
--   * Row Level Security baseline
-- Reversible: see the DOWN section at the end (commented for CLI down-migrations).
-- =============================================================================

-- ---- Enums -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('super_admin', 'admin', 'manager', 'developer');
  end if;
end$$;

-- ---- Business ID sequence + generator --------------------------------------
create sequence if not exists public.seq_user_business_id start 1;

create or replace function public.next_business_id(p_prefix text, p_seq regclass)
returns text
language sql
volatile
as $$
  select p_prefix || lpad(nextval(p_seq)::text, 6, '0');
$$;

-- ---- app_users -------------------------------------------------------------
create table if not exists public.app_users (
  id                    uuid primary key default gen_random_uuid(),
  business_id           text unique not null default public.next_business_id('USR-', 'public.seq_user_business_id'),
  auth_user_id          uuid not null unique references auth.users (id) on delete cascade,
  username              text not null unique,
  display_name          text not null,
  role                  public.user_role not null default 'developer',
  department            text,
  avatar_url            text,
  is_first_login        boolean not null default true,
  is_active             boolean not null default true,
  is_locked             boolean not null default false,
  locked_until          timestamptz,
  failed_login_attempts integer not null default 0,
  last_login_at         timestamptz,
  -- Standard auditable-entity columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid,
  version               integer not null default 1,
  is_archived           boolean not null default false,
  archived_at           timestamptz,
  archived_by           uuid,
  is_deleted            boolean not null default false,
  deleted_at            timestamptz,
  deleted_by            uuid,
  constraint app_users_username_ck check (char_length(username) between 3 and 64)
);

create index if not exists idx_app_users_auth_user_id on public.app_users (auth_user_id);
create index if not exists idx_app_users_username on public.app_users (lower(username));
create index if not exists idx_app_users_role on public.app_users (role);
create index if not exists idx_app_users_active on public.app_users (is_active) where is_deleted = false;

-- ---- updated_at / version trigger ------------------------------------------
create or replace function public.tg_touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_users_touch on public.app_users;
create trigger trg_app_users_touch
  before update on public.app_users
  for each row execute function public.tg_touch_row();

-- ---- Helper: is the current auth user a given tier? ------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where auth_user_id = auth.uid()
    and is_deleted = false
  limit 1;
$$;

-- ---- Username -> email resolution (never exposes existence) ----------------
create or replace function public.resolve_username_to_email(p_username text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email
  into v_email
  from public.app_users au
  join auth.users u on u.id = au.auth_user_id
  where lower(au.username) = lower(p_username)
    and au.is_active = true
    and au.is_deleted = false
  limit 1;

  return v_email; -- null when not found; the client treats this as invalid credentials
end;
$$;

-- ---- Current application profile -------------------------------------------
create or replace function public.current_app_user()
returns setof public.app_users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.app_users
  where auth_user_id = auth.uid()
    and is_deleted = false
  limit 1;
$$;

-- ---- Login attempt tracking + lockout (D-05) -------------------------------
create or replace function public.record_login_result(p_username text, p_success boolean)
returns table (locked boolean, locked_until timestamptz, attempts_remaining integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_max_attempts constant integer := 5;
  v_lock_minutes constant integer := 30;
  v_row public.app_users%rowtype;
begin
  select * into v_row
  from public.app_users
  where lower(username) = lower(p_username)
    and is_deleted = false
  limit 1;

  if not found then
    -- Do not disclose whether the username exists.
    return query select false, null::timestamptz, v_max_attempts;
    return;
  end if;

  if p_success then
    update public.app_users
    set failed_login_attempts = 0,
        is_locked = false,
        locked_until = null,
        last_login_at = now()
    where id = v_row.id;
    return query select false, null::timestamptz, v_max_attempts;
    return;
  end if;

  -- Failed attempt: increment and lock if the threshold is reached.
  update public.app_users
  set failed_login_attempts = failed_login_attempts + 1,
      is_locked = (failed_login_attempts + 1) >= v_max_attempts,
      locked_until = case
        when (failed_login_attempts + 1) >= v_max_attempts
        then now() + make_interval(mins => v_lock_minutes)
        else locked_until
      end
  where id = v_row.id
  returning is_locked, app_users.locked_until, failed_login_attempts into v_row.is_locked, v_row.locked_until, v_row.failed_login_attempts;

  return query
    select v_row.is_locked,
           v_row.locked_until,
           greatest(0, v_max_attempts - v_row.failed_login_attempts);
end;
$$;

-- ---- Super Admin manual unlock (D-05) --------------------------------------
create or replace function public.unlock_account(p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'insufficient_privilege';
  end if;

  update public.app_users
  set is_locked = false,
      locked_until = null,
      failed_login_attempts = 0
  where id = p_user_id;
end;
$$;

-- ---- Row Level Security ----------------------------------------------------
alter table public.app_users enable row level security;

-- A user can read their own profile row.
drop policy if exists app_users_select_self on public.app_users;
create policy app_users_select_self on public.app_users
  for select
  using (auth_user_id = auth.uid() and is_deleted = false);

-- Super Admin can read every profile.
drop policy if exists app_users_select_admin on public.app_users;
create policy app_users_select_admin on public.app_users
  for select
  using (public.current_user_role() = 'super_admin');

-- A user can update a limited set of fields on their own row
-- (display_name / avatar / first-login flag). Role changes are never allowed here.
drop policy if exists app_users_update_self on public.app_users;
create policy app_users_update_self on public.app_users
  for update
  using (auth_user_id = auth.uid() and is_deleted = false)
  with check (auth_user_id = auth.uid());

-- Super Admin can insert and update any profile (user management).
drop policy if exists app_users_write_admin on public.app_users;
create policy app_users_write_admin on public.app_users
  for all
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- Execute grants for the RPCs used by the client.
grant execute on function public.resolve_username_to_email(text) to anon, authenticated;
grant execute on function public.record_login_result(text, boolean) to anon, authenticated;
grant execute on function public.current_app_user() to authenticated;
grant execute on function public.unlock_account(uuid) to authenticated;

-- =============================================================================
-- DOWN (manual):
--   drop table if exists public.app_users cascade;
--   drop function if exists public.resolve_username_to_email(text);
--   drop function if exists public.record_login_result(text, boolean);
--   drop function if exists public.current_app_user();
--   drop function if exists public.unlock_account(uuid);
--   drop function if exists public.current_user_role();
--   drop function if exists public.tg_touch_row();
--   drop function if exists public.next_business_id(text, regclass);
--   drop sequence if exists public.seq_user_business_id;
--   drop type if exists public.user_role;
-- =============================================================================
