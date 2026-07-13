-- =============================================================================
-- 0006_core_functions.sql
-- Reusable business logic centralized in SQL functions (PAD §7.4):
--   create_audit_entry, log_event, generate_notification,
--   archive_record, restore_record, soft_delete_record,
--   and a generic audit trigger (tg_audit) attachable to any business table.
-- =============================================================================

-- ---- Resolve the current actor's app profile (id / username / role) --------
create or replace function public.current_actor()
returns table (actor_id uuid, actor_username text, actor_role public.user_role)
language sql
stable
security definer
set search_path = public
as $$
  select id, username, role
  from public.app_users
  where auth_user_id = auth.uid()
    and is_deleted = false
  limit 1;
$$;

-- ---- Write an audit entry (immutable trail; security events via category) ---
create or replace function public.create_audit_entry(
  p_action        public.audit_action,
  p_entity_table  text default null,
  p_entity_id     uuid default null,
  p_entity_business_id text default null,
  p_old_value     jsonb default null,
  p_new_value     jsonb default null,
  p_category      public.audit_category default 'business',
  p_message       text default null,
  p_correlation_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_id uuid;
begin
  select * into v_actor from public.current_actor();

  insert into public.audit_logs (
    category, action, entity_table, entity_id, entity_business_id,
    actor_id, actor_username, actor_role, old_value, new_value, message, correlation_id
  ) values (
    p_category, p_action, p_entity_table, p_entity_id, p_entity_business_id,
    v_actor.actor_id, v_actor.actor_username, v_actor.actor_role,
    p_old_value, p_new_value, p_message, p_correlation_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---- Write an operational log entry (seven categories) ---------------------
create or replace function public.log_event(
  p_category      public.log_category,
  p_message       text,
  p_severity      public.log_severity default 'information',
  p_module        text default null,
  p_operation     text default null,
  p_context       jsonb default '{}'::jsonb,
  p_correlation_id uuid default null,
  p_duration_ms   integer default null,
  p_error_code    text default null,
  p_stack_trace   text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_id uuid;
begin
  select * into v_actor from public.current_actor();

  insert into public.system_logs (
    category, severity, module, operation, message, context,
    actor_id, correlation_id, duration_ms, error_code, stack_trace
  ) values (
    p_category, p_severity, p_module, p_operation, p_message, coalesce(p_context, '{}'::jsonb),
    v_actor.actor_id, p_correlation_id, p_duration_ms, p_error_code, p_stack_trace
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---- Adjust the denormalized unread counter --------------------------------
create or replace function public.tg_notification_counter()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'unread' and new.is_deleted = false then
      insert into public.notification_counters (user_id, unread_count, updated_at)
      values (new.user_id, 1, now())
      on conflict (user_id) do update
        set unread_count = public.notification_counters.unread_count + 1, updated_at = now();
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    -- Transition out of unread (read / archived / deleted) decrements the counter.
    if old.status = 'unread' and old.is_deleted = false
       and (new.status <> 'unread' or new.is_deleted = true) then
      update public.notification_counters
        set unread_count = greatest(0, unread_count - 1), updated_at = now()
        where user_id = new.user_id;
    -- Transition back into unread increments it.
    elsif (old.status <> 'unread' or old.is_deleted = true)
       and new.status = 'unread' and new.is_deleted = false then
      insert into public.notification_counters (user_id, unread_count, updated_at)
      values (new.user_id, 1, now())
      on conflict (user_id) do update
        set unread_count = public.notification_counters.unread_count + 1, updated_at = now();
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notifications_counter on public.notifications;
create trigger trg_notifications_counter
  after insert or update on public.notifications
  for each row execute function public.tg_notification_counter();

-- ---- Generate a notification -----------------------------------------------
create or replace function public.generate_notification(
  p_user_id       uuid,
  p_event_type    text,
  p_title         text,
  p_message       text default null,
  p_category      public.notification_category default 'business',
  p_priority      public.notification_priority default 'normal',
  p_related_table text default null,
  p_related_id    uuid default null,
  p_action_url    text default null,
  p_is_immutable  boolean default false,
  p_correlation_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_id uuid;
begin
  select * into v_actor from public.current_actor();

  insert into public.notifications (
    user_id, category, event_type, priority, title, message,
    related_table, related_id, action_url, is_immutable, correlation_id, created_by
  ) values (
    p_user_id, p_category, p_event_type, p_priority, p_title, p_message,
    p_related_table, p_related_id, p_action_url, p_is_immutable, p_correlation_id, v_actor.actor_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---- Generic soft delete / archive / restore -------------------------------
-- These operate on any business table carrying the standard auditable columns.
create or replace function public.soft_delete_record(p_table regclass, p_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_actor record;
begin
  select * into v_actor from public.current_actor();
  execute format(
    'update %s set is_deleted = true, deleted_at = now(), deleted_by = $1 where id = $2 and is_deleted = false',
    p_table
  ) using v_actor.actor_id, p_id;

  perform public.create_audit_entry('delete', p_table::text, p_id);
end;
$$;

create or replace function public.archive_record(p_table regclass, p_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_actor record;
begin
  select * into v_actor from public.current_actor();
  execute format(
    'update %s set is_archived = true, archived_at = now(), archived_by = $1 where id = $2',
    p_table
  ) using v_actor.actor_id, p_id;

  perform public.create_audit_entry('archive', p_table::text, p_id);
end;
$$;

create or replace function public.restore_record(p_table regclass, p_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = public
as $$
begin
  execute format(
    'update %s set is_archived = false, archived_at = null, archived_by = null,
       is_deleted = false, deleted_at = null, deleted_by = null where id = $1',
    p_table
  ) using p_id;

  perform public.create_audit_entry('restore', p_table::text, p_id);
end;
$$;

-- ---- Generic audit trigger (attach to any business table) ------------------
-- Records create/update/delete with old/new snapshots. Business tables that
-- expose `business_id` get it captured automatically.
create or replace function public.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id text;
  v_action public.audit_action;
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'create'; v_new := to_jsonb(new); v_old := null; v_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := 'update'; v_new := to_jsonb(new); v_old := to_jsonb(old); v_id := new.id;
  else
    v_action := 'delete'; v_new := null; v_old := to_jsonb(old); v_id := old.id;
  end if;

  begin
    v_business_id := coalesce(v_new ->> 'business_id', v_old ->> 'business_id');
  exception when others then
    v_business_id := null;
  end;

  perform public.create_audit_entry(
    v_action, tg_table_name, v_id, v_business_id, v_old, v_new
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- =============================================================================
-- DOWN (manual): drop the functions and the notification counter trigger.
-- =============================================================================
