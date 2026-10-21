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
};

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
  return `${dims.service.headline_label} for ${dims.niche.headline_label} Brands in ${dims.country.headline_label}`;
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
