import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createIdTokenVerifier, exchangeCode } from "../../../../packages/foundation/auth/verify";
import { setSessionCookie, takeOAuthState, verifySessionToken } from "@/server/auth/session";
import { mirrorSignedInUser } from "@/server/data";
import { accountsConfig, env } from "@/server/env";

/*
  Return from the account service. Every step fails closed and sends the person back to the sign-in
  page with a short reason code (never the server's error text):
  state must match the cookie → code exchanged with PKCE verifier + client secret → access token
  verified by the shared verifier (ES256, issuer, client_id) → ID token verified (audience, nonce) →
  the person's profile is mirrored → session cookie set.
*/
const back = (reason: string) => NextResponse.redirect(new URL(`/sign-in?error=${reason}`, env().APP_URL));
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function GET(request: NextRequest) {
  const a = accountsConfig();
  if (!a) return back("not_configured");
  const saved = await takeOAuthState();
  const q = request.nextUrl.searchParams;
  if (q.get("error")) return back(q.get("error") === "access_denied" ? "denied" : "refused");
  const code = q.get("code");
  const state = q.get("state");
  if (!saved || !code || !state || !same(state, saved.state)) return back("state");

  const exchanged = await exchangeCode({ tokenEndpoint: a.tokenEndpoint, clientId: a.clientId, clientSecret: a.clientSecret, code, codeVerifier: saved.codeVerifier, redirectUri: a.redirectUri });
  if (!exchanged.ok) return back("exchange");

  const principal = await verifySessionToken(exchanged.tokens.access_token);
  if (!principal || principal.via !== "accounts") return back("token");
  const id = await createIdTokenVerifier({ issuer: a.issuer, clientId: a.clientId, jwks: new URL(a.jwksUri) })(exchanged.tokens.id_token, saved.nonce);
  if (!id.ok || id.claims.sub !== principal.userId) return back("token");

  const claims = { ...principal.token.claims, ...id.claims } as Record<string, unknown>;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const email = typeof claims.email === "string" ? claims.email : "";
  // Profile name first; the ID token's `name` can be the email address, which isn't a name.
  const name =
    [meta.full_name, meta.name, claims.name].find((v): v is string => typeof v === "string" && v.trim() !== "" && v !== email) ?? email.split("@")[0] ?? "Member";
  await mirrorSignedInUser({ id: principal.userId, email, displayName: name });

  await setSessionCookie(exchanged.tokens.access_token, principal.token.expiresAt);
  return NextResponse.redirect(new URL("/orgs", env().APP_URL));
}
