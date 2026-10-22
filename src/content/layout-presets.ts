// Size and layout constants for the home page's phone frames, Video Ads
// cards, partner strip and CTA card, in one place. The CSS in
// src/app/design.css reads them as custom properties set from here, so
// changing a number here changes the site (no CSS edit needed).

/** The admin's section-level size control (phones and the Video Ads stage). */
export const FRAME_SIZES = ["small", "medium", "large", "xl"] as const;
export type FrameSize = (typeof FRAME_SIZES)[number];
export const FRAME_SCALE: Record<FrameSize, number> = { small: 0.8, medium: 1, large: 1.15, xl: 1.3 };
export const FRAME_SIZE_LABELS: Record<FrameSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "Extra large",
};

/**
 * Phone frame ("Scroll. Engage. Convert."): base height
 * clamp(460px, 76svh, 820px) × the size scale, never taller than 92svh.
 * The frame is the screen plus a uniform bezel of 2.5% of the frame width,
 * outer corners 13% of the width, a small pill at the top.
 */
export const PHONE_FRAME = {
  minPx: 460,
  vh: 76,
  maxPx: 820,
  capVh: 92,
  bezel: 0.025,
  radius: 0.13,
  /** The 2nd phone of 2-3 sits lower (fraction of the frame height). */
  stagger: 0.08,
  /** From this many phones on, the phones become a sideways row with arrows. */
  rowFrom: 4,
};

/** "clamp(min, vh, max) × scale, capped" as CSS, with an svh version for browsers that have it. */
export function frameHeight(
  f: { minPx: number; vh: number; maxPx: number },
  scale: number,
  cap: (unit: "vh" | "svh") => string,
): { vh: string; svh: string } {
  const one = (u: "vh" | "svh") => `min(calc(clamp(${f.minPx}px, ${f.vh}${u}, ${f.maxPx}px) * ${scale}), ${cap(u)})`;
  return { vh: one("vh"), svh: one("svh") };
}

export const phoneHeight = (size: FrameSize) =>
  frameHeight(PHONE_FRAME, FRAME_SCALE[size], (u) => `${PHONE_FRAME.capVh}${u}`);

/** Outer frame width ÷ height for a screen of width÷height `a` with the bezel above. */
export const phoneFrameRatio = (a: number, bezel = PHONE_FRAME.bezel) => a / (1 - 2 * bezel + 2 * bezel * a);

/**
 * Monitor frame (the Video Ads centre screen): same dark body and 1 px
 * edge as the phone, a uniform bezel of 1.6% of the frame width, corners
 * at 2.4%. No brand marks. A neck and base stand under it (on).
 */
export const MONITOR_FRAME = { bezel: 0.016, radius: 0.024 };
export const SHOW_MONITOR_STAND = true;
export const monitorFrameRatio = (a: number) => phoneFrameRatio(a, MONITOR_FRAME.bezel);

/**
 * Video Ads stage: left phone, centre monitor, right phone. From 1280 px
 * the phone height is clamp(380px, 62svh, 640px) × the size scale, never
 * taller than 68svh; the monitor is 2.1 × the phones' (average) width,
 * on its stand, with a gap of 6% of the phone height to each phone (no
 * overlap) and all bottoms aligned on the stand's base. The whole stage
 * also shrinks to fit its container (768-1279 px is the same composition,
 * scaled by the container width). Below 768 px: monitor full width, the two
 * phones side by side (46% each, at most 70svh tall), then the text.
 */
export const VIDEO_STAGE = {
  minPx: 380,
  vh: 62,
  maxPx: 640,
  capVh: 68,
  monitorScale: 2.1,
  /** Gap between each phone and the monitor, as a share of the phone height. */
  gap: 0.06,
  mobilePhoneShare: 0.46,
  mobileCapVh: 70,
};
export const stageHeight = (size: FrameSize) =>
  frameHeight(VIDEO_STAGE, FRAME_SCALE[size], (u) => `${VIDEO_STAGE.capVh}${u}`);
/**
 * Stage width ÷ phone height, for phone frame ratios `l` and `r`: both
 * phones, the monitor and the two gaps. The phone height is
 * capped at (container width ÷ this), so the stage never overflows.
 */
