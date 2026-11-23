import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
  Automated contrast check of the Command Centre theme (docs/specs/12 §2, "Contrast" row).
  Reads tokens/command-centre.css, resolves var() references, and checks every pair components
  are allowed to use against the WCAG 2.x targets in docs/specs/09 (4.5:1 text, 3:1 control
  boundaries, focus rings and chart marks).
*/
const css = readFileSync(join(process.cwd(), "tokens/command-centre.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

// Top-level ":root {…}" blocks (brand + light), the media-query dark block and the class dark block.
const rootBlocks = [...css.matchAll(/(?:^|\n):root\s*\{([^}]*)\}/g)].map((m) => m[1]);
const mediaDark = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\.mode-light\)\s*\{([^}]*)\}/)?.[1] ?? "";
const classDark = css.match(/:root\.mode-dark\s*\{([^}]*)\}/)?.[1] ?? "";

const light = Object.assign({}, ...rootBlocks.map(declarations)) as Record<string, string>;
const dark = { ...light, ...declarations(classDark) };

function resolve(vars: Record<string, string>, name: string, depth = 0): string {
  const value = vars[name];
  if (value === undefined) throw new Error(`token ${name} is not defined`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  if (ref && depth < 10) return resolve(vars, ref[1], depth + 1);
  return value;
}

function luminance(hex: string): number {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`not a 6-digit hex colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Brand and typeface tokens are not mode-dependent, so dark mode does not redefine them.
const BRAND = new Set(["--cc-forest", "--cc-ivory", "--cc-eucalyptus", "--cc-charcoal", "--cc-stone", "--cc-sage", "--cc-font-display", "--cc-font-body", "--cc-font-mono"]);

const TEXT = 4.5;
const NON_TEXT = 3;
const backgrounds = ["--cc-bg", "--cc-surface", "--cc-surface-muted", "--cc-surface-raised"];
const pairs: [string, string[], number][] = [
  ["--cc-text", backgrounds, TEXT],
  ["--cc-text-muted", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-text-accent", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-action", ["--cc-bg", "--cc-surface"], TEXT], // links use the action colour
  ["--cc-on-action", ["--cc-action", "--cc-action-hover"], TEXT],
  ["--cc-on-secondary", ["--cc-secondary"], TEXT],
  ["--cc-on-accent-soft", ["--cc-accent-soft"], TEXT],
  ["--cc-on-nav-selected", ["--cc-nav-selected"], TEXT],
  ["--cc-success", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-warning", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-danger", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-info", ["--cc-bg", "--cc-surface"], TEXT],
  ["--cc-border-control", ["--cc-bg", "--cc-surface"], NON_TEXT],
  ["--cc-focus", ["--cc-bg", "--cc-surface"], NON_TEXT],
  ...[1, 2, 3, 4, 5, 6].map((n): [string, string[], number] => [`--cc-chart-${n}`, ["--cc-bg", "--cc-surface"], NON_TEXT]),
  ["--cc-chart-target", ["--cc-bg", "--cc-surface"], NON_TEXT],
];

describe("Command Centre theme tokens", () => {
  it("reproduces the ratios published in spec 09", () => {
    // Spot checks against docs/specs/09 §2, to two decimals.
    expect(contrast("#252b29", "#f4f1e9")).toBeCloseTo(12.78, 1);
    expect(contrast("#183c35", "#f4f1e9")).toBeCloseTo(10.71, 1);
    expect(contrast("#718777", "#f4f1e9")).toBeCloseTo(3.42, 1);
    expect(contrast("#a6b5a2", "#f4f1e9")).toBeCloseTo(1.91, 1);
  });

  for (const [mode, vars] of [["light", light], ["dark", dark]] as const) {
    describe(`${mode} mode`, () => {
      for (const [fg, bgs, target] of pairs) {
        for (const bg of bgs) {
          it(`${fg} on ${bg} meets ${target}:1`, () => {
            const ratio = contrast(resolve(vars, fg), resolve(vars, bg));
            expect(ratio, `${fg} (${resolve(vars, fg)}) on ${bg} (${resolve(vars, bg)}) is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(target);
          });
        }
      }
    });
  }

  it("never uses colours that fail as text for text tokens", () => {
    // Deep Sage, Muted Eucalyptus and Soft Stone fail as text on ivory (spec 09 §2).
    for (const name of ["--cc-text", "--cc-text-muted", "--cc-text-accent"]) {
      expect(["#718777", "#a6b5a2", "#d9d2c4"]).not.toContain(resolve(light, name).toLowerCase());
    }
  });

  it("defines dark mode identically for the device setting and the explicit choice", () => {
    expect(declarations(mediaDark)).toEqual(declarations(classDark));
    expect(Object.keys(declarations(classDark)).length).toBeGreaterThan(20);
  });

  it("gives dark mode a value for every semantic token light mode defines", () => {
    const semantic = Object.keys(light).filter((k) => k.startsWith("--cc-") && !BRAND.has(k));
    const missing = semantic.filter((k) => !(k in declarations(classDark)));
    expect(missing).toEqual([]);
  });
});
