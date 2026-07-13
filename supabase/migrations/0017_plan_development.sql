-- =============================================================================
-- 0017_plan_development.sql
-- "План развития" — replaces Artifact 01 with a single task dataset shown as
-- both a Gantt chart and a Kanban board (synced). Access: Super Admin + Admin.
--   * plan_statuses      — Kanban columns (rename/add/delete by Super Admin;
--                          delete blocked while tasks reference the column)
--   * plan_tags          — reusable free-typed tags (admin-managed)
--   * plan_tasks         — title/description/dates/priority/status
--   * plan_task_tags     — task↔tag join
--   * plan_task_comments — per-task comments (admin add/edit/delete)
-- Progress %, overdue flag, and view sync are derived client-side.
-- Every change is audited via tg_audit (history is Super-Admin visible).
-- =============================================================================

create sequence if not exists public.seq_plan_business_id start 1;

-- ---- Kanban columns / statuses --------------------------------------------
create table if not exists public.plan_statuses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null default '#64748b',
  sort_order   integer not null default 0,
  is_terminal  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid,
  updated_by   uuid,
  version      integer not null default 1
);

-- ---- Reusable tags ---------------------------------------------------------
create table if not exists public.plan_tags (
  id           uuid primary key default gen_random_uuid(),
  label        text not null unique,
  color        text not null default '#334155',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid,
  updated_by   uuid,
  version      integer not null default 1
);

-- ---- Tasks -----------------------------------------------------------------
create table if not exists public.plan_tasks (
  id           uuid primary key default gen_random_uuid(),
  business_id  text unique not null
                 default public.next_business_id('PDEV-', 'public.seq_plan_business_id'),
  title        text not null,
  description  text,
  status_id    uuid not null references public.plan_statuses (id) on delete restrict,
  priority     public.priority_level not null default 'medium',
  start_date   date,
  end_date     date,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid,
  updated_by   uuid,
  version      integer not null default 1,
  is_archived  boolean not null default false,
  archived_at  timestamptz,
  archived_by  uuid,
  is_deleted   boolean not null default false,
  deleted_at   timestamptz,
  deleted_by   uuid,
  constraint plan_tasks_dates_ck check (
    start_date is null or end_date is null or end_date >= start_date
  )
);
create index if not exists idx_plan_tasks_status on public.plan_tasks (status_id);

