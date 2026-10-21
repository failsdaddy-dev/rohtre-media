// Landing-page tool (developer only) until the admin panel arrives (Phase 4).
//   npm run lp -- list
//   npm run lp -- seed                      create the three Phase 3 pages as drafts
//   npm run lp -- check <slug>              run the publish check (R25)
//   npm run lp -- publish <slug>            publish the draft if the check passes
//   npm run lp -- duplicate <slug> <country> copy a page for another country (R7)
// Uses the server-only secret key from .env.local; never prints it.

import { createClient } from "@supabase/supabase-js";
import { headlineFor, slugFor, uniqueSlug, type DimensionValue, type PageDims } from "../src/lib/dimensions";
import { matchProof } from "../src/lib/proof-match";
import { checkPublish } from "../src/lib/publish-check";
import { masterTemplate } from "../src/sections/master-template";
import { pageContentSchema, type PageContent } from "../src/sections/schemas";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

/** The three pages the contract asks for in Phase 3 (built from facts the founder supplies). */
const SEED: [string, string, string][] = [
  ["meta-ads", "fashion", "india"], // Meta ads x fashion
  ["d2c-marketing", "fashion", "india"], // a D2C page (Google + Meta)
  ["meta-ads", "fashion", "usa"], // a USA page ("Meta Ads for Fashion Brands in the USA")
];

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

async function dimensionMap() {
  const rows = await must(
    sb.from("dimension_values").select("id, type_key, parent_id, slug, label, headline_label, attrs"),
  );
  return new Map((rows as DimensionValue[]).map((v) => [v.id, v]));
}

function find(all: Map<string, DimensionValue>, type: string, slug: string): DimensionValue {
  const v = [...all.values()].find((x) => x.type_key === type && x.slug === slug);
  if (!v) throw new Error(`No ${type} "${slug}"`);
  return v;
}

async function createPage(dims: PageDims, content: PageContent, note: string) {
  const taken = ((await must(sb.from("pages").select("slug"))) as { slug: string }[]).map((p) => p.slug);
  const slug = uniqueSlug(slugFor(dims), taken);
  const page = (await must(
    sb.from("pages").insert({ slug, visibility: "unlisted", status: "draft" }).select("id").single(),
  )) as {
    id: string;
  };
  await must(
    sb.from("page_dimensions").insert(
      (["service", "niche", "country"] as const).map((t) => ({
        page_id: page.id,
        type_key: t,
        value_id: dims[t].id,
      })),
    ),
  );
  const version = (await must(
    sb.from("page_versions").insert({ page_id: page.id, number: 1, content, note }).select("id").single(),
  )) as { id: string };
  await must(sb.from("pages").update({ draft_version_id: version.id }).eq("id", page.id));
  return slug;
}

async function loadPage(slug: string) {
  const page = (await must(
    sb
      .from("pages")
      .select("id, slug, visibility, status, draft_version_id, published_version_id")
      .eq("slug", slug)
      .maybeSingle(),
  )) as { id: string; slug: string; visibility: string; status: string; draft_version_id: string | null } | null;
  if (!page || !page.draft_version_id) throw new Error(`No draft for /lp/${slug}`);
  const version = (await must(sb.from("page_versions").select("content").eq("id", page.draft_version_id).single())) as {
    content: unknown;
  };
  const dimRows = (await must(sb.from("page_dimensions").select("type_key, value_id").eq("page_id", page.id))) as {
    type_key: string;
    value_id: string;
  }[];
  return { page, content: version.content, dimIds: dimRows.map((d) => d.value_id), dimRows };
}

async function liveCounts(dimIds: string[]) {
  const all = await dimensionMap();
  const pageValues = dimIds.map((id) => all.get(id)).filter((v): v is DimensionValue => Boolean(v));
  const tags = (await must(sb.from("proof_tags").select("item_type, item_id, value_id"))) as {
    item_type: string;
    item_id: string;
    value_id: string;
  }[];
  const count = async (table: string, type: string, live: (r: Record<string, unknown>) => boolean) => {
    const rows = ((await must(sb.from(table).select("*"))) as Record<string, unknown>[]).filter(live);
    const tagged = rows.map((r) => ({
      ...r,
      id: r.id as string,
      sort: (r.sort as number) ?? 0,
      tagIds: tags.filter((t) => t.item_type === type && t.item_id === r.id).map((t) => t.value_id),
    }));
    return matchProof(tagged, pageValues, all);
  };
  const isLive = (r: Record<string, unknown>) => r.approved === true && r.is_placeholder !== true;
  const concept = await count("concept_works", "concept_work", (r) => r.approved === true);
  return {
    liveCounts: {
      results: (await count("results", "result", isLive)).length,
      testimonials: (await count("testimonials", "testimonial", isLive)).length,
      creatives: (await count("creatives", "creative", isLive)).length,
      concept: concept.length,
    },
    unlabelledConcept: concept.filter((m) => !String((m.item as Record<string, unknown>).label_text ?? "").trim())
      .length,
  };
}

