import "server-only";
import { DEFAULT_ABOUT } from "@/content/about-schema";
import { DEFAULT_HOME } from "@/content/home-schema";
import { destroyAsset } from "./cloudinary/server";
import { collectMediaIds, removedMedia } from "./media-refs";
import { mediaInUse } from "./page-ops";
import { supabaseAdmin } from "./supabase/admin";

// Removing an image from the site also removes it from Cloudinary (founder
// decision), with two safety rules:
//   1. only files uploaded through the admin (rows in public.media) can be
//      deleted; images the code itself uses (team photos, badge logos) never;
//   2. a file is deleted only when no draft, published page, home section or
//      proof record still uses it.
// Older page versions are not checked: restoring a very old version may show
// an image that has since been deleted (the publish check then flags it).

export type DeleteOutcome = { publicId: string; result: "deleted" | "in-use" | "not-ours" | "error" };

export async function deleteMediaIfUnused(
  publicIds: string[],
  opts: { force?: boolean } = {},
): Promise<DeleteOutcome[]> {
  const db = supabaseAdmin();
  if (!db || publicIds.length === 0) return [];
  const { data: rows } = await db.from("media").select("public_id, resource_type").in("public_id", publicIds);
  const known = new Map((rows ?? []).map((r) => [r.public_id as string, r.resource_type as "image" | "video"]));
  const used = opts.force ? new Set<string>() : await mediaInUse(db);
  collectMediaIds(DEFAULT_HOME, used); // defaults in code count as "in use"
  collectMediaIds(DEFAULT_ABOUT, used);

  const out: DeleteOutcome[] = [];
  for (const id of publicIds) {
    const type = known.get(id);
    if (!type) {
      out.push({ publicId: id, result: "not-ours" });
      continue;
    }
    if (used.has(id)) {
      out.push({ publicId: id, result: "in-use" });
      continue;
    }
    const res = await destroyAsset(id, type);
    if (res === "ok" || res === "not found") {
      await db.from("media").delete().eq("public_id", id);
      out.push({ publicId: id, result: "deleted" });
    } else out.push({ publicId: id, result: "error" });
  }
  return out;
}

/** After an edit: delete the files the edit stopped using, if nothing else uses them. */
export async function cleanupAfterEdit(before: unknown, after: unknown): Promise<DeleteOutcome[]> {
  const gone = removedMedia(before, after);
  return gone.length ? deleteMediaIfUnused(gone) : [];
}
