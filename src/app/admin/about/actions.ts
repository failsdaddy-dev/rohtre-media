"use server";

import { updateTag } from "next/cache";
import { aboutSchema, parseAbout } from "@/content/about-schema";
import { ABOUT_TAG } from "@/lib/about-data";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { cleanupAfterEdit } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

/** Save the About page content. Goes live straight away (the page's cache tag is refreshed). */
export async function saveAbout(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  const parsed = aboutSchema.safeParse(stripTags(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { data: before } = await sb.from("page_content").select("data").eq("key", "about").maybeSingle();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "about", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the About page.", fieldErrors: {} };
  const cleaned = await cleanupAfterEdit(parseAbout(before?.data), parsed.data);
  await audit(staff, "about.save", "page_content", "about", { mediaCleanup: cleaned });
  updateTag(ABOUT_TAG);
  return { ok: true };
}
