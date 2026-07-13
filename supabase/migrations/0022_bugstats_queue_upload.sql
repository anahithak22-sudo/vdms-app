-- =============================================================================
-- 0022_bugstats_queue_upload.sql
--  * bug_stats — daily bug tally (Артефакт 03), manually entered. Mirrors the
--    Excel logic: per date, counts of opened / in-progress (Rstyle, ВТБА) /
--    closed, with totals and team shares computed in the UI.
--  * queue_items — add a single optional file attachment (upload only here).
-- =============================================================================

create sequence if not exists public.seq_bug_business_id start 1;

create table if not exists public.bug_stats (
  id uuid primary key default gen_random_uuid(),
  business_id text unique not null
    default public.next_business_id('BUG-', 'public.seq_bug_business_id'),
  stat_date date not null,
  opened integer not null default 0,
  in_progress_rstyle integer not null default 0,
  in_progress_vtba integer not null default 0,
  closed integer not null default 0,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, version integer not null default 1,
  is_deleted boolean not null default false,
  deleted_at timestamptz, deleted_by uuid,
  constraint bug_stats_nonneg_ck check (
    opened >= 0 and in_progress_rstyle >= 0 and in_progress_vtba >= 0 and closed >= 0
  )
);
create index if not exists idx_bug_stats_date on public.bug_stats (stat_date);

create trigger trg_bug_stats_touch before update on public.bug_stats
  for each row execute function public.tg_touch_row();
create trigger trg_bug_stats_audit after insert or update or delete on public.bug_stats
  for each row execute function public.tg_audit();

alter table public.bug_stats enable row level security;

-- Everyone authenticated may read the statistics; only admins write.
create policy bug_stats_read on public.bug_stats
  for select using (auth.uid() is not null);
create policy bug_stats_write on public.bug_stats
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

grant select, insert, update, delete on public.bug_stats to authenticated;

-- ---- Queue attachment (upload only in Очередь задач) -----------------------
alter table public.queue_items add column if not exists attachment_path text;
alter table public.queue_items add column if not exists attachment_name text;
