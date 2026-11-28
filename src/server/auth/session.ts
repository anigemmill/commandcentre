import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createVerifier, type VerifiedToken } from "../../../packages/foundation/auth/verify";
import { accountsConfig, env } from "../env";
import { DEV_CLIENT_ID, DEV_TOKEN_SECONDS, devIdentityEnabled, devIssuer, devJwks, issueDevToken } from "./dev-issuer";

/*
  The signed-in person, from a verified access token in an httpOnly cookie.

  Every request verifies the token with the shared verifier (ES256 only, exact issuer, exact
  client_id, expiry). Issuers, in order:
  1. the Outside In account service (ACCOUNTS_*), via OAuth code + PKCE S256 (src/app/auth/*);
  2. development only: the development issuer (DEV_IDENTITY=enabled, never in production).
  Pages and the database only see `Principal`. No sign-in configured = everyone signed out.
*/
export const SESSION_COOKIE = "cc_session";
export const OAUTH_COOKIE = "cc_oauth";

export type Principal = { userId: string; token: VerifiedToken; via: "accounts" | "development" };

type Verify = ReturnType<typeof createVerifier>;
type Source = { via: Principal["via"]; verify: Verify };
const store = globalThis as unknown as { __ccVerifiers?: Promise<Source[]> };

function verifiers(): Promise<Source[]> {
  return (store.__ccVerifiers ??= (async () => {
    const list: Source[] = [];
    const a = accountsConfig();
    if (a) list.push({ via: "accounts", verify: createVerifier({ issuer: a.issuer, clientId: a.clientId, jwks: new URL(a.jwksUri) }) });
    if (devIdentityEnabled()) list.push({ via: "development", verify: createVerifier({ issuer: devIssuer(), clientId: DEV_CLIENT_ID, jwks: await devJwks() }) });
    return list;
  })());
}

export async function signInOptions() {
  await cookies();
  const list = await verifiers();
  return { accounts: list.some((s) => s.via === "accounts"), development: list.some((s) => s.via === "development") };
}

/** Verifies a token against every configured issuer; the first that accepts it wins. */
export async function verifySessionToken(raw: string | undefined): Promise<Principal | null> {
  if (!raw) return null;
  for (const s of await verifiers()) {
    const r = await s.verify(raw);
    if (r.ok) return { userId: r.token.sub, token: r.token, via: s.via };
  }
  return null;
}

export async function currentPrincipal(): Promise<Principal | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; // first, so pages are always rendered per request
  return verifySessionToken(raw);
}

export async function requirePrincipal(): Promise<Principal> {
  const p = await currentPrincipal();
  if (!p) redirect("/sign-in");
  return p;
}

const secure = () => env().APP_URL.startsWith("https://");

/** Stores a verified access token. The session lasts as long as the token (no refresh token kept). */
export async function setSessionCookie(token: string, expiresAt: number) {
  const maxAge = Math.max(0, Math.floor(expiresAt - Date.now() / 1000));
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge });
}

/** Development sign-in only. The caller has already checked the person exists in the mirror. */
export async function startDevSession(userId: string) {
  const token = await issueDevToken(userId);
  await setSessionCookie(token, Date.now() / 1000 + DEV_TOKEN_SECONDS);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/* Short-lived state for one OAuth round trip (state, nonce, PKCE verifier), only sent to /auth/*. */
export type OAuthState = { state: string; nonce: string; codeVerifier: string };
export async function saveOAuthState(s: OAuthState) {
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify(s), { httpOnly: true, sameSite: "lax", secure: secure(), path: "/auth", maxAge: 600 });
}
export async function takeOAuthState(): Promise<OAuthState | null> {
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/auth" });
  try {
    const s = raw ? (JSON.parse(raw) as OAuthState) : null;
    return s && typeof s.state === "string" && typeof s.nonce === "string" && typeof s.codeVerifier === "string" ? s : null;
  } catch {
    return null;
  }
}
