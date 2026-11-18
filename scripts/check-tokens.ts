/*
  Design-token guard (npm run check:tokens, part of npm run check and CI).
  Colours live only in tokens/ and packages/foundation/. Application code under src/ must use the
  semantic utilities (bg-surface, text-ink, border-control …) or var(--color-*), so it fails on:
    - raw hex colours (#fff, #183c35 …)
    - rgb()/hsl() colour literals
    - product-theme tokens used directly (var(--cc-*)), which bypass the semantic layer
  Exceptions: src/app/globals.css maps the semantic layer onto --cc-* and is allowed to reference
  them; test files may contain colours as test data.
*/
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const ALLOW_CC_VARS = new Set(["src/app/globals.css"]);
const RULES: [string, RegExp][] = [
  ["raw hex colour", /(?<![\w&])#[0-9a-fA-F]{3,8}\b/],
  ["rgb()/hsl() colour literal", /\b(?:rgba?|hsla?)\(\s*\d/],
  ["product token used directly (use a semantic utility)", /var\(--cc-/],
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const problems: string[] = [];
for (const file of files(ROOT)) {
  const rel = relative(".", file).replaceAll("\\", "/");
  if (!/\.(tsx?|css)$/.test(rel) || /\.test\.tsx?$/.test(rel)) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, "");
      for (const [what, re] of RULES) {
        if (what.startsWith("product token") && ALLOW_CC_VARS.has(rel)) continue;
        if (re.test(code)) problems.push(`${rel}:${i + 1}  ${what}: ${line.trim()}`);
      }
    });
}

if (problems.length) {
  console.error(`✗ ${problems.length} design-token problem(s):\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("✓ application code uses design tokens only (no raw colours, no direct theme tokens)");
