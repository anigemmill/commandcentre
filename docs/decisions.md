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

## Open questions for the owner

1. **Reel Deal's name.** The blueprint writes "Reel Deal"; its repo uses "Reeldeal", also as a working
   name. Is either final?
2. **AI provider.** The blueprint says Claude initially. Reel Deal's live AI is currently on OpenAI. Should
   Reel Deal move to Claude for consistency, or stay as is behind its provider interface?
3. **Where the accounts service lives.** Proposed: its own repository (`outside-in-accounts` or similar),
   because all three products depend on it. Alternative: start it inside this repo and move it later.
4. **Shared typography.** The blueprint lists Space Grotesk, Inter and Geist Mono as shared. Reel Deal
   uses those; Findable uses Inter, Inter Tight and JetBrains Mono. Should all three share the same
   fonts, or only the type principles (scale, hierarchy, tabular numbers)? The specs assume principles
   only, so Findable keeps its fonts.
5. **When Findable moves to the shared account.** Findable has live businesses, and Te Puia's pilot is
   under way. Proposed: not before the pilot ends, and only after the accounts service is built and
   tested with Command Centre.
