# MVP sign-in and what changes for shared OAuth

Status: in use for local development only (23 Nov 2026).

## Today

- `DEV_IDENTITY=enabled` turns on a **development sign-in**: choose a seeded test person, no
  passwords. `src/server/auth/dev-issuer.ts` signs an ES256 token shaped like the account service's
  (`iss`, `sub`, `client_id`, `iat`, `exp`) with a key generated in memory at start-up.
- The token goes in an httpOnly `cc_session` cookie and is verified on every request by the
  **shared verifier** (`packages/foundation/auth/verify.ts`): ES256 only, exact issuer, exact
  `client_id`, expiry, UUID subject. HS256 and `none` are refused.
- The database runs each request as the person (`asUser`: role `authenticated`, token claims set for
  the transaction), so RLS decides access, as it will in production.
- Refused in production: `parseEnv` fails with `DEV_IDENTITY=enabled` when `NODE_ENV=production` or
  when `APP_URL` isn't localhost (unit tests and `check:env:production` cover both).
- Account mirrors (`users`, `organisations`, `memberships`) are filled by `npm run db:seed` with test
  data. People can only read them.

## When the account service's OAuth server is ready

1. Register Command Centre as a confidential client (code + PKCE S256), redirect
   `<APP_URL>/auth/callback`.
2. Add `ACCOUNTS_ISSUER`, `ACCOUNTS_CLIENT_ID` and `ACCOUNTS_CLIENT_SECRET` to `src/server/env.ts`
   (secret required in production via `requireClientSecret`).
3. In `src/server/auth/session.ts`, point `verifier()` at the account service's issuer and JWKS URL.
4. Replace the sign-in page's buttons with a redirect built by `createAuthorisationRequest`; add
   `/auth/callback` (check state, exchange the code with the secret, verify, set the cookie); add
   refresh-token handling.
5. Fill the mirrors from signed account events instead of `db:seed`.
6. Delete `dev-issuer.ts`, the development sign-in branch of the sign-in page, `DEV_IDENTITY` and
   `scripts/dev-seed.ts`.

Pages, server actions, the data layer and RLS don't change: they only see the verified `Principal`.
