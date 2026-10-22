import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { groupOf, SECTIONS } from "../src/app/admin/home/home-editor";
import { blankFor, itemTitle } from "../src/components/admin/schema-form";
import { CtaDecor, CTA_OBJECTS } from "../src/components/home/cta-decor";
import { ClientShowcase, ScrollEngage, VideoAds } from "../src/components/home/growth-sections";
import { BadgeBar, BadgeLogo } from "../src/components/home/sections";
import { MediaSlot, PhoneFrame } from "../src/components/media/media-slot";
import { CtaPanel } from "../src/components/page-parts";
import { DEFAULT_HOME, homeSchema, parseHome, upgradePhoneSlot, type HomeContent } from "../src/content/home-schema";
import {
  badgeLayout,
  badgeRows,
  CTA_DECOR,
  FRAME_SCALE,
  FRAME_SIZES,
  PHONE_FRAME,
  phoneFrameRatio,
  phoneHeight,
  VIDEO_AD_FRAME,
  videoAdHeight,
} from "../src/content/layout-presets";
import { ASPECTS, emptyPhone, emptySlot, PHONE_ASPECTS } from "../src/content/media-slot";
import { homeJsonSchemas } from "../src/lib/json-schemas";
import { lerp, parallaxAllowed, pointerOffset } from "../src/lib/parallax";
import type { Badge } from "../src/lib/home-data";
import { PROOF_TABLES } from "../src/lib/proof-schemas";

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

// next/image needs the app's Cloudinary loader config; a plain <img> is enough to read the classes.
vi.mock("next/image", () => ({
  default: (p: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stand-in for next/image
    <img src={p.src} alt={p.alt} className={p.className} />
  ),
}));

// ------------------------------------------------------------ partner strip
const badge = (i: number, extra: Partial<Badge> = {}): Badge => ({
  id: `b${i}`,
  label: `Badge ${i}`,
  sublabel: null,
  image_public_id: `rohtre-media/images/badges/b${i}`,
  proof_url: null,
  enabled: true,
  notes: null,
  ...extra,
});

describe("partner strip layout by count", () => {
  it("picks the group and logo height from the number of shown badges", () => {
    expect([1, 3, 4, 5, 7, 9].map((n) => [n, badgeLayout(n).group, badgeLayout(n).logoPx])).toEqual([
      [1, "few", 88],
      [3, "few", 88],
      [4, "four", 80],
      [5, "mid", 68],
      [7, "many", 56],
      [9, "many", 56],
    ]);
    expect(badgeLayout(6).mobileLogoPx).toBe(44);
  });

  it("re-flows into balanced rows at each width (no sideways scroll)", () => {
    expect(badgeRows(3, 1920)).toEqual([3]);
    expect(badgeRows(4, 1024)).toEqual([4]);
    expect(badgeRows(5, 1280)).toEqual([5]);
    expect(badgeRows(5, 1024)).toEqual([3, 2]);
    expect(badgeRows(6, 1024)).toEqual([3, 3]);
    expect(badgeRows(7, 1920)).toEqual([4, 3]);
    expect(badgeRows(9, 1440)).toEqual([4, 4, 1]);
    expect(badgeRows(5, 390)).toEqual([2, 2, 1]);
  });

  it("renders the red band with the count, the sizes and only shown badges", () => {
    const list = [1, 2, 3, 4, 5].map((i) => badge(i)).concat(badge(6, { enabled: false }));
    const out = html(<BadgeBar s={DEFAULT_HOME.badges} badges={list} />);
    expect(out).toContain("bg-brand text-brand-fg");
    expect(out).toContain('data-group="mid"');
    expect(out).toContain('data-count="5"');
    expect(out).toContain("--logo-h-lg:68px");
    expect(out).toContain("--logo-h-sm:44px");
    expect(out).not.toContain("Badge 6");
    expect(out).not.toContain("rm-white-art"); // the old black-on-light inversion is gone
  });

  it("draws each logo style: white silhouette, white plate, or as uploaded (white is the default)", () => {
    expect(html(<BadgeLogo badge={badge(1)} />)).toContain("rm-logo-white");
    expect(html(<BadgeLogo badge={badge(1, { logo_style: "white" })} />)).toContain("rm-logo-white");
    const plate = html(<BadgeLogo badge={badge(1, { logo_style: "plate" })} />);
    expect(plate).toContain("rm-logo-plate");
    expect(plate).not.toContain("rm-logo-white");
    const original = html(<BadgeLogo badge={badge(1, { logo_style: "original" })} />);
    expect(original).not.toMatch(/rm-logo-(white|plate)/);
    expect(html(<BadgeLogo badge={badge(1, { image_public_id: null, label: "2 Billion+ " })} />)).toContain(
      "2 Billion+<",
    );
  });

  it("the admin badge form has Logo style (white, plate, original; default white)", () => {
    const s = PROOF_TABLES.badges.schema;
    expect(s.shape.logo_style.unwrap().options).toEqual(["white", "plate", "original"]);
    expect(s.parse({ ...badge(1), sort: 1, last_verified_at: null }).logo_style).toBe("white");
  });
});

