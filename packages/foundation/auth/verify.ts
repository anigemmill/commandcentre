/*
  Shared token verifier for The Outside In products (security-review.md §1.1 in
  anigemmill/outsideinprojects). Built here first, like the design tokens, and extracted into the
  foundation package when a second product adopts it.

  Strict and fail-closed:
  - signature checked against a JWKS; algorithm allow-list ES256 only (HS*, none, RS* refused,
    whatever the token header says)
  - `iss` exactly the configured issuer; `client_id` exactly this product's client id
  - `exp`, `iat` and `sub` required; at most 60 s clock skew; `sub` must be a UUID
  - every failure returns { ok: false } with a reason code; it never throws and never falls back
*/
import { createLocalJWKSet, createRemoteJWKSet, errors, jwtVerify, type JSONWebKeySet, type JWTPayload } from "jose";

export const ALLOWED_ALGORITHMS = ["ES256"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VerifiedToken = { sub: string; clientId: string; issuer: string; expiresAt: number; claims: JWTPayload };
export type VerifyFailure =
  | "missing"
  | "malformed"
  | "algorithm"
  | "signature"
  | "issuer"
  | "client"
  | "expired"
  | "not_yet_valid"
  | "claims"
  | "subject"
  | "keys_unavailable";
export type VerifyResult = { ok: true; token: VerifiedToken } | { ok: false; reason: VerifyFailure };

export interface VerifierOptions {
  /** Exact issuer, e.g. https://<accounts project>.supabase.co/auth/v1 */
  issuer: string;
  /** This product's OAuth client id in this environment */
  clientId: string;
  /** Remote JWKS URL (production) or an in-memory key set (tests, development issuer) */
  jwks: URL | JSONWebKeySet;
  clockToleranceSeconds?: number;
}

export function createVerifier(options: VerifierOptions) {
  if (!options.issuer || !options.clientId) throw new Error("Token verifier needs an issuer and a client id");
  const keys = options.jwks instanceof URL ? createRemoteJWKSet(options.jwks, { cooldownDuration: 30_000, cacheMaxAge: 600_000 }) : createLocalJWKSet(options.jwks);
  const tolerance = Math.min(options.clockToleranceSeconds ?? 60, 60);

  return async function verify(token: string | null | undefined): Promise<VerifyResult> {
    if (!token) return { ok: false, reason: "missing" };
    if (token.length > 8192 || token.split(".").length !== 3) return { ok: false, reason: "malformed" };
    try {
      const { payload, protectedHeader } = await jwtVerify(token, keys, {
        algorithms: [...ALLOWED_ALGORITHMS],
        issuer: options.issuer,
        clockTolerance: tolerance,
        requiredClaims: ["exp", "iat", "sub"],
      });
      if (!ALLOWED_ALGORITHMS.includes(protectedHeader.alg as (typeof ALLOWED_ALGORITHMS)[number])) return { ok: false, reason: "algorithm" };
      if (payload.client_id !== options.clientId) return { ok: false, reason: "client" };
      if (typeof payload.iat === "number" && payload.iat > Date.now() / 1000 + tolerance) return { ok: false, reason: "not_yet_valid" };
      if (typeof payload.sub !== "string" || !UUID.test(payload.sub)) return { ok: false, reason: "subject" };
      return { ok: true, token: { sub: payload.sub, clientId: options.clientId, issuer: options.issuer, expiresAt: payload.exp as number, claims: payload } };
    } catch (e) {
      return { ok: false, reason: classify(e) };
    }
  };
}

function classify(e: unknown): VerifyFailure {
  if (e instanceof errors.JWTExpired) return "expired";
  if (e instanceof errors.JWTClaimValidationFailed) {
    if (e.claim === "iss") return "issuer";
    if (e.claim === "nbf" || e.claim === "iat") return "not_yet_valid";
    return "claims";
  }
  if (e instanceof errors.JOSEAlgNotAllowed) return "algorithm";
  if (e instanceof errors.JWSSignatureVerificationFailed || e instanceof errors.JWKSNoMatchingKey) return "signature";
  if (e instanceof errors.JWKSTimeout || e instanceof errors.JWKSInvalid) return "keys_unavailable";
  return "malformed";
}

/*
  Authorisation request for a product's sign-in (security-review.md §2): always PKCE S256 (the
  server also accepts "plain"; we never send it), random state and nonce, and the product must be a
  confidential client: exchanging the code requires its client secret.
*/
export type AuthorisationRequest = { url: string; state: string; nonce: string; codeVerifier: string };

export async function createAuthorisationRequest(input: { authorizeEndpoint: string; clientId: string; redirectUri: string; scope?: string }): Promise<AuthorisationRequest> {
  const codeVerifier = randomUrlSafe(32);
  const state = randomUrlSafe(24);
  const nonce = randomUrlSafe(24);
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))));
  const url = new URL(input.authorizeEndpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    scope: input.scope ?? "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return { url: url.toString(), state, nonce, codeVerifier };
}

/*
  Code exchange (confidential client, client_secret_basic) and ID-token check. The access token from
  the exchange is then checked with createVerifier like any other request's token.
*/
export type TokenResponse = { access_token: string; id_token?: string; refresh_token?: string; expires_in?: number };

export async function exchangeCode(input: {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; tokens: TokenResponse } | { ok: false; reason: string }> {
  const secret = requireClientSecret(input.clientSecret);
  try {
    const res = await (input.fetchImpl ?? fetch)(input.tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${Buffer.from(`${encodeURIComponent(input.clientId)}:${encodeURIComponent(secret)}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code: input.code, code_verifier: input.codeVerifier, redirect_uri: input.redirectUri, client_id: input.clientId }),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<TokenResponse> & { error?: string };
    if (!res.ok || typeof body.access_token !== "string") return { ok: false, reason: body.error ?? `http_${res.status}` };
    return { ok: true, tokens: body as TokenResponse };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/** ID token: ES256, exact issuer, audience is this client, nonce matches the one we sent. */
export function createIdTokenVerifier(options: VerifierOptions) {
  if (!options.issuer || !options.clientId) throw new Error("ID token verifier needs an issuer and a client id");
  const keys = options.jwks instanceof URL ? createRemoteJWKSet(options.jwks, { cooldownDuration: 30_000, cacheMaxAge: 600_000 }) : createLocalJWKSet(options.jwks);
  return async function verifyIdToken(token: string | undefined, nonce: string): Promise<{ ok: true; claims: JWTPayload } | { ok: false; reason: VerifyFailure | "nonce" }> {
    if (!token) return { ok: false, reason: "missing" };
    try {
      const { payload } = await jwtVerify(token, keys, {
        algorithms: [...ALLOWED_ALGORITHMS],
        issuer: options.issuer,
        audience: options.clientId,
        clockTolerance: Math.min(options.clockToleranceSeconds ?? 60, 60),
        requiredClaims: ["exp", "iat", "sub", "nonce"],
      });
      if (!nonce || payload.nonce !== nonce) return { ok: false, reason: "nonce" };
      return { ok: true, claims: payload };
    } catch (e) {
      return { ok: false, reason: classify(e) };
    }
  };
}

/** Confidential clients only: a product without a client secret must not exchange codes. */
export function requireClientSecret(secret: string | undefined): string {
  if (!secret || secret.length < 16) throw new Error("A confidential client secret is required to exchange authorisation codes");
  return secret;
}

function randomUrlSafe(bytes: number) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
function base64url(b: Uint8Array) {
  return Buffer.from(b).toString("base64url");
}
