import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_CONTACT, parseContact, type ContactContent } from "@/content/contact-schema";
import { supabasePublic } from "./supabase/public";

// Data for the Contact page (page_content row "contact"). Saving in Admin →
// Contact page calls updateTag(CONTACT_TAG), so the page refreshes straight away.
export const CONTACT_TAG = "page:contact";

export async function getContactContent(): Promise<ContactContent> {
  "use cache";
  cacheTag(CONTACT_TAG);
  cacheLife("max");
  const sb = supabasePublic(); // RLS: page_content is public to read
  if (!sb) return DEFAULT_CONTACT;
  const { data, error } = await sb.from("page_content").select("data").eq("key", "contact").maybeSingle();
  if (error || !data) return DEFAULT_CONTACT;
  return parseContact(data.data);
}
