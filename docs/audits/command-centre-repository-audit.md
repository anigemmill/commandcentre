# Command Centre repository audit

Date: 18 November 2026 · Branch audited: `claude/kind-darwin-4axfgh` at `5b28037` · Audit branch:
`claude/cc-audit-and-foundations`

Scope: the whole repository against the master brief (`docs/blueprint.md` v1.1), the decisions log and
the thirteen specifications. Every claim below was checked against the code or by running it. Nothing
external (Supabase, Vercel, Sentry, other repositories) was changed. Labels used throughout:

| Label | Meaning |
|---|---|
| **Implemented** | Code exists, runs and is tested |
| **Partial** | Some of it exists and works; the rest is missing |
| **Scaffolded** | A placeholder or structure exists but does no real work yet |
| **Specified only** | Designed in `docs/`, no code |
| **Missing** | Neither designed nor built |

## 1. Summary

Command Centre is at the end of milestone **M1 (foundations)**, exactly as its README says. It is a
small, clean, well-documented codebase: 44 files before this audit, of which 23 are documentation.
There are **no product features, no tables, no sign-in and no screens** beyond a placeholder home page.
That is deliberate (blueprint §37: architecture, data relationships and design system first).

The documentation is far ahead of the code and is of high quality: the specifications already cover
almost everything the brief asks for, including the shared-account architecture, which is approved and
has its own repository (`anigemmill/outsideinprojects`). The main risks are therefore not missing
design but **ordering and dependency risks**: Command Centre's next milestone (M2b) depends on the
account service finishing A2–A6, which is itself blocked on `accounts-dev` (see §9).

| Area | Status |
|---|---|
| App skeleton, TypeScript strict, lint, CI | Implemented |
| Environment validation | Implemented (start-up enforcement fixed in this audit, §8) |
| Migrations, migration safety check, RLS guard | Implemented |
| Local database (plain Postgres + Supabase compatibility file) | Implemented |
| Security headers | Partial (no Content Security Policy yet, by design) |
| Design tokens | Partial (foundation and theme tokens added in this audit, §8; no components) |
| Authentication | Specified only (Command Centre M2b; account service A2 in progress elsewhere) |
| Organisations, workspaces, memberships, roles | Specified only |
| Every product module (Home … Strategy Assistant) | Specified only |
| Error monitoring, logging | Missing (Sentry deferred to first deployment, recorded) |
| Hosted environments | Missing (deferred to first deployment, recorded) |

## 2. Application structure and architecture

| Item | Finding | Status |
|---|---|---|
| Framework | Next.js 16.4.6 App Router, React 19.3, TypeScript strict, Tailwind 4.3.3, zod 4, `postgres` (porsager). Same versions as Reel Deal (decided, so components can be shared) | Implemented |
| Layout | `src/app/` (pages and routes), `src/server/` (env, db). The target layout in spec 01 §3 (`server/services`, `server/auth`, `server/ai`, `server/connectors`, `server/jobs`, `components/ui`, `config/`) does not exist yet | Partial |
| Service layer | None. Spec 01 makes `src/server/services` the only code that writes data | Specified only |
| Job worker | None. Spec 01: Postgres-backed queue with a separate Node worker, as in Reel Deal | Specified only |
| AI provider interface | None. Spec 08 | Specified only |
| Config (`config/plans.json`, `models.json`, `agents/*.json`) | None. CLAUDE.md requires plans and limits in config | Specified only |
| `packages/foundation/` | Created in this audit (tokens only) | Partial |
| Node version | `.nvmrc` 22, `engines >=22` | Implemented |

**Architecture is consistent with the decisions log.** No code contradicts an approved decision.

## 3. Routes and pages

| Route | What it does | Status |
|---|---|---|
| `/` | Static placeholder: product name, one-line description, "Foundations only" | Scaffolded (honest: says no features yet) |
| `/api/health` | Liveness: reports whether `DATABASE_URL` is configured; does not connect to the database | Implemented |
| Everything in spec 04 §4 (about 60 screens) | — | Specified only |

There is no `(app)` route group, no `[orgSlug]/[workspaceSlug]` routing (spec 03 §4), no
`/design-system` page (spec 09 §5), no not-found or error page beyond Next.js defaults.

## 4. Database schema and migrations

