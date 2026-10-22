import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BadgeBar } from "../src/components/home/sections";
import { MediaSlot } from "../src/components/media/media-slot";
import { DEFAULT_HOME, parseHome } from "../src/content/home-schema";
import { emptySlot, mediaSlotSchema, type MediaSlotValue } from "../src/content/media-slot";
import { homeBlockers } from "../src/lib/home-blockers";
import { homeJsonSchemas } from "../src/lib/json-schemas";
import type { Badge } from "../src/lib/home-data";
import {
  checkUpload,
  LOOP_CLIP_MAX_SECONDS,
  loopClipWarnings,
  MEDIA_IMAGE_MAX_MB,
  MEDIA_VIDEO_MAX_MB,
} from "../src/lib/media-limits";

const MB = 1024 * 1024;
const filled = (patch: Partial<MediaSlotValue>): MediaSlotValue => ({
  ...emptySlot("4:5"),
  publicId: "rohtre-media/images/test",
  alt: "A red bottle on a table",
  ...patch,
});
const html = (slot: MediaSlotValue, priority = false) =>
  renderToStaticMarkup(<MediaSlot slot={slot} sizes="100vw" priority={priority} />);

describe("MediaSlot states", () => {
  it("empty: a fixed-ratio frame, labelled while building", () => {
    const out = html(emptySlot("9:16", "video"));
    expect(out).toContain("data-empty-slot");
    expect(out).toContain(`aspect-ratio:${9 / 16}`);
    expect(out).toContain(`Placeholder · 9:16 (1080×1920) · image or video · up to ${MEDIA_VIDEO_MAX_MB} MB`);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<video");
  });

  it("image: responsive Cloudinary image with its alt text, lazy unless it is the LCP", () => {
    const lazy = html(filled({}));
    expect(lazy).toContain('alt="A red bottle on a table"');
    expect(lazy).toContain("/image/upload/f_auto,q_auto,w_640,c_limit/rohtre-media/images/test 640w");
    expect(lazy).toContain('loading="lazy"');
    expect(lazy).not.toContain("<video");
    const lcp = html(filled({}), true);
    expect(lcp).toContain('loading="eager"');
    expect(lcp).toContain('fetchPriority="high"');
  });

  it("loop video: muted clip with no file until it is in view, over a first-frame still", () => {
    const out = html(filled({ type: "video", publicId: "rohtre-media/video/clip", alt: "" }));
    expect(out).toMatch(/<video[^>]*data-rm-loop=""/);
    expect(out).toContain('data-src="https://res.cloudinary.com/');
    expect(out).toContain("/video/upload/q_auto,w_1080,c_limit/rohtre-media/video/clip.mp4");
    expect(out).not.toMatch(/<video[^>]* src=/);
    expect(out).toContain("muted");
    expect(out).toContain('preload="none"');
    expect(out).toContain("/video/upload/so_0,q_auto,w_640,c_limit/rohtre-media/video/clip.jpg");
  });

  it("non-loop video: a player with controls that loads nothing up front", () => {
    const out = html(filled({ type: "video", publicId: "rohtre-media/video/film", loop: false }));
    expect(out).toContain("controls");
    expect(out).toContain('preload="none"');
    expect(out).not.toContain("data-rm-loop");
  });

  it("GIF: served as a looping MP4 from the image resource", () => {
    const out = html(filled({ format: "gif", publicId: "rohtre-media/images/anim" }));
    expect(out).toContain("data-rm-loop");
    expect(out).toContain("/image/upload/q_auto,w_1080,c_limit/rohtre-media/images/anim.mp4");
    expect(out).toContain("/image/upload/pg_1,q_auto,w_640,c_limit/rohtre-media/images/anim.jpg");
  });

  it("an image needs alt text; a video or an empty slot doesn't", () => {
    expect(mediaSlotSchema.safeParse(filled({ alt: " " })).success).toBe(false);
    expect(mediaSlotSchema.safeParse(filled({ type: "video", alt: "" })).success).toBe(true);
    expect(mediaSlotSchema.safeParse(emptySlot("1:1")).success).toBe(true);
  });

  it("the admin form sees every slot as a slot (so it gets the image/video editor)", () => {
    const schemas = homeJsonSchemas();
    const media = schemas.products.properties?.items?.items?.properties?.media;
    expect(media?.properties?.aspect && media.properties.loop && media.properties.publicId).toBeTruthy();
  });
});

