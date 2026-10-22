import { z } from "zod";

// What the admin may edit on each proof table (R18, R19, R20, R45, R11).
// The database adds its own checks on top (an approved result needs an
// image and alt text; concept work can't have a client or a metric, etc.).

const pid = z
  .string()
  .regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/)
  .nullable();
/** How a badge logo is drawn on the red partner strip. */
export const BADGE_LOGO_STYLES = ["white", "plate", "original"] as const;
export type BadgeLogoStyle = (typeof BADGE_LOGO_STYLES)[number];

const opt = (max: number) => z.string().max(max).nullable();

export const PROOF_TABLES = {
  results: {
    label: "Results",
    tagType: "result",
    schema: z.object({
      brand_name: z.string().min(1).max(80),
      metric_value: z.string().min(1).max(40),
      metric_label: z.string().min(1).max(120),
      summary: opt(400),
      image_public_id: pid,
      image_alt: opt(200),
      logo_public_id: pid,
      approved: z.boolean(),
      is_placeholder: z.boolean(),
      sort: z.number().int(),
      notes: opt(1000),
    }),
  },
  testimonials: {
    label: "Testimonials",
    tagType: "testimonial",
    schema: z.object({
      quote: z.string().min(1).max(1200),
      person_name: z.string().min(1).max(80),
      person_role: opt(120),
      company: opt(120),
      photo_public_id: pid,
      /** Needs migration 20261022120000_testimonial_logos. */
      logo_public_id: pid,
      approved: z.boolean(),
      is_placeholder: z.boolean(),
      sort: z.number().int(),
      notes: opt(1000),
    }),
  },
  creatives: {
    label: "Creatives & reels",
    tagType: "creative",
    schema: z.object({
      kind: z.enum(["image", "reel"]),
      brand_name: z.string().min(1).max(80),
      media_public_id: pid,
      poster_public_id: pid,
      alt: opt(200),
      approved: z.boolean(),
      is_placeholder: z.boolean(),
      sort: z.number().int(),
      notes: opt(1000),
    }),
  },
  concept_works: {
    label: "Concept work",
    tagType: "concept_work",
    schema: z.object({
      kind: z.enum(["image", "reel"]),
      media_public_id: pid,
      poster_public_id: pid,
      alt: opt(200),
      label_text: z.string().min(5).max(80),
      approved: z.boolean(),
      sort: z.number().int(),
      notes: opt(1000),
    }),
  },
  badges: {
    label: "Badges",
    tagType: null,
    schema: z.object({
      label: z.string().min(1).max(80),
      sublabel: opt(80),
      image_public_id: pid,
      /** Needs migration 20261022150000_badge_logo_style. How the logo is drawn on the red strip. */
      logo_style: z.enum(BADGE_LOGO_STYLES).default("white"),
      proof_url: z.url().startsWith("https://").nullable(),
      last_verified_at: z.iso.date().nullable(),
      enabled: z.boolean(),
      sort: z.number().int(),
      notes: opt(1000),
    }),
  },
} as const;

export type ProofTable = keyof typeof PROOF_TABLES;
export const isProofTable = (t: unknown): t is ProofTable => typeof t === "string" && t in PROOF_TABLES;
