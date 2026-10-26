"use server";

import { updateTag } from "next/cache";
import { DEFAULT_RECOGNITION } from "@/content/work-defaults";
import { parseSections, recognitionSchema } from "@/content/work-schema";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { cleanupAfterEdit } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";
import { RECOGNITION_TAG } from "@/lib/work-data";

/** Remove anything that looks like an HTML tag from every text field (the page also escapes all text). */
function stripTags(v: unknown): unknown {
  if (typeof v === "string") return v.replace(/<[^>]*>/g, "");
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

/** Save the Recognition page content (page_content "recognition"). Goes live straight away. */
export async function saveRecognition(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> }> {
  const staff = await requireStaff();
  const parsed = recognitionSchema.safeParse(stripTags(raw));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.map(String).join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing before saving.", fieldErrors };
  }
  const sb = await supabaseServer();
  const { data: before } = await sb.from("page_content").select("data").eq("key", "recognition").maybeSingle();
  const { error } = await sb
    .from("page_content")
    .upsert({ key: "recognition", data: parsed.data, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return { ok: false, error: "Couldn’t save the Recognition page.", fieldErrors: {} };
  const old = before?.data ? parseSections(recognitionSchema, before.data, DEFAULT_RECOGNITION) : DEFAULT_RECOGNITION;
  const cleaned = await cleanupAfterEdit(old, parsed.data);
  await audit(staff, "recognition.save", "page_content", "recognition", { mediaCleanup: cleaned });
  updateTag(RECOGNITION_TAG);
  return { ok: true };
}
