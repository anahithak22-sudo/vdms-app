-- =============================================================================
-- 0020_task_queue.sql
-- "Очередь задач" — replaces Artifact 05. Three pages (В работе / Приемка /
-- I Support) as one table filtered by `page`. Free-text priority preserves the
-- imported Russian values. Week tag (W##) is assigned by the app on create and
-- bumped by the "Не исправлено / В препрод / В прод" actions. "Исправлено"
-- archives the row (archived rows are visible to Super Admin only).
-- Access: Super Admin + Admin.
-- =============================================================================

create sequence if not exists public.seq_queue_business_id start 1;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'queue_page') then
    create type public.queue_page as enum ('v_rabote', 'priemka', 'i_support');
  end if;
end $$;

create table if not exists public.queue_items (
  id uuid primary key default gen_random_uuid(),
  business_id text unique not null
    default public.next_business_id('QITEM-', 'public.seq_queue_business_id'),
  page public.queue_page not null,
  external_task_id text,
  status text,
  description text not null,
  priority text,
  task_link text,
  fixed_status text,            -- Fixed / Not fixed / null
  environment text,             -- null / preprod / prod (set by move actions)
  comment text,
  week_tag text,
  week_year integer,
  week_number integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1,
  is_archived boolean not null default false,
  archived_at timestamptz, archived_by uuid,
  is_deleted boolean not null default false,
  deleted_at timestamptz, deleted_by uuid
);
create index if not exists idx_queue_page on public.queue_items (page);
create index if not exists idx_queue_archived on public.queue_items (is_archived);

create trigger trg_queue_touch before update on public.queue_items
  for each row execute function public.tg_touch_row();
create trigger trg_queue_audit after insert or update or delete on public.queue_items
  for each row execute function public.tg_audit();

alter table public.queue_items enable row level security;

-- Admins see only active rows; Super Admin also sees archived.
create policy queue_read on public.queue_items
  for select using (
    public.current_user_role() in ('super_admin', 'admin')
    and (is_archived = false or public.current_user_role() = 'super_admin')
  );
create policy queue_write on public.queue_items
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

grant select, insert, update, delete on public.queue_items to authenticated;
