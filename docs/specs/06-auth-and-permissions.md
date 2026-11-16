# 06 · Shared authentication and permission model

Status: proposed. Covers blueprint §6, §9, §27, §28 and how the three products recognise each other.

## 1. Principals

Every request runs as exactly one principal:

| Principal | Authenticated by | Used for |
|---|---|---|
| `user` | Outside In account session (shared sign-in, `13`) | The app |
| `agent` | Internal: created by the job worker for an `agent_run` | AI workforce |
| `integration` | Accounts-issued token for another product (token exchange) or a customer API client | Findable, Reel Deal, customer API clients |

Agent and integration principals always carry an `on_behalf_of` user or organisation, and a list of
permission keys. Effective permission = role permissions of the authorising user ∩ the principal's own
list.

## 2. Roles (system defaults)

| Permission group | Owner | Admin | Manager | Contributor | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| `org.manage` (settings, delete org) | ✓ | | | | |
| `billing.manage` | ✓ | ✓ | | | |
| `members.manage`, `roles.assign` | ✓ | ✓ | | | |
| `integrations.manage` | ✓ | ✓ | | | |
| `workspace.manage`, `brand.manage` | ✓ | ✓ | ✓ | | |
| `strategy.write` | ✓ | ✓ | ✓ | | |
| `campaign.write`, `project.write` | ✓ | ✓ | ✓ | | |
| `task.write`, `content.write`, `intelligence.write` | ✓ | ✓ | ✓ | ✓ | |
| `agent.configure` | ✓ | ✓ | ✓ | | |
| `agent.run` | ✓ | ✓ | ✓ | ✓ | |
| `approval.decide` (per kind, per rule) | ✓ | ✓ | by rule | by rule | |
| `audit.read` | ✓ | ✓ | | | |
| `*.read` | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Approver** is not a role. Approval rules grant `approval.decide` for specific kinds to specific
  people or roles (for example, a client exec approves campaigns but cannot edit anything).
- Memberships can be limited to workspaces or brands.
- Custom roles (Phase 4) are compositions of the same permission keys.

## 3. Enforcement

1. **Route:** the server resolves the URL's org and workspace against memberships, or returns 404 (not
   403, to avoid confirming existence).
2. **Service:** every service function declares the permission it needs and checks it with the
   principal before touching data.
3. **Database:** RLS repeats the check (`has_permission`), so a bug in step 2 still cannot leak data.
4. **Audit:** every write records the principal, including `on_behalf_of`.

## 4. Sessions and security

Sign-in, sessions and MFA belong to the shared Outside In account (`13`), so they behave the same in
every product:

- Email + password with breached-password check, magic link, Google and Microsoft sign-in.
- MFA (TOTP) available to all; organisations can require it (accounts enforces it at sign-in, products
  check the `amr` claim on sensitive actions).
- One session across products; revocable from account security settings; sign-out everywhere.
- SAML/SCIM for enterprise: Phase 4, in the accounts service.
- Rate limits on sign-in and invites (accounts) and on each product's API.

## 5. Cross-product identity (owner decision, 2026-11-16)

**One account signs a person in to every product. Products are added to the organisation by
subscription.** Full design: `13-accounts-and-identity.md`. In short:

1. The accounts service owns users, organisations, organisation roles, product access, subscriptions
   and entitlements.
2. Each product verifies accounts tokens itself and mirrors the account data it needs for RLS.
3. Organisation roles (owner, admin, member, billing) are shared. Product roles (the table in §2 for
   Command Centre) are held by each product.
4. Subscribing to Reel Deal or Findable is the connection: no separate OAuth consent between products.
   Admins can switch the data exchange off per organisation.

## 6. Scopes between products

When one product calls another (token exchange, `13` §5), the token carries these scopes. They are
granted automatically while both products are subscribed and the data exchange is on.

| Product | Scope | Allows |
|---|---|---|
| Reel Deal | `rd:read` | Brands, projects, status, exports |
| Reel Deal | `rd:write` | Create/update brand profile, create projects and briefs, submit approval decisions |
| Reel Deal | `rd:render` | **Never granted to Command Centre.** Renders are confirmed by a person in Reel Deal |
| Findable | `fd:read` | Findings, visibility, opportunities, recommendations, performance |
| Findable | `fd:write` | Update recommendation status, request an audit |
| Command Centre | `cc:context.read` | Business profile, brands, audiences, competitors, campaigns (for the other products) |
| Command Centre | `cc:intelligence.write` | Post findings and performance into the intelligence register |
| Command Centre | `cc:status.write` | Post production or task status for linked records |
