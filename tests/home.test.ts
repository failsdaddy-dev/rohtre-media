import { describe, expect, it } from "vitest";
import { DEFAULT_HOME, homeSchema, parseHome } from "../src/content/home-schema";
import { isLiveBadge, isLiveProof } from "../src/lib/proof";

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

  it("founder years stay unset until confirmed (no invented facts)", () => {
    expect(DEFAULT_HOME.founder.yearsExperience).toBeNull();
  });
});

describe("what may go live (R11, R19)", () => {
  it("a badge needs to be switched on AND have a proof link", () => {
    expect(isLiveBadge({ enabled: true, proof_url: "https://example.com" })).toBe(true);
    expect(isLiveBadge({ enabled: true, proof_url: null })).toBe(false);
    expect(isLiveBadge({ enabled: false, proof_url: "https://example.com" })).toBe(false);
  });

  it("proof needs approval and must not be a placeholder", () => {
    expect(isLiveProof({ approved: true, is_placeholder: false })).toBe(true);
    expect(isLiveProof({ approved: false, is_placeholder: false })).toBe(false);
    expect(isLiveProof({ approved: true, is_placeholder: true })).toBe(false);
  });
});
