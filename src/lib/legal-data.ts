import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { LEGAL_DEFAULTS } from "@/content/legal-defaults";
import { legalKey, parseLegal, type LegalPage, type LegalSlug } from "@/content/legal-schema";
import { supabasePublic } from "./supabase/public";

// Data for the legal pages (page_content rows "legal-<slug>"). Saving in
// Admin → Legal calls updateTag(legalTag(slug)), so the page refreshes
// straight away. Until a page is saved, its copy in legal-defaults.ts is shown.
export const legalTag = (slug: LegalSlug) => `page:${legalKey(slug)}`;

export async function getLegalPage(slug: LegalSlug): Promise<LegalPage> {
  "use cache";
  cacheTag(legalTag(slug));
  cacheLife("max");
  const fallback = LEGAL_DEFAULTS[slug];
  const sb = supabasePublic(); // RLS: page_content is public to read
  if (!sb) return fallback;
  const { data, error } = await sb.from("page_content").select("data").eq("key", legalKey(slug)).maybeSingle();
  if (error || !data) return fallback;
  return parseLegal(data.data, fallback);
}
