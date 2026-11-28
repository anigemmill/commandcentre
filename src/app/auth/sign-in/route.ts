import { NextResponse } from "next/server";
import { createAuthorisationRequest } from "../../../../packages/foundation/auth/verify";
import { saveOAuthState } from "@/server/auth/session";
import { accountsConfig, env } from "@/server/env";

/* Starts "Sign in with your Outside In account": OAuth authorisation code + PKCE S256. */
export async function GET() {
  const a = accountsConfig();
  if (!a) return NextResponse.redirect(new URL("/sign-in", env().APP_URL));
  const req = await createAuthorisationRequest({ authorizeEndpoint: a.authorizeEndpoint, clientId: a.clientId, redirectUri: a.redirectUri, scope: "openid email profile" });
  await saveOAuthState({ state: req.state, nonce: req.nonce, codeVerifier: req.codeVerifier });
  return NextResponse.redirect(req.url);
}
