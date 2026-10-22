// Upload and playback limits for every media slot (home page, admin), in one
// place. The two file-size caps are Cloudinary's Free plan limits.
// verified: https://cloudinary.com/pricing/compare-plans ("Max image file size"
//   Free 10 MB, "Max video file size" Free 100 MB, "Max image megapixels" 25 MP)

export const MEDIA_IMAGE_MAX_MB = 10;
export const MEDIA_VIDEO_MAX_MB = 100;
/** Cloudinary Free: larger images are refused. */
export const MEDIA_IMAGE_MAX_MEGAPIXELS = 25;

/** A looping clip above this size gets a warning (not a block): it plays on every visit. */
export const LOOP_CLIP_RECOMMENDED_MB = 10;
/** A looping clip longer than this gets a warning (not a block). */
export const LOOP_CLIP_MAX_SECONDS = 15;

/** At most this many looping clips play at once; the rest wait, paused, on their poster. */
export const MAX_PLAYING_VIDEOS = 3;

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
export const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"] as const;

const MB = 1024 * 1024;

export type UploadCheck = { ok: true; warnings: string[] } | { ok: false; error: string };

/**
 * Check a file before it is uploaded to a slot of the given type. GIFs are
 * accepted in image slots (Cloudinary serves them as a looping MP4) but MP4
 * is recommended: the same clip as a GIF is many times heavier.
 */
export function checkUpload(file: { type: string; size: number }, slotType: "image" | "video"): UploadCheck {
  const allowed: readonly string[] = slotType === "image" ? IMAGE_MIME : VIDEO_MIME;
  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      error:
        slotType === "image"
          ? "Use a JPG, PNG, WebP, AVIF or GIF file."
          : "Use an MP4, WebM or MOV file (MP4 recommended).",
    };
  }
  const max = slotType === "image" ? MEDIA_IMAGE_MAX_MB : MEDIA_VIDEO_MAX_MB;
  if (file.size > max * MB) return { ok: false, error: `The file is larger than ${max} MB.` };
  const warnings: string[] = [];
  if (file.type === "image/gif")
    warnings.push("GIFs are heavy. An MP4 of the same clip (set the slot to Video) loads much faster.");
  return { ok: true, warnings };
}

/** Warnings for a looping clip once Cloudinary has told us its size and length. */
export function loopClipWarnings(bytes: number | null, seconds: number | null): string[] {
  const out: string[] = [];
  if (bytes != null && bytes > LOOP_CLIP_RECOMMENDED_MB * MB)
    out.push(
      `This loop clip is ${(bytes / MB).toFixed(1)} MB. Keep loop clips under ${LOOP_CLIP_RECOMMENDED_MB} MB so the page stays fast.`,
    );
  if (seconds != null && seconds > LOOP_CLIP_MAX_SECONDS)
    out.push(
      `This loop clip is ${Math.round(seconds)} seconds long. Loop clips work best at ${LOOP_CLIP_MAX_SECONDS} seconds or less.`,
    );
  return out;
}
