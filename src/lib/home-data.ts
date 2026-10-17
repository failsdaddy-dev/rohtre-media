import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_HOME, parseHome, type HomeContent } from "@/content/home-schema";
import { isLiveBadge, isLiveProof } from "./proof";
import { supabaseAdmin } from "./supabase/admin";
import { supabasePublic } from "./supabase/public";

// Data for the home page. Saving in admin calls updateTag() with these tags.
export const HOME_TAG = "page:home";
export const PROOF_TAG = "proof";

/**
 * While building (`npm run dev`) placeholders and unapproved items are shown,
 * clearly marked, so the layout can be judged. A production build (`next
 * build`, the live site) never includes them (R19). In dev they are read with
 * the server-only secret key because RLS hides them from the public.
 */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

const client = () => (SHOW_PLACEHOLDERS ? supabaseAdmin() : null) ?? supabasePublic();

export type Badge = {
  id: string;
  label: string;
  sublabel: string | null;
  image_public_id: string | null;
  proof_url: string | null;
  enabled: boolean;
  notes: string | null;
};
export type Testimonial = {
  id: string;
  quote: string;
  person_name: string;
  person_role: string | null;
  company: string | null;
  photo_public_id: string | null;
  approved: boolean;
  is_placeholder: boolean;
  notes: string | null;
};
export type Result = {
  id: string;
  brand_name: string;
  logo_public_id: string | null;
  metric_value: string;
  metric_label: string;
  summary: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  approved: boolean;
  is_placeholder: boolean;
  notes: string | null;
};

export { isLiveBadge, isLiveProof } from "./proof";

export async function getHomeContent(): Promise<HomeContent> {
  "use cache";
  cacheTag(HOME_TAG);
  cacheLife("max");
  const sb = client();
  if (!sb) return DEFAULT_HOME;
  const { data, error } = await sb.from("page_content").select("data").eq("key", "home").maybeSingle();
  if (error || !data) return DEFAULT_HOME;
  return parseHome(data.data);
}

export async function getBadges(): Promise<Badge[]> {
  "use cache";
  cacheTag(PROOF_TAG);
  cacheLife("max");
  const sb = client();
  if (!sb) return [];
  const { data } = await sb
    .from("badges")
    .select("id, label, sublabel, image_public_id, proof_url, enabled, notes")
    .order("sort");
  const rows = (data ?? []) as Badge[];
  return SHOW_PLACEHOLDERS ? rows : rows.filter(isLiveBadge);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheTag(PROOF_TAG);
  cacheLife("max");
  const sb = client();
  if (!sb) return [];
  const { data } = await sb
    .from("testimonials")
    .select("id, quote, person_name, person_role, company, photo_public_id, approved, is_placeholder, notes")
    .order("sort");
  const rows = (data ?? []) as Testimonial[];
  return SHOW_PLACEHOLDERS ? rows : rows.filter(isLiveProof);
}

export async function getResults(): Promise<Result[]> {
  "use cache";
  cacheTag(PROOF_TAG);
  cacheLife("max");
  const sb = client();
  if (!sb) return [];
  const { data } = await sb
    .from("results")
    .select(
      "id, brand_name, logo_public_id, metric_value, metric_label, summary, image_public_id, image_alt, approved, is_placeholder, notes",
    )
    .order("sort");
  const rows = (data ?? []) as Result[];
  return SHOW_PLACEHOLDERS ? rows : rows.filter(isLiveProof);
}
