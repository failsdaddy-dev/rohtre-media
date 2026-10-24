import { z } from "zod";
import { slotSchema } from "./media-slot";

// The legal pages (Terms of Service, Privacy Notice, Fraudulent Use of Our
// Name, Cookie Settings, Do Not Sell My Info), edited in Admin → Legal and
// stored like the other pages: one JSON row per page in public.page_content
// (key "legal-<slug>"). Until a page is saved, the copy of the live page in
// legal-defaults.ts is shown.
//
// A page is ordered SECTIONS; a section has an optional small label (e.g.
// "01"), a heading (H2 or H3), an optional line under it, and ordered
// BLOCKS: paragraph, bulleted list, numbered list, table, link button,
// media (image or video). Text is plain with three marks only:
// **bold**, *italic* and [link text](url); a line break is kept. No HTML is
// stored or rendered (tags are stripped on save, text is escaped on render).

const line = (max: number) => z.string().max(max);
/** Internal paths, anchors, https, email and phone links only. */
export const LINK_RE = /^(\/(?!\/)|#|https:\/\/|mailto:|tel:)\S*$/;
const href = z.string().regex(LINK_RE, "Start with /, #, https://, mailto: or tel:");

/** Every [text](url) inside a text must use an allowed link. */
const rich = (max: number) =>
  line(max).refine(
    (v) => [...v.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].every((m) => LINK_RE.test(m[2])),
    "A link must start with /, #, https://, mailto: or tel:",
  );

export const BLOCK_TYPES = ["paragraph", "bullets", "numbered", "table", "button", "media"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: rich(3000).min(1) }),
  z.object({ type: z.literal("bullets"), items: z.array(rich(800).min(1)).min(1).max(40) }),
  z.object({ type: z.literal("numbered"), items: z.array(rich(800).min(1)).min(1).max(40) }),
  z.object({
    type: z.literal("table"),
    /** Column headings; empty = a table without a heading row. */
    header: z.array(rich(120)).max(8),
    rows: z.array(z.array(rich(400)).min(1).max(8)).min(1).max(60),
  }),
  z.object({ type: z.literal("button"), label: line(60).min(1), href }),
  z.object({ type: z.literal("media"), media: slotSchema() }),
]);
export type Block = z.infer<typeof blockSchema>;

/** Section icons: names from the site's icon set (ServiceIcon) plus "lock". */
export const LEGAL_ICONS = [
  "book",
  "key",
  "briefcase",
  "users",
  "cart",
  "pen",
  "eye",
  "target",
  "clock",
  "globe",
  "megaphone",
  "box",
  "growth",
  "network",
  "monitor",
  "calendar",
  "heart",
  "lock",
  "search",
  "sparkles",
  "cursor",
  "star",
] as const;
export type LegalIcon = (typeof LEGAL_ICONS)[number];

/** Section card colours (never red), used in this order when a section has none. */
export const LEGAL_COLORS = {
  amber: "#F59E0B",
  blue: "#2563EB",
  violet: "#7C3AED",
  teal: "#0D9488",
  green: "#16A34A",
  pink: "#DB2777",
  orange: "#EA580C",
  sky: "#0284C7",
  indigo: "#4F46E5",
} as const;
export type LegalColor = keyof typeof LEGAL_COLORS;
const COLOR_KEYS = Object.keys(LEGAL_COLORS) as LegalColor[];

export const sectionSchema = z.object({
  /** Small label above the heading, e.g. "01" or "Known Scams". */
  label: line(60),
  /** Empty = a section without a heading (not in the table of contents). */
  heading: line(160),
  level: z.enum(["h2", "h3"]),
  /** A short line under the heading. */
  subtitle: line(200),
  blocks: z.array(blockSchema).max(40),
  /** Card icon and colour (H2 sections). Empty = chosen from the heading / by position. */
  icon: z.enum(["", ...LEGAL_ICONS] as ["", ...LegalIcon[]]).default(""),
  color: z.enum(["", ...COLOR_KEYS] as ["", ...LegalColor[]]).default(""),
});
export type LegalSection = z.infer<typeof sectionSchema>;

export const legalPageSchema = z.object({
  title: line(100).min(1),
  /** Small label above the title. */
  eyebrow: line(60),
  intro: rich(600),
  /** As written on the page, e.g. "January 1, 2025". Empty = not shown. */
  effective: line(60),
  /** As written on the page, e.g. "May 2025". Empty = not shown. */
  updated: line(60),
  seoTitle: line(70).min(1),
  seoDescription: line(170).min(1),
  sections: z.array(sectionSchema).max(80),
});
export type LegalPage = z.infer<typeof legalPageSchema>;

/** The five pages: route slug, footer/admin label, storage key. Any other slug is a 404. */
export const LEGAL_PAGES = [
  { slug: "terms-of-service", label: "Terms of Service", icon: "book", accent: "#2563EB" },
  { slug: "privacy-notice", label: "Privacy Notice", icon: "lock", accent: "#0D9488" },
  { slug: "fraudulent-use", label: "Fraudulent Use of Our Name", icon: "search", accent: "#DB2777" },
  { slug: "cookie-settings", label: "Cookie Settings", icon: "monitor", accent: "#F59E0B" },
  { slug: "do-not-sell", label: "Do Not Sell My Info", icon: "key", accent: "#7C3AED" },
] as const;
export type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];
export const isLegalSlug = (s: string): s is LegalSlug => LEGAL_PAGES.some((p) => p.slug === s);
export const legalKey = (slug: LegalSlug) => `legal-${slug}`;

/** Icon chosen from a section heading's meaning; "book" when nothing matches. */
const ICON_RULES: [RegExp, LegalIcon][] = [
  [/doing about|response/i, "sparkles"],
  [/accept/i, "key"],
  [/service/i, "briefcase"],
  [/responsib|who we are|about/i, "users"],
  [/payment|fee/i, "cart"],
  [/intellectual|property|own/i, "pen"],
  [/confidential|transparen|exactly what/i, "eye"],
  [/liabilit|disclaim|scheme|scam/i, "target"],
  [/terminat|how long|keep it/i, "clock"],
  [/governing|law|jurisdiction|official contact/i, "globe"],
  [/question|contact|report|tell us|encounter/i, "megaphone"],
  [/collect/i, "box"],
  [/how we use/i, "growth"],
  [/shar|platform/i, "network"],
  [/cookie|tracking|small files/i, "monitor"],
  [/right|control|opt|request/i, "cursor"],
  [/child/i, "heart"],
  [/secur|protect/i, "lock"],
  [/verify|sure if/i, "search"],
  [/change/i, "calendar"],
];
export const autoIcon = (heading: string): LegalIcon =>
  ICON_RULES.find(([re]) => re.test(heading))?.[1] ?? "book";
export const autoColor = (index: number): string => LEGAL_COLORS[COLOR_KEYS[index % COLOR_KEYS.length]];

/** Anchor id for a heading: "01 Acceptance of Terms" → "acceptance-of-terms". */
export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/\*\*|\*|\[|\]\([^)]*\)/g, "")
      .replace(/^[^a-z]+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/** A saved page that fails its check falls back to the default (the page never breaks). */
export function parseLegal(raw: unknown, fallback: LegalPage): LegalPage {
  const parsed = legalPageSchema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}
