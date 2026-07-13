-- =============================================================================
-- 0019_roadmap_dev.sql
-- "Roadmap разработки" — replaces Artifact 02. Same Gantt+Kanban engine as
-- План развития, plus: single assignee (real user) and a frozen planned-finish
-- baseline used to compute delay days (current finish − baseline).
-- Access: Super Admin + Admin. Starts empty (seeded by the user).
-- =============================================================================

create sequence if not exists public.seq_rdev_business_id start 1;

create table if not exists public.rdev_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1
);

create table if not exists public.rdev_tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  color text not null default '#334155',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1
);

create table if not exists public.rdev_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id text unique not null
    default public.next_business_id('RDEV-', 'public.seq_rdev_business_id'),
  title text not null,
  description text,
  status_id uuid not null references public.rdev_statuses (id) on delete restrict,
  priority public.priority_level not null default 'medium',
  assignee_id uuid references public.app_users (id) on delete set null,
  start_date date,
  end_date date,
  planned_end date,            -- baseline finish, frozen for delay calc
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1,
  is_archived boolean not null default false,
  archived_at timestamptz, archived_by uuid,
  is_deleted boolean not null default false,
  deleted_at timestamptz, deleted_by uuid,
  constraint rdev_tasks_dates_ck check (
    start_date is null or end_date is null or end_date >= start_date
  )
);
create index if not exists idx_rdev_tasks_status on public.rdev_tasks (status_id);
create index if not exists idx_rdev_tasks_assignee on public.rdev_tasks (assignee_id);

create table if not exists public.rdev_task_tags (
  task_id uuid not null references public.rdev_tasks (id) on delete cascade,
  tag_id uuid not null references public.rdev_tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists public.rdev_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.rdev_tasks (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1,
  is_deleted boolean not null default false,
  deleted_at timestamptz, deleted_by uuid
);
create index if not exists idx_rdev_comments_task on public.rdev_task_comments (task_id);

-- Freeze the planned-finish baseline the first time an end date is set.
create or replace function public.tg_rdev_planned_end()
returns trigger language plpgsql as $$
begin
  if new.planned_end is null and new.end_date is not null then
    new.planned_end := new.end_date;
  end if;
  return new;
end;
$$;
create trigger trg_rdev_planned_end before insert or update on public.rdev_tasks
  for each row execute function public.tg_rdev_planned_end();

create or replace function public.set_rdev_task_tags(p_task_id uuid, p_tag_ids uuid[])
returns void language plpgsql volatile security invoker set search_path = public as $$
begin
  delete from public.rdev_task_tags where task_id = p_task_id;
  if p_tag_ids is not null and array_length(p_tag_ids, 1) is not null then
    insert into public.rdev_task_tags (task_id, tag_id)
    select p_task_id, unnest(p_tag_ids) on conflict do nothing;
  end if;
end;
$$;
grant execute on function public.set_rdev_task_tags(uuid, uuid[]) to authenticated;

create trigger trg_rdev_statuses_touch before update on public.rdev_statuses
  for each row execute function public.tg_touch_row();
create trigger trg_rdev_tags_touch before update on public.rdev_tags
  for each row execute function public.tg_touch_row();
create trigger trg_rdev_tasks_touch before update on public.rdev_tasks
  for each row execute function public.tg_touch_row();
create trigger trg_rdev_comments_touch before update on public.rdev_task_comments
  for each row execute function public.tg_touch_row();

create trigger trg_rdev_statuses_audit after insert or update or delete on public.rdev_statuses
  for each row execute function public.tg_audit();
create trigger trg_rdev_tags_audit after insert or update or delete on public.rdev_tags
  for each row execute function public.tg_audit();
create trigger trg_rdev_tasks_audit after insert or update or delete on public.rdev_tasks
  for each row execute function public.tg_audit();
create trigger trg_rdev_comments_audit after insert or update or delete on public.rdev_task_comments
  for each row execute function public.tg_audit();

alter table public.rdev_statuses enable row level security;
alter table public.rdev_tags enable row level security;
alter table public.rdev_tasks enable row level security;
alter table public.rdev_task_tags enable row level security;
alter table public.rdev_task_comments enable row level security;

create policy rdev_statuses_read on public.rdev_statuses
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_statuses_write on public.rdev_statuses
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
create policy rdev_tags_read on public.rdev_tags
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_tags_write on public.rdev_tags
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_tasks_read on public.rdev_tasks
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_tasks_write on public.rdev_tasks
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_task_tags_all on public.rdev_task_tags
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
create policy rdev_comments_all on public.rdev_task_comments
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

grant select, insert, update, delete on
  public.rdev_statuses, public.rdev_tags, public.rdev_tasks,
  public.rdev_task_tags, public.rdev_task_comments to authenticated;

-- Default process-stage columns (editable).
insert into public.rdev_statuses (name, color, sort_order, is_terminal)
select * from (values
  ('БФТ (Аналитика)',                  '#64748b', 0, false),
  ('Frontend (PWA, APK)',              '#3b82f6', 1, false),
  ('Backend',                          '#6366f1', 2, false),
  ('Frontend (WEB)',                   '#0ea5e9', 3, false),
  ('Test + debug (Rstyle, PWA, APK)',  '#f59e0b', 4, false),
  ('Test + debug (WEB)',               '#f97316', 5, false),
  ('UAT (PWA, APK)',                   '#a855f7', 6, false),
  ('UAT (WEB)',                        '#c026d3', 7, false),
  ('Релиз в препрод и прод',           '#22c55e', 8, true)
) as v(name, color, sort_order, is_terminal)
where not exists (select 1 from public.rdev_statuses);
