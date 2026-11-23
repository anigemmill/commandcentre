# Decisions

Changes to, or interpretations of, `docs/blueprint.md`. Newest last. Each entry names the blueprint
section it affects. **Proposed** means drafted in the specs and awaiting owner sign-off. **Decided**
means the owner has confirmed it.

## 2026-11-16: specification round

- **Separate repository** (§1, §37). Command Centre lives in its own repo, not inside Reel Deal's, to keep
  the product boundary. Products talk only through documented APIs.
- **Contrast-validated colours** (§17, proposed). The blueprint asks for validation. Results (WCAG ratios):
  Deep Sage on Warm Ivory is 3.42:1 and fails as body text; Muted Eucalyptus on ivory is 1.91:1 and
  Soft Stone on ivory 1.33:1, so neither can carry text or mark a control's edge; Deep Forest on the dark
  background is about 1.2:1, so dark mode cannot use forest for actions. The blueprint colours stay as
  brand colours. The design spec adds darker or lighter working shades for text, borders and dark-mode
  actions. Full table in `docs/specs/09-design-system.md`.
- **Tenancy hierarchy** (§6, proposed). Organisation is the tenant and billing unit. Workspace sits inside
  it, brand inside a workspace. Agencies manage client organisations through explicit delegated
  memberships, never through cross-tenant queries. See `docs/specs/03-multi-tenancy.md`.
- **Agents act as principals** (§9, §27, proposed). Every agent run has an acting principal whose
  permissions are the intersection of the agent's configuration and the user who authorised it. Agents
  never use the database service role.
- **Spending is always human-approved** (§9, proposed). Autonomy level 4 never covers actions that spend
  money or credits (for example confirming a Reel Deal render) or send external communications.
- **Integration direction** (§10, proposed). Findable and Reel Deal stay the systems of record for their
  own data. Command Centre stores references and summaries, not copies of their specialist records.

## 2026-11-16: owner answers

- **Working name** (decided). "Command Centre" is a working name; the product has no final name yet.
- **One account for every product** (§6, §15, decided). One Outside In account signs a person in to all
  products; an organisation adds products by subscribing. This replaces the earlier proposal of
  separate accounts linked by OAuth. Architecture change: a shared **accounts service** owns users,
  organisations, organisation roles, product access, subscriptions and entitlements. Each product keeps
  its own database, verifies account tokens itself and mirrors the account data it needs for RLS.
  Design in `docs/specs/13-accounts-and-identity.md`; specs 02, 03, 06, 07, 10 and 11 updated to match.
  Why separate product databases: one product's outage or breach does not expose another's data, and
  each product can be sold and run on its own (§1).
- **Billing** (§15, decided). One Stripe customer per organisation in the accounts service. A bundle is
  one bill; buying a single product is a single subscription, billed on its own. Both run through the
  same accounts billing (`docs/specs/10-billing.md`).
