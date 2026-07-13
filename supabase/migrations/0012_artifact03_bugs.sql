-- =============================================================================
-- 0012_artifact03_bugs.sql
-- Artifact 03 — Bug Statistics (defect tracking & analytics).
-- Access: Super Admin/Admin/Manager full; Developer reads all, updates only
-- bugs assigned to them, cannot delete.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'bug_severity') then
    create type public.bug_severity as enum ('critical', 'major', 'minor', 'trivial');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'bug_status') then
    create type public.bug_status as enum (
      'open', 'assigned', 'in_progress', 'ready_for_testing', 'testing',
      'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'closed', 'archived'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'bug_root_cause') then
    create type public.bug_root_cause as enum (
      'requirements', 'backend', 'frontend', 'database', 'integration',
      'infrastructure', 'performance', 'security', 'configuration', 'unknown'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'bug_resolution') then
    create type public.bug_resolution as enum (
      'fixed', 'cannot_reproduce', 'duplicate', 'wont_fix',
      'by_design', 'configuration_issue', 'third_party', 'deferred'
    );
  end if;
end $$;

create table if not exists public.bugs (
  id                    uuid primary key default gen_random_uuid(),
  business_id           text unique not null
                          default public.next_business_id('BUG-', 'public.seq_bug_business_id'),
  title                 text not null,
  description           text,
  steps_to_reproduce    text,
  expected_result       text,
  actual_result         text,
  severity              public.bug_severity not null default 'major',
  priority              public.priority_level not null default 'medium',
  status                public.bug_status not null default 'open',
  environment           text,
  app_version           text,
  affected_module       text,
  reporter_id           uuid references public.app_users (id),
  assigned_developer_id uuid references public.app_users (id),
  manager_id            uuid references public.app_users (id),
  release_id            uuid references public.releases (id) on delete set null,
  sprint_id             uuid references public.sprints (id) on delete set null,
  root_cause            public.bug_root_cause,
  resolution            public.bug_resolution,
  roadmap_item_id       uuid references public.roadmap_items (id) on delete set null,
  reopen_count          integer not null default 0,
  closed_at             timestamptz,
  resolution_time_hours numeric(10, 2),
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
  deleted_by            uuid
);

create index if not exists idx_bugs_status on public.bugs (status);
create index if not exists idx_bugs_severity on public.bugs (severity);
create index if not exists idx_bugs_priority on public.bugs (priority);
create index if not exists idx_bugs_dev on public.bugs (assigned_developer_id);
create index if not exists idx_bugs_release on public.bugs (release_id);
create index if not exists idx_bugs_sprint on public.bugs (sprint_id);
create index if not exists idx_bugs_module on public.bugs (affected_module);
create index if not exists idx_bugs_active on public.bugs (is_deleted, is_archived);

create trigger trg_bugs_touch before update on public.bugs
  for each row execute function public.tg_touch_row();
create trigger trg_bugs_audit
  after insert or update or delete on public.bugs
  for each row execute function public.tg_audit();

-- ---- RLS -------------------------------------------------------------------
alter table public.bugs enable row level security;

drop policy if exists bugs_read_all on public.bugs;
create policy bugs_read_all on public.bugs
  for select using (auth.uid() is not null);

drop policy if exists bugs_insert on public.bugs;
create policy bugs_insert on public.bugs
  for insert with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists bugs_update on public.bugs;
create policy bugs_update on public.bugs
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

drop policy if exists bugs_delete on public.bugs;
create policy bugs_delete on public.bugs
  for delete using (public.current_user_role() in ('super_admin', 'admin', 'manager'));

-- =============================================================================
-- DOWN (manual): drop table bugs; drop bug_* types.
-- =============================================================================