// -------------------------------------------------------------- frame sizes
/** Evaluate min(clamp(min, vh, max) × scale, cap) for a viewport height in px. */
const height = (f: { minPx: number; vh: number; maxPx: number }, scale: number, vh: number, cap: number) =>
  Math.min(Math.min(Math.max(f.minPx, (f.vh / 100) * vh), f.maxPx) * scale, cap);
// Visible viewport heights (browser bars removed) of a maximised 1920×1080 and 1366×768 window.
const VIEWPORTS = [
  { name: "1920×1080", h: 950 },
  { name: "1366×768", h: 657 },
];

describe("phone and Video Ads frame sizes", () => {
  it("has four sizes with the agreed scales, medium by default", () => {
    expect(FRAME_SIZES).toEqual(["small", "medium", "large", "xl"]);
    expect(Object.values(FRAME_SCALE)).toEqual([0.8, 1, 1.15, 1.3]);
    expect(DEFAULT_HOME.engage.size).toBe("medium");
    expect(DEFAULT_HOME.videoAds.size).toBe("medium");
  });

  it("writes the CSS height with the viewport cap, in vh and svh", () => {
    expect(phoneHeight("medium").svh).toBe("min(calc(clamp(460px, 76svh, 820px) * 1), 92svh)");
    expect(phoneHeight("xl").vh).toBe("min(calc(clamp(460px, 76vh, 820px) * 1.3), 92vh)");
    expect(videoAdHeight("small").svh).toBe("min(calc(clamp(380px, 68svh, 720px) * 0.8), calc(100svh - 150px))");
  });

  for (const v of VIEWPORTS) {
    for (const size of FRAME_SIZES) {
      it(`${v.name}, ${size}: the phone and the whole Video Ads card fit the visible height`, () => {
        const phone = height(PHONE_FRAME, FRAME_SCALE[size], v.h, (PHONE_FRAME.capVh / 100) * v.h);
        expect(phone).toBeLessThanOrEqual(v.h);
        const frame = height(VIDEO_AD_FRAME, FRAME_SCALE[size], v.h, v.h - VIDEO_AD_FRAME.titleRoomPx);
        const card = frame + 12 + 60; // padding + centred title (two lines at most)
        expect(card).toBeLessThanOrEqual(v.h);
      });
    }
  }

  it("draws a real-proportion phone (9:19.5 screen, 2.5% bezel) far narrower than a tablet", () => {
    const r = phoneFrameRatio(ASPECTS["9:19.5"]);
    expect(r).toBeCloseTo(0.4743, 3); // frame width ÷ height
    expect(r).toBeLessThan(0.5);
    // At medium on 1920×1080 the phone is about 722 tall and 342 wide.
    expect(Math.round(722 * r)).toBe(342);
  });

  it("phones: 1 centred, 2-3 side by side (staggered), 4+ a sideways row with arrows", () => {
    const one = html(<ScrollEngage s={{ ...DEFAULT_HOME.engage, phones: [emptyPhone()] }} />);
    expect(one).toContain('data-count="1"');
    expect(one).not.toContain("rm-phone-up");
    const three = html(
      <ScrollEngage s={{ ...DEFAULT_HOME.engage, phones: [emptyPhone(), emptyPhone(), emptyPhone()] }} />,
    );
    expect(three.match(/class="rm-phone /g)).toHaveLength(3);
    expect(three.match(/rm-phone-up/g)).toHaveLength(2);
    expect(three).toContain("--n:3");
    const four = html(
      <ScrollEngage s={{ ...DEFAULT_HOME.engage, phones: Array.from({ length: 4 }, () => emptyPhone()) }} />,
    );
    expect(four).toContain('aria-label="Next phone videos"');
    expect(four.match(/class="rm-phone /g)).toHaveLength(4);
  });

  it("the admin size reaches the page as the section's height", () => {
    const out = html(<ScrollEngage s={{ ...DEFAULT_HOME.engage, size: "xl" }} />);
    expect(out).toContain("--phone-h-svh:min(calc(clamp(460px, 76svh, 820px) * 1.3), 92svh)");
    const ads = html(<VideoAds s={{ ...DEFAULT_HOME.videoAds, size: "small" }} />);
    expect(ads).toContain("* 0.8), calc(100svh - 150px))");
  });

  it("the phone frame keeps the chosen screen shape (it used to force 9:16)", () => {
    for (const a of PHONE_ASPECTS) {
      const out = html(<PhoneFrame slot={emptyPhone(a)} sizes="300px" />);
      expect(out).toContain(`data-aspect="${a}"`);
      expect(out).toContain(`aspect-ratio:${ASPECTS[a]}`);
    }
  });

  it("Video Ads cards follow their own shape and line up at the top", () => {
    const items = DEFAULT_HOME.videoAds.items.map((it, i) => ({
      ...it,
      media: emptyPhone(i === 0 ? "9:16" : "9:19.5"),
    }));
    const out = html(<VideoAds s={{ ...DEFAULT_HOME.videoAds, items }} />);
    expect(out).toContain(`--ar:${9 / 16}`);
    expect(out).toContain(`--ar:${9 / 19.5}`);
    expect(out).toContain("items-start");
    expect(out).not.toContain("h-full");
  });
});

// ------------------------------------------------- phone shapes and Fill/Fit
describe("phone shapes", () => {
  it("offers phone shapes only, 9:19.5 first, with Fill as the default", () => {
    const schemas = homeJsonSchemas();
    const phone = schemas.engage.properties!.phones.items!;
    expect(phone.properties!.aspect.enum).toEqual(["9:19.5", "9:16", "9:18"]);
    const blank = blankFor(phone) as { aspect: string; fit: string };
    expect(blank.aspect).toBe("9:19.5"); // "+ Add" used to give 16:9
    expect(blank.fit).toBe("fill");
    expect(schemas.videoAds.properties!.items.items!.properties!.media.properties!.aspect.enum).toEqual([
      "9:19.5",
      "9:16",
      "9:18",
    ]);
  });

  it("upgrades saved phones: a non-phone shape and empty old-default 9:16 become 9:19.5", () => {
    const saved = {
      engage: {
        ...DEFAULT_HOME.engage,
        size: undefined,
        phones: [
          { ...emptySlot("9:16", "video") },
          { ...emptySlot("9:16", "video"), publicId: "rohtre-media/videos/kept", format: "mp4" },
          { ...emptySlot("16:9") },
        ],
      },
    };
    delete (saved.engage as { size?: unknown }).size;
    const phones = parseHome(saved).engage.phones;
    expect(phones.map((p) => p.aspect)).toEqual(["9:19.5", "9:16", "9:19.5"]);
    expect(phones.every((p) => p.fit === "fill")).toBe(true);
  });

  it("once saved with a size, a 9:16 chosen in the admin stays 9:16", () => {
    const saved = { engage: { ...DEFAULT_HOME.engage, phones: [emptyPhone("9:16")] } };
    expect(parseHome(saved).engage.phones[0].aspect).toBe("9:16");
    expect(upgradePhoneSlot(emptySlot("16:9"), false)).toMatchObject({ aspect: "9:19.5" });
  });

  it("Fit shows the whole file on black; Fill crops to the screen", () => {
    const filled = {
      ...emptyPhone(),
      publicId: "rohtre-media/images/x",
      format: "png",
      alt: "x",
      type: "image" as const,
    };
    expect(html(<MediaSlot slot={filled} sizes="300px" />)).toContain("object-cover");
    const fit = html(<MediaSlot slot={{ ...filled, fit: "fit" }} sizes="300px" />);
    expect(fit).toContain("object-contain");
    expect(fit).toContain("bg-black");
  });

  it("the placeholder names the real shape and the upload size", () => {
    expect(html(<MediaSlot slot={emptyPhone()} sizes="300px" />)).toContain("Placeholder · 9:19.5 (1080×2340)");
  });
});

// ----------------------------------------------------------------- CTA card
describe("CTA card objects", () => {
  it("has 16 objects in total (6 basic accents + 10 new), all decorative", () => {
    expect(CTA_OBJECTS).toHaveLength(10);
    const out = html(<CtaPanel decor={<CtaDecor />} />);
    expect(out.match(/rm-px/g)).toHaveLength(5 + CTA_OBJECTS.length); // 5 accents drift; the corner one is fixed
    expect(6 + CTA_OBJECTS.length).toBe(CTA_DECOR.objects);
    expect(out).toContain("data-cta-card");
    expect(out.match(/aria-hidden="true" class="pointer-events-none/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps objects in the text's safe zone at 0.25 opacity or less, with 6-12 s floats", () => {
    const out = html(<CtaDecor />);
    for (const o of CTA_OBJECTS.filter((x) => x.safe)) expect(o.opacity ?? 1).toBeGreaterThan(0);
    const opacities = [...out.matchAll(/opacity:([\d.]+)/g)].map((m) => Number(m[1]));
    expect(opacities.filter((x) => x <= CTA_DECOR.safeOpacity)).toHaveLength(CTA_OBJECTS.filter((x) => x.safe).length);
    for (const o of CTA_OBJECTS) {
      expect(o.float[0]).toBeGreaterThanOrEqual(6);
      expect(o.float[0]).toBeLessThanOrEqual(12);
    }
  });

  it("drift is off for reduced motion and for touch (coarse) pointers", () => {
    expect(parallaxAllowed(false, false)).toBe(true);
    expect(parallaxAllowed(true, false)).toBe(false);
    expect(parallaxAllowed(false, true)).toBe(false);
    expect(parallaxAllowed(true, true)).toBe(false);
  });

  it("eases towards the pointer (lerp 0.08) within -1..1, and the depths travel 24/14/8 px", () => {
    expect(CTA_DECOR.lerp).toBe(0.08);
    expect(lerp(0, 1, CTA_DECOR.lerp)).toBeCloseTo(0.08);
    expect(pointerOffset(150, 50, { left: 100, top: 0, width: 100, height: 100 })).toEqual({ x: 0, y: 0 });
    expect(pointerOffset(500, -20, { left: 100, top: 0, width: 100, height: 100 })).toEqual({ x: 1, y: -1 });
    expect(CTA_DECOR.travel).toEqual({ near: 24, mid: 14, far: 8 });
  });

  it("the home card has the admin switch, on by default; other pages' CTA panels are unchanged", () => {
    expect(DEFAULT_HOME.finalCta.animated).toBe(true);
    expect(parseHome({ finalCta: { ...DEFAULT_HOME.finalCta, animated: undefined } }).finalCta.animated).toBe(true);
    expect(html(<CtaPanel />)).not.toContain("rm-idle");
  });
});

// --------------------------------------------------------------- admin
describe("admin home editor", () => {
  it("lists every section once, in the site's order", () => {
    expect(SECTIONS.map((s) => s.key)).toEqual([
      "hero",
      "badges",
      "whoWeServe",
      "products",
      "engage",
      "videoAds",
      "results",
      "showcase",
      "process",
      "brands",
      "testimonials",
      "founder",
      "faq",
      "finalCta",
    ]);
    expect(new Set(SECTIONS.map((s) => s.key))).toEqual(new Set(Object.keys(homeSchema.shape)));
  });

  it("groups fields into Words, Pictures & videos, Button and Advanced", () => {
    const schemas = homeJsonSchemas();
    const g = (k: keyof HomeContent, f: string) => groupOf(k, f, schemas[k].properties?.[f], DEFAULT_HOME[k]);
    expect(g("engage", "title")).toBe("words");
    expect(g("engage", "phones")).toBe("media");
    expect(g("engage", "size")).toBe("media");
    expect(g("engage", "cta")).toBe("button");
    expect(g("testimonials", "variant")).toBe("advanced");
    expect(g("hero", "slides")).toBe("advanced"); // composition layout: slider-only fields move away
    expect(groupOf("hero", "video", schemas.hero.properties?.video, { ...DEFAULT_HOME.hero, mode: "slider" })).toBe(
      "advanced",
    );
    expect(g("finalCta", "animated")).toBe("media");
  });

  it("names list rows briefly", () => {
    expect(itemTitle(emptyPhone(), "phone", 2)).toBe("Phone 3 · video · modern phone · empty");
    expect(itemTitle({ q: "How much?", a: "…" }, "question", 0)).toBe("Question 1 · How much?");
    expect(itemTitle({}, "card", 1)).toBe("Card 2");
  });
});

// --------------------------------------------------- save + revalidation
const updateTag = vi.fn();
vi.mock("next/cache", () => ({ updateTag: (t: string) => updateTag(t), cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/auth", () => ({ requireStaff: async () => ({ userId: "u1", role: "owner", email: "a@b.c" }) }));
vi.mock("../src/lib/audit", () => ({ audit: vi.fn() }));
vi.mock("../src/lib/media.server", () => ({ cleanupAfterEdit: async () => [] }));
const stored: { data: unknown } = { data: null };
vi.mock("../src/lib/supabase/server", () => ({
  supabaseServer: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: stored.data ? { data: stored.data } : null }) }),
      }),
      upsert: async (row: { data: unknown }) => {
        stored.data = JSON.parse(JSON.stringify(row.data));
        return { error: null };
      },
    }),
  }),
}));

