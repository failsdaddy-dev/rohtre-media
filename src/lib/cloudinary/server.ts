import "server-only";
import { cloudinaryServerEnv } from "../env.server";
import { isOurPublicId } from "./kinds";
import { apiSignature } from "./sign";

/**
 * Deletes one asset from Cloudinary (used when an image is removed from the
 * site, Phase 4). Only public_ids inside our folder can be deleted.
 * verified: https://cloudinary.com/documentation/image_upload_api_reference#destroy
 */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "video",
): Promise<"ok" | "not found" | "error"> {
  const env = cloudinaryServerEnv();
  if (!env || !isOurPublicId(publicId)) return "error";
  const params = { public_id: publicId, invalidate: "true", timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...params, timestamp: String(params.timestamp), api_key: env.apiKey });
  body.set("signature", await apiSignature(params, env.secret));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloud}/${resourceType}/destroy`, {
    method: "POST",
    body,
  });
  if (!res.ok) return "error";
  const json = (await res.json()) as { result?: string };
  return json.result === "ok" ? "ok" : json.result === "not found" ? "not found" : "error";
}
