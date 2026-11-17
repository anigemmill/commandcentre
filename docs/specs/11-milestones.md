# 11 · Development milestones

Status: proposed. Each milestone ends with a review and a working, tested increment. No milestone
starts until the previous one is accepted. Phases are the blueprint's (§29–§32).

## Phase 0 · Sign-off (now)

- **M0 · Specifications agreed.** Owner reviews `docs/specs/` and answers the open questions in
  `docs/decisions.md`. Exit: decisions recorded.

## Phase 1 · Core Command Centre

| # | Milestone | Includes | Exit criteria |
|---|---|---|---|
| M1 ✅ (17 Nov 2026) | Foundations | Next.js scaffold, TypeScript strict, lint, CI, Supabase local stack, migration tooling, env checks, Sentry | CI green on an empty app; local stack runs from one command |
| M2a | Accounts service (`13`) | Shared sign-in (Supabase Auth), organisations, memberships, product access, invitations, token issuing and JWKS, outbox events, product switcher component, subscriptions assigned by staff (Stripe checkout comes in M17) | A user signs up once and reaches Command Centre without a second sign-in |
| M2b | Tenancy in Command Centre | Token verification, account mirrors, workspaces, brands, Command Centre roles and permissions, `has_permission`, RLS, audit events, record versions | Isolation suite (`03` §7) passes for all tables; removing a member in accounts blocks them in Command Centre within a minute |
| M3 | Design system | Tokens (`09`), primitives, shell (nav, top bar, side panel), `/design-system` page, light/dark/system theme persisted | axe clean in both modes; keyboard walkthrough of shell |
| M4 | Business profile and onboarding | Profile, offerings, locations, audiences, competitors, progressive onboarding checklist | J1 works end to end (AI pre-fill deferred to Phase 2) |
| M5 | Projects and tasks | Projects, milestones, tasks, dependencies, recurring, my tasks, workload, risk flags | M07 requirements pass |
| M6 | Strategy and objectives | Plans, SWOT, objectives, KPIs, progress view, version compare | J3 works without AI |
| M7 | Knowledge hub | Upload, extraction, tagging, search (full-text first; embeddings in M9) | Documents isolated per org in tests |
| M8 | Home and basic reporting | Home dashboard (`04` §6), KPI tiles, manual metrics, GA4 connector through the shared Google connection | Home shows only real data with sources |

## Phase 2 · AI intelligence and workforce

| # | Milestone | Includes |
|---|---|---|
| M9 | AI service | Provider interface, Claude provider, model registry, usage metering, budgets, embeddings and retrieval |
| M10 | Intelligence register and approvals | Intelligence records and workflow, recommendations, Approval Centre and rules |
| M11 | Agents | Agent templates, configuration, autonomy gate, runs and traces, schedules and triggers, first seven agents (`08` §8) |
| M12 | Strategy Assistant | Chat, citations, proposals as cards, handoffs to specialists |

## Phase 3 · Connected ecosystem

| # | Milestone | Includes |
|---|---|---|
| M13 | Ecosystem API | `/api/v1`, token exchange between products (`13` §5), webhooks in and out, OpenAPI, contract tests |
| M14 | Reel Deal | Shared-account connection, brand push, production requests, status, approvals, exports (requires Reel Deal gaps `07` §3.5) |
| M15 | Findable | Shared-account connection, intelligence and metrics ingestion, recommendations sync |
| M16 | Unified reporting | Cross-channel reports, monthly/quarterly reviews, PDF export, entitlements across products |

## Phase 4 · Commercial scale

M17 Billing and Stripe (in accounts) · M18 Agencies and client management · M19 Advanced permissions, custom roles,
SSO · M20 Forecasting and attribution · M21 White-label · M22 Workflow automation and support tooling.

## Dependencies on other teams

- Reel Deal: move onto the shared account (`13` §7), REST surface, webhooks, `cc_ref`/`deadline`, storyboard decision endpoint
  (before M14).
- Findable: move onto the shared account and organisations, an external API and webhooks (`07` §4.5),
  before M15. Shared Google connection (decisions) before M8 if Findable's connection is reused.
- Shared foundation package for tokens and components (before M3 ideally, or M3 builds locally and
  extracts later).