describe("saving the home page", () => {
  beforeEach(() => {
    updateTag.mockClear();
    stored.data = null;
  });

  it("every section survives a save and a reload unchanged", async () => {
    const { saveHome } = await import("../src/app/admin/home/actions");
    expect(await saveHome(DEFAULT_HOME)).toEqual({ ok: true });
    const back = parseHome(stored.data);
    for (const key of Object.keys(homeSchema.shape) as (keyof HomeContent)[]) {
      expect(back[key], key).toEqual(DEFAULT_HOME[key]);
    }
  });

  it("the new size controls and Fit are stored, and the home page cache is refreshed", async () => {
    const { saveHome } = await import("../src/app/admin/home/actions");
    const { HOME_TAG } = await import("../src/lib/home-data");
    const edited: HomeContent = {
      ...DEFAULT_HOME,
      engage: { ...DEFAULT_HOME.engage, size: "xl", phones: [{ ...emptyPhone("9:18"), fit: "fit" }] },
      videoAds: { ...DEFAULT_HOME.videoAds, size: "small" },
      finalCta: { ...DEFAULT_HOME.finalCta, animated: false },
    };
    expect(await saveHome(edited)).toEqual({ ok: true });
    expect(updateTag).toHaveBeenCalledWith(HOME_TAG);
    const back = parseHome(stored.data);
    expect(back.engage.size).toBe("xl");
    expect(back.engage.phones[0]).toMatchObject({ aspect: "9:18", fit: "fit" });
    expect(back.videoAds.size).toBe("small");
    expect(back.finalCta.animated).toBe(false);
  });
});

