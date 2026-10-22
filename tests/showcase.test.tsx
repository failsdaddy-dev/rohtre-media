import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClientShowcase, ProductShowcase } from "../src/components/home/growth-sections";
import { Hero } from "../src/components/home/hero";
import { Faq } from "../src/components/home/sections";
import { MediaSlot } from "../src/components/media/media-slot";
import { DEFAULT_HOME, parseHome } from "../src/content/home-schema";
import { emptySlot } from "../src/content/media-slot";
import { COUNT_UP_MS, countText, edgeState, easeOut, keyStep, metricText, wrapIndex } from "../src/lib/count-up";
import { blankFor } from "../src/components/admin/schema-form";
import { homeBlockers } from "../src/lib/home-blockers";
import { homeJsonSchemas } from "../src/lib/json-schemas";

const m = (value: number, decimals: number, suffix: string, prefix = "") => ({ value, decimals, prefix, suffix });
const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("count-up numbers", () => {
  it("ends on exactly the stored text", () => {
    expect(metricText(m(1.5, 1, "X"))).toBe("1.5X");
    expect(metricText(m(28, 0, "X"))).toBe("28X");
    expect(metricText(m(49, 0, "M+"))).toBe("49M+");
    expect(metricText(m(17, 0, "%"))).toBe("17%");
    for (const metric of [m(1.5, 1, "X"), m(3.1, 1, "%"), m(1200, 0, "", "$")]) {
      expect(countText(metric, 1)).toBe(metricText(metric));
      expect(countText(metric, 1.4)).toBe(metricText(metric));
    }
  });

  it("starts at zero with the same decimals, prefix and suffix, and only climbs", () => {
    expect(countText(m(1.5, 1, "X"), 0)).toBe("0.0X");
    expect(countText(m(250, 0, "k", "$"), 0)).toBe("$0k");
    expect(countText(m(2.75, 2, "%"), -1)).toBe("0.00%");
    let last = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = parseFloat(countText(m(49, 0, "M+"), t));
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    expect(easeOut(0.5)).toBeGreaterThan(0.5); // ease-out: fast start, slow finish
    expect(COUNT_UP_MS).toBe(1400);
  });

  it("server-renders the final value (what reduced motion keeps), labelled and width-reserved", () => {
    const out = html(<ClientShowcase s={DEFAULT_HOME.showcase} />);
    expect(out).toContain('aria-label="1.5X"');
    expect(out).toMatch(/data-count="1.5" data-decimals="1" data-prefix="" data-suffix="X"[^>]*>1.5X</);
    expect(out).toMatch(/<span class="invisible">49M\+<\/span>/);
    expect(out).toContain("tabular-nums");
  });
});

describe("client showcase slider", () => {
  it("wraps around and maps the arrow keys", () => {
    expect(wrapIndex(-1, 2)).toBe(1);
    expect(wrapIndex(2, 2)).toBe(0);
    expect(wrapIndex(5, 3)).toBe(2);
    expect(keyStep("ArrowLeft")).toBe(-1);
    expect(keyStep("ArrowRight")).toBe(1);
    expect(keyStep("Enter")).toBe(0);
  });

  it("is a labelled carousel with arrows and a live slide count", () => {
    const out = html(<ClientShowcase s={DEFAULT_HOME.showcase} />);
    expect(out).toContain('role="region"');
    expect(out).toContain('aria-roledescription="carousel"');
    expect(out).toContain('aria-label="Previous slide"');
    expect(out).toContain('aria-label="Next slide"');
    expect(out).toMatch(/aria-live="polite"[^>]*>Slide 1 of 2</);
    expect(out).toContain("Rama Chikan");
    expect(out).toContain("Harmiche");
    expect(out).not.toContain('<button type="button" autoplay');
  });

  it("hides the arrows with a single slide", () => {
    const one = { ...DEFAULT_HOME.showcase, slides: DEFAULT_HOME.showcase.slides.slice(0, 1) };
    const out = html(<ClientShowcase s={one} />);
    expect(out).not.toContain("Previous slide");
    expect(out).not.toContain("Slide 1 of 1");
  });

  it("uses the live page's numbers, spelled correctly, with empty posters", () => {
    const [rama, harmiche] = DEFAULT_HOME.showcase.slides;
    const texts = (s: typeof rama) => s.metrics.map((x) => metricText({ ...x, value: x.value ?? NaN }));
    expect(texts(rama)).toEqual(["1.5X", "28X", "12X", "49M+", "17%", "20%"]);
    expect(texts(harmiche)).toEqual(["2.6X", "3.2X", "2.8X", "5.4M+", "3.1%", "1.7%"]);
    expect(rama.metrics.map((x) => x.label)).toContain("Impressions");
    expect(DEFAULT_HOME.showcase.slides.every((s) => s.poster.publicId === null && s.poster.aspect === "1:1")).toBe(
      true,
    );
    expect(rama.currency).toBe("₹");
  });

  it("admin: a new slide starts with six empty numbers, and the poster offers only 1:1, 4:5, 16:10", () => {
    const slides = homeJsonSchemas().showcase.properties?.slides;
    const blank = blankFor(slides!.items!) as (typeof DEFAULT_HOME.showcase.slides)[number];
    expect(blank.brand).toBe("");
    expect(blank.metrics).toHaveLength(6);
    expect(blank.metrics.every((x) => x.value === null)).toBe(true);
    expect(slides?.items?.properties?.poster?.properties?.aspect?.enum).toEqual(["1:1", "4:5", "16:10"]);
  });

  it("shows a switched-off or empty number nowhere", () => {
    const s = structuredClone(DEFAULT_HOME.showcase);
    s.slides[0].metrics[0].enabled = false;
    s.slides[0].metrics[1].value = null;
    const out = html(<ClientShowcase s={s} />);
    expect(out).not.toContain('aria-label="1.5X"');
    expect(out).not.toContain('aria-label="28X"');
    expect(out).toContain('aria-label="12X"');
  });
});

