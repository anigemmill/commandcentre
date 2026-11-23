/*
  Verifies the account service's real OAuth behaviour on accounts-dev before any product relies on it
  (security-review.md §1–§2 in anigemmill/outsideinprojects). Development project only.

  Needs the accounts-dev secret key. It is never in this repository or in an environment variable:
  the cloud session's network proxy adds it as the `apikey` header for requests to the accounts-dev
  host. Elsewhere, set ACCOUNTS_APIKEY in your shell.

  Run: NODE_USE_ENV_PROXY=1 npx tsx scripts/verify-accounts-oauth.ts
  Creates a throwaway test user and a confidential OAuth client, runs the full code + PKCE S256 flow,
  checks the tokens with the shared verifier and the failure cases, then deletes both.
*/
import { decodeJwt, decodeProtectedHeader } from "jose";
import { createAuthorisationRequest, createVerifier } from "../packages/foundation/auth/verify";

const PROJECT = "urdrrzqqtmeuwlxksuov";
const BASE = `https://${PROJECT}.supabase.co`;
const AUTH = `${BASE}/auth/v1`;
const REDIRECT = "http://localhost:3000/auth/callback";
// Placeholder in the format Supabase expects; the proxy replaces it with the real key.
const APIKEY = process.env.ACCOUNTS_APIKEY ?? ["sb", "secret", "placeholder"].join("_");

let passed = 0;
const failures: string[] = [];
const check = (ok: boolean, what: string, detail = "") => {
  if (ok) passed++;
  else failures.push(`${what}${detail ? ` (${detail})` : ""}`);
  console.log(`${ok ? "✓" : "✗"} ${what}${detail && !ok ? ` — ${detail}` : ""}`);
};
const note = (what: string) => console.log(`  · ${what}`);

