import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { pageContentSchema, type PageContent } from "@/sections/schemas";
import type { DimensionValue, PageDims } from "./dimensions";
import { isLiveProof } from "./proof";
import { matchProof, type Tagged } from "./proof-match";
import { SHOW_PLACEHOLDERS, type Result, type Testimonial } from "./home-data";
import { supabaseAdmin } from "./supabase/admin";
import { supabasePublic } from "./supabase/public";

// Data for landing pages (/lp/[slug]). Publishing calls updateTag() /
// revalidateTag() with these tags so the cached pages refresh (R35).
export const LANDING_TAG = "landing";
export const pageTag = (slug: string) => `lp:${slug}`;

/**
 * While building (npm run dev) the newest draft is shown, with placeholders,
 * read with the server-only secret key. A production build only ever sees
 * published pages through the public key, so RLS decides what is public.
 */
const client = () => (SHOW_PLACEHOLDERS ? supabaseAdmin() : null) ?? supabasePublic();

export type LandingPage = {
  id: string;
  slug: string;
  visibility: "public" | "unlisted" | "private";
  status: "draft" | "published" | "archived";
  /** True when this is an unpublished draft (only while building). */
  isDraft: boolean;
  content: PageContent;
  dims: PageDims;
  dimValues: DimensionValue[];
};

export async function getDimensionValues(): Promise<DimensionValue[]> {
  "use cache";
  cacheTag(LANDING_TAG);
  cacheLife("max");
  const sb = supabasePublic();
  if (!sb) return [];
  const { data } = await sb
    .from("dimension_values")
    .select("id, type_key, parent_id, slug, label, headline_label, attrs")
    .order("sort");
  return (data ?? []) as DimensionValue[];
}

export async function getLandingPage(slug: string): Promise<LandingPage | null> {
  "use cache";
  cacheTag(LANDING_TAG, pageTag(slug));
  cacheLife("max");
  const sb = client();
  if (!sb || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;

  const { data: page } = await sb
    .from("pages")
    .select("id, slug, visibility, status, draft_version_id, published_version_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) return null;
  if (page.visibility === "private" && !SHOW_PLACEHOLDERS) return null; // private pages need a preview link (Phase 4)

  const versionId = SHOW_PLACEHOLDERS
    ? (page.draft_version_id ?? page.published_version_id)
    : page.published_version_id;
  if (!versionId || (!SHOW_PLACEHOLDERS && page.status !== "published")) return null;
  const { data: version } = await sb.from("page_versions").select("content").eq("id", versionId).maybeSingle();
  const parsed = pageContentSchema.safeParse(version?.content);
  if (!parsed.success) return null;

  const { data: dimRows } = await sb.from("page_dimensions").select("type_key, value_id").eq("page_id", page.id);
  const values = new Map((await getDimensionValues()).map((v) => [v.id, v]));
  const dimValues = (dimRows ?? []).map((d) => values.get(d.value_id)).filter((v): v is DimensionValue => Boolean(v));
  const byType = Object.fromEntries(dimValues.map((v) => [v.type_key, v])) as PageDims;
  if (!byType.service || !byType.niche || !byType.country) return null;

  return {
    id: page.id,
    slug: page.slug,
    visibility: page.visibility,
    status: page.status,
    isDraft: versionId !== page.published_version_id,
    content: parsed.data,
    dims: byType,
    dimValues,
  };
}

export type Creative = {
  id: string;
  kind: "image" | "reel";
  brand_name: string | null;
  media_public_id: string | null;
  poster_public_id: string | null;
  alt: string | null;
  approved: boolean;
  is_placeholder: boolean;
  /** Set for concept work only (R45). */
  label_text?: string;
  concept: boolean;
};

export type LandingProof = {
  results: Result[];
  testimonials: Testimonial[];
  creatives: Creative[];
  concept: Creative[];
};

/** Proof matched to a page's dimensions (R18). Live only on the public site. */
export async function getLandingProof(dimValueIds: string[]): Promise<LandingProof> {
  "use cache";
  cacheTag(LANDING_TAG, "proof");
  cacheLife("max");
  const empty: LandingProof = { results: [], testimonials: [], creatives: [], concept: [] };
  const sb = client();
  if (!sb) return empty;

  const [results, testimonials, creatives, concept, tags, all] = await Promise.all([
    sb.from("results").select("*").order("sort"),
    sb.from("testimonials").select("*").order("sort"),
    sb.from("creatives").select("*").order("sort"),
    sb.from("concept_works").select("*").order("sort"),
    sb.from("proof_tags").select("item_type, item_id, value_id"),
    getDimensionValues(),
  ]);
  const values = new Map(all.map((v) => [v.id, v]));
  const page = dimValueIds.map((id) => values.get(id)).filter((v): v is DimensionValue => Boolean(v));
  const tagsOf = (type: string, id: string) =>
    (tags.data ?? []).filter((t) => t.item_type === type && t.item_id === id).map((t) => t.value_id as string);
  const match = <T extends { id: string; sort?: number }>(type: string, rows: T[]) =>
    matchProof(
      rows.map((r) => ({ ...r, sort: r.sort ?? 0, tagIds: tagsOf(type, r.id) }) as T & Tagged),
      page,
      values,
    ).map((m) => m.item);

  const live = <T extends { approved: boolean; is_placeholder: boolean }>(rows: T[]) =>
    SHOW_PLACEHOLDERS ? rows : rows.filter(isLiveProof);

  return {
    results: match("result", live((results.data ?? []) as Result[])),
    testimonials: match("testimonial", live((testimonials.data ?? []) as Testimonial[])),
    creatives: match(
      "creative",
      live(((creatives.data ?? []) as Omit<Creative, "concept">[]).map((c) => ({ ...c, concept: false }))),
    ),
    concept: match(
      "concept_work",
      ((concept.data ?? []) as Omit<Creative, "concept" | "is_placeholder" | "brand_name">[])
        .map((c) => ({ ...c, brand_name: null, is_placeholder: false, concept: true }))
        .filter((c) => SHOW_PLACEHOLDERS || c.approved),
    ),
  };
}

/** Where an old landing-page address now lives (slug changes add these, R3). */
export async function getRedirect(path: string): Promise<string | null> {
  "use cache";
  cacheTag(LANDING_TAG);
  cacheLife("max");
  const sb = supabasePublic();
  if (!sb) return null;
  const { data } = await sb.from("redirects").select("to_path").eq("from_path", path).maybeSingle();
  return (data?.to_path as string | undefined) ?? null;
}

/** Published landing pages (for prerendering and the sitemap). */
export async function listPublishedLanding(): Promise<{ slug: string; visibility: string; updated_at: string }[]> {
  "use cache";
  cacheTag(LANDING_TAG);
  cacheLife("max");
  const sb = supabasePublic();
  if (!sb) return [];
  const { data } = await sb.from("pages").select("slug, visibility, updated_at").eq("status", "published");
  return data ?? [];
}

/** Every landing slug the current mode can show (drafts only while building). */
export async function listLandingSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(LANDING_TAG);
  cacheLife("max");
  if (!SHOW_PLACEHOLDERS) return (await listPublishedLanding()).map((p) => p.slug);
  const sb = client();
  if (!sb) return [];
  const { data } = await sb.from("pages").select("slug");
  return (data ?? []).map((p) => p.slug as string);
}
