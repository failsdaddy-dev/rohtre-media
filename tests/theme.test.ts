import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Reads the light tokens (:root) and the dark tokens (.rm-dark) from
// globals.css and checks WCAG 2.2 contrast for every text/background pair in
// both palettes (R40, R43).
// verified: https://www.w3.org/TR/WCAG22/#contrast-minimum (4.5:1 text, 3:1 large text / UI)

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} block not found`);
  return css.slice(start, css.indexOf("}", start));
}
const PALETTES = { light: block(":root"), dark: block(".rm-dark") };

function token(mode: keyof typeof PALETTES, name: string): string {
  const own = PALETTES[mode].match(new RegExp(String.raw`--${name}:\s*(#[0-9a-f]{6})\s*;`, "i"));
  if (own) return own[1];
  // A token the dark palette doesn't override keeps its light value.
  const fallback = PALETTES.light.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-f]{6})\s*;`, "i"));
  if (!fallback) throw new Error(`token --${name} not found or not a hex colour`);
  return fallback[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
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
// Red used for focus rings, labels, large accent headings: UI / large-text level (3:1).
const UI_PAIRS: [string, string][] = [
  ["brand", "bg"],
  ["focus", "bg"],
  ["danger", "bg"],
  ["grad-a", "bg"],
  ["grad-c", "bg"],
];

describe("theme contrast", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const [fg, bg] of TEXT_PAIRS) {
      it(`${mode}: --${fg} on --${bg} >= 4.5:1`, () => {
        expect(contrast(token(mode, fg), token(mode, bg))).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const [fg, bg] of UI_PAIRS) {
      it(`${mode}: --${fg} on --${bg} >= 3:1`, () => {
        expect(contrast(token(mode, fg), token(mode, bg))).toBeGreaterThanOrEqual(3);
      });
    }
  }

  // Icon tints: the icon in the tint on a 16% disc of the same tint, over the
  // card it sits on (black glow cards in dark sections, white cards in light ones).
  const mix = (a: string, b: string, share: number) =>
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(a.slice(i, i + 2), 16) * share + parseInt(b.slice(i, i + 2), 16) * (1 - share))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  for (const mode of ["light", "dark"] as const) {
    for (const t of ["green", "coral", "purple", "orange", "blue"]) {
      it(`${mode}: --tint-${t} icon on its disc >= 3:1`, () => {
        const card = token(mode, "bg-elev");
        const disc = mix(token(mode, `tint-${t}`), card, 0.16);
        expect(contrast(token(mode, `tint-${t}`), disc)).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it("dark sections really redefine the core tokens", () => {
    for (const name of ["bg", "bg-elev", "fg", "fg-2", "line"]) {
      expect(PALETTES.dark).toMatch(new RegExp(`--${name}:`));
    }
  });
});
