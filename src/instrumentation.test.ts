import { afterEach, describe, expect, it, vi } from "vitest";

// register() must refuse to start a server with an invalid production environment.
describe("instrumentation register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("fails at start-up when production settings are missing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    const { register } = await import("./instrumentation");
    await expect(register()).rejects.toThrow(/APP_URL/);
  });

  it("starts with a complete production environment", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://app.example.com");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@db.example.com:5432/db");
    const { register } = await import("./instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("does nothing outside the Node.js runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("NODE_ENV", "production");
    const { register } = await import("./instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });
});
