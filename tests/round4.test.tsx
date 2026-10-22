import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shapeOptions } from "../src/components/admin/media-slot-field";
import { VideoAds } from "../src/components/home/growth-sections";
import { Hero } from "../src/components/home/hero";
import { Founder } from "../src/components/home/sections";
import { MonitorFrame } from "../src/components/media/media-slot";
import { SiteFooter } from "../src/components/site-footer";
import { DEFAULT_HOME, homeSchema, parseHome, videoAdsStage, type HomeContent } from "../src/content/home-schema";
import {
  FRAME_SIZES,
  HERO_VIDEO,
  MONITOR_FRAME,
  monitorFrameRatio,
  phoneFrameRatio,
  SHOW_MONITOR_STAND,
  stageLayout,
  VIDEO_STAGE,
} from "../src/content/layout-presets";
import {
  ASPECT_UPLOAD,
  ASPECTS,
  emptyLandscape,
  emptyPhone,
  LANDSCAPE_ASPECTS,
  PHONE_ASPECTS,
  SHAPE_FAMILIES,
  type Aspect,
} from "../src/content/media-slot";
import { homeBlockers } from "../src/lib/home-blockers";
import { homeJsonSchemas } from "../src/lib/json-schemas";
import { callbacksToText, phonesToText, settingsFromForm } from "../src/lib/settings-form";
import { DEFAULT_SETTINGS, parseSettings, type SiteSettings } from "../src/lib/settings-schema";
import {
  footerSocials,
  safeSocialUrl,
  SOCIAL_NETWORKS,
  socialHostWarning,
  socialUrlError,
  type SocialLink,
} from "../src/lib/social-links";

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

// next/image needs the app's Cloudinary loader config; a plain <img> is enough here.
vi.mock("next/image", () => ({
  default: (p: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test stand-in for next/image
    <img src={p.src} alt={p.alt} className={p.className} />
  ),
}));
const css = readFileSync("src/app/design.css", "utf8");
const pid = "rohtre-media/videos/home/clip";

/** Visible page area (CSS px) for common browser windows at 100% zoom (tabs + address bar). */
const VIEWPORTS = [
  { name: "1920×1080", w: 1920, h: 950 },
  { name: "1366×768", w: 1366, h: 657 },
];
const HEADER = 72;

// ------------------------------------------------------------- shape registry
describe("shape registry", () => {
  it("has the phone, landscape and square/portrait families, each shape once, with upload sizes", () => {
    expect(SHAPE_FAMILIES.map((f) => f.key)).toEqual(["phone", "landscape", "other"]);
    expect(PHONE_ASPECTS).toEqual(["9:19.5", "9:16", "9:18"]);
    expect(LANDSCAPE_ASPECTS).toEqual(["16:9", "16:10", "4:3", "21:9"]);
    const all = SHAPE_FAMILIES.flatMap((f) => f.aspects as readonly string[]);
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toEqual(Object.keys(ASPECTS).sort());
    expect(ASPECT_UPLOAD["4:3"]).toBe("1440×1080");
    expect(ASPECT_UPLOAD["21:9"]).toBe("2520×1080");
  });

  it("each media field accepts its families (others untouched)", () => {
    const s = homeJsonSchemas();
    const shapes = (x: { properties?: Record<string, { enum?: unknown[] }> }) => x.properties!.aspect.enum;
    expect(shapes(s.hero.properties!.video)).toEqual([...LANDSCAPE_ASPECTS]);
    const stage = s.videoAds.properties!.stage.properties!;
    expect(shapes(stage.left)).toEqual([...PHONE_ASPECTS]);
    expect(shapes(stage.centre)).toEqual([...LANDSCAPE_ASPECTS]);
    expect(shapes(stage.right)).toEqual([...PHONE_ASPECTS]);
    expect(shapes(s.hero.properties!.visualMedia)).toEqual(["1:1", "4:5", "16:10", "16:9"]);
    expect(shapes(s.products.properties!.items.items!.properties!.media)).toEqual(["9:16", "3:4", "4:5"]);
    // Every landscape slot has Fill (default) / Fit.
    expect(s.hero.properties!.video.properties!.fit.default).toBe("fill");
    expect(stage.centre.properties!.fit.default).toBe("fill");
  });

  it("the Shape list shows family headings, the ratio name and the upload size", () => {
    const opts = shapeOptions([...LANDSCAPE_ASPECTS]);
    expect(opts.map((o) => [o.label, o.hint, o.group])).toEqual([
      ["Widescreen 16:9", "1920×1080", "Landscape"],
      ["Desktop 16:10", "1920×1200", "Landscape"],
      ["Classic 4:3", "1440×1080", "Landscape"],
      ["Ultrawide 21:9", "2520×1080", "Landscape"],
    ]);
    expect(shapeOptions(["1:1", "4:5", "16:10", "16:9"]).map((o) => o.group)).toEqual([
      "Landscape",
      "Landscape",
      "Square and portrait",
      "Square and portrait",
    ]);
  });

  it("an older saved hero video (16:9, no fit) still reads, as 16:9 Fill", () => {
    const old = { ...DEFAULT_HOME.hero, video: { ...emptyLandscape(), fit: undefined } };
    const home = parseHome({ hero: old });
    expect(home.hero.video.aspect).toBe("16:9");
    expect(home.hero.video.fit).toBe("fill");
  });
});

