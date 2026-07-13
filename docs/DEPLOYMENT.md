# VDMS — Deployment Guide

Production runbook for the VTB Development Management System. The application has two
deployable parts: the **Supabase backend** (database, auth, storage, edge functions,
scheduler) and the **frontend** (static SPA on Netlify). No additional code generation
is required — this repository is deployable as-is.

---

## 0. Prerequisites

- Node.js 20+ and npm
- Supabase CLI: `npm i -g supabase`
- A Supabase project (production)
- A GitHub repository and a Netlify site
- Project credentials: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_PROJECT_ID`

---

## 1. Supabase backend

### 1.1 Link and push the schema

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies migrations `0001`–`0016` in order:

| Range | Contents |
| ----- | -------- |
| 0001–0002 | Auth foundation (`app_users`, username→email RPC, login/lockout), user preferences |
| 0003–0005 | Shared enums + business-ID sequences, infrastructure tables (audit/system logs, notifications), reference data (+ RU seed) |
| 0006–0007 | Core SQL functions (audit, logging, soft-delete/archive/restore) + RLS wiring |
| 0008–0009 | User-management RPCs (Super-Admin guarded), storage buckets |
| 0010–0014 | Artifacts 01–05 (planning, roadmap, bugs, weekly, priority queue) with RLS |
| 0015 | Assignable-users directory |
| 0016 | Scheduler: auto weekly roll-over + log-retention cleanup (pg_cron, best-effort) |

Migrations are idempotent where practical and contain no forward references.

### 1.2 Deploy edge functions

Two functions touch `auth.users` with the service role and must be deployed:

```bash
supabase functions deploy admin-create-user
supabase functions deploy admin-reset-password
```

No extra secrets are required — both use the platform-provided
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` inside the function runtime.

### 1.3 Storage

Migration `0009` creates seven private buckets (`avatars`, `attachments`, `imports`,
`exports`, `reports`, `archives`, `temporary`) with a 50 MB limit and RLS policies.
No manual bucket creation is needed.

### 1.4 Scheduler (pg_cron)

Migration `0016` schedules two jobs **when `pg_cron` is available**:

- `vdms-weekly-rollover` — Mondays 00:05 UTC → `auto_rollover_weekly_tasks()`
- `vdms-log-cleanup` — daily 03:00 UTC → `cleanup_expired_logs()`

If `pg_cron` is not enabled on your plan, the migration skips scheduling without
failing. You can then either enable the extension and re-run the `DO` block, or invoke
the two functions from a scheduled Supabase Edge Function / external cron.

### 1.5 Auth configuration

In the Supabase dashboard (Authentication → Providers/Settings):

- **Disable** email signup (self-registration is not allowed).
- Set **Site URL** and **Redirect URLs** to your Netlify domain.
- Keep refresh-token rotation enabled.

`supabase/config.toml` already reflects these settings for local development.

### 1.6 Create the first Super Administrator

1. Authentication → Users → **Add user** (email + password). Note the returned user id.
2. In the SQL editor, insert the profile row:

```sql
insert into public.app_users (auth_user_id, username, display_name, role, is_first_login)
values ('<auth-user-id>', 'superadmin', 'Супер Администратор', 'super_admin', true);
```

On first login the user is redirected to change their password. All subsequent users
are created from **User Management** inside the app.

> `supabase/seed.sql` is a **development-only** template and must not be run in production.

---

## 2. Frontend (Netlify)

### 2.1 Environment variables

In Netlify → Site settings → Environment variables, set:

| Variable | Value |
| -------- | ----- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | project anon key |
| `VITE_APP_VERSION` | e.g. `1.0.0` |
| `VITE_ENVIRONMENT` | `production` |
| `VITE_APP_TIMEZONE` | `Europe/Moscow` |
| `VITE_SESSION_TIMEOUT_MINUTES` | `30` |
| `VITE_SESSION_WARNING_MINUTES` | `5` |

The service role key is **never** exposed to the frontend — it lives only in Supabase.

### 2.2 Build settings

`netlify.toml` already defines:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- SPA redirect: `/* → /index.html 200` (also in `public/_redirects`)

Connect the GitHub repository to Netlify and select the `main` branch. Pushes to
`main` build and deploy automatically.

### 2.3 GitHub Actions

`.github/workflows/ci.yml` runs install → lint → typecheck → build on every push and
pull request, gating merges to `main`.

---

## 3. Post-deploy verification

1. **Auth** — log in as the Super Admin; confirm the forced password change on first login.
2. **RBAC** — create one user per role from User Management; confirm hidden modules and
   read-only behavior match the access matrix in the README.
3. **Artifacts** — create/edit/archive/restore a record in each of the five modules.
4. **Weekly** — confirm a developer can change status only on their own assigned tasks.
5. **Realtime** — trigger a notification; confirm the header bell updates without refresh.
6. **Import/Export** — import a small CSV; export CSV/XLSX; confirm the preview and logs.
7. **Monitoring/Logs** — confirm Super-Admin-only access and that events appear.
8. **Performance** — first load < 3 s; large tables paginate/virtualize smoothly.

---

## 4. Rollback

- **Frontend:** redeploy the previous successful Netlify deploy (one click).
- **Database:** restore from Supabase automated backup / point-in-time recovery.
- **Migrations:** apply a corrective forward migration (never edit applied migrations).

---

## 5. Operational notes

- Audit and security logs are permanent and immutable; error logs retain 2 years,
  performance logs 1 year, debug logs 90 days (enforced by `cleanup_expired_logs`).
- All timestamps are stored in UTC and displayed in Europe/Moscow.
- Every business table enforces RLS; the frontend is not a trust boundary.
