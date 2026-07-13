-- =============================================================================
-- 0014_artifact05_priority_queue.sql
-- Artifact 05 — Priority Queue (import-sourced backlog / staging).
-- Access: Super Admin/Admin manage (imports); Manager/Developer read-only.
-- Managers may select items into Weekly Planning (copy + reference), which does
-- not modify the queue item itself.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'implementation_readiness') then
    create type public.implementation_readiness as enum (
      'not_ready', 'analysis', 'ready', 'approved', 'selected', 'scheduled', 'completed'
    );
  end if;
end $$;

create table if not exists public.priority_queue (
  id                    uuid primary key default gen_random_uuid(),
  business_id           text unique not null
                          default public.next_business_id('QUEUE-', 'public.seq_queue_business_id'),
  external_task_id      text,
  source_system         text not null default 'import',
  title                 text not null,
  description           text,
  priority              public.priority_level not null default 'medium',
  business_area         text,
  project               text,
  owner_id              uuid references public.app_users (id),
  requester             text,
  estimated_hours       numeric(8, 2),
  story_points          integer,
  external_status       text,
  implementation_readiness public.implementation_readiness not null default 'not_ready',
  tags                  text[] not null default '{}',
  imported_at           timestamptz,
  imported_by           uuid,
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
  constraint priority_queue_external_uk unique (source_system, external_task_id)
);

create index if not exists idx_queue_priority on public.priority_queue (priority);
create index if not exists idx_queue_readiness on public.priority_queue (implementation_readiness);
create index if not exists idx_queue_area on public.priority_queue (business_area);
create index if not exists idx_queue_active on public.priority_queue (is_deleted, is_archived);

create trigger trg_queue_touch before update on public.priority_queue
  for each row execute function public.tg_touch_row();
create trigger trg_queue_audit
  after insert or update or delete on public.priority_queue
  for each row execute function public.tg_audit();

-- Weekly tasks may reference the originating queue item.
alter table public.weekly_tasks
  add column if not exists priority_queue_id uuid references public.priority_queue (id) on delete set null;
create index if not exists idx_weekly_queue on public.weekly_tasks (priority_queue_id);

-- ---- Select a queue item into a week (copy + reference; queue unchanged) ----
create or replace function public.select_queue_item_for_week(
  p_queue_id uuid,
  p_week_id uuid,
  p_assignee uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_role public.user_role := public.current_user_role();
  v_me uuid := public.current_app_user_id();
  v_item public.priority_queue%rowtype;
  v_task_id uuid;
begin
  if v_role not in ('super_admin', 'admin', 'manager') then
    raise exception 'insufficient_privilege';
  end if;

  select * into v_item from public.priority_queue where id = p_queue_id and is_deleted = false;
  if not found then raise exception 'not_found'; end if;

  insert into public.weekly_tasks (
    title, description, week_id, assigned_user_id, manager_id, status, priority,
    priority_queue_id, created_by, updated_by
  ) values (
    v_item.title, v_item.description, p_week_id, p_assignee, v_me, 'planned', v_item.priority,
    p_queue_id, v_me, v_me
  )
  returning id into v_task_id;

  return v_task_id;
end;
$$;
grant execute on function public.select_queue_item_for_week(uuid, uuid, uuid) to authenticated;

-- ---- RLS -------------------------------------------------------------------
alter table public.priority_queue enable row level security;

drop policy if exists queue_read_all on public.priority_queue;
create policy queue_read_all on public.priority_queue
  for select using (auth.uid() is not null);

-- Only the admin tier mutates queue data (imports run as admin).
drop policy if exists queue_write_admin on public.priority_queue;
create policy queue_write_admin on public.priority_queue
  for all
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- =============================================================================
-- DOWN (manual): drop table priority_queue; drop type implementation_readiness;
--   alter table weekly_tasks drop column priority_queue_id.
-- =============================================================================