// ------------------------------------------------------------- hero video
/** The hero video box from the CSS (.rm-hero-video), in px. */
function heroVideo(w: number, h: number, aspect: Aspect) {
  const ar = ASPECTS[aspect];
  const base = Math.round(HERO_VIDEO.maxPx / ASPECTS["16:9"]);
  const cap =
    w >= 1024
      ? Math.min((HERO_VIDEO.capVh / 100) * h, Math.max(base, h - HERO_VIDEO.roomPx))
      : (HERO_VIDEO.capVh / 100) * h;
  const column = w >= 1280 ? 620 : w >= 1024 ? (Math.min(w, 1440) - 48 - 56) / 2 : w - (w >= 640 ? 48 : 32);
  const width = Math.min(column, HERO_VIDEO.maxPx, cap * ar);
  return { width, height: width / ar };
}

describe("hero video shapes", () => {
  for (const aspect of LANDSCAPE_ASPECTS) {
    it(`${aspect}: fixed ratio from the server (no layout shift) and the title shows the shape`, () => {
      const hero = { ...DEFAULT_HOME.hero, video: emptyLandscape(aspect) };
      const out = html(<Hero hero={hero} whatsappHref={null} />);
      expect(out).toContain(`--ar:${ASPECTS[aspect]}`);
      expect(out).toContain(`aspect-ratio:${ASPECTS[aspect]}`);
      expect(out).toContain(`Placeholder · ${aspect}`);
    });

    for (const v of [...VIEWPORTS, { name: "390×844", w: 390, h: 760 }]) {
      it(`${aspect} at ${v.name}: never taller than today's 16:9 frame side by side, at most 70svh`, () => {
        const box = heroVideo(v.w, v.h, aspect);
        const today = heroVideo(v.w, v.h, "16:9");
        expect(box.width).toBeLessThanOrEqual(HERO_VIDEO.maxPx);
        expect(box.height).toBeLessThanOrEqual(0.7 * v.h + 0.5);
        if (v.w >= 1024) expect(box.height).toBeLessThanOrEqual(Math.max(today.height, v.h - HERO_VIDEO.roomPx) + 0.5);
      });
    }
  }

  it("16:9 keeps today's size (620 × 349 at 1920 and 1366)", () => {
    for (const v of VIEWPORTS) expect(Math.round(heroVideo(v.w, v.h, "16:9").height)).toBe(349);
  });
});

