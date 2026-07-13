-- =============================================================================
-- 0003_shared_enums.sql
-- Shared enumerations and business-ID sequences used across the backend.
-- Enum values are stable English keys; Russian labels live in the frontend.
-- =============================================================================

-- ---- Audit -----------------------------------------------------------------
-- Security events are folded into the audit log via `category` (D-04).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'audit_category') then
    create type public.audit_category as enum ('business', 'security');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum (
      'create', 'update', 'delete', 'archive', 'restore',
      'status_change', 'priority_change', 'assignment', 'comment', 'attachment',
      'import', 'export', 'role_change', 'permission_update',
      'login', 'logout', 'failed_login', 'password_change', 'password_reset',
      'permission_denied', 'account_locked', 'account_unlocked', 'session_expired'
    );
  end if;
end $$;

-- ---- Logging (seven categories; audit is the eighth, stored separately) D-15
do $$ begin
  if not exists (select 1 from pg_type where typname = 'log_category') then
    create type public.log_category as enum (
      'error', 'debug', 'import', 'export', 'notification', 'scheduler', 'performance'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'log_severity') then
    create type public.log_severity as enum (
      'information', 'warning', 'error', 'critical', 'fatal'
    );
  end if;
end $$;

-- ---- Notifications ---------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'notification_category') then
    create type public.notification_category as enum (
      'business', 'reminder', 'system', 'security', 'monitoring'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'notification_priority') then
    create type public.notification_priority as enum ('low', 'normal', 'high', 'critical');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('unread', 'read', 'archived');
  end if;
end $$;

-- ---- Shared business enums -------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'priority_level') then
    create type public.priority_level as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

-- ---- Business-ID sequences (D-09) ------------------------------------------
create sequence if not exists public.seq_planning_business_id start 1;
create sequence if not exists public.seq_roadmap_business_id start 1;
create sequence if not exists public.seq_queue_business_id start 1;
create sequence if not exists public.seq_weekly_business_id start 1;
create sequence if not exists public.seq_bug_business_id start 1;
create sequence if not exists public.seq_release_business_id start 1;
create sequence if not exists public.seq_sprint_business_id start 1;

-- =============================================================================
-- DOWN (manual): drop the types and sequences created above.
-- =============================================================================
