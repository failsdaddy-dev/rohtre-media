import { z } from "zod";

// Landing-page dimensions (R1): service x niche x country, extensible by
// adding a dimension type. Pure functions, used by the site, the publish
// check, the page script and the tests.

export type DimensionValue = {
  id: string;
  type_key: string;
  parent_id: string | null;
  slug: string;
  label: string;
  headline_label: string;
  attrs: Record<string, unknown>;
  /** Loaded by the admin (dimensionMap); off = hidden from the "New landing page" dropdowns. */
  active?: boolean;
  sort?: number;
};

/** Added from the admin (attrs.custom), not one of the seeded values. */
export const isCustomValue = (v: Pick<DimensionValue, "attrs">) => v.attrs.custom === true;

/** Niche wording that doesn't read as "... Brands" (e.g. "Schools"): no "Brands" in its headline or URL. */
const noBrands = (niche: Pick<DimensionValue, "attrs">) => niche.attrs.noBrands === true;

/** "Clothing Brands": how a niche reads inside a headline. */
export function nichePhrase(niche: Pick<DimensionValue, "attrs" | "headline_label">): string {
  return noBrands(niche) ? niche.headline_label : `${niche.headline_label} Brands`;
}

/** Editor prompt for text a new custom page still needs. Publishing is refused while one remains. */
export const promptText = (what: string) => `[Add ${what} here]`;
export const HAS_PROMPT = /\[Add [^\]]* here\]/;

/** Words a custom option's URL text can't be. */
const RESERVED_SLUGS = new Set(["admin", "api", "lp", "login", "preview", "new", "draft", "brands", "auth", "no-access"]);

/** "Video Editing!" -> "video-editing" */
export function slugPart(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

const plainText = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .min(min, `${what} needs at least ${min} characters.`)
    .max(max, `${what} can be up to ${max} characters.`)
    .regex(/^[^<>]*$/, `${what} can’t contain < or >.`);

export const optionNameSchema = plainText(2, 60, "The name");
export const optionWordingSchema = plainText(2, 48, "The headline wording");
export const optionSlugSchema = z
  .string()
  .min(2, "The URL text needs at least 2 characters.")
  .max(40, "The URL text can be up to 40 characters.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The URL text may only use a-z, 0-9 and single dashes.")
  .refine((s) => !RESERVED_SLUGS.has(s), "That URL text is reserved. Choose another.");

/** What the admin's "Headline wording" box means for a niche: "Video Editing Brands" or "Schools". */
export function parseNicheWording(wording: string): { headline_label: string; noBrands: boolean } {
  const match = wording.match(/^(.+?)\s+brands$/i);
  return match ? { headline_label: match[1], noBrands: false } : { headline_label: wording, noBrands: true };
}

/** Per-country settings stored in dimension_values.attrs (R7). */
export const countryAttrsSchema = z.object({
  iso: z.string().length(2),
  currency: z.string().length(3),
  locale: z.string().min(2).max(12),
  timeZone: z.string().min(3).max(60),
});
export type CountryAttrs = z.infer<typeof countryAttrsSchema>;

export const DEFAULT_COUNTRY: CountryAttrs = { iso: "IN", currency: "INR", locale: "en-IN", timeZone: "Asia/Kolkata" };

export function countryAttrs(value: Pick<DimensionValue, "attrs"> | null | undefined): CountryAttrs {
  const parsed = countryAttrsSchema.safeParse(value?.attrs);
  return parsed.success ? parsed.data : DEFAULT_COUNTRY;
}

/** The dimension values chosen for one page, keyed by type. */
export type PageDims = { service: DimensionValue; niche: DimensionValue; country: DimensionValue } & Record<
  string,
  DimensionValue
>;

/**
 * Slug pattern (Gate 0, option B): {service}-{niche}-brands-{country},
 * e.g. "meta-ads-fashion-brands-usa". Always editable later; a slug edit adds
 * a 301 (database trigger).
 */
export function slugFor(dims: Pick<PageDims, "service" | "niche" | "country">): string {
  if (noBrands(dims.niche)) return [dims.service.slug, dims.niche.slug, dims.country.slug].join("-");
  return [dims.service.slug, dims.niche.slug, "brands", dims.country.slug].join("-");
}

/** Make a slug unique against the ones already taken: add -2, -3, … */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Headline (R4): "Meta Ads for Fashion Brands in the USA". Editable later. */
export function headlineFor(dims: Pick<PageDims, "service" | "niche" | "country">): string {
  return `${dims.service.headline_label} for ${nichePhrase(dims.niche)} in ${dims.country.headline_label}`;
}

/** A value plus all its ancestors (e.g. clothing → fashion), nearest first. */
export function lineage(value: DimensionValue, all: Map<string, DimensionValue>): DimensionValue[] {
  const out: DimensionValue[] = [];
  let cur: DimensionValue | undefined = value;
  while (cur && out.length < 10) {
    out.push(cur);
    cur = cur.parent_id ? all.get(cur.parent_id) : undefined;
  }
  return out;
}

/** Money in result metrics, in the country's format (R7; never prices, R16). */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