// ------------------------------------------------------------ video ads stage
describe("Video Ads stage", () => {
  const frl = phoneFrameRatio(ASPECTS["9:19.5"]);
  const frm = monitorFrameRatio(ASPECTS["16:9"]);

  it("renders left phone, centre monitor, right phone, then the text, then the icon row", () => {
    const out = html(<VideoAds s={DEFAULT_HOME.videoAds} />);
    const order = ["rm-stage-left", "rm-stage-monitor", "rm-stage-right", "rm-stage-text", "rm-icon-row"].map((c) =>
      out.indexOf(c),
    );
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(out.match(/class="rm-phone /g)).toHaveLength(2);
    expect(out).toContain("Creative that scrolls. Ads that sell.");
    expect(out).toContain("bg-brand"); // the short red rule
    // Old cards are not shown.
    expect(out).not.toContain("rm-ad ");
  });

  it("the phones sit in front of the monitor (z-index) and overlap it by 6% of its width", () => {
    expect(css).toMatch(/\.rm-stage-left,\n\.rm-stage-right \{\n  position: relative;\n  z-index: 2;/);
    expect(css).toMatch(
      /\.rm-stage-monitor \{[^}]*z-index: 1;[^}]*margin-inline: calc\(var\(--wm\) \* var\(--ov\) \* -1\);/,
    );
    expect(VIDEO_STAGE.gap).toBe(0.06);
    expect(VIDEO_STAGE.monitorScale).toBe(2.1);
  });

  it("the monitor matches the phone's look: same body, 1.6% bezel, no stand by default", () => {
    expect(MONITOR_FRAME.bezel).toBe(0.016);
    expect(SHOW_MONITOR_STAND).toBe(false);
    const out = html(<MonitorFrame slot={emptyLandscape("21:9")} sizes="600px" />);
    expect(out).toContain('data-aspect="21:9"');
    expect(out).toContain("--mbz:1.6cqw");
    expect(out).not.toContain("rm-monitor-stand");
    expect(css).toMatch(
      /\.rm-monitor-body \{[^}]*background: #0b0b0b;[^}]*inset 0 0 0 1px rgb\(255 255 255 \/ 0\.15\)/,
    );
  });

  for (const [w, h] of [
    [1920, 950],
    [1366, 657],
    [1024, 680],
    [768, 900],
    [390, 760],
  ]) {
    for (const size of FRAME_SIZES) {
      it(`${w}×${h}, ${size}: inside the container, frames on screen, phones taller than the monitor`, () => {
        const L = stageLayout(w, h, size, frl, frl, frm);
        expect(L.width).toBeLessThanOrEqual(L.container + 0.5); // no sideways overflow
        if (w >= 768) {
          expect(L.phoneH).toBeLessThanOrEqual(0.68 * h + 0.5);
          expect(L.phoneH).toBeGreaterThan(L.monitorH); // monitor centred between taller phones
          expect(L.monitorW / L.phoneW[0]).toBeCloseTo(2.1, 5);
        } else {
          expect(L.monitorW).toBe(L.container); // full width
          expect(L.phoneW[0]).toBeLessThanOrEqual(0.46 * L.container + 0.5);
          expect(L.phoneH).toBeLessThanOrEqual(0.7 * h + 0.5);
        }
      });
    }
  }

  for (const v of VIEWPORTS) {
    it(`${v.name} at 100%: all three frames fit on screen at once (medium)`, () => {
      const L = stageLayout(v.w, v.h, "medium", frl, frl, frm);
      expect(L.phoneH).toBeLessThanOrEqual(v.h - HEADER);
      expect(L.monitorH).toBeLessThanOrEqual(v.h - HEADER);
    });
  }

  it("1280 px and wider: phone height clamp(380px, 62svh, 640px) × size, capped at 68svh", () => {
    expect(stageLayout(1920, 950, "medium", frl, frl, frm).phoneH).toBeCloseTo(589, 0);
    expect(stageLayout(2560, 1300, "xl", frl, frl, frm).phoneH).toBeCloseTo(832, 0); // 640 × 1.3 under 68svh (884)
    expect(stageLayout(1366, 657, "xl", frl, frl, frm).phoneH).toBeCloseTo(0.68 * 657, 0);
  });
});

// --------------------------------------------------------------- icon row
describe("Video Ads icon row", () => {
  const icons = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ title: `Item ${i + 1}`, icon: DEFAULT_HOME.videoAds.icons[i % 4].icon }));

  for (const n of [2, 4, 6]) {
    it(`${n} items: one equal column each from 1024 px (--n), every title in full`, () => {
      const out = html(<VideoAds s={{ ...DEFAULT_HOME.videoAds, icons: icons(n) }} />);
      expect(out).toContain(`--n:${n}`);
      expect(out.match(/class="rm-icon-disc"/g)).toHaveLength(n);
      for (let i = 1; i <= n; i++) expect(out).toContain(`>Item ${i}</span>`);
      expect(out).not.toContain("truncate");
    });
  }

  it("allows 2 to 6 items; seeded with the four titles and their icons, in order", () => {
    const schema = homeSchema.shape.videoAds;
    expect(schema.safeParse({ ...DEFAULT_HOME.videoAds, icons: icons(1) }).success).toBe(false);
    expect(schema.safeParse({ ...DEFAULT_HOME.videoAds, icons: icons(7) }).success).toBe(false);
    expect(DEFAULT_HOME.videoAds.icons).toEqual([
      { title: "Reels & UGC Ads", icon: "reel" },
      { title: "Product Films", icon: "clapper" },
      { title: "Paid Social Creatives", icon: "target" },
      { title: "Performance Storytelling", icon: "growth" },
    ]);
  });

  it("titles are at least 17 px, weight 600; a 2 × 2 grid below 1024 px with dividers", () => {
    const out = html(<VideoAds s={DEFAULT_HOME.videoAds} />);
    expect(out).toContain("text-[17px] font-semibold");
    expect(css).toMatch(/\.rm-icon-row \{\n  display: grid;\n  grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(css).toContain("grid-template-columns: repeat(var(--n), minmax(0, 1fr));");
  });
});

// ------------------------------------------------------- video ads migration
describe("Video Ads migration (old cards → stage)", () => {
  const card = (title: string, filled: boolean) => ({
    title,
    media: { ...emptyPhone(), ...(filled ? { publicId: `${pid}-${title.length}`, format: "mp4" } : {}) },
  });
  const old = (items: unknown[]) => {
    const { stage: _s, icons: _i, ...rest } = DEFAULT_HOME.videoAds;
    void _s;
    void _i;
    return { ...rest, items };
  };

  it("copies up to three filled cards, in order, into Left phone, Centre screen, Right phone", () => {
    const saved = old([card("A", false), card("Bb", true), card("Ccc", true), card("Dddd", true)]);
    expect(videoAdsStage(saved).moved).toEqual([
      "card 2 → Left phone",
      "card 3 → Centre screen",
      "card 4 → Right phone",
    ]);
    const home = parseHome({ videoAds: saved });
    expect(home.videoAds.stage.left.publicId).toBe(`${pid}-2`);
    // A phone video in the centre becomes a 16:9 screen shown whole (Fit), never cropped.
    expect(home.videoAds.stage.centre).toMatchObject({ publicId: `${pid}-3`, aspect: "16:9", fit: "fit" });
    expect(home.videoAds.stage.right.publicId).toBe(`${pid}-4`);
    // Old cards untouched; icon row seeded from their titles.
    expect(home.videoAds.items.map((i) => i.title)).toEqual(["A", "Bb", "Ccc", "Dddd"]);
    expect(home.videoAds.icons.map((i) => i.title)).toEqual(["A", "Bb", "Ccc", "Dddd"]);
  });

  it("with today's data (four empty cards) nothing moves and the four titles seed the icon row", () => {
    const saved = old(DEFAULT_HOME.videoAds.items);
    expect(videoAdsStage(saved).moved).toEqual([]);
    expect(parseHome({ videoAds: saved }).videoAds.icons).toEqual(DEFAULT_HOME.videoAds.icons);
  });

  it("runs once: a section that has a stage is never changed again", () => {
    const first = parseHome({ videoAds: old([card("X", true), card("Yy", true)]) });
    const again = parseHome(JSON.parse(JSON.stringify(first)));
    expect(again.videoAds).toEqual(first.videoAds);
    const edited = { ...first.videoAds, stage: { ...first.videoAds.stage, left: emptyPhone() } };
    expect(parseHome({ videoAds: edited }).videoAds.stage.left.publicId).toBeNull(); // not refilled
    expect(videoAdsStage(edited).add).toEqual({});
  });

  it("launch blockers list the three screens, not the old cards", () => {
    const where = homeBlockers(DEFAULT_HOME)
      .filter((b) => b.section === "Video ads & reels")
      .map((b) => b.where);
    expect(where).toEqual(["stage › left", "stage › centre", "stage › right"]);
  });
});

// ---------------------------------------------------------------- founder
describe("founder stat", () => {
  const founder = (n: number | null, extra: Partial<HomeContent["founder"]> = {}) =>
    html(<Founder s={{ ...DEFAULT_HOME.founder, yearsExperience: n, ...extra }} />);

  for (const n of [7, 10, 2024]) {
    it(`${String(n).length} digit(s): number and symbol in one span, on the label's baseline`, () => {
      const out = founder(n);
      expect(out).toContain("flex max-w-full flex-wrap items-baseline");
      expect(out).toMatch(new RegExp(`tabular-nums md:text-\\[32px\\]">${n}\\+</span>`));
      expect(out).toContain('text-[18px] leading-snug md:text-[20px]">years as a digital consultant</span>');
    });
  }

  it("number 1.6× the label (29/18, 32/20), label ≥ 18 px, 24 px spacing above and below", () => {
    expect(29 / 18).toBeCloseTo(1.6, 1);
    expect(32 / 20).toBe(1.6);
    expect(founder(10)).toContain('class="my-2 flex'); // gap-4 (16) + my-2 (8) = 24 px
  });

  it("a long label wraps under the number; the symbol is optional; empty number hides the stat", () => {
    const long = "years helping fashion, beauty and lifestyle brands grow on Meta and Google";
    expect(founder(12, { yearsLabel: long.slice(0, 60), yearsSuffix: "" })).toMatch(/>12<\/span>/);
    expect(founder(null)).not.toContain("items-baseline");
    const schema = homeSchema.shape.founder;
    expect(schema.safeParse({ ...DEFAULT_HOME.founder, yearsExperience: 9999 }).success).toBe(true);
    expect(schema.safeParse({ ...DEFAULT_HOME.founder, yearsExperience: 10000 }).success).toBe(false);
  });

  it("older saved founder data (no symbol or label) reads with the old words", () => {
    const { yearsSuffix: _a, yearsLabel: _b, ...old } = DEFAULT_HOME.founder;
    void _a;
    void _b;
    const back = parseHome({ founder: { ...old, yearsExperience: 20 } }).founder;
    expect([back.yearsExperience, back.yearsSuffix, back.yearsLabel]).toEqual([
      20,
      "+",
      "years as a digital consultant",
    ]);
  });
});

// ------------------------------------------------------------ social links
describe("social links", () => {
  it("accepts only https links", () => {
    expect(safeSocialUrl("https://instagram.com/rohtre")).toBe("https://instagram.com/rohtre");
    for (const bad of [
      "http://instagram.com/rohtre",
      "javascript:alert(1)",
      "data:text/html,hi",
      "instagram.com/rohtre",
      "https://user:pw@instagram.com",
      "https://localhost/x",
      "https://insta gram.com",
      "",
    ])
      expect(safeSocialUrl(bad), bad).toBeNull();
    expect(socialUrlError("instagram", "http://instagram.com/x")).toMatch(/https:\/\/instagram\.com\/yourname/);
    expect(socialUrlError("x", "")).toBeNull();
  });

  it("warns (softly) when the host isn't the platform's", () => {
    expect(socialHostWarning("instagram", "https://www.instagram.com/rohtre")).toBeNull();
    expect(socialHostWarning("x", "https://twitter.com/rohtre")).toBeNull();
    expect(socialHostWarning("pinterest", "https://in.pinterest.com/rohtre")).toBeNull();
    expect(socialHostWarning("youtube", "https://youtu.be/abc")).toBeNull();
    expect(socialHostWarning("facebook", "https://instagram.com/rohtre")).toMatch(/Facebook/);
  });

  const link = (network: SocialLink["network"], url: string | null, enabled = true): SocialLink => ({
    network,
    url,
    enabled,
  });

  it("render rule: none → no row; shown + valid → a link; hidden or invalid → nothing (live)", () => {
    expect(footerSocials(DEFAULT_SETTINGS.socials, false)).toEqual([]);
    const one = footerSocials([link("instagram", "https://instagram.com/rohtre")], false);
    expect(one).toEqual([
      {
        network: "instagram",
        href: "https://instagram.com/rohtre",
        label: "RohTre Media on Instagram (opens in a new tab)",
      },
    ]);
    const five = footerSocials(
      [
        link("instagram", "https://instagram.com/a"),
        link("facebook", "https://facebook.com/a"),
        link("x", "https://x.com/a"),
        link("youtube", "https://youtube.com/@a"),
        link("linkedin", "https://linkedin.com/company/a"),
        link("threads", "https://threads.net/@a", false),
        link("telegram", "javascript:alert(1)"),
      ],
      false,
    );
    expect(five.map((s) => s.network)).toEqual(["instagram", "facebook", "x", "youtube", "linkedin"]);
    expect(five[2].label).toBe("RohTre Media on X (opens in a new tab)");
  });

  it("outside production, switched-on icons without a link show as 'no link yet' (no href)", () => {
    const dev = footerSocials(DEFAULT_SETTINGS.socials, true);
    expect(dev.map((s) => [s.network, s.href])).toEqual(SOCIAL_NETWORKS.slice(0, 5).map((n) => [n, null]));
  });

  it("the footer: copyright left, icons right (stacked on phones), new tab with noopener noreferrer", async () => {
    const settings: SiteSettings = {
      ...DEFAULT_SETTINGS,
      socials: [link("instagram", "https://instagram.com/rohtre"), link("facebook", null, false)],
    };
    const out = html(await SiteFooter({ settings }));
    expect(out).toContain("flex-col items-center gap-4");
    expect(out).toContain("md:flex-row md:justify-between");
    expect(out).toMatch(
      /<a href="https:\/\/instagram\.com\/rohtre" target="_blank" rel="noopener noreferrer" aria-label="RohTre Media on Instagram \(opens in a new tab\)" class="rm-social">/,
    );
    expect(out).not.toContain("Facebook");
    const none = html(await SiteFooter({ settings: { ...DEFAULT_SETTINGS, socials: [] } }));
    expect(none).not.toContain("rm-social");
    expect(none).not.toContain("on social media");
    // 46 px round buttons, red hover, visible focus ring.
    expect(css).toMatch(/\.rm-social \{[^}]*width: 46px;\n  height: 46px;/);
    expect(css).toMatch(/a\.rm-social:hover \{[^}]*background: var\(--brand\);/);
    expect(css).toMatch(/a\.rm-social:focus-visible \{\n  outline: 2px solid var\(--focus\);/);
  });

  it("seeds the first five platforms with empty links; older rows without the switch read as shown", () => {
    expect(DEFAULT_SETTINGS.socials).toEqual(
      ["instagram", "facebook", "x", "youtube", "linkedin"].map((network) => ({ network, url: null, enabled: true })),
    );
    expect(parseSettings({ socials: [{ network: "youtube", url: "https://youtube.com/@r" }] }).socials).toEqual([
      { network: "youtube", url: "https://youtube.com/@r", enabled: true },
    ]);
  });
});

// ----------------------------------------------------------- save round trips
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
      update: (row: { data: unknown }) => ({
        eq: async () => {
          stored.data = JSON.parse(JSON.stringify(row.data));
          return { error: null };
        },
      }),
    }),
  }),
}));

