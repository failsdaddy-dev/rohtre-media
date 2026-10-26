import type { SupabaseClient } from "@supabase/supabase-js";
import { masterTemplate } from "../sections/master-template";
import { pageContentSchema, type PageContent } from "../sections/schemas";
import { headlineFor, slugFor, uniqueSlug, type DimensionValue, type PageDims } from "./dimensions";
import { collectMediaIds } from "./media-refs";
import { matchProof } from "./proof-match";
import { checkPublish, type PublishIssue } from "./publish-check";

// Landing-page operations shared by the admin (server actions) and the
// developer script (scripts/landing.ts). They take a Supabase client, so the
// admin can act as the signed-in user (RLS applies) while the script uses
// the server-only key. No "server-only" import here, so the script can load it.

type Db = SupabaseClient;

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

export async function dimensionMap(db: Db): Promise<Map<string, DimensionValue>> {
  const rows = await must(
    db.from("dimension_values").select("id, type_key, parent_id, slug, label, headline_label, attrs").order("sort"),
  );
  return new Map((rows as DimensionValue[]).map((v) => [v.id, v]));
}

export function findValue(all: Map<string, DimensionValue>, type: string, slug: string): DimensionValue {
  const v = [...all.values()].find((x) => x.type_key === type && x.slug === slug);
  if (!v) throw new Error(`No ${type} "${slug}"`);
  return v;
}

/** Create a draft landing page from content (default: the master template). */
export async function createLandingPage(
  db: Db,
  dims: PageDims,
  opts: { content?: PageContent; note: string; userId?: string | null },
): Promise<{ id: string; slug: string }> {
  const taken = ((await must(db.from("pages").select("slug"))) as { slug: string }[]).map((p) => p.slug);
  const slug = uniqueSlug(slugFor(dims), taken);
  const page = (await must(
    db.from("pages").insert({ slug, visibility: "unlisted", status: "draft" }).select("id").single(),
  )) as {
    id: string;
  };
  await must(
    db.from("page_dimensions").insert(
      (["service", "niche", "country"] as const).map((t) => ({
        page_id: page.id,
        type_key: t,
        value_id: dims[t].id,
      })),
    ),
  );
  const content = opts.content ?? masterTemplate(dims);
  const version = (await must(
    db
      .from("page_versions")
      .insert({ page_id: page.id, number: 1, content, note: opts.note, created_by: opts.userId ?? null })
      .select("id")
      .single(),
  )) as { id: string };
  await must(db.from("pages").update({ draft_version_id: version.id }).eq("id", page.id));
  return { id: page.id, slug };
}

export type LoadedPage = {
  page: {
    id: string;
    slug: string;
    visibility: string;
    status: string;
    draft_version_id: string | null;
    published_version_id: string | null;
    headline_auto: boolean;
    slug_auto: boolean;
  };
  content: PageContent | null;
  rawContent: unknown;
  dims: PageDims;
};

export async function loadLandingPage(db: Db, by: { id?: string; slug?: string }): Promise<LoadedPage> {
  let q = db
    .from("pages")
    .select("id, slug, visibility, status, draft_version_id, published_version_id, headline_auto, slug_auto");
  q = by.id ? q.eq("id", by.id) : q.eq("slug", by.slug ?? "");
  const page = (await must(q.maybeSingle())) as LoadedPage["page"] | null;
  if (!page) throw new Error("Page not found");
  const versionId = page.draft_version_id ?? page.published_version_id;
  const version = versionId
    ? ((await must(db.from("page_versions").select("content").eq("id", versionId).maybeSingle())) as {
        content: unknown;
      } | null)
    : null;
  const parsed = pageContentSchema.safeParse(version?.content);
  const all = await dimensionMap(db);
  const rows = (await must(db.from("page_dimensions").select("type_key, value_id").eq("page_id", page.id))) as {
    type_key: string;
    value_id: string;
  }[];
  const dims = Object.fromEntries(rows.map((r) => [r.type_key, all.get(r.value_id)!])) as PageDims;
  return { page, content: parsed.success ? parsed.data : null, rawContent: version?.content, dims };
}

/** Save content as a new draft version (version history, R24). */
export async function saveDraft(
  db: Db,
  pageId: string,
  content: PageContent,
  opts: { note?: string; userId?: string | null },
): Promise<{ versionId: string; number: number }> {
  const last = (await must(
    db.from("page_versions").select("number").eq("page_id", pageId).order("number", { ascending: false }).limit(1),
  )) as { number: number }[];
  const number = (last[0]?.number ?? 0) + 1;
  const version = (await must(
    db
      .from("page_versions")
      .insert({ page_id: pageId, number, content, note: opts.note ?? null, created_by: opts.userId ?? null })
      .select("id")
      .single(),
  )) as { id: string };
  await must(db.from("pages").update({ draft_version_id: version.id }).eq("id", pageId));
  return { versionId: version.id, number };
}

