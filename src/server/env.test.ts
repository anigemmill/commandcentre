import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts an empty development environment with defaults", () => {
    const env = parseEnv({ NODE_ENV: "development" });
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("rejects a malformed URL", () => {
    expect(() => parseEnv({ APP_URL: "not a url" })).toThrow(/APP_URL/);
  });

  it("requires APP_URL and DATABASE_URL in production", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/APP_URL is required[\s\S]*DATABASE_URL is required/);
  });

  it("refuses http and local databases in production", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "production", APP_URL: "http://example.com", DATABASE_URL: "postgres://u@localhost:5432/db" }),
    ).toThrow(/https[\s\S]*local database/);
  });

  it("accepts a complete production environment", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      APP_URL: "https://app.example.com",
      DATABASE_URL: "postgres://u:p@db.example.com:5432/db",
      ACCOUNTS_ISSUER: "https://accounts.example/auth/v1",
      ACCOUNTS_CLIENT_ID: "cc-client",
      ACCOUNTS_CLIENT_SECRET: "ci-only-client-secret-0123",
    });
    expect(env.APP_URL).toBe("https://app.example.com");
  });

  it("refuses the development sign-in in production and on any non-local address", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "production", APP_URL: "https://app.example.com", DATABASE_URL: "postgres://u:p@db.example.com:5432/db", DEV_IDENTITY: "enabled", ...{ ACCOUNTS_ISSUER: "https://a.example/auth/v1", ACCOUNTS_CLIENT_ID: "c", ACCOUNTS_CLIENT_SECRET: "ci-only-client-secret-0123" } }),
    ).toThrow(/DEV_IDENTITY must not be enabled in production/);
    expect(() => parseEnv({ NODE_ENV: "development", APP_URL: "https://preview.example.com", DEV_IDENTITY: "enabled" })).toThrow(/localhost/);
    expect(parseEnv({ NODE_ENV: "development", DEV_IDENTITY: "enabled" }).DEV_IDENTITY).toBe("enabled");
    expect(parseEnv({}).DEV_IDENTITY).toBe("disabled");
  });

  const ACC = { ACCOUNTS_ISSUER: "https://accounts.example/auth/v1", ACCOUNTS_CLIENT_ID: "cc-client", ACCOUNTS_CLIENT_SECRET: "ci-only-client-secret-0123" };
  const PROD = { NODE_ENV: "production", APP_URL: "https://app.example.com", DATABASE_URL: "postgres://u:p@db.example.com:5432/db" };

  it("requires shared sign-in settings in production", () => {
    expect(() => parseEnv(PROD)).toThrow(/ACCOUNTS_ISSUER, ACCOUNTS_CLIENT_ID and ACCOUNTS_CLIENT_SECRET are required/);
    expect(() => parseEnv({ ...PROD, ...ACC, ACCOUNTS_ISSUER: "http://accounts.example/auth/v1" })).toThrow(/https/);
    expect(parseEnv({ ...PROD, ...ACC }).ACCOUNTS_CLIENT_ID).toBe("cc-client");
  });

  it("refuses partial or weak shared sign-in settings", () => {
    expect(() => parseEnv({ ACCOUNTS_ISSUER: ACC.ACCOUNTS_ISSUER })).toThrow(/all of/);
    expect(() => parseEnv({ ...ACC, ACCOUNTS_CLIENT_SECRET: "short" })).toThrow(/too short/);
    expect(() => parseEnv({ ...ACC, ACCOUNTS_ISSUER: "http://evil.example/auth/v1" })).toThrow(/https/);
  });
});

