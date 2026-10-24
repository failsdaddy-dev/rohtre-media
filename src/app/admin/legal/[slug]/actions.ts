"use server";

import { updateTag } from "next/cache";
import { isLegalSlug, legalKey, legalPageSchema } from "@/content/legal-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { legalTag } from "@/lib/legal-data";
import { supabaseServer } from "@/lib/supabase/server";

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

/** Save one legal page. Goes live straight away (the page's cache tag is refreshed). */
export async function saveLegal(
  slug: string,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  if (!isLegalSlug(slug)) return { ok: false, error: "Unknown page.", fieldErrors: {} };
  const parsed = legalPageSchema.safeParse(stripTags(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: legalKey(slug), data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the page.", fieldErrors: {} };
  await audit(staff, "legal.save", "page_content", legalKey(slug), {});
  updateTag(legalTag(slug));
  return { ok: true };
}
