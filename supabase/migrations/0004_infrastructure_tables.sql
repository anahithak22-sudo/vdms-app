-- =============================================================================
-- 0004_infrastructure_tables.sql
-- Audit, logging, and notification infrastructure.
--   * audit_logs     — immutable business + security change trail (D-04)
--   * system_logs    — seven-category operational log (D-15)
--   * notifications  — in-app notifications with realtime delivery
-- =============================================================================

-- ---- Audit log (immutable) -------------------------------------------------
create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  category       public.audit_category not null default 'business',
  action         public.audit_action not null,
  entity_table   text,
  entity_id      uuid,
  entity_business_id text,
  actor_id       uuid,             -- app_users.id (null for anonymous/system)
  actor_username text,
  actor_role     public.user_role,
  old_value      jsonb,
  new_value      jsonb,
  message        text,
  ip_address     text,
  user_agent     text,
  session_id     text,
  correlation_id uuid,
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_entity on public.audit_logs (entity_table, entity_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_id);
create index if not exists idx_audit_category on public.audit_logs (category);
create index if not exists idx_audit_created on public.audit_logs (created_at desc);
create index if not exists idx_audit_correlation on public.audit_logs (correlation_id);

-- ---- System / operational logs (seven categories) --------------------------
create table if not exists public.system_logs (
  id             uuid primary key default gen_random_uuid(),
  category       public.log_category not null,
  severity       public.log_severity not null default 'information',
  module         text,
  operation      text,
  message        text not null,
  context        jsonb not null default '{}'::jsonb,
  actor_id       uuid,
  correlation_id uuid,
  duration_ms    integer,
  -- Error-specific fields (null for other categories)
  error_code     text,
  stack_trace    text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_syslog_category on public.system_logs (category);
create index if not exists idx_syslog_severity on public.system_logs (severity);
create index if not exists idx_syslog_created on public.system_logs (created_at desc);
create index if not exists idx_syslog_correlation on public.system_logs (correlation_id);
create index if not exists idx_syslog_module on public.system_logs (module);

-- ---- Notifications ---------------------------------------------------------
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.app_users (id) on delete cascade,
  category        public.notification_category not null default 'business',
  event_type      text not null,
  priority        public.notification_priority not null default 'normal',
  status          public.notification_status not null default 'unread',
  title           text not null,
  message         text,
  related_table   text,
  related_id      uuid,
  action_url      text,
  correlation_id  uuid,
  is_immutable    boolean not null default false,  -- security / critical notifications
  created_by      uuid,
  created_at      timestamptz not null default now(),
  read_at         timestamptz,
  archived_at     timestamptz,
  is_deleted      boolean not null default false,
  deleted_at      timestamptz
);

create index if not exists idx_notif_user_status on public.notifications (user_id, status)
  where is_deleted = false;
create index if not exists idx_notif_user_created on public.notifications (user_id, created_at desc);
create index if not exists idx_notif_priority on public.notifications (priority);

-- Denormalized unread counter per user for instant badge updates at scale.
create table if not exists public.notification_counters (
  user_id      uuid primary key references public.app_users (id) on delete cascade,
  unread_count integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- =============================================================================
-- DOWN (manual):
--   drop table if exists public.notification_counters cascade;
--   drop table if exists public.notifications cascade;
--   drop table if exists public.system_logs cascade;
--   drop table if exists public.audit_logs cascade;
-- =============================================================================
