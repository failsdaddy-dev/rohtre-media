import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_CAREERS, parseCareers, type CareersContent } from "@/content/careers-schema";
import { supabasePublic } from "./supabase/public";

// Data for the Careers page (page_content row "careers"). Saving in Admin →
// Careers page calls updateTag(CAREERS_TAG), so the page refreshes straight away.
export const CAREERS_TAG = "page:careers";

export async function getCareersContent(): Promise<CareersContent> {
  "use cache";
  cacheTag(CAREERS_TAG);
  cacheLife("max");
  const sb = supabasePublic(); // RLS: page_content is public to read
  if (!sb) return DEFAULT_CAREERS;
  const { data, error } = await sb.from("page_content").select("data").eq("key", "careers").maybeSingle();
  if (error || !data) return DEFAULT_CAREERS;
  return parseCareers(data.data);
}
