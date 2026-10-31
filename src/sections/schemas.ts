import { z } from "zod";
import { mediaSchema } from "../content/home-schema";
import { slotSchema } from "../content/media-slot";
import type { HeaderTone } from "../lib/header-tone";

// Section registry, part 1: the data (R28). One Zod schema per section type
// with a `variant` enum of at most two values (R27). A landing page is an
// ordered list of these sections stored as JSON in page_versions.content.
// The renderer (src/sections/render.tsx), the publish check, the admin
// editor (Phase 4) and the AI (Phase 5) all use these same schemas, and can
// only use these types.
//
// Adding a section type: add its schema + entry in SECTION_TYPES here, a
// renderer in render.tsx, a test, and deploy. No database change.

const text = (max: number) => z.string().max(max);
const cta = z.object({ text: text(140), label: z.string().min(1).max(40) });

export const heroSchema = z.object({
  eyebrow: text(60),
  /** The page's H1 (R4). Filled from service + niche + country, editable. */
  h1: z.string().min(1).max(120),
  subline: text(240),
  ctaLabel: z.string().min(1).max(40),
  /** R16: every page has its own offer banner; offers and prices live only inside this image. */
  offerBanner: z.object({
    desktop: mediaSchema.nullable(), // about 1200×900
    mobile: mediaSchema.nullable(), // about 1080×1350
    alt: text(250),
  }),
});

export const badgesSchema = z.object({
  eyebrow: text(60),
  /** Badge ids to show; empty = every switched-on badge. */
  badgeIds: z.array(z.uuid()).max(12),
});

export const painPointsSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  items: z
    .array(z.object({ title: z.string().min(1).max(80), text: text(260) }))
    .min(1)
    .max(6),
});

/** A result uploaded for one page: shown before matched proof, needs no approval. */
const pageResult = z.object({
  brand: text(80),
  metric: text(40),
  metricLabel: text(80),
  summary: text(300),
  file: slotSchema(["16:9", "4:3", "1:1", "9:16"]),
});

export const resultsSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  intro: text(300),
  uploads: z.array(pageResult).max(3).default([]),
  /** How many matched results to show (R15: 2-3 dashboards). */
  limit: z.number().int().min(1).max(3),
  cta,
});

export const creativesSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  intro: text(300),
  /** Images and videos uploaded for this page: shown before matched proof, need no approval. */
  media: z.array(slotSchema(["4:5", "1:1", "9:16", "16:9"])).max(12).default([]),
  limit: z.number().int().min(1).max(12),
  /** R45: allow labelled concept work after the real work. */
  showConcept: z.boolean(),
});

export const platformsSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  items: z
    .array(z.object({ name: z.string().min(1).max(40), text: text(200) }))
    .min(1)
    .max(8),
});

export const testimonialsSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  cta,
});

export const processSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  intro: text(300),
  steps: z
    .array(z.object({ title: z.string().min(1).max(60), text: text(200) }))
    .min(1)
    .max(5),
  cta,
});

export const faqSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  /** Written fresh per page, never merged from other pages (R17). */
  items: z
    .array(
      z.object({ q: z.string().min(1).max(200), a: z.string().min(1).max(1200), status: z.enum(["draft", "ready"]) }),
    )
    .max(12),
  cta,
});

export const formSchema = z.object({
  eyebrow: text(60),
  title: text(100),
  accent: text(60),
  intro: text(300),
  formTitle: text(80),
  /** Pre-selects "Interested in" on the form. */
  defaultInterest: text(80),
});

/**
 * R26: custom HTML. "sanitized" (default, any staff member): cleaned of
 * scripts, iframes and event handlers. "raw" (owner/developer only, checked
 * when saving): kept as written, scripts allowed, under the site's CSP.
 */
export const customHtmlSchema = z.object({
  html: z.string().max(20000),
  mode: z.enum(["sanitized", "raw"]),
});

/** Every section type: schema, allowed variants, and the header tone it needs when first. */
export const SECTION_TYPES = {
  hero: { schema: heroSchema, variants: ["banner-right", "banner-below"], headerTone: "transparent-dark-text" },
  badges: { schema: badgesSchema, variants: ["bar"], headerTone: undefined },
  painPoints: { schema: painPointsSchema, variants: ["cards", "list"], headerTone: undefined },
  results: { schema: resultsSchema, variants: ["stack", "grid"], headerTone: undefined },
  creatives: { schema: creativesSchema, variants: ["images-first", "reels-first"], headerTone: undefined },
  platforms: { schema: platformsSchema, variants: ["cards"], headerTone: undefined },
  testimonials: { schema: testimonialsSchema, variants: ["slider", "grid"], headerTone: undefined },
  process: { schema: processSchema, variants: ["timeline"], headerTone: undefined },
  faq: { schema: faqSchema, variants: ["two-column"], headerTone: undefined },
  form: { schema: formSchema, variants: ["split"], headerTone: undefined },
  customHtml: { schema: customHtmlSchema, variants: ["contained", "full-width"], headerTone: undefined },
} as const satisfies Record<
  string,
  { schema: z.ZodType; variants: readonly string[]; headerTone: HeaderTone | undefined }
>;

export type SectionType = keyof typeof SECTION_TYPES;
export const SECTION_TYPE_NAMES = Object.keys(SECTION_TYPES) as SectionType[];

function sectionOf<T extends SectionType>(type: T) {
  const def = SECTION_TYPES[type];
  return z.object({
    id: z.string().min(1).max(40),
    type: z.literal(type),
    variant: z.enum(def.variants as unknown as [string, ...string[]]),
    enabled: z.boolean(),
    props: def.schema as (typeof SECTION_TYPES)[T]["schema"],
  });
}

export const sectionSchema = z.discriminatedUnion("type", [
  sectionOf("hero"),
  sectionOf("badges"),
  sectionOf("painPoints"),
  sectionOf("results"),
  sectionOf("creatives"),
  sectionOf("platforms"),
  sectionOf("testimonials"),
  sectionOf("process"),
  sectionOf("faq"),
  sectionOf("form"),
  sectionOf("customHtml"),
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

/** What page_versions.content holds. */
export const pageContentSchema = z.object({
  meta: z.object({
    title: z.string().max(70), // shown in Google; aim for 50-60
    description: z.string().max(170), // aim for 120-160
  }),
  sections: z.array(sectionSchema).min(1).max(20),
});
export type PageContent = z.infer<typeof pageContentSchema>;
