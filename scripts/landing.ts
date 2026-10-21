// Landing-page tool for the developer (the admin panel does the same things).
//   npm run lp -- list
//   npm run lp -- seed                       create the three Phase 3 pages as drafts
//   npm run lp -- check <slug>               run the publish check (R25)
//   npm run lp -- publish <slug>             publish the draft if the check passes
//   npm run lp -- duplicate <slug> <country> copy a page for another country (R7)
// Uses the server-only secret key from .env.local; never prints it.

import { createClient } from "@supabase/supabase-js";
import { headlineFor, slugFor, type PageDims } from "../src/lib/dimensions";
import {
  contentForCountry,
  createLandingPage,
  dimensionMap,
  findValue,
  loadLandingPage,
  publishIssues,
  publishPage,
} from "../src/lib/page-ops";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/** The three pages the contract asks for in Phase 3. */
const SEED: [string, string, string][] = [
  ["meta-ads", "fashion", "india"],
  ["d2c-marketing", "fashion", "india"],
  ["meta-ads", "fashion", "usa"],
];

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "list") {
    const { data } = await db.from("pages").select("slug, status, visibility").order("slug");
    for (const r of data ?? []) console.log(`/lp/${r.slug}  ${r.status}  ${r.visibility}`);
    if (!data?.length) console.log("No landing pages yet. Run: npm run lp -- seed");
    return;
  }
  if (cmd === "seed") {
    const all = await dimensionMap(db);
    const { data } = await db.from("pages").select("slug");
    const existing = (data ?? []).map((p) => p.slug as string);
    for (const [s, n, c] of SEED) {
      const dims = {
        service: findValue(all, "service", s),
        niche: findValue(all, "niche", n),
        country: findValue(all, "country", c),
      } as PageDims;
      if (existing.includes(slugFor(dims))) {
        console.log(`exists   /lp/${slugFor(dims)}`);
        continue;
      }
      const page = await createLandingPage(db, dims, { note: "Created from the master template" });
      console.log(`created  /lp/${page.slug}  (draft, unlisted)  "${headlineFor(dims)}"`);
    }
    return;
  }
  if (cmd === "check" && a) {
    const issues = await publishIssues(db, await loadLandingPage(db, { slug: a }));
    if (!issues.length) console.log(`/lp/${a}: ready to publish`);
    for (const i of issues)
      console.log(`BLOCKED  ${i.code.padEnd(18)} ${i.message}${i.sectionId ? `  [${i.sectionId}]` : ""}`);
    process.exitCode = issues.length ? 1 : 0;
    return;
  }
  if (cmd === "publish" && a) {
    const loaded = await loadLandingPage(db, { slug: a });
    const issues = await publishPage(db, loaded.page.id, null);
    for (const i of issues) console.log(`BLOCKED  ${i.code.padEnd(18)} ${i.message}`);
    console.log(issues.length ? `Not published: ${issues.length} issue(s).` : `Published /lp/${a}.`);
    process.exitCode = issues.length ? 1 : 0;
    return;
  }
  if (cmd === "duplicate" && a && b) {
    const all = await dimensionMap(db);
    const loaded = await loadLandingPage(db, { slug: a });
    if (!loaded.content) throw new Error("The source page's content is invalid");
    const target = { ...loaded.dims, country: findValue(all, "country", b) } as PageDims;
    const page = await createLandingPage(db, target, {
      content: contentForCountry(loaded.content, target),
      note: `Duplicated from /lp/${a} for ${b}`,
    });
    console.log(`created  /lp/${page.slug}  (draft, unlisted, banner and FAQ to redo)`);
    return;
  }
  console.log("Usage: npm run lp -- list | seed | check <slug> | publish <slug> | duplicate <slug> <country>");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