async function call(path: string, init: RequestInit & { bearer?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", APIKEY);
  if (init.bearer) headers.set("authorization", `Bearer ${init.bearer}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const res = await fetch(path.startsWith("http") ? path : `${AUTH}${path}`, { ...init, headers, redirect: "manual" });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON */
  }
  return { status: res.status, location: res.headers.get("location"), json };
}

const rand = () => crypto.getRandomValues(new Uint8Array(18)).reduce((s, b) => s + b.toString(36).padStart(2, "0"), "");

async function exchange(code: string, verifier: string, client: { id: string; secret?: string }) {
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  if (client.secret) headers.authorization = `Basic ${Buffer.from(`${client.id}:${client.secret}`).toString("base64")}`;
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: verifier, client_id: client.id });
  return call("/oauth/token", { method: "POST", headers, body: body.toString() });
}

async function authorise(clientId: string, userToken: string, method: "S256" | "plain" = "S256") {
  const req = await createAuthorisationRequest({ authorizeEndpoint: `${AUTH}/oauth/authorize`, clientId, redirectUri: REDIRECT });
  const url = new URL(req.url);
  if (method === "plain") {
    url.searchParams.set("code_challenge", req.codeVerifier);
    url.searchParams.set("code_challenge_method", "plain");
  }
  const start = await call(url.toString(), { bearer: userToken });
  const target = start.location ? new URL(start.location, BASE) : null;
  const authorizationId = target?.searchParams.get("authorization_id") ?? null;
  return { req, start, authorizationId };
}

async function approve(authorizationId: string, userToken: string) {
  const details = await call(`/oauth/authorizations/${authorizationId}`, { bearer: userToken });
  const consent = await call(`/oauth/authorizations/${authorizationId}/consent`, { method: "POST", bearer: userToken, body: JSON.stringify({ action: "approve" }) });
  const redirect = (consent.json.redirect_url ?? consent.json.redirect_to) as string | undefined;
  return { details, consent, redirect: redirect ? new URL(redirect) : null };
}

const created: { userId?: string; clientId?: string } = {};
try {
  // 0. Key reaches the project
  const probe = await call("/admin/oauth/clients");
  if (probe.status === 401 || probe.status === 403) {
    console.error(`✗ The accounts-dev secret key isn't reaching the project (HTTP ${probe.status}). Add it as a network secret for ${PROJECT}.supabase.co (header apikey).`);
    process.exit(2);
  }

  // 1. Throwaway user and confidential client
  const email = `oauth-check-${rand().slice(0, 10)}@example.test`;
  const password = rand();
  const user = await call("/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) });
  created.userId = user.json.id as string;
  check(user.status === 200 && !!created.userId, "test user created", `HTTP ${user.status}`);

  const client = await call("/admin/oauth/clients", {
    method: "POST",
    body: JSON.stringify({ client_name: "Command Centre (verification, temporary)", redirect_uris: [REDIRECT], client_type: "confidential", token_endpoint_auth_method: "client_secret_basic" }),
  });
  const clientId = client.json.client_id as string;
  const clientSecret = client.json.client_secret as string;
  created.clientId = clientId;
  check(!!clientId && !!clientSecret, "confidential client registered with a secret", `HTTP ${client.status} ${JSON.stringify(client.json).slice(0, 200)}`);

  const signIn = await call("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  const userToken = signIn.json.access_token as string;
  check(!!userToken, "test user signed in to the account service", `HTTP ${signIn.status}`);
  note(`session token alg ${decodeProtectedHeader(userToken).alg}, aud ${JSON.stringify(decodeJwt(userToken).aud)}`);

  // 2. Authorisation request → consent → code
  const a = await authorise(clientId, userToken);
  check(a.start.status >= 300 && a.start.status < 400 && !!a.authorizationId, "authorise redirects to the consent page with an authorization_id", `HTTP ${a.start.status} ${a.start.location ?? JSON.stringify(a.start.json)}`);
  note(`consent page: ${a.start.location?.split("?")[0]}`);
  const ok = await approve(a.authorizationId!, userToken);
  check(ok.details.status === 200, "authorisation details readable by the signed-in user", `HTTP ${ok.details.status}`);
  check((ok.details.json.redirect_uri as string) === REDIRECT, "details carry the registered redirect_uri (used by our consent check)", JSON.stringify(ok.details.json).slice(0, 200));
  const code = ok.redirect?.searchParams.get("code");
  check(!!code && !!ok.redirect && ok.redirect.origin + ok.redirect.pathname === REDIRECT, "approval returns a code to the exact registered redirect", JSON.stringify(ok.consent.json).slice(0, 200));
  check(ok.redirect?.searchParams.get("state") === a.req.state, "state is returned unchanged");

  // 3. Code exchange failure cases, then success
  const wrongVerifier = await exchange(code!, a.req.codeVerifier.slice(0, -2) + "xx", { id: clientId, secret: clientSecret });
  check(wrongVerifier.status >= 400, "wrong PKCE verifier refused", `HTTP ${wrongVerifier.status}`);
  const noSecret = await exchange(code!, a.req.codeVerifier, { id: clientId });
  check(noSecret.status >= 400, "exchange without the client secret refused", `HTTP ${noSecret.status}`);
  const wrongSecret = await exchange(code!, a.req.codeVerifier, { id: clientId, secret: clientSecret + "x" });
  check(wrongSecret.status >= 400, "exchange with a wrong client secret refused", `HTTP ${wrongSecret.status}`);
  const tokens = await exchange(code!, a.req.codeVerifier, { id: clientId, secret: clientSecret });
  const access = tokens.json.access_token as string | undefined;
  if (!access && (wrongVerifier.status >= 400 || noSecret.status >= 400)) note("code may have been consumed by a refused attempt; retrying with a fresh code");
  let accessToken = access;
  let refresh = tokens.json.refresh_token as string | undefined;
  let idToken = tokens.json.id_token as string | undefined;
  if (!accessToken) {
    const a2 = await authorise(clientId, userToken);
    const ok2 = await approve(a2.authorizationId!, userToken);
    const t2 = await exchange(ok2.redirect!.searchParams.get("code")!, a2.req.codeVerifier, { id: clientId, secret: clientSecret });
    accessToken = t2.json.access_token as string;
    refresh = t2.json.refresh_token as string;
    idToken = t2.json.id_token as string;
    const reuse = await exchange(ok2.redirect!.searchParams.get("code")!, a2.req.codeVerifier, { id: clientId, secret: clientSecret });
    check(reuse.status >= 400, "authorisation code can't be used twice", `HTTP ${reuse.status}`);
  } else {
    const reuse = await exchange(code!, a.req.codeVerifier, { id: clientId, secret: clientSecret });
    check(reuse.status >= 400, "authorisation code can't be used twice", `HTTP ${reuse.status}`);
  }
  check(!!accessToken, "correct code, verifier and secret give an access token", JSON.stringify(tokens.json).slice(0, 200));

  // 4. The access token itself
  const header = decodeProtectedHeader(accessToken!);
  const claims = decodeJwt(accessToken!);
  check(header.alg === "ES256", "access token is signed with ES256", String(header.alg));
  check(claims.iss === AUTH, "issuer is exactly the account service", String(claims.iss));
  check(claims.client_id === clientId, "access token carries client_id", JSON.stringify(claims.client_id));
  check(claims.sub === created.userId, "subject is the account user id");
  note(`aud ${JSON.stringify(claims.aud)} · role ${claims.role} · aal ${claims.aal} · amr ${JSON.stringify(claims.amr)} · lifetime ${Number(claims.exp) - Number(claims.iat)} s · claims: ${Object.keys(claims).sort().join(", ")}`);

  const jwks = new URL(`${AUTH}/.well-known/jwks.json`);
  const verify = createVerifier({ issuer: AUTH, clientId, jwks });
  const accepted = await verify(accessToken);
  check(accepted.ok, "shared verifier accepts the real token", JSON.stringify(accepted));
  const otherProduct = await createVerifier({ issuer: AUTH, clientId: "some-other-product", jwks })(accessToken);
  check(!otherProduct.ok && otherProduct.reason === "client", "another product's verifier refuses it (client_id)", JSON.stringify(otherProduct));
  const sessionToken = await verify(userToken);
  check(!sessionToken.ok, "a plain account-service session token is refused by the product verifier", JSON.stringify(sessionToken));

  if (idToken) {
    const idh = decodeProtectedHeader(idToken);
    const idc = decodeJwt(idToken);
    check(idh.alg === "ES256", "id_token is signed with ES256", String(idh.alg));
    check(idc.aud === clientId || (Array.isArray(idc.aud) && idc.aud.includes(clientId)), "id_token audience is this client", JSON.stringify(idc.aud));
    check(idc.nonce === a.req.nonce || !!idc.nonce, "id_token carries the nonce", JSON.stringify(idc.nonce));
  } else note("no id_token returned");

  // 5. Refresh and rotation
  if (refresh) {
    const r1 = await call("/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }).toString(),
    });
    check(!!r1.json.access_token, "refresh token gives a new access token", `HTTP ${r1.status}`);
    const r2 = await call("/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }).toString(),
    });
    note(`reusing the old refresh token: HTTP ${r2.status} (${r2.status >= 400 ? "rotated" : "still accepted, within reuse interval"})`);
  } else note("no refresh token returned");

  // 6. What the server allows that we must never send
  const plain = await authorise(clientId, userToken, "plain");
  note(`PKCE "plain" request: HTTP ${plain.start.status} (${plain.authorizationId ? "accepted by the server; our client never sends it" : "refused"})`);
  const badRedirect = await call(`${AUTH}/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: "https://evil.example/cb", code_challenge: "x".repeat(43), code_challenge_method: "S256" })}`, { bearer: userToken });
  check(badRedirect.status === 400 || !(badRedirect.location ?? "").startsWith("https://evil.example"), "unregistered redirect_uri refused", `HTTP ${badRedirect.status} ${badRedirect.location}`);
} catch (e) {
  failures.push(`unexpected error: ${(e as Error).message}`);
  console.error(`✗ ${(e as Error).message}`);
} finally {
  if (created.clientId) {
    const d = await call(`/admin/oauth/clients/${created.clientId}`, { method: "DELETE" });
    console.log(`${d.status < 300 ? "✓" : "✗"} temporary client deleted`);
  }
  if (created.userId) {
    const d = await call(`/admin/users/${created.userId}`, { method: "DELETE" });
    console.log(`${d.status < 300 ? "✓" : "✗"} test user deleted`);
  }
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exitCode = 1;
}
