-- =============================================================================
-- 0016_scheduler.sql
-- Automated jobs (PAD §12 Scheduled Jobs, §17 Scheduler Logs).
--   * auto_rollover_weekly_tasks() — moves unfinished tasks into the next week
--     at week boundary, creating the following week when absent.
--   * cleanup_expired_logs() — enforces log retention (debug 90d, performance 1y).
-- Both are SECURITY DEFINER, write a scheduler log, and are idempotent enough
-- to run repeatedly. pg_cron scheduling is attempted but guarded: if the
-- extension is unavailable in the target project the functions still exist and
-- can be invoked manually or wired to Supabase scheduled Edge Functions.
-- =============================================================================

-- ---- Automatic weekly roll-over --------------------------------------------
create or replace function public.auto_rollover_weekly_tasks()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_source     public.planning_weeks%rowtype;
  v_target_id  uuid;
  v_next_no    integer;
  v_next_year  integer;
  v_moved      integer := 0;
  v_total      integer := 0;
begin
  -- Every open week whose end date has passed is eligible for roll-over.
  for v_source in
    select * from public.planning_weeks
    where status = 'open'
      and end_date < current_date
      and is_deleted = false
    order by year, week_number
  loop
    -- Determine the following week (wrap year at week 52).
    if v_source.week_number >= 52 then
      v_next_no := 1;
      v_next_year := v_source.year + 1;
    else
      v_next_no := v_source.week_number + 1;
      v_next_year := v_source.year;
    end if;

    -- Ensure the target week exists.
    select id into v_target_id
    from public.planning_weeks
    where year = v_next_year and week_number = v_next_no;

    if v_target_id is null then
      insert into public.planning_weeks (week_number, year, start_date, end_date, status)
      values (
        v_next_no, v_next_year,
        v_source.end_date + 1,
        v_source.end_date + 7,
        'open'
      )
      returning id into v_target_id;
    end if;

    v_moved := public.rollover_weekly_tasks(v_source.id, v_target_id);
    v_total := v_total + v_moved;

    -- Close the processed source week so it is not rolled over again.
    update public.planning_weeks set status = 'closed' where id = v_source.id;
  end loop;

  perform public.log_event(
    'scheduler', 'Автоматический перенос задач недели выполнен', 'information',
    'weekly-planning', 'auto_rollover',
    jsonb_build_object('tasks_moved', v_total)
  );
  return v_total;
end;
$$;

revoke all on function public.auto_rollover_weekly_tasks() from public;
grant execute on function public.auto_rollover_weekly_tasks() to service_role;

-- ---- Log retention cleanup -------------------------------------------------
create or replace function public.cleanup_expired_logs()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_deleted integer := 0; v_tmp integer := 0;
begin
  delete from public.system_logs
  where category = 'debug' and created_at < now() - interval '90 days';
  get diagnostics v_tmp = row_count;
  v_deleted := v_deleted + v_tmp;

  delete from public.system_logs
  where category = 'performance' and created_at < now() - interval '365 days';
  get diagnostics v_tmp = row_count;
  v_deleted := v_deleted + v_tmp;

  perform public.log_event(
    'scheduler', 'Очистка устаревших журналов выполнена', 'information',
    'monitoring', 'cleanup_expired_logs',
    jsonb_build_object('deleted', v_deleted)
  );
  return v_deleted;
end;
$$;

revoke all on function public.cleanup_expired_logs() from public;
grant execute on function public.cleanup_expired_logs() to service_role;

-- ---- pg_cron scheduling (best-effort) --------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- Weekly roll-over: Mondays 00:05 UTC.
    perform cron.schedule(
      'vdms-weekly-rollover', '5 0 * * 1',
      $cron$ select public.auto_rollover_weekly_tasks(); $cron$
    );
    -- Log cleanup: daily 03:00 UTC.
    perform cron.schedule(
      'vdms-log-cleanup', '0 3 * * *',
      $cron$ select public.cleanup_expired_logs(); $cron$
    );
  end if;
exception
  when others then
    -- Scheduling is optional; never fail the migration if pg_cron is absent
    -- or the current role cannot manage it.
    raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end $$;
