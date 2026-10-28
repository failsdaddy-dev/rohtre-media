import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_HEADER_TONE, GROUP_TONES, HEADER_TONES, resolveHeaderTone } from "../src/lib/header-tone";

// Every public page gets a valid header tone from its route-group layout, and
// forgetting to declare one is harmless (it resolves to "solid").

const APP = join(__dirname, "..", "src", "app");
const PRIVATE = /^(admin|login|no-access|auth|api|preview)(\/|$)/;

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pages(full);
    return name === "page.tsx" ? [full] : [];
  });
}

/** Public page files with the route group they sit in (or null). */
/** Landing pages take their tone from their first section (tests/landing.test.ts), not from a group. */
const LANDING = "(landing)/lp/[slug]/page.tsx";

const PUBLIC_PAGES = pages(APP)
  .map((file) => relative(APP, file).split(sep).join("/"))
  .filter((path) => !PRIVATE.test(path) && path !== LANDING)
  .map((path) => ({ path, group: path.match(/^(\([^)]+\))\//)?.[1] ?? null }));

const URL_OF = (path: string) => "/" + path.replace(/^\([^)]+\)\//, "").replace(/\/?page\.tsx$/, "");

describe("header tone (resolution)", () => {
  it("has exactly three tones, default solid", () => {
    expect(HEADER_TONES).toEqual(["solid", "transparent-dark-text", "transparent-light-text"]);
    expect(DEFAULT_HEADER_TONE).toBe("solid");
  });

  it("missing or unknown values become solid", () => {
    expect(resolveHeaderTone(undefined)).toBe("solid");
    expect(resolveHeaderTone(null)).toBe("solid");
    expect(resolveHeaderTone("dark")).toBe("solid");
    expect(resolveHeaderTone("transparent-light-text")).toBe("transparent-light-text");
  });
});

describe("header tone (every public page)", () => {
  it("landing pages use the light-hero tone without reading the URL (instant navigation)", () => {
    const layout = readFileSync(join(APP, "(landing)", "lp", "[slug]", "layout.tsx"), "utf8");
    expect(layout).toContain('GROUP_TONES["(light-hero)"]');
    expect(layout).not.toContain("await params");
  });

  it("finds the public pages", () => {
    expect(PUBLIC_PAGES.map((p) => URL_OF(p.path)).sort()).toEqual(
      [
        "/",
        "/about",
        "/careers",
        "/contact",
        "/cookie-settings",
        "/do-not-sell",
        "/fraudulent-use",
        "/privacy-notice",
        "/recognition",
        "/terms-of-service",
        "/work",
        "/work/[slug]",
      ].sort(),
    );
  });

  it("every public page sits in a route group whose layout sets its tone", () => {
    for (const { path, group } of PUBLIC_PAGES) {
      expect(group, `${path} is not in a route group`).not.toBeNull();
      expect(Object.keys(GROUP_TONES), `${group} has no entry in GROUP_TONES`).toContain(group);
      const layout = readFileSync(join(APP, group!, "layout.tsx"), "utf8");
      expect(layout).toContain(`GROUP_TONES["${group}"]`);
      expect(HEADER_TONES).toContain(resolveHeaderTone(GROUP_TONES[group!]));
    }
  });

  it("matches what is behind the header at the top of each page (every page starts light)", () => {
    for (const { path, group } of PUBLIC_PAGES) {
      expect(resolveHeaderTone(GROUP_TONES[group!]), URL_OF(path)).toBe("transparent-dark-text");
    }
  });

  it("no page under the dark-text header starts with the old dark PageHero", () => {
    for (const { path } of PUBLIC_PAGES) {
      const source = readFileSync(join(APP, path), "utf8");
      expect(/<PageHero\b/.test(source), URL_OF(path)).toBe(false);
    }
  });
});
