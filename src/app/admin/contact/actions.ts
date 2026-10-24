"use server";

import { updateTag } from "next/cache";
import { contactSchema } from "@/content/contact-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { CONTACT_TAG } from "@/lib/contact-data";
import { supabaseServer } from "@/lib/supabase/server";

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

/** Save the Contact page content. Goes live straight away (the page's cache tag is refreshed). */
export async function saveContact(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  const parsed = contactSchema.safeParse(stripTags(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "contact", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the Contact page.", fieldErrors: {} };
  await audit(staff, "contact.save", "page_content", "contact", {});
  updateTag(CONTACT_TAG);
  return { ok: true };
}
