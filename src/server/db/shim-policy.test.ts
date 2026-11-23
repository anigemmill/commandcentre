import { describe, expect, it } from "vitest";
import { localShimAllowed } from "./shim-policy";

describe("localShimAllowed", () => {
  it("allows a database on this machine by default", () => {
    expect(localShimAllowed("postgres://postgres@localhost:54330/commandcentre", undefined)).toBe(true);
    expect(localShimAllowed("postgres://postgres@127.0.0.1:5432/db", undefined)).toBe(true);
    expect(localShimAllowed("postgres://postgres@[::1]:5432/db", undefined)).toBe(true);
  });

  it("refuses a hosted database unless explicitly allowed", () => {
    expect(localShimAllowed("postgres://u:p@db.example.com:5432/db", undefined)).toBe(false);
    expect(localShimAllowed("postgres://u:p@db.example.com:5432/db", "true")).toBe(true);
  });

  it("refuses when switched off, even locally", () => {
    expect(localShimAllowed("postgres://postgres@localhost:54330/commandcentre", "false")).toBe(false);
  });

  it("refuses an unparseable URL", () => {
    expect(localShimAllowed("not a url", undefined)).toBe(false);
  });
});
