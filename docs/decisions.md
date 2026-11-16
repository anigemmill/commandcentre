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
- **Findable is live** (§10). Its contract in `docs/specs/07-integration-contracts.md` §4 is still a
  proposal until it is checked against Findable's real API.

## Open questions for the owner

1. **Reel Deal's name.** The blueprint writes "Reel Deal"; its repo uses "Reeldeal", also as a working
   name. Is either final?
2. **AI provider.** The blueprint says Claude initially. Reel Deal's live AI is currently on OpenAI. Should
   Reel Deal move to Claude for consistency, or stay as is behind its provider interface?
3. **Findable access.** Findable's repository or API documentation is needed to replace the proposed
   contract with the real one.
4. **Te Puia pilot.** The owner will share a link to the pilot. Read it to avoid simply reproducing it
   (§37).
5. **Where the accounts service lives.** Proposed: its own repository (`outside-in-accounts` or similar),
   because all three products depend on it. Alternative: start it inside this repo and move it later.
