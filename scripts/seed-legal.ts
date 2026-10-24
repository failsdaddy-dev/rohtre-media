// Store the five legal pages (the copy of the live pages in
// src/content/legal-defaults.ts) in the database:
//   npm run seed:legal
// Writes page_content rows "legal-<slug>" ONLY for pages that have never
// been saved in Admin → Legal; a page edited there is never overwritten.
// Optional: until a page is saved, the site already shows the same copy.
// Safe to run again. Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
// from .env.local; never prints them.

import { createClient } from "@supabase/supabase-js";
import { LEGAL_DEFAULTS } from "../src/content/legal-defaults";
import { LEGAL_PAGES, legalKey, legalPageSchema } from "../src/content/legal-schema";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<boolean> {
  let failed = false;
  for (const { slug, label } of LEGAL_PAGES) {
    const k = legalKey(slug);
    const data = legalPageSchema.parse(LEGAL_DEFAULTS[slug]); // fails loudly if the copy breaks a rule
    const { data: existing, error: readError } = await sb.from("page_content").select("key").eq("key", k).maybeSingle();
    if (readError) {
      console.error(`${label}: couldn't read (${readError.message})`);
      failed = true;
      continue;
    }
    if (existing) {
      console.log(`${label}: already saved, left as it is`);
      continue;
    }
    const { error } = await sb.from("page_content").insert({ key: k, data });
    if (error) {
      console.error(`${label}: couldn't save (${error.message})`);
      failed = true;
    } else console.log(`${label}: stored`);
  }
  return failed;
}

main().then((failed) => process.exit(failed ? 1 : 0));
