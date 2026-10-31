import { describe, expect, it } from "vitest";
import {
  countryAttrs,
  formatMoney,
  headlineFor,
  slugFor,
  uniqueSlug,
  type DimensionValue,
} from "../src/lib/dimensions";
import { matchProof } from "../src/lib/proof-match";
import { checkPublish, type PublishContext } from "../src/lib/publish-check";
import { masterTemplate } from "../src/sections/master-template";
import { pageContentSchema, SECTION_TYPES, type PageContent } from "../src/sections/schemas";
import { pageHeaderTone } from "../src/sections/tone";

const v = (
  id: string,
  type_key: string,
  slug: string,
  headline_label: string,
  parent_id: string | null = null,
  attrs: Record<string, unknown> = {},
): DimensionValue => ({ id, type_key, slug, label: headline_label, headline_label, parent_id, attrs });

const META = v("s-meta", "service", "meta-ads", "Meta Ads", null, { channels: ["meta"] });
const GOOGLE = v("s-google", "service", "google-ads", "Google Ads", null, { channels: ["google"] });
const D2C = v("s-d2c", "service", "d2c-marketing", "D2C Marketing", null, { channels: ["google", "meta"] });
const D2C_META = v("s-d2c-meta", "service", "d2c-meta-ads", "D2C Meta Ads Marketing", "s-d2c", { channels: ["meta"] });
const FASHION = v("n-fashion", "niche", "fashion", "Fashion");
const SHOES = v("n-shoes", "niche", "shoes", "Shoe", "n-fashion");
const BEAUTY = v("n-beauty", "niche", "beauty", "Beauty");
const INDIA = v("c-in", "country", "india", "India", null, {
  iso: "IN",
  currency: "INR",
  locale: "en-IN",
  timeZone: "Asia/Kolkata",
});
const USA = v("c-us", "country", "usa", "the USA", null, {
  iso: "US",
  currency: "USD",
  locale: "en-US",
  timeZone: "America/New_York",
});
const ALL = new Map([META, GOOGLE, D2C, D2C_META, FASHION, SHOES, BEAUTY, INDIA, USA].map((x) => [x.id, x]));

describe("slugs and headlines (R3, R4)", () => {
  it("builds the slug from the dimensions", () => {
    expect(slugFor({ service: META, niche: FASHION, country: USA })).toBe("meta-ads-fashion-brands-usa");
  });
  it("keeps slugs unique", () => {
    expect(uniqueSlug("a-b", [])).toBe("a-b");
    expect(uniqueSlug("a-b", ["a-b", "a-b-2"])).toBe("a-b-3");
  });
  it("builds the headline from the dimensions (the brief's example)", () => {
    expect(headlineFor({ service: META, niche: FASHION, country: USA })).toBe("Meta Ads for Fashion Brands in the USA");
    expect(headlineFor({ service: D2C_META, niche: SHOES, country: INDIA })).toBe(
      "D2C Meta Ads Marketing for Shoe Brands in India",
    );
  });
});

describe("country settings (R7)", () => {
  it("reads the country's currency, locale and time zone", () => {
    expect(countryAttrs(USA)).toEqual({ iso: "US", currency: "USD", locale: "en-US", timeZone: "America/New_York" });
    expect(countryAttrs({ attrs: { bad: true } }).iso).toBe("IN"); // safe default
  });
  it("formats money in the country's style (results only; never prices)", () => {
    expect(formatMoney(2400000, "INR", "en-IN")).toBe("₹24,00,000");
    expect(formatMoney(180000, "USD", "en-US")).toBe("$180,000");
  });
});

describe("proof matching (R18)", () => {
  const items = [
    { id: "general", sort: 5, tagIds: [] },
    { id: "fashion", sort: 4, tagIds: ["n-fashion"] },
    { id: "shoes-exact", sort: 3, tagIds: ["n-shoes"] },
    { id: "beauty", sort: 1, tagIds: ["n-beauty"] },
    { id: "d2c-parent", sort: 2, tagIds: ["s-d2c"] },
    { id: "google-only", sort: 0, tagIds: ["s-google"] },
    { id: "usa-only", sort: 0, tagIds: ["c-us"] },
  ];
  const ids = (page: DimensionValue[]) => matchProof(items, page, ALL).map((m) => m.item.id);

  it("shows matching and general proof, most specific first", () => {
    // shoes-exact: exact niche; fashion and d2c-parent: one parent match each (tie → own sort order); general last.
    expect(ids([D2C_META, SHOES, INDIA])).toEqual(["shoes-exact", "d2c-parent", "fashion", "general"]);
  });
  it("never shows proof tagged for another niche, service or country", () => {
    const shown = ids([META, FASHION, INDIA]);
    expect(shown).not.toContain("beauty");
    expect(shown).not.toContain("google-only");
    expect(shown).not.toContain("usa-only");
    expect(shown).not.toContain("d2c-parent"); // D2C proof doesn't match a plain Meta ads page
  });
});

