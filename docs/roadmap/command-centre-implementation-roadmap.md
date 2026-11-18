# Command Centre implementation roadmap

Status: **proposal for review**, 18 November 2026. Refines `docs/specs/11-milestones.md` using tonight's
audits. Milestone numbers (M…) are spec 11's; account-service steps (A…) are
`anigemmill/outsideinprojects` `docs/plan.md`. Each milestone ends tested and reviewed before the next
starts (spec 11). Sizes are relative (S ≈ days, M ≈ 1–2 weeks, L ≈ 3+ weeks of focused work), not
commitments.

## 1. Where things stand

| Done | In progress elsewhere | Blocked |
|---|---|---|
| M1 foundations; tonight: start-up validation, token layer, contrast check, token guard, shim policy | Account service A2 (sign-in pages built, not run against real Auth) | A2 end-to-end tests: `accounts-dev` needs correcting (repository audit R2) and Supabase access |

## 2. What "commercially usable" means

**Proposed:** the first version a business can pay for is **Phase 1 + billing + production readiness**:
sign-in through the shared account, one organisation with workspaces and brands, business profile and
onboarding, strategy and objectives, projects and tasks, knowledge hub, a real Home and basic
reporting with Google Analytics, in light and dark, accessible, billed through Stripe. The AI
workforce, Findable and Reel Deal integrations follow as upgrades. Reason: each of those depends on
other systems (model costs, Findable's and Reel Deal's APIs and account migrations); the core must be
trustworthy on its own first (blueprint §1: each product works independently).

[OWNER DECISION: accept this definition, or include the Strategy Assistant (M12) in the first paid
version.]

## 3. Milestones

Legend for "External": **None** = can be done entirely in this repository with local Postgres;
**Hosted** = needs a hosted development project; **Credentials** = needs a key or account the owner
creates; **Other team** = needs work in another repository.

### R1 · Foundation and infrastructure (M1 ✅ + hardening) · S

| | |
|---|---|
| Scope | Remaining M1 items: CI additions (production `npm audit`, secret scan, `check:env` with a production-shaped environment); error and not-found pages; structured logger with request ids; `cc_meta` lock-down migration; branch protection on a `main` branch |
| Dependencies | None |
| Acceptance | CI fails on a production advisory, a committed secret, or a misconfigured production environment; every error screen shows a support reference |
| Tests | Unit tests for the logger (no tokens or personal data in output); CI jobs proven by a deliberately failing commit |
| Risks | Low |
| External | None (branch protection: owner, in GitHub settings) |

### R2 · Authentication and account management (A2–A5 + M2b part 1) · L

| | |
|---|---|
| Scope | Account service: finish A2 (end-to-end against `accounts-dev`), A3 organisations, A4 product access, A5 tokens and JWKS. Command Centre: OIDC client (authorisation code + PKCE, confidential secret), encrypted session cookie, callback, offline token verifier, principal resolution, sign-out everywhere. **Built first against a local test issuer** so Command Centre is not blocked on accounts (audit R1) |
| Dependencies | `accounts-dev` corrected; account service A2–A5 |
| Acceptance | A person signs up once in the account service and reaches Command Centre without a second sign-in; tokens from another issuer, another audience, expired or with a symmetric algorithm are refused |
| Tests | Verifier unit tests against a local issuer (all nine cases in the security review §2); end-to-end sign-in against `accounts-dev`; Playwright: sign in, sign out everywhere |
| Risks | Supabase's OAuth 2.1 server is beta (contained by using only standard OIDC); accounts schedule slips (contained by the local issuer) |
| External | **Hosted** (`accounts-dev`), **Credentials** (OAuth client id and secret, session key), **Other team** (account service) |

### R3 · Organisation and workspace management (M2b part 2 + A6) · L

| | |
|---|---|
| Scope | Account mirrors with receipts and sequence tracking; workspaces, brands, `cc_access` with join tables; roles, permissions; `app.has_permission()` with a pinned search path; audit events and record versions; restricted runtime roles instead of the service role; workspace and organisation switchers; members and roles pages that link to account invitations |
| Dependencies | R2; account service A6 (events) for the end-to-end path; local signed test events before that |
| Acceptance | The isolation suite (spec 03 §7) passes for every table; removing a member in accounts blocks them in Command Centre within a minute; a dropped event is repaired by reconciliation |
| Tests | Generated isolation tests per table (a table without tests fails CI); event ordering and idempotency tests; database tests as the restricted roles |
| Risks | Mirror drift; scope arrays (fixed by join tables, data model review §4.2) |
| External | **None** for most of it (local events); **Other team** for end-to-end events |

