import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DimensionValue } from "../src/lib/dimensions";
import { DEFAULT_SETTINGS } from "../src/lib/settings-schema";
import { masterTemplate } from "../src/sections/master-template";
import { LandingSections, type RenderContext } from "../src/sections/render";

// Renders a landing page built from the master template, the way /lp/[slug]
// does, without a browser. Proof lists are empty, as on a fresh page.

const dv = (type_key: string, slug: string, label: string, attrs: Record<string, unknown> = {}): DimensionValue => ({
  id: slug,
  type_key,
  parent_id: null,
  slug,
  label,
  headline_label: label,
  attrs,
});
const dims = {
  service: dv("service", "meta-ads", "Meta Ads", { channels: ["meta"] }),
  niche: dv("niche", "fashion", "Fashion"),
  country: dv("country", "usa", "the USA"),
};
const ctx: RenderContext = {
  proof: { results: [], testimonials: [], creatives: [], concept: [] },
  badges: [],
  settings: DEFAULT_SETTINGS,
  whatsappHref: "https://wa.me/919695747475?text=Hi",
};
const html = renderToStaticMarkup(<LandingSections sections={masterTemplate(dims).sections} ctx={ctx} />);

describe("landing page render", () => {
  it("has exactly one H1, the generated headline", () => {
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Meta Ads for Fashion Brands in the USA</h1>");
  });

  it("includes the one enquiry form, which the hero CTA points to", () => {
    expect(html.match(/id="enquiry"/g)).toHaveLength(1);
    expect(html).toContain('href="#enquiry"');
    expect(html).toContain('type="submit"');
  });

  it("renders enabled sections in template order and skips switched-off ones", () => {
    const order = [...html.matchAll(/data-section="([a-zA-Z]+)"/g)].map((m) => m[1]);
    expect(order[0]).toBe("hero");
    expect(order.at(-1)).toBe("form");
    expect(order).not.toContain("process"); // off by default (R15)
  });

  it("starts with a dark hero (white header text) and shows no prices", () => {
    expect(html).toMatch(/class="rm-dark rm-hero-dark/);
    expect(html.toLowerCase()).not.toMatch(/price|package|what’s included|what's included/);
  });
});
