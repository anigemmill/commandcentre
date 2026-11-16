# Decisions

Changes to, or interpretations of, `docs/blueprint.md`. Newest last. Each entry names the blueprint
section it affects. **Proposed** means drafted in the specs and awaiting owner sign-off.

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

## Open questions for the owner

1. **Product name.** The blueprint writes "Reel Deal". The Reel Deal repo uses "Reeldeal" as a working
   name to be confirmed before launch. Which is it?
2. **AI provider.** The blueprint says Claude initially. Reel Deal's live AI is currently on OpenAI. Should
   Reel Deal move to Claude for consistency, or stay as is behind its provider interface?
3. **Shared identity.** One sign-in across all three products (a shared identity service), or separate
   accounts linked by OAuth? The specs assume linked accounts first, shared identity later.
4. **Shared design foundation.** Shared tokens and components need a home both repos can use (a private
   npm package or a third repo). Which do you prefer?
5. **Findable.** Is there a Findable codebase or API to read? The Findable contract is a proposal written
   without one.
6. **Te Puia pilot.** §37 says not to simply reproduce it. Is there pilot material (screens, data, lessons)
   I should read to avoid repeating it?
7. **Billing across products.** One Stripe customer and invoice for bundles, or separate billing per
   product at first?
8. **Data residency.** Customers are tourism businesses (likely New Zealand and Australia first). Is there
   a hosting-region requirement for Supabase and R2?
