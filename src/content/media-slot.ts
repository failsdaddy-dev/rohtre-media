import { z } from "zod";

// One media slot (image OR video) used everywhere on the home page. Every
// slot has a fixed aspect ratio, so the page never jumps while media loads,
// and ships empty: an empty slot is a neutral frame (labelled only while
// building) and a launch blocker in the admin.
//   type      image | video
//   publicId  the Cloudinary file (null = empty)
//   format    from Cloudinary; "gif" means an animated image, served as a looping MP4
//   alt       required for images (and GIFs)
//   aspect    one of ASPECTS
//   loop      video: a muted looping clip that plays while in view (else a player with controls)
//   poster    video: optional still; default is the clip's first frame
//   bytes, duration  recorded at upload, for the admin's size and length warnings
//   fit       phone-shaped slots only: fill (crop to the screen, default) | fit (show the whole file)

export const ASPECTS = {
  "16:9": 16 / 9,
  "16:10": 16 / 10,
  "12:5": 12 / 5,
  "4:5": 4 / 5,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "9:18": 9 / 18,
  "9:19.5": 9 / 19.5,
} as const;
export type Aspect = keyof typeof ASPECTS;
const ASPECT_KEYS = Object.keys(ASPECTS) as [Aspect, ...Aspect[]];

/**
 * Phone screens (phone frames and the Video Ads cards). Modern large phones
 * are about 430×932 CSS px, roughly 9:19.5 (the first, default shape).
 */
export const PHONE_ASPECTS = ["9:19.5", "9:16", "9:18"] as const satisfies readonly Aspect[];
export type PhoneAspect = (typeof PHONE_ASPECTS)[number];
export const isPhoneAspect = (a: unknown): a is PhoneAspect => PHONE_ASPECTS.includes(a as PhoneAspect);

/** How the admin names a shape (the stored value stays e.g. "9:19.5"). */
export const ASPECT_LABELS: Partial<Record<Aspect, string>> = {
  "9:19.5": "Modern phone 9:19.5",
  "9:16": "Classic 9:16",
  "9:18": "Tall 9:18",
};
/** Recommended upload size per shape, shown on empty slots and in the admin. */
export const ASPECT_UPLOAD: Partial<Record<Aspect, string>> = {
  "9:19.5": "1080×2340",
  "9:16": "1080×1920",
  "9:18": "1080×2160",
  "16:9": "1920×1080",
  "16:10": "1920×1200",
  "12:5": "1920×800",
  "4:5": "1080×1350",
  "1:1": "1080×1080",
  "3:4": "1080×1440",
};

export const SLOT_FITS = ["fill", "fit"] as const;
export type SlotFit = (typeof SLOT_FITS)[number];

const pid = z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/);

const slotFields = (aspects: readonly [Aspect, ...Aspect[]]) => ({
  type: z.enum(["image", "video"]),
  publicId: pid.nullable(),
  format: z.string().max(10).nullable(),
  alt: z.string().max(250),
  aspect: z.enum(aspects),
  loop: z.boolean(),
  poster: pid.nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  duration: z.number().nonnegative().nullable(),
});
const altRequired = (s: { publicId: string | null; type: string; alt: string }, ctx: z.RefinementCtx) => {
  if (s.publicId && s.type === "image" && !s.alt.trim())
    ctx.addIssue({ code: "custom", path: ["alt"], message: "Describe the image (alt text is required)." });
};

/** A slot schema; `aspects` limits the shapes the admin offers (the first is listed first). */
export const slotSchema = (aspects: readonly [Aspect, ...Aspect[]] = ASPECT_KEYS) =>
  z.object(slotFields(aspects)).superRefine(altRequired);

/** A phone screen: phone shapes only, plus Fill/Fit (older saved slots without `fit` read as fill). */
export const phoneSlotSchema = () =>
  z.object({ ...slotFields(PHONE_ASPECTS), fit: z.enum(SLOT_FITS).default("fill") }).superRefine(altRequired);
export type PhoneSlotValue = z.infer<ReturnType<typeof phoneSlotSchema>>;

export const mediaSlotSchema = slotSchema();
export type MediaSlotValue = z.infer<typeof mediaSlotSchema>;

/** An empty phone screen (Fill by default). */
export const emptyPhone = (aspect: PhoneAspect = "9:19.5", type: "image" | "video" = "video") =>
  ({ ...emptySlot(aspect, type), fit: "fill" }) satisfies PhoneSlotValue;

/** An empty slot (the default for every slot until real media is uploaded). */
export const emptySlot = <A extends Aspect>(aspect: A, type: "image" | "video" = "image") =>
  ({
    type,
    publicId: null,
    format: null,
    alt: "",
    aspect,
    loop: true,
    poster: null,
    bytes: null,
    duration: null,
  }) satisfies MediaSlotValue;

export const isGif = (s: Pick<MediaSlotValue, "format">) => s.format?.toLowerCase() === "gif";
/** Plays as a video: a real video, or a GIF (served as a looping MP4). */
export const playsAsVideo = (s: Pick<MediaSlotValue, "type" | "format">) => s.type === "video" || isGif(s);
export const isFilled = (s: Pick<MediaSlotValue, "publicId">) => Boolean(s.publicId);

/** Recognises a slot-shaped value anywhere in content (for the launch blocker list). */
export function looksLikeSlot(v: unknown): v is MediaSlotValue {
  return Boolean(v && typeof v === "object" && "aspect" in v && "publicId" in v && "type" in v && "loop" in v);
}

/** The words shown on an empty slot while building. */
export const slotLabel = (s: Pick<MediaSlotValue, "aspect" | "type">, imageMb: number, videoMb: number) =>
  `Placeholder · ${s.aspect}${ASPECT_UPLOAD[s.aspect] ? ` (${ASPECT_UPLOAD[s.aspect]})` : ""} · image or video · up to ${s.type === "video" ? videoMb : imageMb} MB`;
