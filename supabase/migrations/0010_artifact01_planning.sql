-- =============================================================================
-- 0010_artifact01_planning.sql
-- Artifact 01 — Development Planning (strategic initiatives).
-- Access: Super Admin + Admin only (permission matrix). Managers/Developers
-- have no access — enforced by RLS. Lifecycle per D-02.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'risk_level') then
    create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'planning_status') then
    create type public.planning_status as enum (
      'draft', 'proposed', 'approved', 'planned', 'in_progress', 'on_hold', 'completed', 'archived'
    );
  end if;
end $$;

create table if not exists public.planning_initiatives (
  id                   uuid primary key default gen_random_uuid(),
  business_id          text unique not null
                         default public.next_business_id('PLAN-', 'public.seq_planning_business_id'),
  title                text not null,
  short_description    text,
  description          text,
  business_area        text,
  department           text,
  owner_id             uuid references public.app_users (id),
  priority             public.priority_level not null default 'medium',
  status               public.planning_status not null default 'draft',
  risk_level           public.risk_level not null default 'low',
  start_date           date,
  target_finish_date   date,
  actual_finish_date   date,
  estimated_duration_days integer,
  progress             integer not null default 0 check (progress between 0 and 100),
  budget               numeric(14, 2),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  updated_by           uuid,
  version              integer not null default 1,
  is_archived          boolean not null default false,
  archived_at          timestamptz,
  archived_by          uuid,
  is_deleted           boolean not null default false,
  deleted_at           timestamptz,
  deleted_by           uuid,
  constraint planning_dates_ck check (
    target_finish_date is null or start_date is null or target_finish_date >= start_date
  )
);

create index if not exists idx_planning_status on public.planning_initiatives (status);
create index if not exists idx_planning_priority on public.planning_initiatives (priority);
create index if not exists idx_planning_owner on public.planning_initiatives (owner_id);
create index if not exists idx_planning_active on public.planning_initiatives (is_deleted, is_archived);
create index if not exists idx_planning_search on public.planning_initiatives
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

create trigger trg_planning_touch before update on public.planning_initiatives
  for each row execute function public.tg_touch_row();

create trigger trg_planning_audit
  after insert or update or delete on public.planning_initiatives
  for each row execute function public.tg_audit();

-- ---- RLS: Super Admin + Admin only -----------------------------------------
alter table public.planning_initiatives enable row level security;

drop policy if exists planning_read_admin on public.planning_initiatives;
create policy planning_read_admin on public.planning_initiatives
  for select using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists planning_write_admin on public.planning_initiatives;
create policy planning_write_admin on public.planning_initiatives
  for all
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- =============================================================================
-- DOWN (manual): drop table planning_initiatives; drop types planning_status, risk_level.
-- =============================================================================
