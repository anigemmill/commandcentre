# Development

## Requirements

- Node 22 or later (`.nvmrc`)
- PostgreSQL 16 or later server binaries (`initdb`, `pg_ctl`, `psql`) for the local database.
  Plain Postgres stands in for Supabase locally: `supabase/local/` adds the roles and `auth.uid()`
  the migrations rely on. It is never applied to a real Supabase project.

## First run

```bash
npm install
```

```bash
npm run setup
```

`setup` starts a local Postgres in `.data/postgres` (port 54330, git-ignored), creates the `commandcentre`
database and applies the migrations. Then copy `.env.example` to `.env.local` and start the app:

```bash
npm run dev
```

The app runs on http://localhost:3000. `/api/health` reports whether the database is configured.

## Checks

| Command | What it does |
|---|---|
| `npm run check` | Migration safety, token guard, secret scan, type check, lint and unit tests (what CI runs, minus the build, the dependency audit and the production settings check) |
| `npm run check:secrets` | Fails on committed credentials, or on `process.env` read anywhere in `src/` other than `src/server/env.ts` |
| `npm run check:deps` | Fails on a high or critical advisory in a production dependency (`npm audit --omit=dev`) |
| `npm run check:env:production` | Proves the production start-up rules: a complete production environment passes, missing settings or a local database fail |
| `npm run check:tokens` | Fails on raw colours or direct theme tokens in `src/` (use semantic utilities; `docs/design-system.md`) |
| `npm run test:db` | Database tests against the local database (starts it if needed via `npm run setup` first) |
| `npm run check:env` | Validates the current environment the way the server does at start-up |
| `npm run build` | Production build |

CI (`.github/workflows/ci.yml`) runs every check, including the database tests against its own
Postgres 16 service, on every push and pull request.

## Migrations

- Files live in `supabase/migrations/`, named `<14-digit timestamp>_<snake_case>.sql` (the Supabase CLI format).
- Additive only. `npm run check:migrations` fails on drops, truncates, deletes, row updates, renames, type
  changes and disabling RLS. A reviewed exception is marked `-- reviewed: destructive` on the same line.
- Every table in `public` needs RLS and at least one policy. `app.tables_missing_rls` lists offenders and
  the database tests fail if it returns anything.
- New tables get **no** privileges for `anon` or `authenticated` by default (the foundation migration
  removes Supabase's broad defaults). Grant what a table needs explicitly.
- `npm run db:migrate` applies `supabase/local/` only to a database on this machine. For any other
  non-Supabase database it refuses unless `ALLOW_LOCAL_SHIM=true` is set deliberately.
- **Target guard.** `npm run db:migrate` first checks the target (`src/server/db/migration-guard.ts`):
  a Supabase project must be listed in `config/database-targets.json` (none yet, so only local
  databases are accepted), and a database carrying another product's meta schema or identity marker
  is refused. Nothing is written when the check fails.

## Start-up checks

A server validates its environment when it starts (`src/instrumentation.ts`). In production, missing or
local values are logged at start-up and no route is served, rather than failing request by request.

## Not set up yet

- Error monitoring (Sentry): needs an account and DSN; added when the app is first deployed.
- Hosted Supabase and Vercel projects (Sydney): created at first deployment.
- The Supabase Docker stack: Docker isn't available in the environment this was built in, so the local
  database is plain Postgres plus `supabase/local/`.
