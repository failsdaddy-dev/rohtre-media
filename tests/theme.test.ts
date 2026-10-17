import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Reads the light-dark() token pairs from globals.css and checks WCAG 2.2
// contrast for every text/background pair, in both themes (R40, R43).
// verified: https://www.w3.org/TR/WCAG22/#contrast-minimum (4.5:1 text, 3:1 large text / UI)

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));

function token(name: string): { light: string; dark: string } {
  const m = root.match(
    new RegExp(
      String.raw`--${name}:\s*(?:light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)|(#[0-9a-f]{6}))`,
      "i",
    ),
  );
  if (!m) throw new Error(`token --${name} not found or not a hex colour`);
  return m[3] ? { light: m[3], dark: m[3] } : { light: m[1], dark: m[2] };
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEXT_PAIRS: [string, string][] = [
  ["fg", "bg"],
  ["fg-2", "bg"],
  ["fg", "bg-elev"],
  ["fg-2", "bg-elev"],
  ["fg", "bg-soft"],
  ["chip-on-fg", "chip-on-bg"],
  ["brand-fg", "brand"],
  ["fg", "menu"],
  ["fg", "field-bg"],
];
// Red used for focus rings, eyebrow labels and accents: UI-component level (3:1).
const UI_PAIRS: [string, string][] = [
  ["brand", "bg"],
  ["focus", "bg"],
  ["danger", "bg"],
];

describe("theme contrast", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const [fg, bg] of TEXT_PAIRS) {
      it(`${mode}: --${fg} on --${bg} >= 4.5:1`, () => {
        expect(contrast(token(fg)[mode], token(bg)[mode])).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const [fg, bg] of UI_PAIRS) {
      it(`${mode}: --${fg} on --${bg} >= 3:1`, () => {
        expect(contrast(token(fg)[mode], token(bg)[mode])).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
