import "server-only";
import { exportJWK, generateKeyPair, SignJWT, type JSONWebKeySet } from "jose";
import { env } from "../env";

/*
  DEVELOPMENT ONLY: a stand-in for the Outside In account service's token issuer.

  It signs ES256 access tokens shaped like the account service's (iss, sub, client_id, iat, exp),
  and the app verifies them with the same shared verifier (packages/foundation/auth/verify.ts) it
  will use for real tokens. There are no passwords: on the development sign-in page you choose one of
  the seeded test people. The signing key is generated in memory when the server starts and is never
  written anywhere, so restarting the server signs everyone out.

  Refused outside development by src/server/env.ts: DEV_IDENTITY=enabled fails in production and
  with any APP_URL that isn't localhost. When the account service's OAuth server is ready, this file
  and the development sign-in page are deleted (docs/mvp-auth.md).
*/
export const DEV_CLIENT_ID = "command-centre-dev";
export const devIssuer = () => `${env().APP_URL}/dev-identity`;

type Keys = { privateKey: CryptoKey; jwks: JSONWebKeySet };
const store = globalThis as unknown as { __ccDevIdentityKeys?: Promise<Keys> };

export function devIdentityEnabled() {
  const e = env();
  return e.DEV_IDENTITY === "enabled" && e.NODE_ENV !== "production";
}

function keys(): Promise<Keys> {
  if (!devIdentityEnabled()) throw new Error("The development sign-in is not enabled");
  return (store.__ccDevIdentityKeys ??= (async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
    const jwk = { ...(await exportJWK(publicKey)), kid: "dev-1", alg: "ES256", use: "sig" };
    return { privateKey, jwks: { keys: [jwk] } };
  })());
}

export async function devJwks(): Promise<JSONWebKeySet> {
  return (await keys()).jwks;
}

export const DEV_TOKEN_SECONDS = 8 * 60 * 60;

export async function issueDevToken(sub: string): Promise<string> {
  const { privateKey } = await keys();
  return new SignJWT({ client_id: DEV_CLIENT_ID })
    .setProtectedHeader({ alg: "ES256", kid: "dev-1", typ: "JWT" })
    .setIssuer(devIssuer())
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${DEV_TOKEN_SECONDS}s`)
    .sign(privateKey);
}
