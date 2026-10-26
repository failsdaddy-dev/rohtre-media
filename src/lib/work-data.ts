import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_BRANDS, DEFAULT_RECOGNITION, DEFAULT_WORK } from "@/content/work-defaults";
import {
  parseBrandData,
  parseSections,
  recognitionSchema,
  workSchema,
  type Brand,
  type RecognitionContent,
  type WorkContent,
} from "@/content/work-schema";
import { supabasePublic } from "./supabase/public";

// Data for Work, the brand pages and Recognition. Saving in the admin calls
// updateTag() with these tags, so the pages refresh straight away (no
// redeploy): a brand saved as published gets its card on /work and its page
// /work/[slug] at once; an unpublished one disappears and its page 404s.
//   Work / Recognition: page_content rows "work" / "recognition".
//   Brands: public.work_brands; RLS lets the public key read published rows
//   only. Until the work_brands migration is applied the table doesn't
//   exist, and the ten brands copied from the live site are shown.
export const WORK_TAG = "page:work";
export const RECOGNITION_TAG = "page:recognition";
export const BRANDS_TAG = "work:brands";

export type BrandRow = { id: string; slug: string; published: boolean; sort_order: number; data: unknown };

export const rowToBrand = (r: BrandRow): Brand | null => {
  const data = parseBrandData(r.data);
  return data ? { ...data, id: r.id, slug: r.slug, published: r.published, sort: r.sort_order } : null;
};

async function readPage(key: string): Promise<unknown> {
  const sb = supabasePublic(); // RLS: page_content is public to read
  if (!sb) return null;
  const { data, error } = await sb.from("page_content").select("data").eq("key", key).maybeSingle();
  return error || !data ? null : data.data;
}

export async function getWorkContent(): Promise<WorkContent> {
  "use cache";
  cacheTag(WORK_TAG);
  cacheLife("max");
  const raw = await readPage("work");
  return raw ? parseSections(workSchema, raw, DEFAULT_WORK) : DEFAULT_WORK;
}

export async function getRecognitionContent(): Promise<RecognitionContent> {
  "use cache";
  cacheTag(RECOGNITION_TAG);
  cacheLife("max");
  const raw = await readPage("recognition");
  return raw ? parseSections(recognitionSchema, raw, DEFAULT_RECOGNITION) : DEFAULT_RECOGNITION;
}

/** Published brands in their order (the /work grid, the brand pages, the sitemap). */
export async function getBrands(): Promise<Brand[]> {
  "use cache";
  cacheTag(BRANDS_TAG);
  cacheLife("max");
  const sb = supabasePublic();
  if (!sb) return DEFAULT_BRANDS;
  const { data, error } = await sb
    .from("work_brands")
    .select("id, slug, published, sort_order, data")
    .eq("published", true)
    .order("sort_order")
    .order("created_at");
  if (error) return DEFAULT_BRANDS; // table not created yet: the live site's ten brands
  return (data as BrandRow[]).map(rowToBrand).filter((b): b is Brand => b !== null);
}

export async function getBrand(slug: string): Promise<Brand | null> {
  return (await getBrands()).find((b) => b.slug === slug) ?? null;
}
