# VDMS — VTB Development Management System

Internal enterprise web application that replaces five Excel-based workflows with a
single, auditable platform: strategic planning, development roadmap, bug statistics,
weekly planning, and a priority queue — plus dashboard, notifications, import/export,
archive, monitoring, logging, user management, and system settings.

The entire UI is in **Russian**; all code, identifiers, and comments are in **English**.

**Stack:** React 19 · TypeScript (strict) · Vite 6 · Tailwind CSS · shadcn/ui ·
TanStack Query v5 · React Router v6 · React Hook Form · Zod · Recharts ·
Supabase (PostgreSQL · Auth · Storage · Realtime · Row Level Security · Edge Functions).

**Hosting:** GitHub → GitHub Actions → Netlify (frontend); Supabase (backend).

---

## Prerequisites

- Node.js 20+
- A Supabase project (URL + anon key + service role key)
- Supabase CLI (`npm i -g supabase`) for migrations and edge functions

## Quick start (local)

```bash
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

## Database & backend

```bash
supabase link --project-ref <your-project-ref>
supabase db push                       # applies migrations 0001–0016
supabase functions deploy admin-create-user
supabase functions deploy admin-reset-password
```

Storage buckets (7, all private, 50 MB limit) are created by migration `0009`.
The scheduler (`0016`) installs `pg_cron` jobs when the extension is available;
otherwise the job functions can be invoked manually or via scheduled Edge Functions.

### First user (no self-registration)

1. Create an auth user (Supabase dashboard → Authentication → Users, or the Admin API).
2. Insert a matching `public.app_users` row (template in `supabase/seed.sql`) with
   `role = 'super_admin'` and `is_first_login = true`.

On first login the user is forced to change their password before any other page loads.
All further users are created in-app from **User Management** (Super Admin only), which
issues a temporary password via the `admin-create-user` Edge Function.

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full production runbook.

## Scripts

```bash
npm run dev           # dev server
npm run build         # typecheck + production build
npm run preview       # preview the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier (write)
```

## Roles & access (enforced by RLS, mirrored in the UI)

| Module            | Super Admin | Admin | Manager    | Developer  |
| ----------------- | :---------: | :---: | :--------: | :--------: |
| Dashboard         | ✔ | ✔ | ✔ | ✔ |
| Planning (01)     | ✔ | ✔ | ✖ | ✖ |
| Roadmap (02)      | ✔ | ✔ | ✔ | assigned only |
| Bug Statistics(03)| ✔ | ✔ | ✔ | assigned only |
| Weekly Planning(04)| ✔ | ✔ | ✔ | own status via RPC |
| Priority Queue(05)| ✔ | ✔ | read + select | read only |
| Import / Export   | ✔ | ✔ | optional | optional |
| Archive           | ✔ | ✔ | limited | limited |
| User Management   | ✔ | ✖ | ✖ | ✖ |
| Monitoring / Logs / Settings | ✔ | ✖ | ✖ | ✖ |

Frontend role checks are a usability aid only — **Supabase Row Level Security is the
authoritative boundary**. Every business table enables RLS; audit and system logs are
Super-Admin-read-only; audit records are immutable.

## Project structure

```
src/
  app/            application root
  components/
    ui/           shadcn/ui primitives
    data/         DataTable engine, toolbar, pagination, export menu, row actions
    common/       display primitives, form dialog, details drawer, status controls
    kanban/       generic drag-and-drop board
    layout/       sidebar, header (+ notification bell), session dialog
  constants/      roles, routes, navigation, enums/label maps, options
  features/
    auth/ planning/ roadmap/ bugs/ weekly/ queue/     five artifacts + auth
    dashboard/ notifications/ import/ archive/ monitoring/ settings/ users/
  hooks/          CRUD/list controllers, reference data, audit, notifications, prefs
  layouts/        AuthLayout, AppLayout
  lib/            env, supabase client + typed schema, query params, format, export, import
  locales/        ru.ts (single Russian UI source)
  providers/      Query, Auth, composed AppProviders
  routes/         router assembly + guards (Protected/Public/Role)
  services/       centralized service layer (no component talks to Supabase directly)
  types/          user, api envelope, common
supabase/
  migrations/     0001–0016 (auth, infra, reference, core fns, RLS, artifacts, scheduler)
  functions/      admin-create-user, admin-reset-password (+ _shared)
  seed.sql        development seed template
```

## Architecture notes

- **Layered:** Components → Hooks → Services → Supabase → SQL functions → PostgreSQL.
- **Single source of truth:** typed `Database` schema; every query keyed via `queryKeys`.
- **Auditability:** database triggers write immutable audit logs; services never duplicate them.
- **Soft delete + archive** everywhere; nothing is hard-deleted.
- **Optimistic locking** via per-record `version` (no silent overwrite).
- **UTC storage, Europe/Moscow display.**
