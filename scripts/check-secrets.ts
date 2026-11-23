/*
  Secret hygiene (npm run check:secrets, part of npm run check and CI). Ported from Reel Deal.
  1. No credentials committed: scans tracked and new (not ignored) files for common key formats.
  2. Settings are read in one place: process.env appears in src/ only in src/server/env.ts (and the
     runtime check in src/instrumentation.ts), so a secret cannot leak through an ad-hoc read.
  Throwaway values for local and CI databases are named "local-dev-only…" or "ci-only…" and ignored.
*/
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execSync("git ls-files -co --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !/\.(png|jpe?g|gif|webp|ico|woff2?|lock)$|package-lock\.json$/.test(f));

const SECRET_PATTERNS: [string, RegExp][] = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ["AWS / R2 access key id", /\bAKIA[0-9A-Z]{16}\b/],
  ["JWT (e.g. a Supabase legacy service role key)", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ["Stripe live key", /\b(?:sk|rk)_live_[0-9a-zA-Z]{16,}/],
  ["Stripe webhook secret", /\bwhsec_[0-9a-zA-Z]{20,}/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ["database URL with a password", /postgres(?:ql)?:\/\/[^:\s/]+:[^@\s]{12,}@(?!localhost|127\.0\.0\.1)/],
  ["generic secret assignment", /(?:SECRET|PASSWORD|SERVICE_ROLE_KEY|ACCESS_KEY|API_KEY|SIGNING_KEY)[A-Z_]*\s*[=:]\s*["']?[A-Za-z0-9/+_-]{20,}/],
];
const ENV_ALLOWED = /^(src\/server\/env\.ts|src\/instrumentation\.ts)$|\.test\.ts$/;
const THROWAWAY = /local-dev-only|ci-only/;

const problems: string[] = [];
for (const file of files) {
  if (file === "scripts/check-secrets.ts") continue; // contains the patterns themselves
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  text.split("\n").forEach((line, i) => {
    if (!THROWAWAY.test(line)) {
      for (const [name, re] of SECRET_PATTERNS) if (re.test(line)) problems.push(`${file}:${i + 1}  possible ${name}`);
    }
    if (/^src\//.test(file) && !ENV_ALLOWED.test(file) && /process\.env\b/.test(line) && !/^\s*(\/\/|\*)/.test(line)) {
      problems.push(`${file}:${i + 1}  reads process.env directly; add the setting to src/server/env.ts`);
    }
  });
}

if (problems.length) {
  console.error(`✗ ${problems.length} secret-hygiene problem(s):\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`✓ no committed secrets; settings are read only in src/server/env.ts (${files.length} files scanned)`);
