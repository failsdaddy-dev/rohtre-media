// Store the ten Work page brands (the copy of the live brand pages in
// src/content/work-defaults.ts) in public.work_brands:
//   npm run seed:work
// Needs the work_brands migration first. Inserts ONLY brands whose slug
// isn't in the table yet; a brand edited in Admin → Work page is never
// overwritten. Safe to run again. Reads NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SECRET_KEY from .env.local; never prints them.

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_BRANDS } from "../src/content/work-defaults";
import { brandDataOf, brandSchema } from "../src/content/work-schema";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<boolean> {
  let failed = false;
  for (const b of DEFAULT_BRANDS) {
    const { slug, published, sort } = b;
    const data = brandSchema.parse(brandDataOf(b)); // fails loudly if the copy breaks a rule
    const { data: existing, error: readError } = await sb
      .from("work_brands")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (readError) {
      console.error(`${b.name}: couldn't read (${readError.message})`);
      failed = true;
      continue;
    }
    if (existing) {
      console.log(`${b.name}: already stored, left as it is`);
      continue;
    }
    const { error } = await sb.from("work_brands").insert({ slug, name: data.name, published, sort_order: sort, data });
    if (error) {
      console.error(`${b.name}: couldn't save (${error.message})`);
      failed = true;
    } else console.log(`${b.name}: stored`);
  }
  return failed;
}

main().then((failed) => process.exit(failed ? 1 : 0));
