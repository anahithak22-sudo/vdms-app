-- =============================================================================
-- 0007_rls_and_wiring.sql
-- Row Level Security for infrastructure and reference tables, audit triggers,
-- notification RPCs, and execute grants. RLS is authoritative (PAD §5.1).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Audit logs — immutable, Super Admin read-only. No INSERT/UPDATE/DELETE
-- policies exist, so writes are possible only through SECURITY DEFINER
-- functions (create_audit_entry / tg_audit). This makes the trail immutable.
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_super_admin on public.audit_logs;
create policy audit_logs_select_super_admin on public.audit_logs
  for select using (public.current_user_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- System logs — Super Admin read-only; writes via log_event() only.
-- ---------------------------------------------------------------------------
alter table public.system_logs enable row level security;

drop policy if exists system_logs_select_super_admin on public.system_logs;
create policy system_logs_select_super_admin on public.system_logs
  for select using (public.current_user_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Notifications — a user sees and manages only their own; writes via
-- generate_notification(). Immutable notifications cannot be deleted/archived.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
    and is_deleted = false
  );

-- Users may update status (read/archived) and soft-delete their own,
-- but never mutable-flag an immutable notification into deletion/archival.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  )
  with check (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
    and (is_immutable = false or (status <> 'archived' and is_deleted = false))
  );

alter table public.notification_counters enable row level security;

drop policy if exists notification_counters_select_own on public.notification_counters;
create policy notification_counters_select_own on public.notification_counters
  for select using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Reference data — readable by all authenticated users; writable by admin tier.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'business_areas','departments','projects','priority_definitions','releases','sprints'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_select_all', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() is not null);',
      t || '_select_all', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_write_admin', t);
    execute format(
      'create policy %I on public.%I for all using (public.current_user_role() in (''super_admin'',''admin'')) with check (public.current_user_role() in (''super_admin'',''admin''));',
      t || '_write_admin', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Attach the generic audit trigger to auditable business tables.
-- ---------------------------------------------------------------------------
drop trigger if exists trg_app_users_audit on public.app_users;
create trigger trg_app_users_audit
  after insert or update or delete on public.app_users
  for each row execute function public.tg_audit();

drop trigger if exists trg_releases_audit on public.releases;
create trigger trg_releases_audit
  after insert or update or delete on public.releases
  for each row execute function public.tg_audit();

drop trigger if exists trg_sprints_audit on public.sprints;
create trigger trg_sprints_audit
  after insert or update or delete on public.sprints
  for each row execute function public.tg_audit();

-- ---------------------------------------------------------------------------
-- Notification helper RPCs used by the client service.
-- ---------------------------------------------------------------------------
create or replace function public.mark_notification_read(p_id uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.notifications
  set status = 'read', read_at = now()
  where id = p_id
    and status = 'unread'
    and user_id in (select id from public.app_users where auth_user_id = auth.uid());
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.notifications
  set status = 'read', read_at = now()
  where status = 'unread'
    and user_id in (select id from public.app_users where auth_user_id = auth.uid());
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.unread_notification_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select unread_count from public.notification_counters
      where user_id in (select id from public.app_users where auth_user_id = auth.uid())),
    0
  );
$$;

-- ---- Grants ----------------------------------------------------------------
grant execute on function public.current_actor() to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.unread_notification_count() to authenticated;
grant execute on function public.archive_record(regclass, uuid) to authenticated;
grant execute on function public.restore_record(regclass, uuid) to authenticated;
grant execute on function public.soft_delete_record(regclass, uuid) to authenticated;

-- =============================================================================
-- DOWN (manual): drop the policies, triggers, and RPCs created above.
-- =============================================================================