### R4 · Design system and application shell (M3) · M

| | |
|---|---|
| Scope | Fonts via `next/font`; shadcn/ui on the tokens; every component family in `docs/design-system.md` §6; the shell and sidebar from `docs/product/navigation-and-information-architecture.md`; theme preference (light, dark, follow device) persisted; `/design-system` page; CSP with nonces |
| Dependencies | Tokens (done tonight); R2 for the profile menu (can use a fixture principal before) |
| Acceptance | axe clean in both modes on every component and the shell; keyboard walkthrough; no horizontal scroll at 375, 768, 1280 px; theme survives sign-out and a new device |
| Tests | Playwright + axe state matrix; token contrast tests (exist); visual check in light and dark |
| Risks | Over-building components before screens need them: build the ones R5–R7 use first |
| External | None |

### R5 · Core: business intelligence and onboarding (M4, M7) · M

| | |
|---|---|
| Scope | Business profile with completeness, offerings, locations, audiences, competitors, business goals; onboarding checklist (J1); knowledge hub upload, extraction, tagging, full-text search; cultural authority and "not for AI tools" flags; `is_demo` flag |
| Dependencies | R3, R4; R2 file storage decision (R2 bucket for documents) |
| Acceptance | J1 end to end; documents isolated per organisation; demo data badged and excluded from reports |
| Tests | Isolation per new table; upload limits and type checks; Playwright J1 |
| Risks | Document extraction quality (PDF, DOCX) |
| External | **Credentials** for document storage (R2 bucket and keys) |

### R6 · Strategy and growth planning (M6) · M

| | |
|---|---|
| Scope | Plans of every kind with periods and sections; SWOT linked to evidence; objectives and KPIs; progress view with at-risk rule; experiments; version history and compare |
| Dependencies | R5 |
| Acceptance | J3 without AI; one active plan per kind and period enforced; KPI progress computed, never typed in |
| Tests | Constraint tests; concurrent-edit 409 test; Playwright J3 |
| Risks | Plan editor complexity: ship structured sections, not a free-form document editor |
| External | None |

### R7 · Projects and tasks (M5) · M

| | |
|---|---|
| Scope | Projects, milestones, tasks, dependencies with cycle detection, recurring tasks, my tasks, workload, risk flags, saved views; board with keyboard alternative to drag |
| Dependencies | R3, R4 |
| Acceptance | Spec 05 M07.1–M07.6 pass; cycles rejected; drag has a keyboard path |
| Tests | Cycle detection unit tests; RRULE tests; isolation; Playwright board via keyboard |
| Risks | Low |
| External | None |

### R8 · Home and basic reporting (M8) · M

| | |
|---|---|
| Scope | Home dashboard (spec 04 §6); KPI tiles with source, period, updated time and evidence class; manual metrics; GA4 through the shared Google connection |
| Dependencies | R6, R7; shared Google connection decision (decisions 17 Nov) |
| Acceptance | Home shows only real data with sources; every number links to its list |
| Tests | Evidence badge present on every metric (component test); GA4 connector against recorded fixtures |
| Risks | **Google OAuth verification**: reusing Findable's connection avoids a second verification but requires it to move into the account service |
| External | **Other team** (shared Google connection), **Credentials** (Google) |

### R9 · Integrations framework (part of M8, M13) · M

| | |
|---|---|
| Scope | Connector interface, health status, sync runs history, backoff, "last synced" labels; integrations page in Settings; credentials stored by reference, never in rows |
| Dependencies | R8 for the first connector |
| Acceptance | Fixture failures (401, 429, 500, timeout) produce visible status and backoff |
| Tests | Connector contract tests with recorded fixtures |
| Risks | Each new platform (Meta, Google Ads) has its own review process |
| External | **Credentials** per platform |

### R10 · Billing and subscriptions (M17, account service A9) · M

