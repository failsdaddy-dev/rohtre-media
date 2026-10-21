"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { PROOF_TAG } from "@/lib/home-data";
import { LANDING_TAG } from "@/lib/landing-data";
import { cleanupAfterEdit } from "@/lib/media.server";
import { isProofTable, PROOF_TABLES, type ProofTable } from "@/lib/proof-schemas";
import { supabaseServer } from "@/lib/supabase/server";

type Result = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Turn a database check failure into words an editor understands. */
function friendly(message: string): string {
  if (message.includes("placeholder_not_approved"))
    return "A placeholder can’t be approved. Untick “Is placeholder” first.";
  if (message.includes("approved_needs_image")) return "An approved result needs a screenshot and its alt text.";
  if (message.includes("approved_needs_media")) return "Approved items need their image or video and alt text.";
  if (message.includes("reel_needs_poster")) return "An approved reel needs a poster image.";
  return "Couldn’t save. Please check the fields.";
}

function refresh() {
  updateTag(PROOF_TAG);
  updateTag(LANDING_TAG);
}

export async function saveProof(
  table: ProofTable,
  id: string | null,
  values: unknown,
  tagIds: string[],
): Promise<Result> {
  const staff = await requireStaff();
  if (!isProofTable(table)) return { ok: false, error: "Unknown table." };
  const def = PROOF_TABLES[table];
  const parsed = def.schema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Some fields need fixing.", fieldErrors };
  }
  const values_ = parsed.data as Record<string, unknown>; // validated above; one shape per table
  const sb = await supabaseServer();
  let before: unknown = null;
  let rowId = id;
  if (id) {
    const { data } = await sb.from(table).select("*").eq("id", id).maybeSingle();
    before = data;
    const { error } = await sb.from(table).update(values_).eq("id", id);
    if (error) return { ok: false, error: friendly(error.message) };
  } else {
    const { data, error } = await sb.from(table).insert(values_).select("id").single();
    if (error) return { ok: false, error: friendly(error.message) };
    rowId = data.id as string;
  }
  if (def.tagType) {
    await sb.from("proof_tags").delete().eq("item_type", def.tagType).eq("item_id", rowId!);
    if (tagIds.length) {
      const { error } = await sb
        .from("proof_tags")
        .insert(tagIds.map((value_id) => ({ item_type: def.tagType, item_id: rowId, value_id })));
      if (error) return { ok: false, error: "Saved, but the tags couldn’t be saved." };
    }
  }
  const cleaned = before ? await cleanupAfterEdit(before, values_) : [];
  await audit(staff, id ? `${table}.update` : `${table}.create`, table, rowId, {
    tags: tagIds.length,
    mediaCleanup: cleaned,
  });
  refresh();
  return { ok: true, id: rowId! };
}

export async function deleteProof(table: ProofTable, id: string): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff({ manage: true });
  if (!isProofTable(table)) return { ok: false, error: "Unknown table." };
  const sb = await supabaseServer();
  const { data: before } = await sb.from(table).select("*").eq("id", id).maybeSingle();
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  const tagType = PROOF_TABLES[table].tagType;
  if (tagType) await sb.from("proof_tags").delete().eq("item_type", tagType).eq("item_id", id);
  const cleaned = await cleanupAfterEdit(before, null);
  await audit(staff, `${table}.delete`, table, id, { mediaCleanup: cleaned });
  refresh();
  return { ok: true };
}
