import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createAuthorisationRequest, createVerifier, requireClientSecret } from "../../../packages/foundation/auth/verify";

const ISS = "https://accounts.example/auth/v1";
const CLIENT = "command-centre-test";
const SUB = "11111111-1111-4111-8111-111111111111";
const now = () => Math.floor(Date.now() / 1000);

let es256: CryptoKey, otherEs256: CryptoKey, rs256: CryptoKey;
let jwk: JWK;

beforeAll(async () => {
  const a = await generateKeyPair("ES256");
  es256 = a.privateKey;
  jwk = { ...(await exportJWK(a.publicKey)), kid: "k1", alg: "ES256", use: "sig" };
  otherEs256 = (await generateKeyPair("ES256")).privateKey;
  rs256 = (await generateKeyPair("RS256")).privateKey;
});

const verifier = () => createVerifier({ issuer: ISS, clientId: CLIENT, jwks: { keys: [jwk] } });
const token = (claims: Record<string, unknown> = {}, opts: { key?: CryptoKey; alg?: string; kid?: string } = {}) =>
  new SignJWT({ client_id: CLIENT, ...claims })
    .setProtectedHeader({ alg: opts.alg ?? "ES256", kid: opts.kid ?? "k1" })
    .setIssuer((claims.iss as string) ?? ISS)
    .setSubject((claims.sub as string) ?? SUB)
    .setIssuedAt((claims.iat as number) ?? now())
    .setExpirationTime((claims.exp as number) ?? now() + 900)
    .sign(opts.key ?? es256);

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("shared token verifier", () => {
  it("accepts a valid ES256 token for this issuer and client", async () => {
    const r = await verifier()(await token());
    expect(r).toMatchObject({ ok: true, token: { sub: SUB, clientId: CLIENT } });
  });

  it("rejects HS256, even when signed with the public key's bytes", async () => {
    const header = b64({ alg: "HS256", typ: "JWT", kid: "k1" });
    const body = b64({ iss: ISS, sub: SUB, client_id: CLIENT, iat: now(), exp: now() + 900 });
    const sig = createHmac("sha256", JSON.stringify(jwk)).update(`${header}.${body}`).digest("base64url");
    expect(await verifier()(`${header}.${body}.${sig}`)).toEqual({ ok: false, reason: "algorithm" });
  });

  it("rejects alg none and RS256", async () => {
    const none = `${b64({ alg: "none" })}.${b64({ iss: ISS, sub: SUB, client_id: CLIENT, iat: now(), exp: now() + 900 })}.`;
    expect((await verifier()(none)).ok).toBe(false);
    expect(await verifier()(await token({}, { key: rs256, alg: "RS256" }))).toEqual({ ok: false, reason: "algorithm" });
  });

  it("rejects a token signed by another key", async () => {
    expect(await verifier()(await token({}, { key: otherEs256 }))).toEqual({ ok: false, reason: "signature" });
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = (await token()).split(".");
    expect(await verifier()(`${h}.${b64({ iss: ISS, sub: SUB, client_id: CLIENT, iat: now(), exp: now() + 99999 })}.${s}`)).toEqual({ ok: false, reason: "signature" });
  });

  it("requires the exact issuer", async () => {
    for (const iss of ["https://accounts.example/auth/v1/", "https://evil.example/auth/v1", "https://accounts.example"]) {
      expect(await verifier()(await token({ iss }))).toEqual({ ok: false, reason: "issuer" });
    }
  });

  it("requires this product's client_id and refuses a token without one", async () => {
    expect(await verifier()(await token({ client_id: "reel-deal" }))).toEqual({ ok: false, reason: "client" });
    expect(await verifier()(await token({ client_id: undefined }))).toEqual({ ok: false, reason: "client" });
  });

  it("does not use aud to tell products apart", async () => {
    expect((await verifier()(await token({ aud: "authenticated" }))).ok).toBe(true);
  });

  it("rejects expired tokens and tokens issued in the future", async () => {
    expect(await verifier()(await token({ iat: now() - 2000, exp: now() - 120 }))).toEqual({ ok: false, reason: "expired" });
    expect((await verifier()(await token({ iat: now() + 600 }))).ok).toBe(false);
  });

  it("rejects a non-UUID subject", async () => {
    expect(await verifier()(await token({ sub: "admin" }))).toEqual({ ok: false, reason: "subject" });
  });

  it("fails closed on missing and malformed input", async () => {
    for (const t of [undefined, null, "", "abc", "a.b", "a.b.c", "x".repeat(9000)]) {
      expect((await verifier()(t as string)).ok).toBe(false);
    }
  });

  it("refuses to be created without an issuer or client id", () => {
    expect(() => createVerifier({ issuer: "", clientId: CLIENT, jwks: { keys: [] } })).toThrow();
    expect(() => createVerifier({ issuer: ISS, clientId: "", jwks: { keys: [] } })).toThrow();
  });
});

describe("authorisation request", () => {
  it("always uses PKCE S256 with fresh state and nonce", async () => {
    const a = await createAuthorisationRequest({ authorizeEndpoint: "https://accounts.example/auth/v1/oauth/authorize", clientId: CLIENT, redirectUri: "http://localhost:3000/auth/callback" });
    const q = new URL(a.url).searchParams;
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(q.get("state")).toBe(a.state);
    expect(q.get("nonce")).toBe(a.nonce);
    const b = await createAuthorisationRequest({ authorizeEndpoint: "https://accounts.example/x", clientId: CLIENT, redirectUri: "http://localhost:3000/cb" });
    expect(b.state).not.toBe(a.state);
    expect(b.codeVerifier).not.toBe(a.codeVerifier);
  });

  it("requires a confidential client secret", () => {
    expect(() => requireClientSecret(undefined)).toThrow();
    expect(() => requireClientSecret("short")).toThrow();
    expect(requireClientSecret("a-long-enough-secret")).toBe("a-long-enough-secret");
  });
});
