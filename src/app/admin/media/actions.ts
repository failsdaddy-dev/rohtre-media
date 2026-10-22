"use server";

import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { UPLOAD_KINDS, isOurPublicId } from "@/lib/cloudinary/kinds";
import { destroyAsset, fetchResource } from "@/lib/cloudinary/server";
import { deleteMediaIfUnused, type DeleteOutcome } from "@/lib/media.server";
import { supabaseServer } from "@/lib/supabase/server";

export type Uploaded = {
  publicId: string;
  width: number;
  height: number;
  resourceType: "image" | "video";
  bytes: number;
  /** e.g. "jpg", "gif", "mp4" (a GIF is served as a looping video). */
  format: string | null;
  /** Seconds, for videos (when Cloudinary reports it). */
  duration: number | null;
};

/**
 * Record a file the browser just uploaded straight to Cloudinary. Size and
 * dimensions come from Cloudinary itself; anything over the limit is deleted
 * again (R39).
 */
export async function registerUpload(
  publicId: string,
  resourceType: "image" | "video",
  alt = "",
): Promise<{ ok: true; media: Uploaded } | { ok: false; error: string }> {
  const staff = await requireStaff();
  if (!isOurPublicId(publicId)) return { ok: false, error: "That isn’t one of our uploads." };
  const info = await fetchResource(publicId, resourceType);
  if (!info) return { ok: false, error: "Cloudinary doesn’t have that file." };
  const maxBytes = UPLOAD_KINDS[resourceType].maxMb * 1024 * 1024;
  if (info.bytes > maxBytes) {
    await destroyAsset(publicId, resourceType);
    return { ok: false, error: `The file is larger than ${UPLOAD_KINDS[resourceType].maxMb} MB.` };
  }
  const sb = await supabaseServer();
  const { error } = await sb.from("media").upsert({
    public_id: publicId,
    resource_type: resourceType,
    width: info.width ?? null,
    height: info.height ?? null,
    bytes: info.bytes,
    format: info.format ?? null,
    alt: alt || null,
    uploaded_by: staff.userId,
  });
  if (error) return { ok: false, error: "Couldn’t save the upload." };
  await audit(staff, "media.upload", "media", publicId, { bytes: info.bytes });
  return {
    ok: true,
    media: {
      publicId,
      width: info.width ?? 1,
      height: info.height ?? 1,
      resourceType,
      bytes: info.bytes,
      format: info.format ?? null,
      duration: info.duration ?? null,
    },
  };
}

/** Delete files from the library and Cloudinary (owner/developer), unless the site still uses them. */
export async function deleteMedia(publicIds: string[]): Promise<DeleteOutcome[]> {
  const staff = await requireStaff({ manage: true });
  const out = await deleteMediaIfUnused(publicIds.filter(isOurPublicId));
  await audit(staff, "media.delete", "media", null, { results: out });
  return out;
}
