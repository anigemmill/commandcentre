# Command Centre — The Outside In

"Command Centre" is a working name; the product has no final name yet.

AI-powered business growth and marketing operating system. The central intelligence and orchestration
layer of The Outside In ecosystem, alongside **Findable** (discoverability) and **Reel Deal** (video).

## Read first

- `docs/blueprint.md`: the master product requirements, architecture and design system (v1.1). Its
  rules apply unless `docs/decisions.md` records a change.
- `docs/decisions.md`: decisions made since the blueprint, plus **open questions for the owner**.
- `docs/specs/`: the twelve pre-implementation deliverables from blueprint section 37. Build from these.
- `docs/specs/11-milestones.md`: what to build, in order.
- `docs/specs/13-accounts-and-identity.md`: one Outside In account signs people in to every product;
  products are added by subscription. Users, organisations and billing are mastered there, not here.

## Status

Milestone M1 (foundations) built: Next.js app, environment checks, migrations with the RLS guard, local
database, CI. No product features yet. Blueprint section 37: establish architecture, data relationships,
design system and shared foundations first. Do not start with disconnected screens.
How to run and check everything: `docs/development.md`.

## Stack (blueprint section 26)

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, RLS), Cloudflare R2,
Vercel, Claude as the first AI provider behind a provider interface.

## Product boundaries (non-negotiable)

- Command Centre **thinks, plans, coordinates, analyses and measures**.
- SEO/AEO/GEO analysis belongs to **Findable**. Video creation belongs to **Reel Deal**.
- Command Centre never reimplements their specialist functions. It reads their outputs and sends them
  requests through documented APIs (`docs/specs/07-integration-contracts.md`).
- Each product must work on its own. Connected features must degrade cleanly when a product is not
  connected.

## Rules for working in this repo

- Every customer-data table has `org_id` and RLS. No table ships without isolation tests.
- Permissions are checked in the database (RLS) **and** the service layer. AI agents act through the same
  service layer with an explicit principal, never with the service role.
- Every metric and intelligence record carries source, period/date and an evidence classification
  (`measured`, `platform_reported`, `estimated`, `ai_interpretation`). Never show AI output as measured.
- No fake functionality presented as real. Mocked features are labelled in code and UI.
- Use design tokens (`tokens/`, once created), never raw hex in components. Respect the contrast
  adjustments in `docs/specs/09-design-system.md`; some blueprint colours fail as text.
- Accessibility: WCAG 2.2 AA, real buttons and links, labelled inputs, keyboard paths, reduced motion.
- Plans, prices and limits live in config, never hard-coded.
- Small, phased changes. Explain any change to architecture in `docs/decisions.md`.
- Anything in `[BRACKETS]` is copy or data still needed from the owner. Keep it bracketed.
