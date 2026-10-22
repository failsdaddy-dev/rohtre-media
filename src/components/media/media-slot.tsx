import type { CSSProperties } from "react";
import { phoneFrameRatio } from "@/content/layout-presets";
import { ASPECTS, isGif, playsAsVideo, slotLabel, type MediaSlotValue, type SlotFit } from "@/content/media-slot";
import { clipUrl, cloudinaryUrl, stillUrl } from "@/lib/cloudinary/url";
import { MEDIA_IMAGE_MAX_MB, MEDIA_VIDEO_MAX_MB } from "@/lib/media-limits";

// One media slot (image OR video) at a fixed aspect ratio, so nothing jumps
// while it loads. Server-rendered; the only browser code is MediaPlayback,
// which starts and stops the looping clips.
//   empty  → a neutral frame; while building it carries a small label
//   image  → responsive Cloudinary image (f_auto, q_auto, widths below)
//   video  → a still (poster or first frame) under the clip. Loop clips are
//            muted, have no src until MediaPlayback starts them in view, and
//            stay on the still for reduced motion or data saver. Other
//            videos get a normal player with controls and preload="none".
//   GIF    → served as a looping MP4 (much lighter than the GIF itself)

const SHOW_LABELS = process.env.NODE_ENV !== "production";
const WIDTHS = [320, 480, 640, 828, 1080, 1280, 1600, 1920, 2400];

export type SlotProps = {
  /** Phone-shaped slots also carry `fit`: "fit" shows the whole file on black instead of cropping. */
  slot: MediaSlotValue & { fit?: SlotFit };
  /** The image `sizes` attribute (how wide the slot is on screen). */
  sizes: string;
  /** The LCP element: load the still eagerly with high priority. */
  priority?: boolean;
  className?: string;
  /** Widest file needed (keeps small slots from offering huge files). */
  maxWidth?: number;
  /** "contain" shows the whole file (e.g. a transparent PNG/SVG cut-out) instead of filling the frame. */
  fit?: "cover" | "contain";
};

/** The still image's URL at a given width (image, video poster or GIF frame). */
export function stillFor(slot: MediaSlotValue, width: number): string | null {
  if (!slot.publicId) return null;
  if (slot.type === "video") {
    return slot.poster ? cloudinaryUrl(slot.poster, { width }) : stillUrl(slot.publicId, { width });
  }
  return isGif(slot) ? stillUrl(slot.publicId, { width, gif: true }) : cloudinaryUrl(slot.publicId, { width });
}

export function stillSrcSet(slot: MediaSlotValue, maxWidth = 2400): string | undefined {
  if (!slot.publicId) return undefined;
  return WIDTHS.filter((w) => w <= maxWidth)
    .map((w) => `${stillFor(slot, w)} ${w}w`)
    .join(", ");
}

export function MediaSlot({ slot, sizes, priority, className = "", maxWidth = 2400, fit = "cover" }: SlotProps) {
  const frame: CSSProperties = { aspectRatio: String(ASPECTS[slot.aspect]) };
  const box = `relative w-full overflow-hidden ${slot.fit === "fit" && slot.publicId ? "bg-black" : ""} ${className}`;
  const whole = fit === "contain" || slot.fit === "fit";
  const objectFit = whole ? "object-contain" : "object-cover";

  if (!slot.publicId) {
    return (
      <div
        style={frame}
        data-empty-slot=""
        className={`${box} grid place-items-center border border-line bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] [background-image:radial-gradient(color-mix(in_srgb,var(--fg)_9%,transparent)_1px,transparent_1px)] [background-size:14px_14px]`}
      >
        {SHOW_LABELS && (
          <span className="mx-3 rounded-full bg-bg/85 px-2.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-fg-2">
            {slotLabel(slot, MEDIA_IMAGE_MAX_MB, MEDIA_VIDEO_MAX_MB)}
          </span>
        )}
      </div>
    );
  }

  const srcSet = stillSrcSet(slot, maxWidth);
  const still = (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary does the resizing (same URLs as the next/image loader)
    <img
      src={stillFor(slot, Math.min(1080, maxWidth)) ?? undefined}
      srcSet={srcSet}
      sizes={sizes}
      alt={playsAsVideo(slot) ? "" : slot.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`absolute inset-0 size-full ${objectFit}`}
    />
  );
  if (!playsAsVideo(slot)) {
    return (
      <div style={frame} className={box}>
        {still}
      </div>
    );
  }

  const clip = clipUrl(slot.publicId, { width: Math.min(1080, maxWidth), gif: isGif(slot) });
  const loop = slot.loop || isGif(slot);
  return (
    <div style={frame} className={box}>
      {still}
      {loop ? (
        <video
          data-rm-loop=""
          data-src={clip}
          muted
          loop
          playsInline
          preload="none"
          aria-label={slot.alt || undefined}
          aria-hidden={slot.alt ? undefined : true}
          className={`rm-loop-clip absolute inset-0 size-full ${objectFit}`}
        />
      ) : (
        <video
          src={clip}
          poster={stillFor(slot, 1080) ?? undefined}
          controls
          playsInline
          preload="none"
          aria-label={slot.alt || "Video"}
          className={`absolute inset-0 size-full bg-black ${objectFit}`}
        />
      )}
    </div>
  );
}

/**
 * A generic, CSS-drawn phone (no brand marks) around a phone-shaped slot:
 * the screen keeps the slot's own shape (9:19.5, 9:16 or 9:18), with a
 * uniform bezel of 2.5% of the frame width, corners at 13% and a small
 * pill. The width comes from the section's frame height (--phone-h, set by
 * the section) and is also limited by `--share` (room per phone).
 */
export function PhoneFrame({
  slot,
  sizes,
  className = "",
  style,
}: Omit<SlotProps, "priority"> & { style?: CSSProperties }) {
  const ratio = ASPECTS[slot.aspect];
  return (
    <div
      className={`rm-phone ${className}`}
      data-aspect={slot.aspect}
      style={{ "--fr": phoneFrameRatio(ratio), ...style } as CSSProperties}
    >
      <div className="rm-phone-body">
        <span aria-hidden="true" className="rm-phone-pill" />
        <MediaSlot slot={slot} sizes={sizes} maxWidth={828} className="rm-phone-screen" />
      </div>
    </div>
  );
}
