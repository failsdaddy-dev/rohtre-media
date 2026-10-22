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

export const ASPECTS = {
  "16:9": 16 / 9,
  "12:5": 12 / 5,
  "4:5": 4 / 5,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
} as const;
export type Aspect = keyof typeof ASPECTS;
const ASPECT_KEYS = Object.keys(ASPECTS) as [Aspect, ...Aspect[]];

const pid = z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/);

export const mediaSlotSchema = z
  .object({
    type: z.enum(["image", "video"]),
    publicId: pid.nullable(),
    format: z.string().max(10).nullable(),
    alt: z.string().max(250),
    aspect: z.enum(ASPECT_KEYS),
    loop: z.boolean(),
    poster: pid.nullable(),
    bytes: z.number().int().nonnegative().nullable(),
    duration: z.number().nonnegative().nullable(),
  })
  .superRefine((s, ctx) => {
    if (s.publicId && s.type === "image" && !s.alt.trim())
      ctx.addIssue({ code: "custom", path: ["alt"], message: "Describe the image (alt text is required)." });
  });
export type MediaSlotValue = z.infer<typeof mediaSlotSchema>;

/** An empty slot (the default for every slot until real media is uploaded). */
export const emptySlot = (aspect: Aspect, type: "image" | "video" = "image"): MediaSlotValue => ({
  type,
  publicId: null,
  format: null,
  alt: "",
  aspect,
  loop: true,
  poster: null,
  bytes: null,
  duration: null,
});

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
  `Placeholder · ${s.aspect} · image or video · up to ${s.type === "video" ? videoMb : imageMb} MB`;
