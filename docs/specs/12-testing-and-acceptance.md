# 12 · Testing and acceptance criteria

Status: proposed. Covers blueprint §33–§35. A milestone is accepted only when its rows below pass in CI.

## 1. Test layers

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Services, permission logic, autonomy gate, entitlement checks, metric maths |
| Database | Vitest against local Supabase (Postgres 17) | RLS policies, triggers (versions, audit), constraints |
| Isolation | Dedicated suite, every PR | `03` §7, generated per table so a new table without tests fails CI |
| Integration | Vitest + recorded fixtures | Connectors (GA4, Search Console), Stripe webhooks, Findable/Reel Deal clients |
| Contract | OpenAPI-based consumer tests | Both directions with Reel Deal and Findable (`07` §6) |
| AI evaluation | Fixture provider + eval sets | Agent outputs match schema; permission and autonomy gates hold; prompt-injection cases refused |
| End to end | Playwright | Journeys J1–J9 (`04` §2) on desktop and a phone viewport |
| Accessibility | axe in Playwright + manual keyboard and screen-reader passes per milestone | WCAG 2.2 AA |
| Performance | Lighthouse CI, k6 for API | Budgets in §3 |
| Security | Dependency audit, secret scanning, OWASP ZAP baseline, Supabase advisors | Before each phase release; external pen test before launch |

## 2. Acceptance criteria

### Product (§33)

| Criterion | Test |
|---|---|
| Independent organisations | Isolation suite; two orgs created through the UI never see each other |
| Single and multi-brand | Org with 1 brand hides the brand selector; with 3 brands filters correctly |
| Secure user management | Invite, role change and removal take effect on the next request; audit recorded |
| Editable business profiles | J1; version history shows every change |
| Strategic planning, objectives and KPIs | J3; KPI progress computed from linked metrics |
| Projects and tasks | M07 requirements; cycle in dependencies rejected |
| Connected intelligence | Finding → task → measured → learning, all linked |
| Performance reporting | Every metric shows source, period, updated time, evidence class |
| Agent configuration and history | J6; trace shows every step and cost |
| Findable and Reel Deal integration | J4, J5 against the other products' staging environments |
| Subscription entitlements | Locked feature blocked in service layer, not just hidden |

### Design (§34)

| Criterion | Test |
|---|---|
| Palette and editorial direction | Design review sign-off against `09` |
| Light default, dark mode, system option persisted | E2E: preference survives sign-out/in and new device |
| Contrast | Automated token check: every semantic text/background pair meets `09` targets |
| Responsive | E2E at 375, 768, 1280 px; no horizontal scroll |
| Accessible charts | Every chart has a table view and passes axe; series distinguishable in greyscale |
| Loading, empty, error, success states | Storybook-style state matrix on `/design-system`; E2E forces each state |

### Technical (§35)

| Criterion | Test |
|---|---|
| Tenant isolation | Isolation suite, including agent principals and retrieval |
| Permissions at DB and API | Same denial tested by calling the service and by direct SQL as the user |
| AI agents respect permissions | Agent with a narrower list than its user cannot exceed it; level-4 never spends |
| Concurrent edits | Two sessions edit the same record; second gets 409 with both versions; no lost update |
| Integration error handling | Fixture failures (401, 429, 500, timeout) produce visible status and backoff |
| Audit records | Every write path asserted to create an audit event |
| Backups | Quarterly restore drill documented with timings |
| Critical workflows | J1–J9 automated |
| Security and performance | §1 security row; §3 budgets |

## 3. Performance budgets

- App pages: LCP < 2.5 s on 4G mid-range phone, INP < 200 ms, JS < 200 kB gzip per route.
- API: p95 < 300 ms for reads, < 600 ms for writes at 50 requests/s per org.
- Agent runs: scheduled runs finish within 5 min or are reported as slow.
