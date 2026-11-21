# Security and testing review

Date: 18 November 2026. Covers the Command Centre repository only. Method: read every source file,
ran every check locally, started the production build with good and bad settings, ran `npm audit`.
No external service was contacted.

**A passing test is evidence that one property holds, not that the system is secure.** Most of the
security design is specified but not built, so most of it cannot be validated yet. Each row below says
how it was checked.

## 1. Results at a glance

| Area | State | How checked |
|---|---|---|
| Authentication and sessions | Not built (M2b) | Code read |
| Authorisation | Not built (M2b) | Code read |
| Tenant isolation | Foundation only: deny-by-default grants and the RLS guard | 5 database tests on real Postgres 16 |
| RLS assumptions | Two assumptions only proven on plain Postgres, not on Supabase (§3) | Code read |
| Input validation | Only the environment (zod) | Unit tests |
| API security | One read-only health route | Code read, run |
| Secrets | None committed; reads confined to `src/server/env.ts` | grep of the repository |
| Security headers | Good baseline, no CSP yet | Response headers inspected on `next start` |
| Error handling | Start-up validation fixed tonight; no error pages or error types yet | Run with good and bad settings |
| Dependencies | Production: 0 advisories. Dev tooling: 16 high, one root cause, no fix published (§6) | `npm audit` |
| Unit tests | 12 (environment 5, start-up 3, shim policy 4) plus 86 token tests, all passing | `npm test` |
| Database tests | 5 passing on real Postgres 16 (skipped in `npm test` without a database) | `npm run test:db` |
| Browser and accessibility tests | None (no screens) | — |
| CI | Migrations, tokens, types, lint, unit + database tests, build on every push | Workflow read |

## 2. Authentication, sessions and authorisation

Nothing to test yet. The approved design (account service as OIDC provider, offline JWKS verification,
one issuer per environment, encrypted httpOnly session cookie, RLS as the user) is sound. Requirements
to verify when M2b is built, each as an automated test:

1. A token from another environment's issuer is refused (spec 13, identity-architecture §5).
2. A token issued to another product (a different `client_id`), or with no `client_id`, is refused.
3. An expired token is refused; refresh works; a revoked session cannot refresh.
4. `alg: none` and HS256 tokens are refused (asymmetric keys only).
5. Removing a member in accounts blocks them within a minute (mirror event), whatever the token says.
6. The URL's organisation is resolved against memberships; a guessed organisation slug returns 404.
7. Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, encrypted with `SESSION_ENCRYPTION_KEY`.
8. Server actions refuse cross-site requests (Next.js origin check stays enabled).
9. Sensitive actions check `amr` for MFA when the organisation requires it.

## 3. Tenant isolation and RLS assumptions

Proven tonight against real Postgres:

- New tables get no privileges for `anon` or `authenticated` by default.
- A table without RLS, or with RLS but no policy, fails the guard.
- `auth.uid()` is read from `request.jwt.claims`.

**Assumptions that hold locally but are not yet proven on a Supabase project** (needs a hosted
development database):

| # | Assumption | Risk if wrong | How to verify |
|---|---|---|---|
| A1 | `alter default privileges … revoke` covers every table that will be created | Default privileges apply only to objects created **by the role that ran the statement**. Tables created by another role (e.g. through the dashboard, or a different migration role) would get Supabase's broad defaults | After the first hosted migration, run the guard test's privilege probe on the hosted database; always migrate with the same role |
| A2 | `auth.uid()` behaves like the local shim | Supabase's own function reads the same setting, so this should hold; the local test only proves the shim | Run the database tests against `commandcentre-dev` once it exists |
| A3 | `cc_meta.migrations` is unreachable from the Data API | It has no RLS. Supabase exposes only configured schemas, so it should be unreachable; Reel Deal's equivalent was rated critical by the advisor and then locked down | Check the hosted project's exposed schemas and the security advisor; add a migration enabling RLS on it when first hosted |

Specified isolation suite (spec 03 §7) still to build: two organisations, every table and operation,
guessed ids, `org_id` changes on update, agents, retrieval, signed file URLs.

## 4. Input validation and API security

- Environment: zod schema with production-only rules (https, no local database). Tested.
- Routes: `/api/health` takes no input and reports only whether a database is configured (it does not
  connect, so it cannot be used to probe the database). It tells an outsider whether `DATABASE_URL` is
  set; acceptable for a liveness check, but move it behind the platform's health-check path or remove
  the detail before launch.
- To build with M2b and later: zod schemas at every server action and route boundary; ids validated as
  UUIDs; idempotency keys on writes; rate limits per organisation (spec 07 §2); signed webhooks with a
  5-minute window; request size limits on uploads.

