-- =============================================================================
-- 0021_weekly_todo.sql
-- "Планирование недели" — replaces Artifact 04. A per-week to-do list: each
-- item has who (real user), what (text), when (date), done flag. Everyone sees
-- all items; only Super Admin + Admin create/edit/delete. A user may toggle
-- "done" on their own item via wp_toggle_done (admins may toggle any).
-- Visible to all roles.
-- =============================================================================

create sequence if not exists public.seq_wp_business_id start 1;

create table if not exists public.wp_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id text unique not null
    default public.next_business_id('WP-', 'public.seq_wp_business_id'),
  week_tag text not null,
  week_year integer not null,
  week_number integer not null,
  assignee_id uuid references public.app_users (id) on delete set null,
  title text not null,
  due_date date,
  is_done boolean not null default false,
  done_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1,
  is_deleted boolean not null default false,
  deleted_at timestamptz, deleted_by uuid
);
create index if not exists idx_wp_week on public.wp_tasks (week_year, week_number);
create index if not exists idx_wp_assignee on public.wp_tasks (assignee_id);

create trigger trg_wp_touch before update on public.wp_tasks
  for each row execute function public.tg_touch_row();
create trigger trg_wp_audit after insert or update or delete on public.wp_tasks
  for each row execute function public.tg_audit();

-- Toggle done: allowed for the item's assignee or any admin/super admin.
create or replace function public.wp_toggle_done(p_id uuid, p_done boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_assignee uuid; v_role text;
begin
  select assignee_id into v_assignee from public.wp_tasks where id = p_id;
  v_role := public.current_user_role();
  if v_role in ('super_admin', 'admin') or v_assignee = public.current_app_user_id() then
    update public.wp_tasks
      set is_done = p_done,
          done_at = case when p_done then now() else null end
      where id = p_id;
  else
    raise exception 'not authorized to change this task';
  end if;
end;
$$;
grant execute on function public.wp_toggle_done(uuid, boolean) to authenticated;

alter table public.wp_tasks enable row level security;

-- Everyone authenticated may read; only admins write (create/edit/delete).
create policy wp_read on public.wp_tasks
  for select using (auth.uid() is not null);
create policy wp_write on public.wp_tasks
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

grant select, insert, update, delete on public.wp_tasks to authenticated;
