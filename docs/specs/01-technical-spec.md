# 01 · Technical specification

Status: proposed. Validates blueprint §26–§28 and fills the gaps it leaves open.

## 1. System overview

```
 Browser (Next.js app)            AI clients (MCP, later)
        │                                  │
        ▼                                  ▼
 ┌──────────────────────── Command Centre (Vercel) ────────────────────────┐
 │  App routes (RSC + server actions)    API routes (/api/v1, /api/mcp)    │
 │                    │                          │                         │
 │                    ▼                          ▼                         │
 │              Service layer (src/server/services) — one place for rules  │
 │     auth context · permissions · validation · audit · versioning        │
 │                    │                 │                  │               │
 │          Postgres (Supabase, RLS)   AI service      Connector framework │
 └────────────────────┼─────────────────┼──────────────────┼───────────────┘
                      │                 │                  │
              Job worker (queue)   Model providers    Findable · Reel Deal ·
              schedules, agents,   (Claude first)     GA4 · Search Console ·
              syncs, reports                          Meta · Google Ads …
```

## 2. Validated stack

| Layer | Choice | Validation notes |
|---|---|---|
| Frontend | Next.js App Router, React, TypeScript (strict) | Server components for data-heavy pages; client components only where interactive |
| Styling | Tailwind CSS on CSS-variable tokens | Theme = class on `<html>`, so light/dark and product themes are a class swap |
| Components | shadcn/ui (Radix primitives) | Radix gives keyboard and ARIA behaviour; restyled with our tokens |
| Charts | Recharts or Visx, wrapped in our own chart components | Wrappers enforce labels, units, period, source and evidence badge (§21) |
| Database | Supabase Postgres 17 | RLS on every table; `pgvector` for knowledge retrieval |
| Auth | Supabase Auth (email, Google, Microsoft SSO) | MFA available; SAML later for enterprise (Phase 4) |
| Storage | Cloudflare R2, private, signed URLs | Documents and report exports; same pattern Reel Deal already uses |
| Jobs | Postgres-backed queue with a separate Node worker | Matches Reel Deal's proven job model (leases, retries, idempotency). Revisit a hosted queue if volume needs it |
| Scheduling | Cron entries that enqueue jobs | Agent schedules, integration syncs, report generation |
| AI | Provider interface, Anthropic Claude as first provider | Model chosen per task from a registry in config, not hard-coded |
| Hosting | Vercel (app, functions in `syd1`), a container host for the worker (Sydney) | Long agent runs and syncs do not fit serverless time limits. All data in Sydney: Supabase `ap-southeast-2`, R2 Oceania (decisions, 2026-11-16) |
| Monitoring | Sentry (errors), structured logs, OpenTelemetry traces | Agent runs traced end to end |
| Email | Transactional email provider (Resend or Postmark) | Notifications, approvals, invites |
| Billing | Stripe | See `10-billing.md` |

## 3. Code layout (when building starts)

```
src/
  app/(marketing)/         public pages, if Command Centre gets its own site
  app/(app)/               logged-in product, one folder per module
  app/api/v1/              public REST API (versioned)
  server/services/         business rules; the only code that writes data
  server/auth/             principal resolution (user, agent, integration)
  server/ai/               providers, model registry, orchestrator, tools
  server/connectors/       one folder per integration, shared connector interface
  server/jobs/             queue, worker, schedules
  components/ui/           design-system primitives
  components/charts/       chart wrappers
tokens/                    tokens.css, tailwind preset
config/                    plans.json, models.json, agents/*.json
supabase/migrations/       SQL migrations
```

## 4. Cross-cutting requirements and how they are met

| Requirement (§27) | Approach |
|---|---|
| Multi-tenant, database-level isolation | `org_id` on every row, RLS policies via `has_permission()`; see `03` |
| Role-based permissions | Roles map to permission strings; enforced in RLS and services; see `06` |
| Version history | `record_versions` table written by trigger on core tables (JSON snapshot, actor, reason) |
| Concurrent edits | `version` integer on every record; updates use `where version = $expected`; conflict returns 409 with both versions |
| Audit logging | Append-only `audit_events`; inserted by services and security-definer triggers; no update/delete grants |
| Real-time | Supabase Realtime on notifications, approvals, agent runs and task boards only |
| Backups and recovery | Supabase PITR; quarterly restore drill into a scratch project, recorded in `docs/ops/` |
| Export and deletion | Per-organisation export job (JSON + files zip); deletion = soft delete, 30-day purge job, audit kept |
| Usage metering | `usage_events` ledger (AI tokens, agent runs, storage, syncs) rolled up per period; see `10` |
| Monitoring | Sentry, job dashboards, alert on failed syncs and agent runs |

## 5. Record conventions

Every core table has: `id uuid`, `org_id`, `workspace_id` (nullable only for organisation-level records),
`brand_id` (nullable), `status`, `owner_id`, `created_by`, `created_by_type` (`user` | `agent` |
`integration`), `created_at`, `updated_at`, `archived_at`, `deleted_at`, `version`.

Lifecycle (§7): create → edit → (submit for approval → approved/rejected) → archive ↔ restore → delete
(soft) → purge. Archived and deleted records are hidden by default views, not by RLS.

## 6. API

- **Internal:** server actions and route handlers call services directly.
- **Public REST** `/api/v1` (Phase 3): JSON, cursor pagination, `Idempotency-Key` on writes, OAuth 2.1
  bearer tokens scoped to one organisation. Used by Findable, Reel Deal and customers.
- **Webhooks out:** signed (HMAC-SHA256, timestamped), retried with backoff, delivery log per endpoint.
- **MCP server** (Phase 3 or later): same services, same permission checks, like Reel Deal's.

## 7. Environments

`local` (Supabase CLI stack), `preview` (Vercel previews on a Supabase branch), `staging`, `production`.
Secrets only in the host's secret store; a startup check refuses to boot with missing or test keys in
production.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Scope: eleven modules plus an AI workforce | Strict milestones (`11`); each module ships thin first |
| AI cost per customer | Usage ledger, per-plan limits, model routing (smaller models for routine work) |
| Integration fragility (GA4, Meta and others) | Connector interface with health status, backoff and clear "last synced" labels |
| Agents acting wrongly | Autonomy levels enforced in tool layer, approvals, full run traces (`08`) |
| Cross-tenant leaks via AI retrieval | Retrieval runs under the principal's RLS context, isolation tests include agents |