## 5. Secrets, headers and errors

| Item | Finding |
|---|---|
| Committed secrets | None. `.env`, `.env.local` and `.env.*.local` are ignored. `.env.example` has a passwordless local URL only. CI uses a throwaway database password, which is fine |
| Secret reads | Only `src/server/env.ts` reads settings (plus tests and scripts); `server-only` prevents it reaching the browser |
| Secret scanning in CI | Not present. Reel Deal has `check:secrets`; add the same before any credential is used here |
| Headers | `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, HSTS `max-age=63072000; includeSubDomains; preload`, `X-Powered-By` removed |
| CSP | Missing, by design until real pages exist. Add a nonce-based CSP with M3, when the shell and scripts exist |
| HSTS preload | The `preload` directive is harmless until the domain is submitted to the preload list, but submission is effectively permanent and covers all subdomains. Owner decision before launch |
| Start-up validation | **Fixed tonight.** A production server previously started and reported "Ready" with required settings missing, then failed every request. `src/instrumentation.ts` now validates at start-up; with bad settings the cause is logged once and no route is served (verified), and tests cover it |
| Error pages and types | No `error.tsx`/`not-found.tsx`, no structured service error type, no request ids. Add with M2b/M3: plain messages to people, details only in logs, a support reference on every error screen |
| Logging and monitoring | None. Sentry deferred to first deployment (recorded). Add structured JSON logs with request id, principal and organisation, never tokens or personal data |

## 6. Dependencies

`npm audit` (18 Nov): **0 advisories in production dependencies.** 16 "high" advisories in
development tooling, all from one root cause: `picomatch` ReDoS through repeated extglobs
(GHSA-fc5q-39xc-vjpf, affects ≤ 4.0.7), pulled in by `eslint-config-next` and `vitest`.

- No fixed version is published (4.0.7 is the latest). npm's suggested "fix" is a downgrade of
  `eslint-config-next` to 14 and `vitest` to 3, which would be worse, and `npm audit fix` crashes.
- Exposure: the vulnerable code runs only in lint and test runs, on glob patterns written by
  developers, never on customer input or in the deployed app.
- Action: none tonight. Re-check when picomatch publishes a fix; add `npm audit --omit=dev
  --audit-level=high` to CI so production advisories fail the build.

## 7. Fixes made tonight

| Fix | Files | Tests |
|---|---|---|
| Start-up environment validation | `src/instrumentation.ts` | `src/instrumentation.test.ts` (3); verified with `next start` |
| Local compatibility file refused for hosted databases unless explicitly allowed (it creates an RLS-bypassing `service_role` and an `auth` stub) | `src/server/db/shim-policy.ts`, `scripts/db-migrate.ts` | `src/server/db/shim-policy.test.ts` (4); fresh `npm run setup` still works |
| Design-token guard in CI | `scripts/check-tokens.ts`, `package.json`, `.github/workflows/ci.yml` | Run on clean code and on a deliberately bad file |
| Contrast check | `src/design/tokens.test.ts` | 86 tests |

Nothing was weakened: no RLS, grant, header or validation rule was loosened to make a test pass.

## 8. What can be checked where

| Check | Locally, without Supabase | Needs a hosted Supabase project |
|---|---|---|
| Migrations, RLS guard, default grants | ✅ (done) | Re-run to prove A1 |
| Policies and isolation suite for every table | ✅ (local Postgres + compatibility file) | Re-run before release |
| Token verification, issuer and `client_id` pinning, expiry, key rotation | ✅ with a local test issuer and JWKS | — |
| Full sign-in, code exchange, refresh, sign-out everywhere | ❌ | `accounts-dev` (after the R2 correction) |
| Mirror events and reconciliation | ✅ with signed test events | End-to-end with the account service |
| Supabase security and performance advisors | ❌ | Hosted project |
| Email links (confirmation, reset) | ❌ | `accounts-dev` + email provider |
| Browser journeys, axe, keyboard | ✅ (once screens exist) | — |
| Headers, CSP, start-up validation | ✅ (done) | Re-check on Vercel |
| Dependency and secret scanning | ✅ | — |

## 9. Recommended additions to CI (small, no new services)

1. ✅ 18 Nov: `npm run check:deps` (`npm audit --omit=dev --audit-level=high`).
2. ✅ 18 Nov: `npm run check:secrets`, ported from Reel Deal, with Supabase secret-key, Anthropic,
   Stripe webhook and password-in-URL patterns added.
3. ✅ 18 Nov: `npm run check:env:production`: a complete production environment must pass; missing
   settings and a local database must fail.
4. When screens exist: Playwright with axe at 375, 768 and 1280 px, light and dark.