| Item | Finding | Status |
|---|---|---|
| Migrations | One: `20261117000001_foundation.sql`. Removes Supabase's default grants on new tables, sequences and functions for `anon`/`authenticated`; revokes `create` on `public`; creates the `app` schema; creates `app.tables_missing_rls` | Implemented |
| Migration runner | `src/server/db/migrate.ts`: ordered, each migration in a transaction, recorded in `cc_meta.migrations`; applies `supabase/local/*` only when `auth.users` is absent; `ALLOW_LOCAL_SHIM=false` refuses the shim | Implemented |
| Safety check | `scripts/check-migrations.ts`: refuses drops, truncates, deletes, row updates, renames, type changes and disabling RLS unless marked `-- reviewed: destructive` | Implemented |
| RLS guard | Tests fail if any `public` table lacks RLS or a policy | Implemented |
| Product tables | **None.** No organisations mirror, workspaces, brands or any module table | Specified only (spec 02) |
| `cc_meta` schema | Created by the runner, not by a migration. Not exposed through the Data API (Command Centre does not use the Data API for customer requests), but it has no RLS. Reel Deal hit the same Supabase advisor finding on its equivalent and fixed it in a migration | Partial (see review in the data model document) |

Detailed review against the brief: `docs/architecture/command-centre-data-model-review.md`.

## 5. Authentication and the account service

| Item | Finding | Status |
|---|---|---|
| Decision | Approved 17 Nov 2026: Command Centre signs people in only through the account service, as an OAuth 2.1 / OIDC client of its Supabase Auth, verifying tokens offline with its JWKS and accepting exactly one issuer per environment | Decided |
| Command Centre code | No sign-in, session, callback, token verification or principal resolution. No `ACCOUNTS_*` or `SESSION_ENCRYPTION_KEY` variables in `src/server/env.ts` (correct: variables are added when first used) | Specified only (M2b) |
| Database side | `auth.uid()` from `request.jwt.claims`, proven by a database test against real Postgres | Implemented (foundation only) |
| Account service (`anigemmill/outsideinprojects`, read, not changed) | A1 done; A2 in progress: sign-in, sign-up, reset, MFA and OAuth consent pages built and unit-tested, never run against a real Supabase Auth | Partial, external |

## 6. Organisations, workspaces, tenancy and isolation

| Item | Finding | Status |
|---|---|---|
| Hierarchy (organisation → workspace → brand) | Spec 03 §1 | Specified only |
| Mirrors of accounts data | Spec 02 marks `organisations`, `org_relationships`, `users`, `memberships`, `subscriptions`, `entitlements` as mirrors fed by signed events | Specified only |
| `app.has_permission()` | Spec 03 §2 (SQL drafted) | Specified only |
| Isolation tests | Spec 03 §7 lists six required tests for every table | Specified only |
| Deny-by-default grants | Implemented and tested | Implemented |

Multi-tenancy cannot be assessed beyond the foundation, because no tenant tables exist. The design is
sound (organisation as boundary, composite foreign keys, `with check` on every policy, URL-carried
context resolved server-side, agents as narrower principals). Points that need attention before M2b are
in the data model review §4.

## 7. API routes, server actions, components, tests, errors and security

| Area | Finding | Status |
|---|---|---|
| API routes | `/api/health` only. `/api/v1`, webhooks and MCP are specified (spec 01 §6, spec 07) | Specified only |
| Server actions | None | Missing (nothing to act on yet) |
| Shared components | None. No `components/` folder, no shadcn/ui installed | Specified only (M3) |
| Design tokens | Placeholder of three colours before this audit; now the full token layer (§8) | Partial |
| Unit tests | `env` parsing (5), plus tests added in this audit: start-up validation (3), token contrast (86) | Implemented |
| Database tests | 5, against real Postgres in CI and locally | Implemented |
| Browser, accessibility, isolation, contract tests | None (nothing to test yet) | Specified only (spec 12) |
| Error handling | `parseEnv` gives clear messages. No error boundary, no `not-found`/`error` pages, no structured error type for services | Partial |
| Logging and monitoring | No structured logger, no Sentry, no request ids | Missing (deferred, recorded) |
| Security headers | Frame denial, nosniff, referrer policy, permissions policy, HSTS with preload; no CSP | Partial |
| Secrets | None committed; `.env*` git-ignored; `process.env` read only in `src/server/env.ts` (plus tests and scripts) | Implemented |

Full detail: `docs/audits/security-and-testing-review.md`.

## 8. Changes made during this audit

All small, isolated and tested. None changes the architecture.

1. **Start-up environment check now actually runs at start-up** (`src/instrumentation.ts`). Before, a
   production server started and reported "Ready" with `APP_URL` and `DATABASE_URL` missing, then
   answered requests with a 500, contradicting the promise in `src/server/env.ts`. Now the error is
   logged when the server starts and no route is served (verified with `next start`). Tests in
   `src/instrumentation.test.ts`.
