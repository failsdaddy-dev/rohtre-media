import { describe, expect, it } from "vitest";
import { DEFAULT_HOME, homeSchema, parseHome } from "../src/content/home-schema";
import { isLiveBadge, isLiveProof, publicBadges } from "../src/lib/proof";

describe("home content (R13, R14)", () => {
  it("has exactly two hero slides", () => {
    expect(DEFAULT_HOME.hero.slides).toHaveLength(2);
    const three = { ...DEFAULT_HOME.hero, slides: [...DEFAULT_HOME.hero.slides, DEFAULT_HOME.hero.slides[0]] };
    expect(homeSchema.shape.hero.safeParse(three).success).toBe(false);
  });

  it("a bad section falls back to its default without touching the others", () => {
    const h = parseHome({ hero: { slides: [] }, finalCta: { ...DEFAULT_HOME.finalCta, title: "Talk to us" } });
    expect(h.hero).toEqual(DEFAULT_HOME.hero);
    expect(h.finalCta.title).toBe("Talk to us");
  });

  it("has a CTA after every section that needs one", () => {
    for (const key of ["badges", "services", "results", "process", "testimonials", "faq"] as const) {
      expect(DEFAULT_HOME[key].cta.label.length).toBeGreaterThan(0);
    }
  });

  it("FAQ drafts start unapproved", () => {
    expect(DEFAULT_HOME.faq.items.every((f) => f.status === "draft")).toBe(true);
  });

  it("has no price, package or industries fields anywhere (rule 6)", () => {
    const keys = JSON.stringify(DEFAULT_HOME).toLowerCase();
    for (const banned of ['"price', '"package', '"industries', "what's included"]) expect(keys).not.toContain(banned);
  });

  it("every heading has its accent line and every service has an icon", () => {
    for (const key of ["services", "results", "process", "testimonials", "faq"] as const) {
      expect(DEFAULT_HOME[key].accent.length).toBeGreaterThan(0);
    }
    expect(DEFAULT_HOME.services.items.every((i) => i.icon && i.tags.length > 0)).toBe(true);
  });

  it("founder years stay unset until confirmed (no invented facts)", () => {
    expect(DEFAULT_HOME.founder.yearsExperience).toBeNull();
  });
});

describe("what may go live (R11 as changed by the founder, R19)", () => {
  it("a badge shows when switched on (showcase, no proof link needed)", () => {
    expect(isLiveBadge({ enabled: true })).toBe(true);
    expect(isLiveBadge({ enabled: false })).toBe(false);
  });

  it("the public strip shows only switched-on badges, in any order or mix", () => {
    const list = [
      { id: "proved", enabled: true, proof_url: "https://example.com/proof" },
      { id: "off", enabled: false, proof_url: null },
      { id: "no-proof", enabled: true, proof_url: null },
    ];
    // Showcase rule (founder, 2026-10-17): switched on = shown, proof optional.
    expect(publicBadges(list).map((b) => b.id)).toEqual(["proved", "no-proof"]);
    expect(publicBadges([{ enabled: false }])).toEqual([]);
  });

  it("the strip's column count follows the visible badges (no empty slot)", () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ enabled: i < 5 }));
    expect(publicBadges(six)).toHaveLength(5); // --cols = 5 on 768 px and wider
  });

  it("proof needs approval and must not be a placeholder", () => {
    expect(isLiveProof({ approved: true, is_placeholder: false })).toBe(true);
    expect(isLiveProof({ approved: false, is_placeholder: false })).toBe(false);
    expect(isLiveProof({ approved: true, is_placeholder: true })).toBe(false);
  });
});
