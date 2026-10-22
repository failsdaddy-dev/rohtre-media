// Size and layout constants for the home page's phone frames, Video Ads
// cards, partner strip and CTA card, in one place. The CSS in
// src/app/design.css reads them as custom properties set from here, so
// changing a number here changes the site (no CSS edit needed).

/** The admin's section-level size control (phones and Video Ads). */
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

/**
 * Video Ads card frame: height clamp(380px, 68svh, 720px) × the size
 * scale; the whole card (frame + title) stays inside the viewport, and on
 * phones the frame is never taller than 70svh.
 */
export const VIDEO_AD_FRAME = {
  minPx: 380,
  vh: 68,
  maxPx: 720,
  /** Room kept for the title and card padding inside the viewport. */
  titleRoomPx: 150,
  mobileCapVh: 70,
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
export const videoAdHeight = (size: FrameSize) =>
  frameHeight(VIDEO_AD_FRAME, FRAME_SCALE[size], (u) => `calc(100${u} - ${VIDEO_AD_FRAME.titleRoomPx}px)`);

/** Outer frame width ÷ height for a screen of width÷height `a` with the bezel above. */
export const phoneFrameRatio = (a: number, bezel = PHONE_FRAME.bezel) => a / (1 - 2 * bezel + 2 * bezel * a);

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
  mobile: { logoPx: 44, cols: 2 },
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
