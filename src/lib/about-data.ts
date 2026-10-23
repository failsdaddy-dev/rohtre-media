import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_ABOUT, parseAbout, type AboutContent } from "@/content/about-schema";
import { supabasePublic } from "./supabase/public";

// Data for the About page (page_content row "about"). Saving in Admin →
// About page calls updateTag(ABOUT_TAG), so the page refreshes straight away.
export const ABOUT_TAG = "page:about";

export async function getAboutContent(): Promise<AboutContent> {
  "use cache";
  cacheTag(ABOUT_TAG);
  cacheLife("max");
  const sb = supabasePublic(); // RLS: page_content is public to read
  if (!sb) return DEFAULT_ABOUT;
  const { data, error } = await sb.from("page_content").select("data").eq("key", "about").maybeSingle();
  if (error || !data) return DEFAULT_ABOUT;
  return parseAbout(data.data);
}