2. **Design token layer** (`packages/foundation/tokens.css`, `tokens/command-centre.css`,
   `src/app/globals.css`): foundation `--oi-*` tokens, the Command Centre theme with light and dark
   values from spec 09, and Tailwind utilities on top. Verified in a browser in both modes.
3. **Automated contrast check** (`src/design/tokens.test.ts`, 86 tests): every text, control, focus
   and chart pair meets spec 09's targets, the spec's published ratios are reproduced, and dark mode is
   identical for the device setting and the explicit choice. Spec 12 §2 requires this check.
4. **Token guard** (`scripts/check-tokens.ts`, `npm run check:tokens`, in CI): fails on raw colours or
   direct theme tokens in application code, enforcing the CLAUDE.md rule.

## 9. Architectural decisions that may cause rework

| # | Issue | Why it matters | Recommendation |
|---|---|---|---|
| R1 | **Command Centre's M2b depends on account service A2–A6**, and A2 is blocked on `accounts-dev` | Everything with an organisation depends on M2b. If accounts slips, Command Centre is stalled | Build M2b against a **local token issuer** (a test JWKS and signed test tokens) behind the same verifier, so Command Centre's tenancy can be finished and tested before accounts is live. This is already the stated local approach ("tests set verified claims directly"); make it an explicit milestone task |
| R2 | **`accounts-dev` now contains Reel Deal's schema.** On 17 Nov, in the Reel Deal session, Reel Deal's eight migrations were applied to `accounts-dev` by mistake (it was taken to be a Reel Deal test project). No data was written | `accounts-dev` is meant to be the identity project for every product, with synthetic data only, and separate product databases are an approved rule | Before A2 testing resumes: recreate `accounts-dev` (free, nothing to keep) or remove the Reel Deal objects with a reviewed script. Owner decision; needs Supabase access |
| R3 | Spec 01 §2 still lists "Auth: Supabase Auth (email, Google, Microsoft SSO)" and §7 "local (Supabase CLI stack)" | Both predate the shared-account and plain-Postgres decisions; a reader could build Command Centre's own sign-in | Update spec 01 to point to spec 13 and the decisions (documentation only) |
| R4 | `has_permission()` (spec 03 §2) is `security definer` with `search_path = app, public, pg_temp` | A security-definer function whose search path includes a schema other roles can write to is a privilege-escalation pattern; the foundation revokes `create` on `public`, which mitigates it, but Reel Deal pinned `search_path = ''` after a Supabase advisor finding | Pin `search_path = ''` and schema-qualify every name when the function is written |
| R5 | Arrays of foreign ids (`cc_access.workspace_ids`, `campaigns.audience_ids`, `approvals.approver_ids`) | Postgres cannot enforce foreign keys or same-organisation rules on array elements, so a row can reference another tenant's id | Use join tables for anything security-relevant (`cc_access` scope at least) |
| R6 | Spec 03 §2: "Only the job worker uses the service role" | A process holding a role that bypasses RLS is the largest blast radius in the system. Reel Deal has since moved to restricted runtime roles (`reeldeal_web`, `reeldeal_worker`) for exactly this reason | Adopt restricted roles from the start in Command Centre instead of the service role |
| R7 | `user_preferences` (theme, density) is keyed by user only, in Command Centre's database | Preferences such as theme would be set separately in each product | Decide whether shared account settings (theme, locale, time zone) live in accounts; see the ecosystem document §7 |
| R8 | Mirrors are fed by events, but there is no receipt table, sequence tracking or reconciliation design on the Command Centre side | Without per-organisation sequence numbers and idempotent receipts, mirrors drift silently | Add `account_event_receipts` and a mirror state table in M2b (data model review §3) |
| R9 | `performance_metrics` "partitioned by month" | Partitioned tables complicate composite foreign keys, RLS policies (per partition) and the RLS guard view (it checks `relkind in ('r','p')` only for the parent) | Start unpartitioned with the right indexes; partition when volume needs it |
| R10 | Default branch is a `claude/…` branch | Work is merged into a session branch rather than a protected `main` | Owner decision: create `main`, protect it, require CI |

## 10. What should happen next

In order, without starting new features:

1. Owner decisions in the consolidated report (accounts-dev, branch protection, spec corrections).
2. Correct spec 01 (R3) and fold R4–R9 into specs 02 and 03 before M2b starts.
3. M2b with a local token issuer (R1), so tenancy and isolation are built and tested independently of
   the account service's progress.
4. M3 design system components on the tokens added tonight.
