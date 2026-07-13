-- =============================================================================
-- 0011_artifact02_roadmap.sql
-- Artifact 02 — Development Roadmap (operational delivery).
-- Access: Super Admin/Admin/Manager full; Developer reads all, updates only
-- items assigned to them, cannot delete (permission matrix + D-17).
-- =============================================================================

-- Scalar helper: current caller's app_users.id (or null).
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.app_users where auth_user_id = auth.uid() and is_deleted = false limit 1;
$$;
grant execute on function public.current_app_user_id() to authenticated;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'roadmap_status') then
    create type public.roadmap_status as enum (
      'backlog', 'ready', 'in_development', 'code_review', 'ready_for_testing',
      'testing', 'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'closed'
    );
  end if;
end $$;

create table if not exists public.roadmap_items (
  id                    uuid primary key default gen_random_uuid(),
  business_id           text unique not null
                          default public.next_business_id('ROAD-', 'public.seq_roadmap_business_id'),
  title                 text not null,
  description           text,
  epic                  text,
  feature               text,
  release_id            uuid references public.releases (id) on delete set null,
  sprint_id             uuid references public.sprints (id) on delete set null,
  owner_id              uuid references public.app_users (id),
  assigned_developer_id uuid references public.app_users (id),
  priority              public.priority_level not null default 'medium',
  status                public.roadmap_status not null default 'backlog',
  story_points          integer check (story_points in (1, 2, 3, 5, 8, 13, 21, 34)),
  estimated_hours       numeric(8, 2),
  remaining_hours       numeric(8, 2),
  progress              integer not null default 0 check (progress between 0 and 100),
  start_date            date,
  due_date              date,
  actual_finish_date    date,
  risk                  public.risk_level not null default 'low',
  tags                  text[] not null default '{}',
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
  constraint roadmap_dates_ck check (due_date is null or start_date is null or due_date >= start_date)
);

create index if not exists idx_roadmap_status on public.roadmap_items (status);
create index if not exists idx_roadmap_priority on public.roadmap_items (priority);
create index if not exists idx_roadmap_release on public.roadmap_items (release_id);
create index if not exists idx_roadmap_sprint on public.roadmap_items (sprint_id);
create index if not exists idx_roadmap_dev on public.roadmap_items (assigned_developer_id);
create index if not exists idx_roadmap_active on public.roadmap_items (is_deleted, is_archived);

create trigger trg_roadmap_touch before update on public.roadmap_items
  for each row execute function public.tg_touch_row();
create trigger trg_roadmap_audit
  after insert or update or delete on public.roadmap_items
  for each row execute function public.tg_audit();

-- ---- RLS -------------------------------------------------------------------
alter table public.roadmap_items enable row level security;

-- Read: all authenticated roles.
drop policy if exists roadmap_read_all on public.roadmap_items;
create policy roadmap_read_all on public.roadmap_items
  for select using (auth.uid() is not null);

-- Insert: admin tier + managers.
drop policy if exists roadmap_insert on public.roadmap_items;
create policy roadmap_insert on public.roadmap_items
  for insert with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

-- Update: admin tier + managers freely; developers only their assigned items.
drop policy if exists roadmap_update on public.roadmap_items;
create policy roadmap_update on public.roadmap_items
  for update using (
    public.current_user_role() in ('super_admin', 'admin', 'manager')
    or (public.current_user_role() = 'developer' and assigned_developer_id = public.current_app_user_id())
  )
  with check (
    public.current_user_role() in ('super_admin', 'admin', 'manager')
    or (
      public.current_user_role() = 'developer'
      and assigned_developer_id = public.current_app_user_id()
      and is_deleted = false
      and is_archived = false
    )
  );

-- Delete: admin tier + managers (developers cannot delete).
drop policy if exists roadmap_delete on public.roadmap_items;
create policy roadmap_delete on public.roadmap_items
  for delete using (public.current_user_role() in ('super_admin', 'admin', 'manager'));

-- =============================================================================
-- DOWN (manual): drop table roadmap_items; drop type roadmap_status;
--   drop function current_app_user_id().
-- =============================================================================