- **Hosting region** (§28, decided on the owner's delegation). Sydney for everything: Supabase
  `ap-southeast-2`, Cloudflare R2 with the Oceania location hint, Vercel functions in `syd1`, the job
  worker in Sydney. Reasons: closest region to New Zealand that all three providers offer (none has a
  New Zealand region), low latency for NZ and Australian customers, and Reel Deal already runs there,
  so the products share a region. Customers are told where their data is stored (privacy policy and
  security page). Model providers may process prompts outside Australia; that is disclosed under AI
  usage transparency (§28).
- **Shared design foundation** (§22–§23, decided on the owner's delegation). Build the foundation
  tokens (`--oi-*`) and shared components inside this repo first, in a clearly separated folder
  (`packages/foundation/`). Extract them into a private npm package on GitHub Packages once a second
  product (Reel Deal or Findable) adopts them. Reason: one product's real needs shape the foundation
  before it is shared, and nothing has to be published or versioned until there is a second consumer.
- **Findable is live** (§10). See the 2026-11-17 entries below.

## 2026-11-17: pilot and Findable review

Full review: `docs/pilot-review.md`.

- **Findable and the Te Puia pilot are one codebase** (`anigemmill/Tourism-AI-Growth-Platform`), deployed
  twice: `PRODUCT_BRAND=outside-in` for the pilot, `PRODUCT_BRAND=findable` for Findable. It is
  single-tenant, has its own password login, test-mode Stripe billing per business and no external API.
- **Findable contract rewritten from the real data model** (§10, proposed). `docs/specs/07` §4 maps
  every endpoint to an existing Findable table. Rule: Command Centre receives exactly what the business
  may see in its own Findable portal; staff drafts, fixtures and illustrative data never leave
  Findable. Findable must add an external API, webhooks and the move to the shared account.
- **Boundary with the pilot** (§37, proposed). The pilot's assessments, opportunity register, projects
  and tasks, signals and briefs, experiments and agent library are Command Centre's territory and are
  rebuilt here as a self-serve, multi-tenant product, not copied. AI visibility, citations, answer
  competitors, website assessment, question coverage, content briefs and Search Console stay in
  Findable. Programme, cohort, collective, commercial and destination modules are pilot delivery or
  internal tools and are not part of Command Centre.
- **Patterns adopted from the pilot** (proposed): typed claims alongside the evidence classes, human
  approval before AI output reaches a client, nothing shown as connected without a tested sync,
  flagged demo and fixture data, consent-gated visibility levels, the cultural authority gate,
  experiment threshold rules, and Findable's billing rules. Added to specs 02, 05 and 13.
- **One Google connection per business** (§13, proposed). Findable already connects GA4 and Search
  Console per business and is going through Google's OAuth verification. Command Centre must not ask
  the same business to connect Google a second time or pass Google verification again. Proposal:
  move the Google connection into the shared account so one consent serves both products. Until then,
  Command Centre reads Search Console through Findable and builds no Search Console connector of its own.
- **Platform staff** (§6, proposed). The Outside In's own people are platform staff in accounts with
  audited, time-limited support access, not members of customer organisations (spec 13).

## 2026-11-17: owner answers (second round)

- **Reel Deal is the name** (decided). The video product is "Reel Deal". The Reel Deal repo still calls
  it "Reeldeal" as a working name; update that repo's docs when it is next worked on.
- **Reel Deal moves from OpenAI to Claude** (decided on the owner's delegation). Reasons:
  1. *One provider for the ecosystem's own AI.* Command Centre is specified on Claude (§26) and Findable
     already uses Claude for its own writing (`src/lib/llm/anthropic.ts`). One provider means one bill,
     one set of keys and usage limits, one data-processing agreement and one privacy disclosure, which
     is what §27's "central model management" asks for.
  2. *Small, contained change.* Reel Deal's AI already sits behind a provider interface
     (`src/server/ai/provider.ts`) with one OpenAI implementation and a test fixture. A Claude provider
     is added beside it; the schemas and validation of briefs, concepts and storyboards stay as they are.
  3. *Measured, not assumed.* The same set of real briefs runs through both providers before switching,
     comparing storyboard quality, adherence to the footage actually available, and cost per video.
     OpenAI stays available as a fallback until the comparison is accepted.
  4. *Cost stays small either way.* A brief, concepts and storyboard are a few thousand tokens per
     video, so any current Claude model costs cents per video. Model choice is made from the comparison.
  Not affected: Findable keeps calling ChatGPT, Perplexity and Google, because those engines are what it
  measures.
- **Fonts stay separate, rules are shared** (§19, §22, decided). Each product keeps its own typefaces
  (Command Centre: Space Grotesk, Inter, Geist Mono; Reel Deal: the same plus Instrument Serif; Findable:
  Inter, Inter Tight, JetBrains Mono). The shared foundation covers the type scale, weights, line heights,
  tabular numbers and hierarchy rules, not the families.
- **Accounts service gets its own repository** (decided): `anigemmill/outsideinprojects`. The master copy
  of spec 13 moved there as `docs/spec.md`, with a build plan in `docs/plan.md`.
- **Findable moves to the shared account early, not after the pilot** (proposed, revised). Findable has
  one live business, so now is the cheapest and safest time to move it: one account to migrate and one
  business to agree a date with. Order: build the accounts service and connect Command Centre to it;
  move a staging copy of Findable onto it and test; then switch production at a quiet time agreed with
  Te Puia, keeping the old sign-in available for a week as a fallback. The pilot deployment
  (`PRODUCT_BRAND=outside-in`) stays on its own sign-in until the pilot ends.

## 2026-11-17: milestone M1 built

- **Stack versions** match Reel Deal's tested set: Next.js 16.4.6, React 19.3, Tailwind 4.3.3, Vitest 5,
  zod 4, `postgres` (porsager) for SQL. One stack across products makes shared components possible.
- **Local database is plain Postgres plus a Supabase compatibility file** (`supabase/local/`), as in
  Reel Deal, because Docker isn't available in the build environment. The migrations are written for
  Supabase and never apply the compatibility file to a real Supabase project.
- **Deny by default in the database.** The first migration removes Supabase's default grants to `anon`
  and `authenticated` on new tables, and adds `app.tables_missing_rls`; tests and CI fail if any public
  table lacks RLS or a policy. Proven by tests against a real Postgres.
- **Not in M1, deliberately:** error monitoring (needs a Sentry account and DSN; added at first
  deployment) and hosted Supabase/Vercel projects (created at first deployment, in Sydney).

## 2026-11-17: shared identity mechanism (approved by the owner, 17 Nov 2026)

- Command Centre signs people in only through the account service (`anigemmill/outsideinprojects`):
  it is an OAuth 2.1 / OpenID Connect client of the account service's Supabase Auth, verifies tokens
  offline with its JWKS, accepts exactly one issuer per environment, and keeps its own database. Its own
  Supabase project's Auth stays locked. Design: `outsideinprojects/docs/identity-architecture.md`;
  variables and secrets: `outsideinprojects/docs/environments.md`.

## 2026-11-18: audit round (no Supabase access)

Documents: `docs/audits/command-centre-repository-audit.md`, `docs/audits/security-and-testing-review.md`,
`docs/architecture/outside-in-product-ecosystem.md`, `docs/architecture/command-centre-data-model-review.md`,
`docs/design-system.md`, `docs/product/navigation-and-information-architecture.md`,
`docs/roadmap/command-centre-implementation-roadmap.md`. Everything in them marked "proposed" awaits
sign-off.

- **Token layer built ahead of M3** (§22–§23, spec 09). Foundation `--oi-*` in
  `packages/foundation/tokens.css` (as decided 17 Nov), Command Centre theme in
  `tokens/command-centre.css`. One naming change from spec 09 §1: the mode-dependent values are
  `--cc-*` and the semantic layer is Tailwind's own `--color-*` theme (`src/app/globals.css`), as in
  Reel Deal. Reason: spec 09's semantic names (`--color-bg` …) are Tailwind's namespace, so mapping
  them onto themselves would create self-referencing variables. Components still read only semantic
  tokens. Dark-mode values spec 09 does not define (hover, secondary, accent) are added, marked
  "proposed" in the file, and pass the contrast tests. No components yet.
- **Contrast is tested automatically** (`src/design/tokens.test.ts`), and **raw colours in application
  code fail CI** (`npm run check:tokens`).
- **Start-up validation fixed.** `src/instrumentation.ts` validates the environment when a server
  starts, so a misconfigured production server no longer reports "Ready" and then fails every request.
- **Local compatibility file is local by default.** `npm run db:migrate` applies `supabase/local/` (an
  `auth` stub and an RLS-bypassing `service_role`) only to a database on this machine, unless
  `ALLOW_LOCAL_SHIM=true` is set.
- **Incident: `accounts-dev` contains Reel Deal's schema.** On 17 Nov, in a Reel Deal session, Reel
  Deal's eight migrations were applied to `accounts-dev` in the belief it was a Reel Deal test project.
  No data was written. `accounts-dev` is the identity project for every product and must hold only the
  account service's schema. Correction needs Supabase access and an owner decision (below).

## 2026-11-19: `accounts-dev` rebuilt; migration target guard (approved by the owner)

- **Resolved.** The owner deleted the old `accounts-dev` (`xmqivpwwdksahxkkamgm`). A new one
  (`egtlqrmujhxelczbyszj`, Outside In Development, Sydney, US$0) holds only the account service's
  foundation migration and identity marker. Details and which project belongs to which product:
  `outsideinprojects/docs/environments.md`; decision record: `outsideinprojects/docs/decisions.md`.
- **Migration target guard** in all three repositories: `src/server/db/migration-target.ts` (shared
  verbatim; change all three together) and `config/database-targets.json`. Command Centre lists no
  hosted project yet, so `npm run db:migrate` accepts only local databases until `commandcentre-dev`
  exists and is added to that file.
- **Development environment:** the cloud environment used for Command Centre work reaches only the new
  `accounts-dev` among Supabase hosts; Reel Deal's production project was removed from it.

## 2026-11-22: ecosystem domains and identity (owner direction; architecture proposed)

- The ecosystem architecture is now one document: `outsideinprojects/docs/identity-architecture.md`.
  `docs/architecture/outside-in-product-ecosystem.md` was cut down to Command Centre's part and points
  there, so the two cannot contradict each other.
- Confirmed URLs: `theoutsidein.nz` (parent), `theoutsidein.nz/findable/`, `theoutsidein.nz/reeldeal/`.
  Proposed: `theoutsidein.nz/command-centre/` for Command Centre's marketing, and `app.theoutsidein.nz`
  as the shared entry point (today it serves Findable's live app).
- Proposed for Command Centre: its signed-in app on its own origin under `theoutsidein.nz`, as an OIDC
  client of the account service, verifying `client_id` (not `aud`). Open decisions D1–D7 are listed
  once, in the master's §12.

## 2026-11-22: decisions D1–D7 approved; Command Centre integrates first

- Approved architectural directions (not DNS, hosting or production changes), recorded once in
  `outsideinprojects/docs/identity-architecture.md` §12. For Command Centre: its app is
  `commandcentre.theoutsidein.nz` (D2, D5); product sign-out and global sign-out are distinct (D6);
  the session policy is reviewed before implementation (D7).
- **Command Centre is the first product to integrate** with the account service, as the lowest-risk
  test of the shared identity design. Plan: `outsideinprojects/docs/integrations/command-centre.md`.
  It starts only once `outsideinprojects/docs/security-review.md`'s gate is met.

## 2026-11-23: MVP built locally; visual direction applied

- **MVP (local development):** development-only sign-in (`docs/mvp-auth.md`), account mirrors,
  workspaces, tasks and objectives with RLS and isolation tests, and the "Today" home dashboard.
  Objectives belong to a workspace for now (`strategy_id` arrives with strategies in M6); progress is
  derived from linked tasks, never stored.
- **Visual direction (owner, 23 Nov):** premium editorial, light default, forest/ivory/sage, spacious,
  few cards, no gradients, a dashboard that works as a command centre rather than a task tool. Built on
  the existing palette and typefaces (no change to spec 09 values); see `docs/design-system.md` §1a.

## Open questions for the owner

1. ~~`accounts-dev` correction~~: done 19 Nov (recreated).
2. **First commercial release:** Phase 1 + billing + production readiness, with the AI workforce and
   product integrations as later upgrades (roadmap §2)?
3. **Shared account settings:** theme, locale and time zone mastered in the account service
   (`outsideinprojects/docs/schema-proposal.md`, profiles)?
4. **Navigation:** Knowledge Hub as its own sidebar item, Integrations under Settings, Strategy
   Assistant as a top-bar panel, unsubscribed products shown by default (navigation §1, §4)?
5. **Branch protection:** create a protected `main` branch with required CI (repository audit R10)?
6. **Spec corrections:** update spec 01 (it still lists Command Centre's own Supabase Auth and a
   Supabase CLI stack) and fold data model review §3–§5 into spec 02 before M2b?