export const stageWidthFactor = (l: number, r: number) =>
  l + r + VIDEO_STAGE.monitorScale * ((l + r) / 2) + 2 * VIDEO_STAGE.gap;

/**
 * The stage's CSS (design.css .rm-stage) worked out in pixels for a
 * viewport of w × h CSS px and the section's container (1680 px max, 16 or
 * 24 px side padding), for the tests and the docs. Frame ratios are
 * width ÷ height of the whole frame (screen + bezel).
 */
export function stageLayout(w: number, h: number, size: FrameSize, frl: number, frr: number, frm: number) {
  const pad = w >= 640 ? 24 : 16;
  const cw = Math.min(w, 1680) - 2 * pad;
  const s = VIDEO_STAGE;
  let ph: number;
  let wm: number;
  let width: number;
  if (w >= 768) {
    const byScreen = Math.min(
      Math.min(Math.max(s.minPx, (s.vh / 100) * h), s.maxPx) * FRAME_SCALE[size],
      (s.capVh / 100) * h,
    );
    ph = Math.min(byScreen, cw / stageWidthFactor(frl, frr));
    wm = (s.monitorScale * (ph * frl + ph * frr)) / 2;
    width = ph * frl + ph * frr + wm + 2 * s.gap * ph;
  } else {
    ph = Math.min((s.mobileCapVh / 100) * h, (s.mobilePhoneShare * cw) / Math.max(frl, frr));
    wm = cw;
    width = cw;
  }
  return { container: cw, phoneH: ph, phoneW: [ph * frl, ph * frr], monitorW: wm, monitorH: wm / frm, width };
}

/** Hero video: up to 620 px wide; its height follows the shape, capped (see design.css .rm-hero-video). */
export const HERO_VIDEO = { maxPx: 620, capVh: 70, roomPx: 620 };

/**
 * Partner strip: logo height by the number of shown badges (the badge
 * render rule itself is unchanged). Phones: 2 columns at mobilePx.
 *   1-3 → one row, centred cells with a max width
 *   4   → one row
 *   5-6 → one row from 1280 px, else rows of 3 (3+3 or 3+2, centred)
 *   7+  → rows of 4, last row centred
 */
export const BADGE_LAYOUT = {
  few: { upTo: 3, logoPx: 88, cellMaxPx: 380 },
  four: { logoPx: 80 },
  mid: { upTo: 6, logoPx: 68, oneRowFromPx: 1280, perRow: 3 },
  many: { logoPx: 56, perRow: 4 },
  mobile: { logoPx: 40, cols: 2 },
} as const;
export type BadgeGroup = "few" | "four" | "mid" | "many";

export function badgeLayout(count: number): { group: BadgeGroup; logoPx: number; mobileLogoPx: number } {
  const group: BadgeGroup =
    count <= BADGE_LAYOUT.few.upTo ? "few" : count === 4 ? "four" : count <= BADGE_LAYOUT.mid.upTo ? "mid" : "many";
  return { group, logoPx: BADGE_LAYOUT[group].logoPx, mobileLogoPx: BADGE_LAYOUT.mobile.logoPx };
}

/** Rows a badge count makes at a given width (for the tests and the admin preview). */
export function badgeRows(count: number, width: number): number[] {
  if (count === 0) return [];
  const { group } = badgeLayout(count);
  const perRow =
    width < 768
      ? BADGE_LAYOUT.mobile.cols
      : group === "many"
        ? BADGE_LAYOUT.many.perRow
        : group === "mid" && width < BADGE_LAYOUT.mid.oneRowFromPx
          ? BADGE_LAYOUT.mid.perRow
          : count;
  const rows: number[] = [];
  for (let left = count; left > 0; left -= perRow) rows.push(Math.min(perRow, left));
  return rows;
}

/** CTA card ("Let's talk about your brand."): decorative objects and pointer drift. */
export const CTA_DECOR = {
  objects: 16,
  /** Maximum travel in px per depth layer while the pointer is over the card. */
  travel: { near: 24, mid: 14, far: 8 },
  /** Easing per frame towards the pointer (and back to rest). */
  lerp: 0.08,
  /** Opacity cap for objects inside the text's safe zone. */
  safeOpacity: 0.25,
  /** Idle float loop length range, seconds. */
  floatSeconds: [6, 12] as const,
};