describe("save round trips", () => {
  beforeEach(() => {
    updateTag.mockClear();
    stored.data = null;
  });

  it("hero shape, the stage, the icon row and the founder stat are stored and the home page refreshed", async () => {
    const { saveHome } = await import("../src/app/admin/home/actions");
    const { HOME_TAG } = await import("../src/lib/home-data");
    const edited: HomeContent = {
      ...DEFAULT_HOME,
      hero: { ...DEFAULT_HOME.hero, video: { ...emptyLandscape("4:3"), fit: "fit" } },
      videoAds: {
        ...DEFAULT_HOME.videoAds,
        stage: { left: emptyPhone("9:16"), centre: emptyLandscape("21:9"), right: emptyPhone("9:18") },
        icons: DEFAULT_HOME.videoAds.icons.slice(0, 2),
        size: "large",
      },
      founder: { ...DEFAULT_HOME.founder, yearsExperience: 1200, yearsSuffix: "K", yearsLabel: "campaigns run" },
    };
    expect(await saveHome(edited)).toEqual({ ok: true });
    expect(updateTag).toHaveBeenCalledWith(HOME_TAG);
    const back = parseHome(stored.data);
    expect(back.hero.video).toMatchObject({ aspect: "4:3", fit: "fit" });
    expect(back.videoAds.stage.centre.aspect).toBe("21:9");
    expect(back.videoAds.stage.right.aspect).toBe("9:18");
    expect(back.videoAds.icons).toHaveLength(2);
    expect(back.videoAds.items).toEqual(DEFAULT_HOME.videoAds.items); // old cards kept
    expect([back.founder.yearsExperience, back.founder.yearsSuffix, back.founder.yearsLabel]).toEqual([
      1200,
      "K",
      "campaigns run",
    ]);
  });

  it("settings: social rows post through FormData (Select hidden input) and refresh every page", async () => {
    const { saveSettings } = await import("../src/app/admin/settings/actions");
    const { SETTINGS_TAG } = await import("../src/lib/settings");
    const f = new FormData();
    const s = DEFAULT_SETTINGS;
    const base: Record<string, string> = {
      email: s.email,
      location: s.location,
      tagline: s.tagline,
      phones: phonesToText(s),
      callbackCountries: callbacksToText(s),
      whatsappNumber: s.whatsapp.number,
      whatsappTemplate: s.whatsapp.template,
      whatsappEnabled: "on",
      hrWhatsapp: s.hrWhatsapp ?? "",
      careersLineEnabled: "on",
      leadRetentionDays: String(s.leadRetentionDays),
      adSpendRanges: s.adSpendRanges.join("\n"),
      interests: s.interests.join("\n"),
      aiBots: s.aiBots.join("\n"),
      socialsCount: "2",
      "socials.0.network": "threads",
      "socials.0.url": "https://threads.net/@rohtre",
      "socials.0.enabled": "on",
      "socials.1.network": "pinterest",
      "socials.1.url": "",
    };
    for (const [k, v] of Object.entries(base)) f.set(k, v);
    const res = await saveSettings({ status: "idle", errors: {} }, f);
    expect(res.status).toBe("saved");
    expect(updateTag).toHaveBeenCalledWith(SETTINGS_TAG);
    expect(parseSettings(stored.data).socials).toEqual([
      { network: "threads", url: "https://threads.net/@rohtre", enabled: true },
      { network: "pinterest", url: null, enabled: false },
    ]);
  });

  it("settings: an http or javascript: link is refused with a hint on its row", () => {
    const f = new FormData();
    f.set("socialsCount", "2");
    f.set("socials.0.network", "instagram");
    f.set("socials.0.url", "http://instagram.com/x");
    f.set("socials.1.network", "x");
    f.set("socials.1.url", "javascript:alert(1)");
    const r = settingsFromForm(f, DEFAULT_SETTINGS, true);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors["socials.0"]).toMatch(/https:\/\//);
      expect(r.errors["socials.1"]).toMatch(/https:\/\//);
    }
  });
});