| | |
|---|---|
| Scope | In the account service: Stripe Checkout, Customer Portal, webhooks, Findable's billing rules; in Command Centre: `config/plans.json`, `requireEntitlement`, locked states, usage metering |
| Dependencies | R3 (entitlement mirror); prices [OWNER] |
| Acceptance | Test-mode subscription changes flow to entitlements within a minute; a locked feature is refused in the service layer, not only hidden |
| Tests | Webhook signature and idempotency tests; entitlement unit tests; Playwright upgrade path in test mode |
| Risks | Pricing undecided |
| External | **Credentials** (Stripe test mode, then live), **Other team** (account service) |

### R11 · Production readiness · M

| | |
|---|---|
| Scope | `commandcentre-prod` and `accounts-prod` in the paid organisation; Vercel in `syd1`; Sentry; backups and a restore drill; external penetration test; privacy policy and terms; status page; HSTS preload decision; support tooling (platform staff sessions, A8) |
| Dependencies | R1–R10 |
| Acceptance | Spec 12 §2 technical criteria; restore drill documented; pen test findings closed |
| Tests | Full Playwright suite on staging; Lighthouse budgets; OWASP ZAP baseline; Supabase advisors clean |
| Risks | Cost (paid projects, monitoring) needs approval |
| External | **Hosted**, **Credentials**, owner approval of costs |

**→ First commercial release** (proposed definition, §2).

### R12 · AI workforce (M9, M10, M11, M12) · L

| | |
|---|---|
| Scope | Model gateway and Claude provider, model registry in config, usage metering and budgets, embeddings and retrieval under RLS; intelligence register and Approval Centre with rules; agents with autonomy gate, runs and traces; Strategy Assistant |
| Dependencies | R5–R8 (data to reason over), R10 (credits) |
| Acceptance | Agents cannot exceed their authorising user; level 4 never spends or sends; prompt-injection eval cases refused; every AI output labelled `ai_interpretation` |
| Tests | Fixture provider; eval sets; isolation tests including retrieval |
| Risks | Model cost per customer; incorrect agent actions (contained by approvals and autonomy levels) |
| External | **Credentials** (Anthropic API key) |

### R13 · Reel Deal integration (M13, M14) · M

| | |
|---|---|
| Scope | Ecosystem API (`/api/v1`, token exchange, webhooks in and out, idempotency); brand push, production requests, status, storyboard approvals, exports |
| Dependencies | Reel Deal on the shared account (spec 13 §7) and its gaps (spec 07 §3.5); account service token exchange |
| Acceptance | J4 against Reel Deal's staging; Command Centre never holds `rd:render` |
| Tests | Contract tests both ways; signed webhook tests |
| Risks | Reel Deal's account migration timing |
| External | **Other team** (Reel Deal), **Hosted** staging |

### R14 · Findable integration (M15) · M

| | |
|---|---|
| Scope | Intelligence and metrics ingestion, opportunities and recommendations sync, deep links |
| Dependencies | Findable on the shared account, its external API and webhooks (spec 07 §4.5) |
| Acceptance | J5 against Findable's staging; only data the business can see in its own Findable portal arrives |
| Tests | Contract tests; evidence mapping tests |
| Risks | Findable is live with a real customer; its migration must not disrupt Te Puia |
| External | **Other team** (Findable), **Hosted** staging |

### R15 · Unified reporting and analytics (M16) · M

| | |
|---|---|
| Scope | Cross-channel reports, monthly and quarterly reviews, PDF export, entitlements across products |
| Dependencies | R8, R13, R14 |
| Acceptance | J9; every metric shows source, period, updated time and evidence class |
| Tests | Report generation snapshots; accessible chart table views |
| Risks | Attribution claims: anything modelled is `estimated` |
| External | None beyond R13–R14 |

## 4. Critical path

```
R1 ─► R2 ─► R3 ─► R4 ─► R5 ─► R6 ─► R8 ─► R10 ─► R11  (first commercial release)
                    └──► R7 ────────┘
R2 depends on: accounts-dev corrected → account service A2–A5
R3 end-to-end depends on: account service A6
After R11: R12 · R13 (needs Reel Deal) · R14 (needs Findable) · R15
```

What can start tomorrow without any external access: R1, the local-issuer half of R2, most of R3 (with
local signed events) and R4.

## 5. Decisions needed

1. Definition of the first commercial release (§2).
2. `accounts-dev` correction method (repository audit R2).
3. Protected `main` branch (audit R10).
4. Prices and plan limits (R10).
5. Costs for production (R11), approved before creation.
