# 06 · Shared authentication and permission model

Status: proposed. Covers blueprint §6, §9, §27, §28 and how the three products recognise each other.

## 1. Principals

Every request runs as exactly one principal:

| Principal | Authenticated by | Used for |
|---|---|---|
| `user` | Supabase Auth session (cookie) | The app |
| `agent` | Internal: created by the job worker for an `agent_run` | AI workforce |
| `integration` | OAuth 2.1 access token (client credentials or user-delegated) | Findable, Reel Deal, customer API clients |

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

- Email + password with breached-password check, magic link, Google and Microsoft sign-in.
- MFA (TOTP) available to all; organisations can require it (enforced at route level).
- Sessions: 7-day refresh, revocable from Security settings; sign-out everywhere.
- SAML/SCIM for enterprise: Phase 4.
- Rate limits on sign-in, invite and API endpoints.

## 5. Cross-product identity

**Phase 3 (proposed):** products keep their own user accounts and link at the organisation level.

1. An admin in Command Centre clicks "Connect Reel Deal" → OAuth 2.1 authorisation code + PKCE flow
   against Reel Deal's authorisation server → the admin signs in to Reel Deal and picks the Reel Deal
   organisation → consents to the requested scopes.
2. Command Centre stores the tokens in Supabase Vault, referenced from `integrations.credential_ref`.
3. Calls to Reel Deal are made as the linked organisation, with the user's identity passed as a hint
   for audit (`X-Acting-User` email hash). Reel Deal applies its own roles.
4. Findable is linked the same way.

**Later (owner decision):** a shared Outside In identity (one sign-in, SSO across products). The
`integration` principal model does not change; only the sign-in step does.

## 6. Scopes between products

| Product | Scope | Allows |
|---|---|---|
| Reel Deal | `rd:read` | Brands, projects, status, exports |
| Reel Deal | `rd:write` | Create/update brand profile, create projects and briefs, submit approval decisions |
| Reel Deal | `rd:render` | **Not requested by Command Centre.** Renders are confirmed by a person in Reel Deal |
| Findable | `fd:read` | Findings, visibility, opportunities, recommendations, performance |
| Findable | `fd:write` | Update recommendation status, request an audit |
| Command Centre | `cc:context.read` | Business profile, brands, audiences, competitors, campaigns (for the other products) |
| Command Centre | `cc:intelligence.write` | Post findings and performance into the intelligence register |
| Command Centre | `cc:status.write` | Post production or task status for linked records |
