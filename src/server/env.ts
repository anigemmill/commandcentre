import "server-only";
import { z } from "zod";

/*
  Environment checks. Every setting the server reads is declared here, so a missing or
  wrong value fails at start-up with a clear message, not deep inside a request.
  Production is stricter: required settings must be present and must not be local values.
*/
const Schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  /*
    Development sign-in (src/server/auth/dev-issuer.ts): stands in for the Outside In account service
    until its OAuth server is enabled. Never allowed in production, and only on a localhost APP_URL.
  */
  DEV_IDENTITY: z.enum(["enabled", "disabled"]).default("disabled"),
  /*
    Shared sign-in with the Outside In account service (OAuth code + PKCE S256, confidential client).
    All three or none. Required in production. docs/mvp-auth.md.
  */
  ACCOUNTS_ISSUER: z.url().optional(),
  ACCOUNTS_CLIENT_ID: z.string().min(1).optional(),
  ACCOUNTS_CLIENT_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof Schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid environment:\n  ${fields.join("\n  ")}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    const problems: string[] = [];
    if (!source.APP_URL) problems.push("APP_URL is required in production");
    else if (!env.APP_URL.startsWith("https://")) problems.push("APP_URL must use https in production");
    if (!env.DATABASE_URL) problems.push("DATABASE_URL is required in production");
    else if (/@(localhost|127\.0\.0\.1)[:/]/.test(env.DATABASE_URL)) problems.push("DATABASE_URL points at a local database");
    if (source.DEV_IDENTITY === "enabled") problems.push("DEV_IDENTITY must not be enabled in production");
    if (!env.ACCOUNTS_ISSUER || !env.ACCOUNTS_CLIENT_ID || !env.ACCOUNTS_CLIENT_SECRET) problems.push("ACCOUNTS_ISSUER, ACCOUNTS_CLIENT_ID and ACCOUNTS_CLIENT_SECRET are required in production");
    else if (!env.ACCOUNTS_ISSUER.startsWith("https://")) problems.push("ACCOUNTS_ISSUER must use https in production");
    if (problems.length) throw new Error(`Invalid production environment:\n  ${problems.join("\n  ")}`);
  }
  const accounts = [env.ACCOUNTS_ISSUER, env.ACCOUNTS_CLIENT_ID, env.ACCOUNTS_CLIENT_SECRET].filter(Boolean).length;
  if (accounts !== 0 && accounts !== 3) {
    throw new Error("Invalid environment:\n  set all of ACCOUNTS_ISSUER, ACCOUNTS_CLIENT_ID and ACCOUNTS_CLIENT_SECRET, or none");
  }
  if (env.ACCOUNTS_CLIENT_SECRET && env.ACCOUNTS_CLIENT_SECRET.length < 16) {
    throw new Error("Invalid environment:\n  ACCOUNTS_CLIENT_SECRET is too short to be a real client secret");
  }
  if (env.ACCOUNTS_ISSUER && !env.ACCOUNTS_ISSUER.startsWith("https://") && !isLocalUrl(env.ACCOUNTS_ISSUER)) {
    throw new Error("Invalid environment:\n  ACCOUNTS_ISSUER must use https (or be local)");
  }
  if (env.DEV_IDENTITY === "enabled" && !isLocalUrl(env.APP_URL)) {
    throw new Error("Invalid environment:\n  DEV_IDENTITY can only be enabled when APP_URL is localhost");
  }
  return env;
}

function isLocalUrl(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

let cached: Env | undefined;
export function env(): Env {
  return (cached ??= parseEnv(process.env));
}

/** Shared sign-in settings, or null when not configured. */
export function accountsConfig() {
  const e = env();
  if (!e.ACCOUNTS_ISSUER || !e.ACCOUNTS_CLIENT_ID || !e.ACCOUNTS_CLIENT_SECRET) return null;
  const issuer = e.ACCOUNTS_ISSUER.replace(/\/$/, "");
  return {
    issuer,
    clientId: e.ACCOUNTS_CLIENT_ID,
    clientSecret: e.ACCOUNTS_CLIENT_SECRET,
    authorizeEndpoint: `${issuer}/oauth/authorize`,
    tokenEndpoint: `${issuer}/oauth/token`,
    jwksUri: `${issuer}/.well-known/jwks.json`,
    redirectUri: `${e.APP_URL.replace(/\/$/, "")}/auth/callback`,
  };
}
