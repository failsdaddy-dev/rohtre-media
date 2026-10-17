import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_SETTINGS, parseSettings, type SiteSettings } from "./settings-schema";
import { supabasePublic } from "./supabase/public";

export const SETTINGS_TAG = "settings";

/**
 * Global settings for public pages. Cached and shared by every page; saving
 * settings in admin calls updateTag(SETTINGS_TAG) so pages refresh (R35).
 */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("max");
  const sb = supabasePublic();
  if (!sb) return DEFAULT_SETTINGS;
  const { data, error } = await sb.from("site_settings").select("data").eq("id", true).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return parseSettings(data.data);
}