/** How many approved items each proof section would show on a page (for the publish check). */
export async function liveProofCounts(db: Db, dimIds: string[]) {
  const all = await dimensionMap(db);
  const pageValues = dimIds.map((id) => all.get(id)).filter((v): v is DimensionValue => Boolean(v));
  const tags = (await must(db.from("proof_tags").select("item_type, item_id, value_id"))) as {
    item_type: string;
    item_id: string;
    value_id: string;
  }[];
  const match = async (table: string, type: string, live: (r: Record<string, unknown>) => boolean) => {
    const rows = ((await must(db.from(table).select("*"))) as Record<string, unknown>[]).filter(live);
    return matchProof(
      rows.map((r) => ({
        ...r,
        id: r.id as string,
        sort: (r.sort as number) ?? 0,
        tagIds: tags.filter((t) => t.item_type === type && t.item_id === r.id).map((t) => t.value_id),
      })),
      pageValues,
      all,
    );
  };
  const isLive = (r: Record<string, unknown>) => r.approved === true && r.is_placeholder !== true;
  const concept = await match("concept_works", "concept_work", (r) => r.approved === true);
  return {
    liveCounts: {
      results: (await match("results", "result", isLive)).length,
      testimonials: (await match("testimonials", "testimonial", isLive)).length,
      creatives: (await match("creatives", "creative", isLive)).length,
      concept: concept.length,
    },
    unlabelledConcept: concept.filter((m) => !String((m.item as Record<string, unknown>).label_text ?? "").trim())
      .length,
  };
}

/** Run the publish check (R25) on a page's current draft. */
export async function publishIssues(db: Db, loaded: LoadedPage): Promise<PublishIssue[]> {
  const others = ((await must(db.from("pages").select("slug").neq("id", loaded.page.id))) as { slug: string }[]).map(
    (p) => p.slug,
  );
  const badges = ((await must(db.from("badges").select("id").eq("enabled", true))) as { id: string }[]).map(
    (b) => b.id,
  );
  const counts = await liveProofCounts(
    db,
    Object.values(loaded.dims).map((d) => d.id),
  );
  return checkPublish(loaded.rawContent, {
    slug: loaded.page.slug,
    visibility: loaded.page.visibility,
    otherSlugs: others,
    liveBadgeIds: badges,
    ...counts,
  });
}

/** Publish the current draft if the check passes. Returns the issues (empty = published). */
export async function publishPage(db: Db, pageId: string, userId: string | null): Promise<PublishIssue[]> {
  const loaded = await loadLandingPage(db, { id: pageId });
  if (!loaded.page.draft_version_id) return [{ code: "no-draft", message: "There is no draft to publish." }];
  const issues = await publishIssues(db, loaded);
  if (issues.length) return issues;
  await must(
    db
      .from("pages")
      .update({
        status: "published",
        published_version_id: loaded.page.draft_version_id,
        published_at: new Date().toISOString(),
        published_by: userId,
      })
      .eq("id", pageId),
  );
  return [];
}

/** Copy a page for another country (R7): new headline, own banner and FAQ to redo. */
export function contentForCountry(content: PageContent, target: PageDims): PageContent {
  const copy = pageContentSchema.parse(structuredClone(content));
  for (const s of copy.sections) {
    if (s.type === "hero") {
      s.props.h1 = headlineFor(target);
      s.props.offerBanner = { desktop: null, mobile: null, alt: "" }; // R16: every page has its own banner
    }
    if (s.type === "faq") s.props.items = s.props.items.map((i) => ({ ...i, status: "draft" as const })); // R17
  }
  copy.meta.title = headlineFor(target).slice(0, 70);
  return copy;
}

/** Every Cloudinary file the site currently uses (drafts, published pages, home, proof tables). */
export async function mediaInUse(db: Db): Promise<Set<string>> {
  const used = new Set<string>();
  const pages = (await must(db.from("pages").select("draft_version_id, published_version_id"))) as {
    draft_version_id: string | null;
    published_version_id: string | null;
  }[];
  const versionIds = [
    ...new Set(pages.flatMap((p) => [p.draft_version_id, p.published_version_id]).filter(Boolean)),
  ] as string[];
  if (versionIds.length) {
    const versions = (await must(db.from("page_versions").select("content").in("id", versionIds))) as {
      content: unknown;
    }[];
    for (const v of versions) collectMediaIds(v.content, used);
  }
  const home = (await must(db.from("page_content").select("data"))) as { data: unknown }[];
  collectMediaIds(home, used);
  for (const table of ["badges", "testimonials", "results", "creatives", "concept_works"]) {
    collectMediaIds(await must(db.from(table).select("*")), used);
  }
  // Work page brands (no error if the work_brands migration isn't applied yet).
  const brands = await db.from("work_brands").select("data");
  if (!brands.error) collectMediaIds(brands.data, used);
  return used;
}