describe("upload checks", () => {
  it("accepts the allowed types and refuses the rest", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"])
      expect(checkUpload({ type, size: MB }, "image").ok).toBe(true);
    for (const type of ["video/mp4", "video/webm", "video/quicktime"])
      expect(checkUpload({ type, size: MB }, "video").ok).toBe(true);
    expect(checkUpload({ type: "image/svg+xml", size: MB }, "image").ok).toBe(false);
    expect(checkUpload({ type: "video/mp4", size: MB }, "image").ok).toBe(false);
    expect(checkUpload({ type: "image/png", size: MB }, "video").ok).toBe(false);
  });

  it("refuses files over the plan limits", () => {
    expect(checkUpload({ type: "image/png", size: MEDIA_IMAGE_MAX_MB * MB + 1 }, "image")).toEqual({
      ok: false,
      error: `The file is larger than ${MEDIA_IMAGE_MAX_MB} MB.`,
    });
    expect(checkUpload({ type: "video/mp4", size: MEDIA_VIDEO_MAX_MB * MB }, "video").ok).toBe(true);
    expect(checkUpload({ type: "video/mp4", size: MEDIA_VIDEO_MAX_MB * MB + 1 }, "video").ok).toBe(false);
  });

  it("recommends MP4 over GIF, and warns (never blocks) on heavy or long loop clips", () => {
    const gif = checkUpload({ type: "image/gif", size: MB }, "image");
    expect(gif.ok && gif.warnings.length).toBe(1);
    expect(loopClipWarnings(5 * MB, 8)).toEqual([]);
    expect(loopClipWarnings(12 * MB, LOOP_CLIP_MAX_SECONDS + 5)).toHaveLength(2);
    expect(loopClipWarnings(null, null)).toEqual([]);
  });
});

describe("partner strip render rule (unchanged: switched on = shown)", () => {
  const badge = (id: string, enabled: boolean): Badge => ({
    id,
    label: `Badge ${id}`,
    sublabel: null,
    image_public_id: null,
    proof_url: null,
    enabled,
    notes: null,
  });

  it("renders only switched-on badges, laid out by their count", () => {
    const out = renderToStaticMarkup(
      <BadgeBar s={DEFAULT_HOME.badges} badges={[badge("a", true), badge("b", false), badge("c", true)]} />,
    );
    expect(out).toContain("Badge a");
    expect(out).toContain("Badge c");
    expect(out).not.toContain("Badge b");
    expect(out).toContain('data-count="2"');
  });

  it("renders nothing when no badge is switched on", () => {
    expect(renderToStaticMarkup(<BadgeBar s={DEFAULT_HOME.badges} badges={[badge("x", false)]} />)).toBe("");
  });
});

describe("launch blockers (unfilled slots)", () => {
  it("lists every empty slot of the shipped home page", () => {
    const list = homeBlockers(DEFAULT_HOME);
    const slots = list.filter((b) => b.message.startsWith("Empty"));
    // hero video + 2 phones + 4 video ads + 2 showcase posters (products ship with the seeded mockups)
    expect(slots).toHaveLength(1 + 2 + 4 + 2);
    expect(slots.some((b) => b.section === "Client showcase" && b.where === "slide 2 › poster")).toBe(true);
    expect(list.some((b) => b.section === "Brands we've worked with" && /not identified/.test(b.message))).toBe(true);
    const showcase = list.filter((b) => b.section === "Client showcase" && !b.message.startsWith("Empty"));
    expect(showcase.map((b) => `${b.where}: ${b.message.split(" (")[0]}`)).toEqual([
      "slide 1 (Rama Chikan): Numbers have no period",
      "slide 1 (Rama Chikan): Numbers have no source",
      "slide 2 (Harmiche): Numbers have no period",
      "slide 2 (Harmiche): Numbers have no source",
    ]);
  });

  it("drops a slot once it is filled, flags missing alt text, and skips switched-off sections", () => {
    const home = parseHome({});
    home.products.items[0].media = filled({ aspect: "9:16" });
    home.products.items[1].media = { ...filled({ aspect: "9:16" }), alt: "" };
    home.products.items[2].media = emptySlot("9:16");
    home.videoAds.enabled = false;
    const list = homeBlockers(home).filter((b) => b.section !== "Client showcase");
    const products = list.filter((b) => b.section === "Product showcase");
    expect(products.some((b) => b.where === "item 1 › media")).toBe(false);
    expect(products.some((b) => b.where === "item 2 › media" && b.message === "Image has no alt text.")).toBe(true);
    expect(products.some((b) => b.where === "item 3 › media" && b.message.startsWith("Empty 9:16"))).toBe(true);
    expect(list.some((b) => b.section === "Video ads & reels")).toBe(false);
  });
});
