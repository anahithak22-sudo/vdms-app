-- =============================================================================
-- 0008_user_management.sql
-- User-management backend. Account creation and password resets that touch
-- auth.users run through Edge Functions with the service role; the SQL here
-- covers profile lifecycle operations the Super Administrator performs.
-- =============================================================================

-- ---- List users (Super Admin) with pagination-friendly output --------------
create or replace function public.admin_list_users(
  p_search text default null,
  p_include_archived boolean default false
)
returns setof public.app_users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.app_users
  where public.current_user_role() = 'super_admin'
    and is_deleted = false
    and (p_include_archived or is_archived = false)
    and (
      p_search is null
      or username ilike '%' || p_search || '%'
      or display_name ilike '%' || p_search || '%'
      or business_id ilike '%' || p_search || '%'
    )
  order by created_at desc;
$$;

-- ---- Assign a role (Super Admin only; audited) -----------------------------
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_old public.user_role;
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'insufficient_privilege';
  end if;

  select role into v_old from public.app_users where id = p_user_id;
  update public.app_users set role = p_role, updated_by = (select actor_id from public.current_actor())
    where id = p_user_id;

  perform public.create_audit_entry(
    'role_change', 'app_users', p_user_id, null,
    jsonb_build_object('role', v_old), jsonb_build_object('role', p_role),
    'security', 'Изменение роли пользователя'
  );
end;
$$;

-- ---- Activate / deactivate (Super Admin) -----------------------------------
create or replace function public.admin_set_user_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'insufficient_privilege';
  end if;

  update public.app_users
    set is_active = p_active, updated_by = (select actor_id from public.current_actor())
    where id = p_user_id;
end;
$$;

-- ---- Archive / restore users (soft delete policy; audited) -----------------
create or replace function public.admin_archive_user(p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'insufficient_privilege';
  end if;

  update public.app_users
    set is_archived = true, archived_at = now(),
        archived_by = (select actor_id from public.current_actor()),
        is_active = false
    where id = p_user_id;
end;
$$;

create or replace function public.admin_restore_user(p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'insufficient_privilege';
  end if;

  update public.app_users
    set is_archived = false, archived_at = null, archived_by = null, is_active = true
    where id = p_user_id;
end;
$$;

grant execute on function public.admin_list_users(text, boolean) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;
grant execute on function public.admin_archive_user(uuid) to authenticated;
grant execute on function public.admin_restore_user(uuid) to authenticated;
grant execute on function public.unlock_account(uuid) to authenticated;

-- =============================================================================
-- DOWN (manual): drop the admin_* functions created above.
-- =============================================================================
