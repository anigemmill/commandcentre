# Command Centre in The Outside In ecosystem

**The ecosystem architecture lives in one place:** `anigemmill/outsideinprojects`
`docs/identity-architecture.md` (identity, domains, sign-in, sessions, sign-out, organisation choice,
token validation, security boundaries, environments, migration and open decisions), with the account
service's `docs/spec.md`, `docs/schema-proposal.md`, `docs/environments.md` and `docs/decisions.md`.
This page covers only how Command Centre fits in, so the two cannot drift. If they disagree, the
account service documents win.

Updated 22 November 2026. Labels: **Current** (built), **Proposed**, **Decided**, **[DECIDE]**.

## 1. Where Command Centre sits

- The Outside In is the parent ecosystem; Command Centre, Findable and Reel Deal are independently
  usable products (**Decided**). Command Centre thinks, plans, coordinates, analyses and measures; it
  never reimplements Findable's or Reel Deal's specialist work (CLAUDE.md).
- Marketing: `https://theoutsidein.nz/command-centre/` (**Proposed**, not built), next to the
  confirmed `/findable/` and `/reeldeal/`.
- Signed-in app: its own origin under `theoutsidein.nz` (**Proposed**, e.g.
  `commandcentre.theoutsidein.nz` **[DECIDE D5]**), reached from the Outside In account at
  `app.theoutsidein.nz` (**Proposed, D1**) and from the product switcher.
- Today: no deployment, no sign-in, no tables (**Current**, M1).

## 2. How Command Centre signs people in (Proposed, milestone M2b)

| Piece | Command Centre's implementation |
|---|---|
| OIDC client | Confidential client of the account service per environment (`ACCOUNTS_CLIENT_ID`, `ACCOUNTS_CLIENT_SECRET`, `ACCOUNTS_ISSUER`; `outsideinprojects/docs/environments.md`). Callback `/auth/callback` on Command Centre's own origin (`http://localhost:3000/auth/callback` in development) |
| Session | One encrypted, httpOnly, Secure, host-only cookie (`SESSION_ENCRYPTION_KEY`) holding Command Centre's own tokens; refreshed server-side |
| Token check | The shared verifier: ES256 allow-list, exact issuer, **`client_id` = Command Centre's client** (not `aud`), expiry, then the mirror. Claims beyond `sub` are not trusted for authorisation (`identity-architecture.md` §6) |
| Database | Each request runs as the user (`set local role authenticated`, `request.jwt.claims`), so RLS applies (proven in M1 tests) |
| Organisation | From the URL (`/{orgSlug}/{workspaceSlug}/…`), checked against the membership mirror on every request (spec 03 §4) |
| Sign-out | Clears Command Centre's session and revokes its refresh token; "sign out everywhere" is on the account page and reaches Command Centre as a `session.revoked` event |

Until the account service issues real tokens, M2b is built and tested against a **local test issuer**
(test JWKS and signed test tokens) behind the same verifier (repository audit R1).

## 3. What Command Centre mirrors and owns

| Data | Where it is mastered | In Command Centre |
|---|---|---|
| People, organisations, memberships, organisation roles | Account service | Read-only mirrors (spec 02), updated by signed events with receipts and per-organisation sequence numbers (data model review G11) |
| Command Centre product access and entitlements | Account service | Mirrors of Command Centre's rows only |
| Command Centre roles (Owner, Admin, Manager, Contributor, Viewer) and scopes | Command Centre | `cc_access` and permission tables (spec 06 §2) |
| Workspaces, brands and every module's data | Command Centre | Its own database, RLS on every table |

Default mapping when someone first opens Command Centre (**Proposed**): organisation `owner` → Owner,
`admin` → Admin, `member` → Contributor (raised by an Owner or Admin), `billing` → no product role
unless granted.

## 4. Locked states and product switching

- An organisation without a Command Centre subscription never reaches it: the account service shows
  "Add Command Centre to your plan" (spec 13 §6).
- Inside Command Centre, Findable and Reel Deal appear under "Connected products" with locked states
  when not subscribed (`docs/product/navigation-and-information-architecture.md` §4).
- The product switcher is the account service's shared component (A7), shown in the top bar.

## 5. Working with Findable and Reel Deal

Through documented APIs only (`docs/specs/07-integration-contracts.md`): REST `/api/v1`, token
exchange for a signed-in person, account-issued service tokens for background agent work, signed
webhooks. Command Centre is never granted Reel Deal's `rd:render`.

## 6. Command Centre's part of the open decisions

Owner decisions are listed once, in `identity-architecture.md` §12. The ones that change Command
Centre's work: **D2** (own origin), **D5** (its hostname), **D6** (what product sign-out does).
