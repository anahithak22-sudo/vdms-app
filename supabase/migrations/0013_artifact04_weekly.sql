-- =============================================================================
-- 0013_artifact04_weekly.sql
-- Artifact 04 — Weekly Planning (weeks + tasks).
-- Access: Super Admin/Admin/Manager full; Developer reads all and may change
-- the status of only their own assigned tasks (via set_weekly_task_status),
-- cannot delete, reassign, or change priority.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'week_status') then
    create type public.week_status as enum ('open', 'closed', 'archived');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'weekly_task_status') then
    create type public.weekly_task_status as enum (
      'planned', 'in_progress', 'blocked', 'ready_for_testing', 'testing',
      'fixed_on_test', 'fixed_on_preprod', 'fixed_on_production', 'done'
    );
  end if;
end $$;

-- ---- Weeks -----------------------------------------------------------------
create table if not exists public.planning_weeks (
  id                    uuid primary key default gen_random_uuid(),
  week_number           integer not null check (week_number between 1 and 53),
  year                  integer not null,
  start_date            date not null,
  end_date              date not null,
  status                public.week_status not null default 'open',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
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
  constraint planning_weeks_uk unique (year, week_number)
);

-- ---- Weekly tasks ----------------------------------------------------------
create table if not exists public.weekly_tasks (
  id                uuid primary key default gen_random_uuid(),
  business_id       text unique not null
                      default public.next_business_id('WEEK-', 'public.seq_weekly_business_id'),
  title             text not null,
  description       text,
  week_id           uuid not null references public.planning_weeks (id) on delete cascade,
  roadmap_item_id   uuid references public.roadmap_items (id) on delete set null,
  assigned_user_id  uuid references public.app_users (id),
  manager_id        uuid references public.app_users (id),
  status            public.weekly_task_status not null default 'planned',
  priority          public.priority_level not null default 'medium',
  estimated_hours   numeric(8, 2),
  actual_hours      numeric(8, 2),
  remaining_hours   numeric(8, 2),
  sprint_id         uuid references public.sprints (id) on delete set null,
  release_id        uuid references public.releases (id) on delete set null,
  tags              text[] not null default '{}',
  due_date          date,
  previous_task_id  uuid references public.weekly_tasks (id) on delete set null,
  rollover_count    integer not null default 0,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid,
  version           integer not null default 1,
  is_archived       boolean not null default false,
  archived_at       timestamptz,
  archived_by       uuid,
  is_deleted        boolean not null default false,
  deleted_at        timestamptz,
  deleted_by        uuid
);

create index if not exists idx_weekly_week on public.weekly_tasks (week_id);
create index if not exists idx_weekly_assignee on public.weekly_tasks (assigned_user_id);
create index if not exists idx_weekly_status on public.weekly_tasks (status);
create index if not exists idx_weekly_active on public.weekly_tasks (is_deleted, is_archived);

create trigger trg_planning_weeks_touch before update on public.planning_weeks
  for each row execute function public.tg_touch_row();
create trigger trg_weekly_tasks_touch before update on public.weekly_tasks
  for each row execute function public.tg_touch_row();
create trigger trg_planning_weeks_audit
  after insert or update or delete on public.planning_weeks
  for each row execute function public.tg_audit();
create trigger trg_weekly_tasks_audit
  after insert or update or delete on public.weekly_tasks
  for each row execute function public.tg_audit();

-- ---- Developer status change (own tasks only; status field only) -----------
create or replace function public.set_weekly_task_status(
  p_task_id uuid,
  p_status public.weekly_task_status
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_role public.user_role := public.current_user_role();
  v_me uuid := public.current_app_user_id();
  v_assignee uuid;
begin
  select assigned_user_id into v_assignee from public.weekly_tasks where id = p_task_id;
  if not found then raise exception 'not_found'; end if;

  -- Developers may only change status on tasks assigned to them.
  if v_role = 'developer' and v_assignee is distinct from v_me then
    raise exception 'insufficient_privilege';
  end if;
  if v_role not in ('super_admin', 'admin', 'manager', 'developer') then
    raise exception 'insufficient_privilege';
  end if;

  update public.weekly_tasks
  set status = p_status,
      completed_at = case when p_status = 'done' then now() else null end,
      updated_by = v_me
  where id = p_task_id;
end;
$$;
grant execute on function public.set_weekly_task_status(uuid, public.weekly_task_status) to authenticated;

-- ---- Automatic weekly roll-over (scheduler; PAD §9 automation) --------------
create or replace function public.rollover_weekly_tasks(p_source_week uuid, p_target_week uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_count integer := 0;
begin
  insert into public.weekly_tasks (
    title, description, week_id, roadmap_item_id, assigned_user_id, manager_id,
    status, priority, estimated_hours, remaining_hours, sprint_id, release_id, tags,
    due_date, previous_task_id, rollover_count
  )
  select
    title, description, p_target_week, roadmap_item_id, assigned_user_id, manager_id,
    'planned', priority, estimated_hours, remaining_hours, sprint_id, release_id, tags,
    due_date, id, rollover_count + 1
  from public.weekly_tasks
  where week_id = p_source_week
    and status <> 'done'
    and is_deleted = false
    and is_archived = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.rollover_weekly_tasks(uuid, uuid) to authenticated;

-- ---- RLS -------------------------------------------------------------------
alter table public.planning_weeks enable row level security;
alter table public.weekly_tasks enable row level security;

drop policy if exists weeks_read_all on public.planning_weeks;
create policy weeks_read_all on public.planning_weeks
  for select using (auth.uid() is not null);
drop policy if exists weeks_write on public.planning_weeks;
create policy weeks_write on public.planning_weeks
  for all
  using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
  with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists weekly_read_all on public.weekly_tasks;
create policy weekly_read_all on public.weekly_tasks
  for select using (auth.uid() is not null);

-- Direct writes: admin tier + managers only. Developers use the status RPC.
drop policy if exists weekly_insert on public.weekly_tasks;
create policy weekly_insert on public.weekly_tasks
  for insert with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));
drop policy if exists weekly_update on public.weekly_tasks;
create policy weekly_update on public.weekly_tasks
  for update
  using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
  with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));
drop policy if exists weekly_delete on public.weekly_tasks;
create policy weekly_delete on public.weekly_tasks
  for delete using (public.current_user_role() in ('super_admin', 'admin', 'manager'));

-- =============================================================================
-- DOWN (manual): drop weekly_tasks, planning_weeks; drop related types & fns.
-- =============================================================================