async function check(slug: string) {
  const { page, content, dimIds } = await loadPage(slug);
  const others = ((await must(sb.from("pages").select("slug").neq("id", page.id))) as { slug: string }[]).map(
    (p) => p.slug,
  );
  const badges = ((await must(sb.from("badges").select("id").eq("enabled", true))) as { id: string }[]).map(
    (b) => b.id,
  );
  const counts = await liveCounts(dimIds);
  return {
    page,
    issues: checkPublish(content, {
      slug,
      visibility: page.visibility,
      otherSlugs: others,
      liveBadgeIds: badges,
      ...counts,
    }),
  };
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "list") {
    const rows = (await must(sb.from("pages").select("slug, status, visibility, updated_at").order("slug"))) as Record<
      string,
      string
    >[];
    for (const r of rows) console.log(`/lp/${r.slug}  ${r.status}  ${r.visibility}`);
    if (!rows.length) console.log("No landing pages yet. Run: npm run lp -- seed");
    return;
  }
  if (cmd === "seed") {
    const all = await dimensionMap();
    const existing = ((await must(sb.from("pages").select("slug"))) as { slug: string }[]).map((p) => p.slug);
    for (const [s, n, c] of SEED) {
      const dims = {
        service: find(all, "service", s),
        niche: find(all, "niche", n),
        country: find(all, "country", c),
      } as PageDims;
      if (existing.includes(slugFor(dims))) {
        console.log(`exists   /lp/${slugFor(dims)}`);
        continue;
      }
      const slug = await createPage(dims, masterTemplate(dims), "Created from the master template");
      console.log(`created  /lp/${slug}  (draft, unlisted)  "${headlineFor(dims)}"`);
    }
    return;
  }
  if (cmd === "check" && a) {
    const { issues } = await check(a);
    if (!issues.length) console.log(`/lp/${a}: ready to publish`);
    for (const i of issues)
      console.log(`BLOCKED  ${i.code.padEnd(18)} ${i.message}${i.sectionId ? `  [${i.sectionId}]` : ""}`);
    process.exitCode = issues.length ? 1 : 0;
    return;
  }
  if (cmd === "publish" && a) {
    const { page, issues } = await check(a);
    if (issues.length) {
      for (const i of issues) console.log(`BLOCKED  ${i.code.padEnd(18)} ${i.message}`);
      console.log(`Not published: ${issues.length} issue(s).`);
      process.exitCode = 1;
      return;
    }
    await must(
      sb
        .from("pages")
        .update({
          status: "published",
          published_version_id: page.draft_version_id,
          published_at: new Date().toISOString(),
        })
        .eq("id", page.id),
    );
    console.log(
      `Published /lp/${a}. A running site picks it up on its next build or cache refresh (admin publishing in Phase 4 refreshes instantly).`,
    );
    return;
  }
  if (cmd === "duplicate" && a && b) {
    const all = await dimensionMap();
    const { content, dimRows } = await loadPage(a);
    const dims = Object.fromEntries(dimRows.map((d) => [d.type_key, all.get(d.value_id)!])) as PageDims;
    const target = { ...dims, country: find(all, "country", b) } as PageDims;
    const copy = pageContentSchema.parse(structuredClone(content));
    for (const s of copy.sections) {
      if (s.type === "hero") {
        s.props.h1 = headlineFor(target); // regenerate for the new country (R4)
        s.props.offerBanner = { desktop: null, mobile: null, alt: "" }; // R16: every page has its own banner
      }
      if (s.type === "faq") s.props.items = s.props.items.map((i) => ({ ...i, status: "draft" as const })); // R17: rewrite per page
    }
    const slug = await createPage(target, copy, `Duplicated from /lp/${a} for ${b}`);
    console.log(`created  /lp/${slug}  (draft, unlisted, banner and FAQ to redo)`);
    return;
  }
  console.log("Usage: npm run lp -- list | seed | check <slug> | publish <slug> | duplicate <slug> <country>");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
