"use server";

import { updateTag } from "next/cache";
import { homeSchema, parseHome } from "@/content/home-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { HOME_TAG } from "@/lib/home-data";
import { cleanupAfterEdit } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";

/** Save the home page content (R23). Goes live straight away (R35: the home page cache refreshes). */
export async function saveHome(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  const parsed = homeSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { data: before } = await sb.from("page_content").select("data").eq("key", "home").maybeSingle();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "home", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the home page.", fieldErrors: {} };
  const cleaned = await cleanupAfterEdit(parseHome(before?.data), parsed.data);
  await audit(staff, "home.save", "page_content", "home", { mediaCleanup: cleaned });
  updateTag(HOME_TAG);
  return { ok: true };
}