describe("master template (R15, R21, R28)", () => {
  it("is valid against the section schemas, hero first, form included", () => {
    for (const service of [META, GOOGLE, D2C]) {
      const page = masterTemplate({ service, niche: FASHION, country: USA });
      expect(pageContentSchema.safeParse(page).success).toBe(true);
      expect(page.sections[0].type).toBe("hero");
      expect(page.sections.some((s) => s.type === "form" && s.enabled)).toBe(true);
    }
  });
  it("puts the generated headline in the H1", () => {
    const page = masterTemplate({ service: META, niche: FASHION, country: USA });
    const hero = page.sections.find((s) => s.type === "hero");
    expect(hero?.type === "hero" && hero.props.h1).toBe("Meta Ads for Fashion Brands in the USA");
  });
  it("takes the channel angle: Meta leads with reels, Google with images and search platforms", () => {
    const creatives = (p: PageContent) => p.sections.find((s) => s.type === "creatives")?.variant;
    const platforms = (p: PageContent) => {
      const s = p.sections.find((x) => x.type === "platforms");
      return s?.type === "platforms" ? s.props.items.map((i) => i.name) : [];
    };
    const meta = masterTemplate({ service: META, niche: FASHION, country: INDIA });
    const google = masterTemplate({ service: GOOGLE, niche: FASHION, country: INDIA });
    expect(creatives(meta)).toBe("reels-first");
    expect(creatives(google)).toBe("images-first");
    expect(platforms(meta)).toEqual(["Facebook", "Instagram"]);
    expect(platforms(google)).toContain("Google Search");
  });
  it("has no prices, packages or invented facts (rule 4, 6)", () => {
    const text = JSON.stringify(masterTemplate({ service: D2C, niche: FASHION, country: USA })).toLowerCase();
    for (const banned of ['"price', "package", "what's included", "%", "₹", "$"]) expect(text).not.toContain(banned);
  });
  it("starts FAQ answers as drafts (written fresh per page, R17)", () => {
    const page = masterTemplate({ service: META, niche: FASHION, country: USA });
    const faq = page.sections.find((s) => s.type === "faq");
    expect(faq?.type === "faq" && faq.props.items.every((i) => i.status === "draft")).toBe(true);
  });
});

describe("section registry (R27, R28)", () => {
  it("every section type has at most two variants", () => {
    for (const def of Object.values(SECTION_TYPES)) expect(def.variants.length).toBeLessThanOrEqual(2);
  });
  it("a page takes its header tone from its first enabled section, default solid", () => {
    const page = masterTemplate({ service: META, niche: FASHION, country: USA });
    expect(pageHeaderTone(page)).toBe("transparent-dark-text"); // the light sky hero
    const noHero = { sections: page.sections.map((s) => (s.type === "hero" ? { ...s, enabled: false } : s)) };
    expect(pageHeaderTone(noHero)).toBe("solid");
    expect(pageHeaderTone(null)).toBe("solid");
  });
});

describe("publish check (R25)", () => {
  const ready = (): PageContent => {
    const page = masterTemplate({ service: META, niche: FASHION, country: USA });
    for (const s of page.sections) {
      if (s.type === "hero")
        s.props.offerBanner = {
          desktop: { publicId: "rohtre-media/images/x", width: 1200, height: 900 },
          mobile: { publicId: "rohtre-media/images/y", width: 1080, height: 1350 },
          alt: "Offer banner",
        };
      if (s.type === "faq") s.props.items = s.props.items.map((i) => ({ ...i, status: "ready" as const }));
    }
    return page;
  };
  const ctx = (over: Partial<PublishContext> = {}): PublishContext => ({
    slug: "meta-ads-fashion-brands-usa",
    visibility: "unlisted",
    otherSlugs: [],
    liveCounts: { results: 2, testimonials: 1, creatives: 3, concept: 0 },
    unlabelledConcept: 0,
    liveBadgeIds: ["b1"],
    ...over,
  });
  const codes = (content: unknown, c = ctx()) => checkPublish(content, c).map((i) => i.code);

  it("passes a complete page", () => {
    expect(codes(ready())).toEqual([]);
  });
  it("blocks draft FAQs but not a missing banner", () => {
    expect(codes(masterTemplate({ service: META, niche: FASHION, country: USA }))).toEqual(["faq-draft"]);
  });
  it("blocks a half-finished banner", () => {
    const page = ready();
    for (const s of page.sections) if (s.type === "hero") s.props.offerBanner.mobile = null;
    expect(codes(page)).toEqual(["banner-mobile"]);
  });
  it("blocks a missing H1, missing form and a duplicate slug", () => {
    const page = ready();
    for (const s of page.sections) {
      if (s.type === "hero") s.props.h1 = " ";
      if (s.type === "form") s.enabled = false;
    }
    expect(codes(page, ctx({ otherSlugs: ["meta-ads-fashion-brands-usa"] }))).toEqual(
      expect.arrayContaining(["h1", "form", "slug-unique"]),
    );
  });
  it("allows a page with no proof or badges (those sections are left off)", () => {
    const empty = { liveCounts: { results: 0, testimonials: 0, creatives: 0, concept: 0 }, liveBadgeIds: [] };
    expect(codes(ready(), ctx(empty))).toEqual([]);
  });
  it("blocks [NEEDS DATA] and switched-off badges", () => {
    const page = ready();
    for (const s of page.sections) {
      if (s.type === "painPoints") s.props.items[0].text = "We grew sales by [NEEDS DATA].";
      if (s.type === "badges") s.props.badgeIds = ["11111111-1111-4111-8111-111111111111"];
    }
    expect(codes(page)).toEqual(expect.arrayContaining(["missing-facts", "badges"]));
  });
  it("rejects content that doesn't match the schemas", () => {
    expect(codes({ meta: {}, sections: [] })).toContain("content-invalid");
  });
});