// ------------------------------------------------ client showcase, 3 slides
describe("client showcase with a third slide", () => {
  it("shows all three with arrows and 'Slide 1 of 3'; the new slide's numbers count up", () => {
    const third = { ...structuredClone(DEFAULT_HOME.showcase.slides[0]), brand: "New Brand" };
    third.metrics[0] = { ...third.metrics[0], value: 4.2, decimals: 1 };
    const s = { ...DEFAULT_HOME.showcase, slides: [...DEFAULT_HOME.showcase.slides, third] };
    const out = html(<ClientShowcase s={s} />);
    expect(out).toMatch(/aria-live="polite"[^>]*>Slide 1 of 3</);
    expect(out).toContain("New Brand");
    expect(out).toContain('data-count="4.2"');
    expect(out).toContain('aria-label="Next slide"');
    const two = html(<ClientShowcase s={{ ...s, slides: s.slides.slice(0, 2) }} />);
    expect(two).toMatch(/>Slide 1 of 2</);
  });

  it("a slide added in the admin starts empty and saves", () => {
    const item = homeJsonSchemas().showcase.properties!.slides.items!;
    const blank = blankFor(item);
    const s = { ...DEFAULT_HOME.showcase, slides: [...DEFAULT_HOME.showcase.slides, blank] };
    expect(homeSchema.shape.showcase.safeParse(s).success).toBe(true);
  });
});
