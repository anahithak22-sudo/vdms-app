-- =============================================================================
-- 0005_reference_data.sql
-- Shared reference data owned by a dedicated module (D-14): business areas,
-- departments, projects, priority definitions, releases, and sprints.
-- Tables + RLS + seed here; the management UI is deferred to a later phase.
-- =============================================================================

-- ---- Simple lookup tables --------------------------------------------------
create table if not exists public.business_areas (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.priority_definitions (
  id          uuid primary key default gen_random_uuid(),
  key         public.priority_level unique not null,
  name        text not null,
  color       text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- Releases --------------------------------------------------------------
create table if not exists public.releases (
  id                    uuid primary key default gen_random_uuid(),
  business_id           text unique not null
                          default public.next_business_id('REL-', 'public.seq_release_business_id'),
  name                  text not null,
  release_version       text,
  status                text not null default 'planned',
  owner_id              uuid references public.app_users (id),
  start_date            date,
  target_date           date,
  completion_percentage integer not null default 0
                          check (completion_percentage between 0 and 100),
  release_notes         text,
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

-- ---- Sprints ---------------------------------------------------------------
create table if not exists public.sprints (
  id              uuid primary key default gen_random_uuid(),
  business_id     text unique not null
                    default public.next_business_id('SPR-', 'public.seq_sprint_business_id'),
  name            text not null,
  release_id      uuid references public.releases (id) on delete set null,
  start_date      date,
  end_date        date,
  capacity        integer,
  velocity        integer,
  completion_rate integer not null default 0 check (completion_rate between 0 and 100),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid,
  version         integer not null default 1,
  is_archived     boolean not null default false,
  archived_at     timestamptz,
  archived_by     uuid,
  is_deleted      boolean not null default false,
  deleted_at      timestamptz,
  deleted_by      uuid,
  constraint sprints_date_ck check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists idx_sprints_release on public.sprints (release_id);

-- ---- updated_at / version triggers -----------------------------------------
create trigger trg_business_areas_touch before update on public.business_areas
  for each row execute function public.tg_touch_updated_at();
create trigger trg_departments_touch before update on public.departments
  for each row execute function public.tg_touch_updated_at();
create trigger trg_projects_touch before update on public.projects
  for each row execute function public.tg_touch_updated_at();
create trigger trg_priority_definitions_touch before update on public.priority_definitions
  for each row execute function public.tg_touch_updated_at();
create trigger trg_releases_touch before update on public.releases
  for each row execute function public.tg_touch_row();
create trigger trg_sprints_touch before update on public.sprints
  for each row execute function public.tg_touch_row();

-- ---- Seed ------------------------------------------------------------------
insert into public.priority_definitions (key, name, color, sort_order) values
  ('low', 'Низкий', '#6B7280', 1),
  ('medium', 'Средний', '#2563EB', 2),
  ('high', 'Высокий', '#D97706', 3),
  ('critical', 'Критический', '#DC2626', 4)
on conflict (key) do nothing;

insert into public.business_areas (key, name, sort_order) values
  ('retail', 'Розничный бизнес', 1),
  ('corporate', 'Корпоративный бизнес', 2),
  ('payments', 'Платежи и переводы', 3),
  ('lending', 'Кредитование', 4),
  ('infrastructure', 'Инфраструктура', 5)
on conflict (key) do nothing;

insert into public.departments (key, name, sort_order) values
  ('dbo', 'ДБО', 1),
  ('backend', 'Backend-разработка', 2),
  ('frontend', 'Frontend-разработка', 3),
  ('qa', 'Тестирование', 4),
  ('analytics', 'Аналитика', 5)
on conflict (key) do nothing;

insert into public.projects (key, name, sort_order) values
  ('mobile', 'Мобильное приложение', 1),
  ('web', 'Интернет-банк', 2),
  ('core', 'Ядро системы', 3)
on conflict (key) do nothing;

-- =============================================================================
-- DOWN (manual): drop tables sprints, releases, priority_definitions,
--   projects, departments, business_areas.
-- =============================================================================