describe("product slider", () => {
  it("shows only the arrows that can move", () => {
    expect(edgeState(0, 2000, 1000)).toEqual({ atStart: true, atEnd: false });
    expect(edgeState(500, 2000, 1000)).toEqual({ atStart: false, atEnd: false });
    expect(edgeState(1000, 2000, 1000)).toEqual({ atStart: false, atEnd: true });
    expect(edgeState(0, 900, 1000)).toEqual({ atStart: true, atEnd: true }); // everything fits: no arrows
  });

  it("starts with a Next button only, and the mockups as 9:16 images with alt text, no ratings", () => {
    const out = html(<ProductShowcase s={DEFAULT_HOME.products} />);
    expect(out).toContain('aria-label="Next products"');
    expect(out).not.toContain("Previous products");
    expect(out).toContain('alt="Product placeholder image"');
    expect(out).toContain("rohtre-media/images/products/grow");
    expect(out).toContain(`aspect-ratio:${9 / 16}`);
    expect(out).not.toMatch(/4\.[6-9]/);
  });
});

describe("FAQ", () => {
  it("never shows approval pills, and every closed card has the same size in one aligned grid", () => {
    const out = html(<Faq s={DEFAULT_HOME.faq} />);
    expect(out).not.toMatch(/approval|draft/i);
    expect(out).toContain("grid gap-5 md:grid-cols-2 md:items-start");
    const cards = out.match(/<details class="[^"]*"/g) ?? [];
    const summaries = out.match(/<summary class="[^"]*"/g) ?? [];
    expect(cards).toHaveLength(6);
    expect(new Set(cards).size).toBe(1);
    expect(new Set(summaries).size).toBe(1);
    expect(summaries[0]).toContain("h-24");
  });

  it("keeps approval as data, upgrades old saved answers, and lists unapproved ones as blockers", () => {
    expect(DEFAULT_HOME.faq.items.every((f) => f.approved === false)).toBe(true);
    const old = {
      ...DEFAULT_HOME.faq,
      items: [
        { q: "A?", a: "Yes.", status: "ready" },
        { q: "B?", a: "No.", status: "draft" },
      ],
    };
    const faq = parseHome({ faq: old }).faq;
    expect(faq.items.map((f) => f.approved)).toEqual([true, false]);
    const list = homeBlockers({ ...DEFAULT_HOME, faq }).filter((b) => b.section === "FAQ");
    expect(list).toEqual([{ section: "FAQ", where: "question 2", message: "Not approved: “B?”" }]);
  });
});

describe("hero", () => {
  it("composition: same headline, the line, a 16:9 video slot with caption, the button and the illustration", () => {
    const out = html(<Hero hero={DEFAULT_HOME.hero} whatsappHref={null} />);
    expect(out).toContain("We make brands");
    expect(out).toContain("unstoppable.");
    expect(out).toContain("Shopify Development");
    expect(out).toContain("Performance Marketing");
    expect(out).toContain(`aspect-ratio:${16 / 9}`);
    expect(out).toContain("Watch how we help brands grow");
    expect(out).toContain("Book a free strategic call with our experts");
    expect(out).toContain("rm-magnet");
    expect(out).toContain("/brand/platforms/shopify-bag.svg");
    expect(out).not.toContain("rohtremedia.com");
  });

  it("slider mode keeps the earlier layout and its two slides", () => {
    const out = html(<Hero hero={{ ...DEFAULT_HOME.hero, mode: "slider" }} whatsappHref={null} />);
    expect(out).toContain('aria-label="Featured"');
    expect(out).not.toContain("rm-magnet");
  });

  it("media visual: an uploaded transparent image is shown whole, with no frame or background", () => {
    const slot = { ...emptySlot("1:1"), publicId: "rohtre-media/images/cutout", format: "png", alt: "Magnet" };
    const out = html(<MediaSlot slot={slot} sizes="50vw" fit="contain" />);
    expect(out).toContain("object-contain");
    expect(out).not.toContain("object-cover");
    expect(out).not.toMatch(/class="relative w-full overflow-hidden[^"]*bg-/);
    expect(out).toContain("f_auto"); // keeps the alpha channel (WebP/AVIF)
  });

  it("only the chosen layout's slots count as blockers", () => {
    const where = (hero: typeof DEFAULT_HOME.hero) =>
      homeBlockers({ ...DEFAULT_HOME, hero })
        .filter((b) => b.section === "Hero & slides")
        .map((b) => b.where);
    expect(where(DEFAULT_HOME.hero)).toEqual(["video"]);
    expect(where({ ...DEFAULT_HOME.hero, visual: "media" })).toEqual(["video", "visual media"]);
    expect(where({ ...DEFAULT_HOME.hero, mode: "slider" })).toHaveLength(4);
  });
});
