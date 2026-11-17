# Review: the Te Puia pilot and Findable

Source: `anigemmill/Tourism-AI-Growth-Platform` at `b283f7b` (17 Nov 2026), read-only. Blueprint §37
says "Do not simply reproduce the Te Puia pilot". This note records what that repository is, what
Command Centre should learn from it, what it must not copy, and where the product boundaries fall.

## 1. What the repository is

One codebase, two deployments:

| Deployment | Setting | What it is |
|---|---|---|
| **Tourism AI Growth OS** (the pilot) | `PRODUCT_BRAND=outside-in` | Internal tool for one founder to deliver a 4-week AI growth pilot to about 10 Rotorua operators (Te Puia first, Waimangu next): assessments, opportunity register, projects and tasks, experiments with baselines, the Growth Collective, reports, an agent and workflow library, commercial tracking |
| **Findable** (live) | `PRODUCT_BRAND=findable` | AI search visibility for a business: traveller questions asked of ChatGPT, Perplexity and Google AI Overviews; mentions, recommendations, sentiment and citations; competitors found in answers; website assessment and question coverage; content briefs; GA4 and Search Console; reports; plans and Stripe billing (test mode) |

Stack: Next.js 16, React 19, Prisma 6 on Supabase Postgres (Sydney), Vercel `syd1`, own email and
password auth with server-side sessions, RLS enabled on every table only to block Supabase's Data API
(access is enforced in the app's data layer). About 100 tables. **Single-tenant**: one deployment
serves one operator (The Outside In) and its client businesses (`Operator`), with staff roles
(FOUNDER, ADMIN) and business users (OPERATOR).

There is **no external API**. Route handlers are internal (cron, workers, PDF downloads, Google OAuth
callback, Stripe and Resend webhooks).

## 2. Boundary map

Where each capability in the repository belongs in the three-product ecosystem.

| Capability in the repo | Belongs to | Notes |
|---|---|---|
| AI visibility runs, answers, citations, mentions, sentiment, accuracy | **Findable** | Core Findable. Command Centre reads results only |
| Competitors discovered in AI answers and search results | **Findable** | Command Centre's competitor list can import them (§07) |
| Website assessment, question coverage, technical findings | **Findable** | |
| Content briefs (SEO / AI-discovery briefs) | **Findable** | Command Centre plans and schedules them as content items |
| Search Console data | **Findable** | |
| GA4 data | **Shared need** | Findable uses it for AI-referral traffic; Command Centre needs it for business reporting. See decisions: one Google connection per business |
| Business profile (`Operator`, `BusinessIntelligenceProfile`) | **Command Centre** masters business context; Findable keeps its search-specific fields (brand names, domains, search location, questions) | |
| Assessments, opportunity register, projects, tasks | **Command Centre** | The pilot's versions are staff-run; Command Centre's are self-serve |
| Signals and weekly growth briefs | **Command Centre** (intelligence register, Chief of Staff) | Findable keeps its own visibility reports |
| Experiments with baselines and verdicts | **Command Centre** (Strategy, Performance) | Not in the blueprint by name; worth adding (see §3) |
| Growth Collective, programme stages, cohort reports | **Neither, for now** | Specific to delivering a facilitated pilot. Possible future agency/destination feature |
| Commercial (deals, payments, costs, scenarios) | **The Outside In's internal tooling** | Not a customer feature |
| Agent and workflow library | **Command Centre** AI Workforce | The pilot's honest status model (concept → testing → validated → operational) carries over |
| Destination data (Rotorua Pulse foundation) | **Neither, for now** | Destination-level product, later |
| Accounts, roles, billing | **Shared accounts service** (`specs/13`) | Findable's rules for Stripe carry over (§3) |

## 3. Keep: patterns proven in the pilot

These are adopted into the Command Centre specs.

1. **Claims are typed.** Signals carry `FACT / OBSERVATION / INFERENCE / HYPOTHESIS / RECOMMENDATION`;
   opportunities carry an evidence basis (`OBSERVED / OPERATOR_REPORTED / MEASURED / THIRD_PARTY /
   HYPOTHESIS`). Richer than the blueprint's four evidence classes; Command Centre keeps both (spec 02).
2. **Nothing AI-made reaches a client without a person approving it.** Briefs and reports go
   DRAFT → APPROVED → SHARED.
3. **Nothing is shown as connected unless a sync was tested.**
4. **Demo, fixture and illustrative data are flagged in the schema** and badged wherever shown, and never
   counted as real.
5. **Visibility levels with consent.** `INTERNAL / CONFIDENTIAL / COHORT / AGGREGATE_APPROVED /
   PUBLIC_APPROVED`; widening visibility checks recorded consent.
6. **Cultural authority gate.** Each business can record who holds authority over its cultural content
   and what must not go into AI tools; content flagged for cultural review cannot be shared until an
   authority is named. Essential for Māori tourism operators such as Te Puia.
7. **Experiments need thresholds before they start**, limitations before they complete, and editing a
   threshold after the start is audited.
8. **Money states are never mixed:** proposed ≠ quoted ≠ contracted ≠ received.
9. **Billing rules** (decided 3 Nov 2026): downgrades at period end; upgrades take effect only once the
   upgrade invoice is paid; failed payments keep the plan during retries, then pause; only the primary
   contact can pay; allowances reset on the 1st, New Zealand time; manual and provider-confirmed records
   kept apart.
10. **Engines and consent:** a real-provider run needs a recorded consent for that business.

## 4. Don't reproduce

1. **Single tenancy.** Command Centre is multi-tenant from day one (spec 03).
2. **A founder-run back office as the main product.** In the pilot the business is a read-mostly portal
   user and staff do the work. In Command Centre the business runs the platform itself; The Outside In
   staff get audited support access, not ownership of client work.
3. **The 4-week programme structure.** Stages, cohorts and workshops are delivery scaffolding, not the
   product.
4. **Access enforced only in the app layer.** Command Centre enforces it in RLS as well (spec 03).
5. **Its own password auth.** Replaced by the shared account (spec 13).
6. **Rules-only briefs.** Command Centre's intelligence uses agents (spec 08), with the pilot's approval
   discipline kept.

## 5. Consequences for Findable

- Findable must move from single-tenant to the shared account, with each business as an organisation
  (spec 13 §7). This is a larger change than Reel Deal's, because Findable has no organisation model
  and its staff roles sit beside customer roles.
- Findable needs an external API before Command Centre can connect to it. Spec 07 §4 now describes that
  API from Findable's real data model.
- The "Te Puia 12 agents, all live" deck is not reflected as operational in the pilot's library, because
  the agents aren't integrated or tested. Command Centre's agent library must keep the same honesty.
