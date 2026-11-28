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

## Shared sign-in (built 28 Nov 2026, local development against accounts-dev)

"Sign in with your Outside In account" is now the main sign-in. Flow and checks:

1. `/auth/sign-in` builds the request (PKCE S256, random `state` and `nonce`), keeps them in a
   10-minute httpOnly cookie limited to `/auth`, and redirects to the account service.
2. The account service signs the person in; its consent page auto-approves Command Centre
   (first-party client, allowed redirect origin) or refuses.
3. `/auth/callback` fails closed at each step: `state` must match (constant-time) → code exchanged
   with the PKCE verifier and the client secret (Basic) → access token verified by the shared
   verifier (ES256, issuer, `client_id`) → ID token verified (ES256, audience, nonce, same `sub`) →
   profile mirrored (id, email, name) → httpOnly SameSite=Lax session cookie for the token's lifetime.
4. No refresh token is stored. After an hour the person signs in again, which passes straight through
   while their Outside In session is active (no password prompt).
5. Sign-out ends the Command Centre session only (D6); the Outside In account stays signed in.

Organisation memberships are not created at sign-in. Until the account service sends membership
events, add yourself locally with `npm run db:seed -- --member <email> owner`.

| Setting | Where |
|---|---|
| OAuth client "Command Centre (local development)" | accounts-dev, confidential, client_secret_basic, redirect `http://localhost:3000/auth/callback` only. Client id `86d968a0-3341-4489-9c5f-a01aeb917e10` |
| `ACCOUNTS_ISSUER`, `ACCOUNTS_CLIENT_ID`, `ACCOUNTS_CLIENT_SECRET` | `.env.local` only (the secret is shown once; regenerate it under Authentication → OAuth Apps for another machine) |
| Account service `.env.local` | `FIRST_PARTY_CLIENT_IDS=<client id>`, `PRODUCT_REDIRECT_ORIGINS=http://localhost:3000` |
| Production | `parseEnv` requires all three `ACCOUNTS_*` (https issuer) and refuses `DEV_IDENTITY` |

Tested: `npm run test:e2e:oauth -- <account.json>` (real accounts-dev account, browser): redirect to the
account service, sign-in, auto-approved consent, back to Command Centre, httpOnly cookie holding the
ES256 token for this client, state cookie cleared, forged callback refused, sign-out, silent re-sign-in.

**Still open:** accounts-dev's Site URL must be `http://localhost:3100` (it is the default
`http://localhost:3000`, which sends the consent step to Command Centre). The browser test steps in
for it until then. The development sign-in stays available locally for multi-person testing.
