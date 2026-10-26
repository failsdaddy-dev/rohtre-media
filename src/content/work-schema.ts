import { z } from "zod";
import { emptySlot, slotSchema } from "./media-slot";

// Work (/work), the brand pages (/work/[slug]) and Recognition (/recognition).
//   Work page and Recognition page: one JSON row each in public.page_content
//   (keys "work" and "recognition"), like the other company pages.
//   Brands: one row each in public.work_brands (slug, published, order and
//   a JSON `data` checked by brandSchema), so a brand added in Admin → Work
//   page gets its card and its own page straight away.
// Until something is saved, the copy of the live pages in work-defaults.ts
// is shown. Text is plain (tags stripped on save, escaped on render).

const line = (max: number) => z.string().max(max);
/** Internal links ("/contact"), anchors ("#x") or https links only. */
export const HREF_RE = /^(\/(?!\/)|#|https:\/\/)\S*$/;
const href = z.string().regex(HREF_RE, "Start with /, # or https://");
/** Images copied from the live site into public/images (shown until a file is uploaded). */
const LOCAL_SRC = /^\/images\/(work|recognition)\/[a-z0-9-]+\.(webp|png|jpe?g)$/;

/**
 * An image: an uploaded file (media slot, Cloudinary) or, while the slot is
 * empty, the copy of the live site's image in public/images (`src`, with its
 * size `w` × `h`). The alt text is the slot's alt.
 */
export const picSchema = (aspects: Parameters<typeof slotSchema>[0]) =>
  z.object({
    media: slotSchema(aspects),
    src: z.union([z.literal(""), z.string().regex(LOCAL_SRC)]),
    w: z.number().int().min(0).max(8000),
    h: z.number().int().min(0).max(8000),
  });
export type Pic = z.infer<ReturnType<typeof picSchema>>;

/** A copied image with its alt text and size. */
export const localPic = (
  aspect: "1:1" | "16:9" | "21:9" | "4:3",
  src: string,
  w: number,
  h: number,
  alt: string,
): Pic => ({ media: { ...emptySlot(aspect), alt }, src, w, h });
export const emptyPic = (aspect: "1:1" | "16:9" | "21:9" | "4:3"): Pic => ({
  media: emptySlot(aspect),
  src: "",
  w: 0,
  h: 0,
});
export const hasPic = (p: Pic) => Boolean(p.media.publicId || p.src);

/** A red-strip number: "+" "1.5" "M", then the label and the line under it. The value counts up. */
export const statSchema = z.object({
  prefix: line(8),
  value: z.string().regex(/^\d+(\.\d+)?$/, "Digits only, e.g. 200 or 1.5"),
  suffix: line(12),
  label: line(60),
  text: line(240),
});
export type Stat = z.infer<typeof statSchema>;
export const statText = (s: Stat) => `${s.prefix}${s.value}${s.suffix}`;

const button = z.object({ label: line(40).min(1), href });

const seo = z.object({
  title: line(70).min(1),
  description: line(500),
});

// -------------------------------------------------------------- work page
/** A video frame: a media slot plus the caption above it. */
const videoFrame = z.object({ caption: line(120), media: slotSchema(["16:9"]) });

export const workSchema = z.object({
  hero: z.object({
    title: line(140).min(1),
    intro: line(400),
    image: picSchema(["16:9"]),
    /** Which point of the photo stays in view when it is cropped (0 = left, 100 = right). */
    focusX: z.number().int().min(0).max(100),
    focusXMobile: z.number().int().min(0).max(100),
    buttons: z.array(button).max(2),
  }),
  stats: z.object({ enabled: z.boolean(), items: z.array(statSchema).max(8) }),
  intro: z.object({
    eyebrow: line(40),
    title: line(140),
    body: line(1200),
  }),
  brands: z.object({
    eyebrow: line(40),
    title: line(140),
    /** A short line under the heading ([DRAFT]: not on the live page). */
    pointer: line(160),
    cardLabel: line(30).min(1),
  }),
  videos: z.object({
    enabled: z.boolean(),
    eyebrow: line(40),
    title: line(140),
    body: line(1200),
    first: videoFrame,
    second: videoFrame,
  }),
  cta: z.object({
    eyebrow: line(60),
    title: line(80).min(1),
    accent: line(80),
    text: line(240),
    label: line(30).min(1),
  }),
  seo,
});
export type WorkContent = z.infer<typeof workSchema>;

// ------------------------------------------------------------------ brands
/** Slugs a brand can't take (they would read as admin words or other pages). */
export const RESERVED_SLUGS = [
  "new",
  "edit",
  "admin",
  "api",
  "work",
  "recognition",
  "page",
  "index",
  "about",
  "careers",
  "contact",
  "lp",
  "login",
];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** "Law Care Legal" → "law-care-legal" (lowercase ASCII, hyphens). */
export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");

/** The live pages' THE COMPANY / THE CHALLENGE / ... blocks. */
const storySection = z.object({
  label: line(60),
  lead: line(800),
  paragraphs: z.array(line(2000).min(1)).max(12),
  bullets: z.array(line(400).min(1)).max(20),
});

export const brandSchema = z.object({
  name: line(60).min(1),
  logo: picSchema(["1:1"]),
  /** The card's one line (the live page's headline; the card cuts it to 3 lines). */
  overview: line(240),
  eyebrow: line(60),
  headline: line(240).min(1),
  description: z.array(line(1500).min(1)).max(8),
  buttons: z.array(button).max(2),
  metrics: z.array(statSchema).max(8),
  sections: z.array(storySection).max(10),
  gallery: z.array(picSchema(["21:9", "16:9", "4:3", "1:1"])).max(12),
  videos: z.array(slotSchema(["16:9", "4:3", "1:1", "9:16"])).max(6),
  seo,
});
export type BrandData = z.infer<typeof brandSchema>;

/** A brand as the site and admin use it (row columns + data). */
export type Brand = BrandData & { id: string; slug: string; published: boolean; sort: number };

/** A new, empty brand (the admin's "Add brand"). */
export const blankBrand = (): BrandData => ({
  name: "",
  logo: emptyPic("1:1"),
  overview: "",
  eyebrow: "",
  headline: "",
  description: [],
  buttons: [
    { label: "Learn more", href: "/contact" },
    { label: "Hire us", href: "/contact" },
  ],
  metrics: [],
  sections: [],
  gallery: [],
  videos: [],
  seo: { title: "", description: "" },
});

/** A brand's page content without its row fields (id, slug, published, sort). */
export function brandDataOf(b: Brand): BrandData {
  const d: Partial<Brand> = { ...b };
  delete d.id;
  delete d.slug;
  delete d.published;
  delete d.sort;
  return d as BrandData;
}

export const parseBrandData = (raw: unknown): BrandData | null => {
  const r = brandSchema.safeParse(raw);
  return r.success ? r.data : null;
};

// -------------------------------------------------------- recognition page
const slide = z.object({
  image: picSchema(["16:9"]),
  title: line(200).min(1),
  text: line(400),
  buttons: z.array(button).max(2),
});
const award = z.object({
  logo: picSchema(["1:1"]),
  title: line(120).min(1),
  body: line(1200),
});
const quote = z.object({
  quote: line(800).min(1),
  name: line(80).min(1),
  role: line(120),
  photo: picSchema(["1:1"]),
});

export const recognitionSchema = z.object({
  hero: z.object({ slides: z.array(slide).max(15) }),
  awards: z.object({ enabled: z.boolean(), items: z.array(award).max(12) }),
  clients: z.object({
    enabled: z.boolean(),
    eyebrow: line(40),
    title: line(140),
    items: z.array(quote).max(12),
  }),
  team: z.object({
    enabled: z.boolean(),
    image: picSchema(["4:3", "16:9", "1:1"]),
    eyebrow: line(40),
    title: line(140),
    body: line(800),
    linkLabel: line(60),
    linkHref: z.union([z.literal(""), href]),
  }),
  seo,
});
export type RecognitionContent = z.infer<typeof recognitionSchema>;

/** A saved page that fails its check falls back section by section to the default (the page never breaks). */
export function parseSections<T extends Record<string, unknown>>(
  schema: { shape: Record<string, z.ZodType> },
  raw: unknown,
  fallback: T,
): T {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const [key, s] of Object.entries(schema.shape)) {
    const r = (s as z.ZodType).safeParse(src[key]);
    out[key] = r.success ? r.data : fallback[key];
  }
  return out as T;
}
