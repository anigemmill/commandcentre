import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createVerifier, type VerifiedToken } from "../../../packages/foundation/auth/verify";
import { env } from "../env";
import { DEV_CLIENT_ID, DEV_TOKEN_SECONDS, devIdentityEnabled, devIssuer, devJwks, issueDevToken } from "./dev-issuer";

/*
  The signed-in person, from a verified access token in an httpOnly cookie.

  Every request verifies the token with the shared verifier (ES256 only, exact issuer, exact
  client_id, expiry). Today the only configured issuer is the development one; when shared OAuth is
  ready, `verifier()` points at the account service's issuer and JWKS instead and sign-in becomes the
  OAuth code + PKCE flow (docs/mvp-auth.md). Nothing else in the app changes: pages and the database
  only see `Principal`.
*/
export const SESSION_COOKIE = "cc_session";

export type Principal = { userId: string; token: VerifiedToken };

type Verify = ReturnType<typeof createVerifier>;
const store = globalThis as unknown as { __ccVerifier?: Promise<Verify | null> };

/** null when no sign-in is configured: everyone is signed out (fail closed). */
function verifier(): Promise<Verify | null> {
  return (store.__ccVerifier ??= (async () => {
    if (!devIdentityEnabled()) return null;
    return createVerifier({ issuer: devIssuer(), clientId: DEV_CLIENT_ID, jwks: await devJwks() });
  })());
}

export async function signInConfigured() {
  await cookies();
  return (await verifier()) !== null;
}

export async function currentPrincipal(): Promise<Principal | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; // first, so pages are always rendered per request
  const verify = await verifier();
  if (!verify) return null;
  const result = await verify(raw);
  return result.ok ? { userId: result.token.sub, token: result.token } : null;
}

export async function requirePrincipal(): Promise<Principal> {
  const p = await currentPrincipal();
  if (!p) redirect("/sign-in");
  return p;
}

/** Development sign-in only. The caller has already checked the person exists in the mirror. */
export async function startDevSession(userId: string) {
  const token = await issueDevToken(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().APP_URL.startsWith("https://"),
    path: "/",
    maxAge: DEV_TOKEN_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
