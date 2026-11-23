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
    if (problems.length) throw new Error(`Invalid production environment:\n  ${problems.join("\n  ")}`);
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
