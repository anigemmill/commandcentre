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

## Verified token behaviour (accounts-dev, 28 Nov 2026)

`scripts/verify-accounts-oauth.ts` ran the full flow against accounts-dev with a temporary
confidential client and test user (both deleted afterwards): **25 checks passed, 0 failed.**

| Area | Result |
|---|---|
| Server set-up | OAuth server on; dynamic client registration refused (403); unknown client refused (400); unregistered `redirect_uri` refused |
| Flow | Authorise redirects to the consent page with `authorization_id`; details include the registered `redirect_uri`; approval returns the code to the exact redirect with `state` unchanged |
| Code exchange | Wrong PKCE verifier, missing client secret and wrong client secret all refused; a code works once only |
| Access token | ES256 (the JWKS key); `iss` exactly `https://urdrrzqqtmeuwlxksuov.supabase.co/auth/v1`; carries `client_id`; `sub` is the account user id; lifetime 3600 s |
| Our verifier | Accepts the real token; a verifier for another product refuses it (`client_id`); a plain account session token (no `client_id`) is refused |
| ID token | ES256, audience is the client, carries the nonce |
| Refresh | Works; the old refresh token is still accepted briefly (Supabase's reuse interval) |

Facts that shape the integration:

- **`aud` is `"authenticated"` for every token**, so products must check `client_id` (as the shared
  verifier does), never `aud`.
- **The server still accepts PKCE `plain`.** Our client only ever sends S256 and every product is a
  confidential client, so a code is useless without the client secret. Recorded as accepted risk.
- **Tokens carry `aal` and `amr`** (`aal1` and `oauth_provider/authorization_code` here), so a product
  can require MFA (`aal2`) for sensitive actions later.
- **accounts-dev's Site URL is `http://localhost:3000`**, the same port as Command Centre's dev server.
  Run the account service on another port (e.g. 3001) and update the Site URL before testing the two together.
- Supabase ignores the user's token when a request carries the **secret** key, so anything acting
  for a person must use the publishable key (the verification script does this).

## Next: switching Command Centre to shared sign-in (OAuth server now enabled on accounts-dev)

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
