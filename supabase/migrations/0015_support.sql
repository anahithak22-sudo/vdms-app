-- =============================================================================
-- 0015_support.sql
-- Cross-artifact support: a minimal, non-privileged directory of assignable
-- users for owner/assignee selects. Exposes only id, display name, and role
-- of active users — never email or security fields.
-- =============================================================================

create or replace function public.list_assignable_users()
returns table (id uuid, display_name text, role public.user_role)
language sql
stable
security definer
set search_path = public
as $$
  select id, display_name, role
  from public.app_users
  where is_active = true
    and is_deleted = false
    and is_archived = false
  order by display_name;
$$;

grant execute on function public.list_assignable_users() to authenticated;

-- =============================================================================
-- DOWN (manual): drop function list_assignable_users().
-- =============================================================================