-- ---- Task ↔ tag join -------------------------------------------------------
create table if not exists public.plan_task_tags (
  task_id  uuid not null references public.plan_tasks (id) on delete cascade,
  tag_id   uuid not null references public.plan_tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

-- ---- Comments --------------------------------------------------------------
create table if not exists public.plan_task_comments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.plan_tasks (id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid,
  updated_by   uuid,
  version      integer not null default 1,
  is_deleted   boolean not null default false,
  deleted_at   timestamptz,
  deleted_by   uuid
);
create index if not exists idx_plan_comments_task on public.plan_task_comments (task_id);

-- ---- Replace a task's tags atomically (admin+) -----------------------------
create or replace function public.set_plan_task_tags(p_task_id uuid, p_tag_ids uuid[])
returns void
language plpgsql
volatile
security invoker
set search_path = public
as $$
begin
  delete from public.plan_task_tags where task_id = p_task_id;
  if p_tag_ids is not null and array_length(p_tag_ids, 1) is not null then
    insert into public.plan_task_tags (task_id, tag_id)
    select p_task_id, unnest(p_tag_ids)
    on conflict do nothing;
  end if;
end;
$$;
grant execute on function public.set_plan_task_tags(uuid, uuid[]) to authenticated;

-- ---- Triggers: touch/version + audit history -------------------------------
create trigger trg_plan_statuses_touch before update on public.plan_statuses
  for each row execute function public.tg_touch_row();
create trigger trg_plan_tags_touch before update on public.plan_tags
  for each row execute function public.tg_touch_row();
create trigger trg_plan_tasks_touch before update on public.plan_tasks
  for each row execute function public.tg_touch_row();
create trigger trg_plan_comments_touch before update on public.plan_task_comments
  for each row execute function public.tg_touch_row();

create trigger trg_plan_statuses_audit
  after insert or update or delete on public.plan_statuses
  for each row execute function public.tg_audit();
create trigger trg_plan_tags_audit
  after insert or update or delete on public.plan_tags
  for each row execute function public.tg_audit();
create trigger trg_plan_tasks_audit
  after insert or update or delete on public.plan_tasks
  for each row execute function public.tg_audit();
create trigger trg_plan_comments_audit
  after insert or update or delete on public.plan_task_comments
  for each row execute function public.tg_audit();

-- ---- RLS: Super Admin + Admin only across the whole block -------------------
alter table public.plan_statuses      enable row level security;
alter table public.plan_tags          enable row level security;
alter table public.plan_tasks         enable row level security;
alter table public.plan_task_tags     enable row level security;
alter table public.plan_task_comments enable row level security;

-- statuses: read admin-tier; write Super Admin only (column management)
create policy plan_statuses_read on public.plan_statuses
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy plan_statuses_write on public.plan_statuses
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- tags: read + write admin-tier
create policy plan_tags_read on public.plan_tags
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy plan_tags_write on public.plan_tags
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- tasks: read + write admin-tier
create policy plan_tasks_read on public.plan_tasks
  for select using (public.current_user_role() in ('super_admin', 'admin'));
create policy plan_tasks_write on public.plan_tasks
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- join + comments: admin-tier
create policy plan_task_tags_all on public.plan_task_tags
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
create policy plan_comments_all on public.plan_task_comments
  for all using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

grant select, insert, update, delete on
  public.plan_statuses, public.plan_tags, public.plan_tasks,
  public.plan_task_tags, public.plan_task_comments to authenticated;

-- ---- Seed default Kanban columns -------------------------------------------
insert into public.plan_statuses (name, color, sort_order, is_terminal)
select * from (values
  ('Планируется',   '#64748b', 0, false),
  ('Разработка БТ', '#3b82f6', 1, false),
  ('Анализ РС',     '#6366f1', 2, false),
  ('Разработка',    '#f59e0b', 3, false),
  ('Тестирование',  '#a855f7', 4, false),
  ('Внедрение',     '#22c55e', 5, true)
) as v(name, color, sort_order, is_terminal)
where not exists (select 1 from public.plan_statuses);

-- ---- Seed tasks from the roadmap (dates derived from the Excel bars) -------
insert into public.plan_tasks (title, start_date, end_date, sort_order, status_id)
select v.title, v.start_date::date, v.end_date::date, v.sort_order,
       (select id from public.plan_statuses where name = 'Планируется' limit 1)
from (values
  ('Согласование и подписание договоров', '2025-02-01', '2025-06-30', 0),
  ('Анализ, обследование интеграций', '2025-03-01', '2025-06-30', 1),
  ('Создание ТЗ на доработку смежных систем*', '2025-05-01', '2025-09-30', 2),
  ('Создание тестовых стендов для шины и ДБО', '2025-04-01', '2025-08-31', 3),
  ('Подготовка и согласование дизайна', '2025-05-01', '2025-09-30', 4),
  ('Разработка на стороне Rstyle', '2025-07-01', '2026-02-28', 5),
  ('Доработки на стороне LSOFT', '2025-08-01', '2025-11-30', 6),
  ('Разработки на PST, РБС, QuadroSoft, МК', '2025-09-01', '2026-01-31', 7),
  ('Интеграционные работы', '2025-09-01', '2026-01-31', 8),
  ('Тестирование на тестовой среде / препроде', '2025-10-01', '2025-11-30', 9),
  ('Создание препрод и прод стендов', '2025-10-01', '2025-11-30', 10),
  ('Релиз 1.1 - Внедрение PWA (РБ)', '2025-12-01', '2025-12-31', 11),
  ('Выкуп исходного кода', '2025-12-01', '2025-12-31', 12),
  ('Онбординг "Сотрудники ГО"', '2026-01-01', '2026-01-31', 13),
  ('Онбординг "Сеть + КЦ"', '2026-01-01', '2026-02-28', 14),
  ('Онбординг "Хопанчи"; "Екассир"', '2026-02-01', '2026-02-28', 15),
  ('Релиз 1.5 "Скоуп Договор"', '2026-02-01', '2026-02-28', 16),
  ('Внедрение APK', '2026-02-01', '2026-02-28', 17),
  ('Отключение ДБО Екассир', '2026-02-01', '2026-02-28', 18),
  ('Внедрение Web', '2026-02-01', '2026-03-31', 19),
  ('Начало гарантийной поддержки', '2026-03-01', '2026-03-31', 20),
  ('Онбординг "Вся база"', '2026-03-01', '2026-03-31', 21),
  ('Согласование и подписание Договора развития', '2026-02-01', '2026-04-30', 22),
  ('Релиз 2 "Развитие"', '2026-05-01', '2026-05-31', 23),
  ('Внедрение iOS', '2026-05-01', '2026-05-31', 24),
  ('Отключение ДБО Нетинфо', '2026-06-01', '2026-06-30', 25),
  ('Согласование и подписание Договора поддержки', '2026-02-01', '2026-08-31', 26),
  ('CVV, активация, блокировка', '2025-10-01', '2025-11-30', 27),
  ('Стягивания с карт', '2025-10-01', '2025-11-30', 28),
  ('Трансгран (РФ)  переводы по номеру телефона', '2025-10-01', '2025-11-30', 29),
  ('H2H', '2025-10-01', '2025-11-30', 30),
  ('Arcapay', '2025-10-01', '2025-11-30', 31),
  ('C2C 3е страны', '2025-10-01', '2025-11-30', 32),
  ('КПЗЗ топап', '2025-10-01', '2025-11-30', 33),
  ('POS QR', '2025-10-01', '2025-11-30', 34),
  ('Узнай свой лимит', '2025-10-01', '2025-11-30', 35),
  ('Открытие счета новых клиентов', '2025-10-01', '2025-11-30', 36),
  ('Виртуалка', '2025-10-01', '2025-11-30', 37),
  ('Безбумажный', '2025-10-01', '2025-11-30', 38),
  ('Калькулятор КПЗЗ', '2025-10-01', '2025-11-30', 39),
  ('Премиальные пакеты', '2025-10-01', '2025-11-30', 40),
  ('Платежи РФ', '2025-10-01', '2025-11-30', 41),
  ('Курс аналитика', '2025-10-01', '2025-11-30', 42),
  ('Единий QR', '2025-10-01', '2025-11-30', 43),
  ('imID', '2025-10-01', '2025-11-30', 44),
  ('Темная тема', '2025-10-01', '2025-11-30', 45),
  ('ios', '2025-10-01', '2025-11-30', 46),
  ('Юнистрим на карту', '2025-10-01', '2025-11-30', 47),
  ('Блокировка операций', '2025-10-01', '2025-11-30', 48),
  ('Оплата налога', '2025-10-01', '2025-11-30', 49),
  ('Дебиторки счета и карты', '2025-10-01', '2025-11-30', 50)
) as v(title, start_date, end_date, sort_order)
where not exists (select 1 from public.plan_tasks);
